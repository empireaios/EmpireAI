import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test, type TestContext } from "node:test";
import {
  EmpireDatabase,
  getSqlitePersistStats,
  sqlJsEngine,
} from "../../brain/sqlite-database.js";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}

function fixture(t: TestContext) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sqlite-boundary-"));
  const filename = path.join(dir, "state.db");
  const db = new EmpireDatabase(filename);
  db.exec("CREATE TABLE events (id INTEGER PRIMARY KEY)");
  t.after(() => {
    t.mock.restoreAll();
    db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return { dir, filename, db };
}

function readDiskIds(filename: string) {
  const disk = new sqlJsEngine.Database(fs.readFileSync(filename));
  try { return disk.exec("SELECT id FROM events ORDER BY id")[0]?.values.map((row) => row[0]) ?? []; }
  finally { disk.close(); }
}

function pauseFirstWrite(t: TestContext) {
  const entered = deferred();
  const release = deferred();
  const open = fs.promises.open.bind(fs.promises);
  let first = true;
  t.mock.method(fs.promises, "open", async (...args: Parameters<typeof fs.promises.open>) => {
    const handle = await open(...args);
    if (first) {
      first = false;
      const writeFile = handle.writeFile.bind(handle);
      handle.writeFile = async (...writeArgs: Parameters<typeof handle.writeFile>) => {
        await writeFile(...writeArgs);
        entered.resolve();
        await release.promise;
      };
    }
    return handle;
  });
  t.after(() => release.resolve());
  return { entered, release };
}

test("critical persistence resolves only after data is readable from a fresh database", async (t) => {
  const { db, filename } = fixture(t);
  db.exec("INSERT INTO events VALUES (1)");
  await db.requestCriticalPersist();
  assert.deepEqual(readDiskIds(filename), [1]);
  assert.equal(getSqlitePersistStats().lastFlushError, null);
  assert.equal(getSqlitePersistStats().pending, false);
});

test("a second critical waiter includes a mutation after the first export", async (t) => {
  const { db, filename } = fixture(t);
  const { entered, release } = pauseFirstWrite(t);
  db.exec("INSERT INTO events VALUES (1)");
  let acknowledged = false;
  const first = db.requestCriticalPersist().then(() => { acknowledged = true; });
  await entered.promise;
  assert.equal(acknowledged, false);
  db.exec("INSERT INTO events VALUES (2)");
  const second = db.requestCriticalPersist();
  release.resolve();
  await Promise.all([first, second]);
  assert.deepEqual(readDiskIds(filename), [1, 2]);
});

test("close fences an older async export from overwriting the final newer snapshot", async (t) => {
  const { db, filename } = fixture(t);
  const { entered, release } = pauseFirstWrite(t);
  db.exec("INSERT INTO events VALUES (1)");
  const pending = db.requestCriticalPersist();
  await entered.promise;
  db.exec("INSERT INTO events VALUES (2)");
  db.close();
  assert.deepEqual(readDiskIds(filename), [1, 2]);
  release.resolve();
  await pending;
  assert.deepEqual(readDiskIds(filename), [1, 2]);
  assert.equal(getSqlitePersistStats().pending, false);
});

test("close before async export starts does not access a closed SQL.js handle", async (t) => {
  const { db, filename } = fixture(t);
  db.exec("INSERT INTO events VALUES (1)");
  const pending = db.requestCriticalPersist();
  db.close();
  await pending;
  assert.deepEqual(readDiskIds(filename), [1]);
});

test("ENOSPC rejects critical save and a later explicit retry persists the same writes", async (t) => {
  const { db, filename } = fixture(t);
  db.exec("INSERT INTO events VALUES (1)");
  const mocked = t.mock.method(fs.promises, "open", async () => {
    throw Object.assign(new Error("test disk full"), { code: "ENOSPC" });
  });
  await assert.rejects(db.requestCriticalPersist(), { code: "ENOSPC" });
  assert.equal(getSqlitePersistStats().pending, true);
  assert.match(getSqlitePersistStats().lastFlushError ?? "", /test disk full/);
  assert.equal(fs.existsSync(filename), false);
  mocked.mock.restore();
  await db.requestCriticalPersist();
  assert.deepEqual(readDiskIds(filename), [1]);
  assert.equal(getSqlitePersistStats().lastFlushError, null);
});

test("file sync failure rejects without replacing a prior valid snapshot", async (t) => {
  const { db, filename, dir } = fixture(t);
  await db.requestCriticalPersist();
  const open = fs.promises.open.bind(fs.promises);
  t.mock.method(fs.promises, "open", async (...args: Parameters<typeof fs.promises.open>) => {
    const handle = await open(...args);
    handle.sync = async () => { throw new Error("test file sync failed"); };
    return handle;
  });
  db.exec("INSERT INTO events VALUES (1)");
  await assert.rejects(db.requestCriticalPersist(), /test file sync failed/);
  assert.deepEqual(readDiskIds(filename), []);
  assert.deepEqual(fs.readdirSync(dir), ["state.db"]);
  assert.equal(getSqlitePersistStats().pending, true);
});

test("rename failure rejects and preserves pending data for retry", async (t) => {
  const { db, filename } = fixture(t);
  await db.requestCriticalPersist();
  const rename = t.mock.method(fs, "renameSync", () => { throw new Error("test rename failed"); });
  db.exec("INSERT INTO events VALUES (1)");
  await assert.rejects(db.requestCriticalPersist(), /test rename failed/);
  assert.deepEqual(readDiskIds(filename), []);
  rename.mock.restore();
  await db.requestCriticalPersist();
  assert.deepEqual(readDiskIds(filename), [1]);
});

test("POSIX directory-sync failure is reported even if rename already completed", {
  skip: process.platform === "win32", // Windows has file-sync coverage above.
}, async (t) => {
  const { db, filename } = fixture(t);
  const fsync = fs.fsyncSync.bind(fs);
  const sync = t.mock.method(fs, "fsyncSync", (fd: number) => {
    if (fs.fstatSync(fd).isDirectory()) throw new Error("test directory sync failed");
    fsync(fd);
  });
  db.exec("INSERT INTO events VALUES (1)");
  await assert.rejects(db.requestCriticalPersist(), /test directory sync failed/);
  assert.equal(getSqlitePersistStats().pending, true);
  assert.deepEqual(readDiskIds(filename), [1]);
  sync.mock.restore();
  await db.requestCriticalPersist();
  assert.equal(getSqlitePersistStats().pending, false);
});

test("reopened database save cannot collide with a closed instance's pending temp file", async (t) => {
  const { db, filename } = fixture(t);
  const { entered, release } = pauseFirstWrite(t);
  db.exec("INSERT INTO events VALUES (1)");
  const pending = db.requestCriticalPersist();
  await entered.promise;
  db.close();
  const reopened = new EmpireDatabase(filename);
  try {
    reopened.exec("INSERT INTO events VALUES (2)");
    await reopened.requestCriticalPersist();
    release.resolve();
    await pending;
    assert.deepEqual(readDiskIds(filename), [1, 2]);
  } finally { release.resolve(); reopened.close(); }
});

test("failed shutdown save throws, leaves database usable, and succeeds on retry", async (t) => {
  const { db, filename } = fixture(t);
  db.exec("INSERT INTO events VALUES (1)");
  const open = t.mock.method(fs, "openSync", () => { throw new Error("test shutdown disk failure"); });
  assert.throws(() => db.close(), /test shutdown disk failure/);
  assert.equal(getSqlitePersistStats().pending, true);
  assert.match(getSqlitePersistStats().lastFlushError ?? "", /test shutdown disk failure/);
  assert.equal(db.prepare("SELECT id FROM events").get()?.id, 1);
  open.mock.restore();
  db.close();
  assert.deepEqual(readDiskIds(filename), [1]);
  assert.throws(() => db.requestCriticalPersist(), /Database is closed/);
});

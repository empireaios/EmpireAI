import test from "node:test";
import assert from "node:assert/strict";
import {
  appendFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
  writeSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { createJournal as openJournal, sealJson } from "./soak-journal.mjs";

const journals = new Map();
function createJournal(directory, options) {
  const journal = openJournal(directory, options);
  const opened = journals.get(directory) || [];
  opened.push(journal);
  journals.set(directory, opened);
  return journal;
}

function temporary(t) {
  const directory = mkdtempSync(path.join(tmpdir(), "pillow-soak-journal-"));
  t.after(() => {
    for (const journal of journals.get(directory) || []) journal.close();
    journals.delete(directory);
    rmSync(directory, { recursive: true, force: true });
  });
  return directory;
}

function reservation(id = "O01_r0_0") {
  return {
    id, kind: "ordinary", checkId: "birth-lock-v2", sessionId: "session-test",
    promptHash: createHash("sha256").update("synthetic prompt").digest("hex"),
  };
}

function records(directory) {
  return readFileSync(path.join(directory, "submission-journal.jsonl"), "utf8")
    .trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
}

test("submission is preceded by a persisted reservation; evidence includes admission and finish", (t) => {
  const directory = temporary(t);
  const journal = createJournal(directory);
  t.after(() => journal.close());
  let posts = 0;
  journal.reserve(reservation());
  const beforePost = records(directory);
  assert.equal(beforePost.length, 1);
  assert.equal(beforePost[0].type, "reserve");
  posts += 1;
  journal.recordAdmission("O01_r0_0", "pcr-first");
  journal.finish("O01_r0_0", { id: "O01_r0_0", requestId: "pcr-first", ok: false });
  journal.event({ type: "gate-failed", failureCount: 1 });
  assert.equal(posts, 1);
  assert.deepEqual(records(directory).map((record) => record.type), ["reserve", "admission", "finish", "event"]);
});

test("disk failure during reserve means zero POST calls and poisons the journal", (t) => {
  const journal = createJournal(temporary(t), { write() { throw new Error("simulated disk full"); } });
  t.after(() => journal.close());
  let posts = 0;
  assert.throws(() => {
    journal.reserve(reservation());
    posts += 1;
  }, { code: "journal_persistence_failed", fatal: true });
  assert.equal(posts, 0);
  assert.throws(() => journal.reserve(reservation("different-case")), { code: "journal_poisoned" });
});

test("failure while recording admission cannot cause a second POST after reopening", (t) => {
  const directory = temporary(t);
  let writes = 0;
  const first = createJournal(directory, {
    write(fd, buffer) {
      writes += 1;
      if (writes === 2) throw new Error("disk failure after remote admission");
      return writeSync(fd, buffer);
    },
  });
  let posts = 0;
  first.reserve(reservation());
  posts += 1;
  assert.throws(() => first.recordAdmission("O01_r0_0", "pcr-returned"), { code: "journal_persistence_failed" });
  first.close();
  const reopened = createJournal(directory);
  t.after(() => reopened.close());
  assert.throws(() => {
    reopened.reserve(reservation());
    posts += 1;
  }, { code: "journal_duplicate_logical_id" });
  assert.equal(posts, 1);
  assert.equal(records(directory).length, 1);
});

test("failure after durable admission cannot cause replay with a different request ID", (t) => {
  const directory = temporary(t);
  let writes = 0;
  const first = createJournal(directory, {
    write(fd, buffer) {
      writes += 1;
      if (writes === 3) throw new Error("disk failure while finalizing");
      return writeSync(fd, buffer);
    },
  });
  first.reserve(reservation());
  first.recordAdmission("O01_r0_0", "pcr-first");
  assert.throws(() => first.finish("O01_r0_0", {
    id: "O01_r0_0", requestId: "pcr-first", ok: true,
  }), { code: "journal_persistence_failed" });
  first.close();
  const second = createJournal(directory);
  t.after(() => second.close());
  assert.throws(() => second.reserve({ ...reservation(), requestId: "pcr-second" }), {
    code: "journal_duplicate_logical_id",
  });
  assert.deepEqual(records(directory).map((record) => record.type), ["reserve", "admission"]);
});

test("a completed logical case remains reserved forever", (t) => {
  const directory = temporary(t);
  const first = createJournal(directory);
  first.reserve(reservation());
  first.recordAdmission("O01_r0_0", "pcr-first");
  first.finish("O01_r0_0", { id: "O01_r0_0", requestId: "pcr-first", ok: true });
  first.close();
  const second = createJournal(directory);
  t.after(() => second.close());
  assert.throws(() => second.reserve(reservation()), { code: "journal_duplicate_logical_id" });
});

test("request IDs cannot be reused for different logical cases", (t) => {
  const journal = createJournal(temporary(t));
  t.after(() => journal.close());
  journal.reserve(reservation("case-1"));
  journal.reserve(reservation("case-2"));
  journal.recordAdmission("case-1", "pcr-duplicate");
  assert.throws(() => journal.recordAdmission("case-2", "pcr-duplicate"), {
    code: "journal_duplicate_request_id",
  });
});

test("concurrent writers are refused; closing cleanly allows reopen", (t) => {
  const directory = temporary(t);
  const first = createJournal(directory);
  assert.throws(() => createJournal(directory), { code: "journal_writer_locked" });
  first.close();
  const second = createJournal(directory);
  second.reserve(reservation());
  second.close();
});

test("partial writes are completed before reserve succeeds", (t) => {
  const directory = temporary(t);
  let writes = 0;
  const journal = createJournal(directory, {
    write(fd, buffer) {
      writes += 1;
      return writeSync(fd, buffer.subarray(0, Math.min(buffer.length, 7)));
    },
  });
  t.after(() => journal.close());
  journal.reserve(reservation());
  assert.ok(writes > 1);
  assert.equal(records(directory)[0].data.id, "O01_r0_0");
});

test("partial write followed by failure is detected as truncation on reopen", (t) => {
  const directory = temporary(t);
  let writes = 0;
  const first = createJournal(directory, {
    write(fd, buffer) {
      writes += 1;
      if (writes > 1) throw new Error("interrupted write");
      return writeSync(fd, buffer.subarray(0, 20));
    },
  });
  assert.throws(() => first.reserve(reservation()), { code: "journal_persistence_failed" });
  first.close();
  assert.throws(() => createJournal(directory), { code: "journal_truncated_record" });
});

test("complete-line corruption is detected; evidence is not repaired or discarded", (t) => {
  const directory = temporary(t);
  const first = createJournal(directory);
  first.reserve(reservation());
  first.close();
  const file = path.join(directory, "submission-journal.jsonl");
  const original = readFileSync(file, "utf8");
  const corrupt = original.replace("session-test", "session-evil");
  writeFileSync(file, corrupt);
  assert.throws(() => createJournal(directory), { code: "journal_corrupt_chain" });
  assert.equal(readFileSync(file, "utf8"), corrupt);
});

test("malformed and blank appended records fail closed", (t) => {
  for (const suffix of ["{not-json}\n", "\n"]) {
    const directory = temporary(t);
    const journal = createJournal(directory);
    journal.reserve(reservation());
    journal.close();
    appendFileSync(path.join(directory, "submission-journal.jsonl"), suffix);
    assert.throws(() => createJournal(directory), { code: "journal_corrupt_record" });
  }
});

test("admission without reservation and result identity mismatches are fatal", (t) => {
  const first = createJournal(temporary(t));
  t.after(() => first.close());
  assert.throws(() => first.recordAdmission("unknown", "pcr-first"), {
    code: "journal_admission_without_reservation",
  });
  const second = createJournal(temporary(t));
  t.after(() => second.close());
  second.reserve(reservation());
  second.recordAdmission("O01_r0_0", "pcr-first");
  assert.throws(() => second.finish("O01_r0_0", { id: "O01_r0_0", requestId: "pcr-other" }), {
    code: "journal_result_request_id_mismatch",
  });
});

test("finish can record a failed non-admission without inventing a request ID", (t) => {
  const directory = temporary(t);
  const journal = createJournal(directory);
  t.after(() => journal.close());
  journal.reserve(reservation());
  journal.finish("O01_r0_0", { id: "O01_r0_0", requestId: null, admitted: false, ok: false });
  assert.equal(records(directory)[1].data.row.admitted, false);
});

test("caller mutation cannot alter stored reservation metadata", (t) => {
  const directory = temporary(t);
  const journal = createJournal(directory);
  t.after(() => journal.close());
  const metadata = reservation();
  journal.reserve(metadata);
  metadata.id = "changed";
  journal.recordAdmission("O01_r0_0", "pcr-original");
  assert.equal(records(directory)[0].data.id, "O01_r0_0");
});

test("sealJson exclusively creates immutable files with correct byte hash", (t) => {
  const file = path.join(temporary(t), "SOAK_RESULTS.json");
  const sealed = sealJson(file, { pass: false, semanticFailures: 17 });
  const bytes = readFileSync(file);
  assert.equal(sealed.sha256, createHash("sha256").update(bytes).digest("hex"));
  assert.equal(sealed.bytes, bytes.length);
  assert.throws(() => sealJson(file, { pass: true }), { code: "EEXIST" });
  assert.deepEqual(JSON.parse(readFileSync(file, "utf8")), { pass: false, semanticFailures: 17 });
});

test("run directory, journal and seal use private modes on POSIX", { skip: process.platform === "win32" }, (t) => {
  const directory = temporary(t);
  const journal = createJournal(directory);
  t.after(() => journal.close());
  journal.reserve(reservation());
  const file = path.join(directory, "result.json");
  sealJson(file, { pass: false });
  assert.equal(statSync(directory).mode & 0o777, 0o700);
  assert.equal(statSync(path.join(directory, "submission-journal.jsonl")).mode & 0o777, 0o600);
  assert.equal(statSync(file).mode & 0o777, 0o600);
});

test("closed journal cannot accept new reservations", (t) => {
  const journal = createJournal(temporary(t));
  journal.close();
  journal.close();
  assert.throws(() => journal.reserve(reservation()), { code: "journal_closed" });
});

test("zero-progress writes and unserializable events are fatal, never retryable", (t) => {
  const zeroWrite = createJournal(temporary(t), { write: () => 0 });
  assert.throws(() => zeroWrite.reserve(reservation()), { code: "journal_persistence_failed", fatal: true });
  const invalid = createJournal(temporary(t));
  const event = { type: "circular" };
  event.self = event;
  assert.throws(() => invalid.event(event), { code: "journal_invalid_serializable_data", fatal: true });
  assert.throws(() => invalid.reserve(reservation()), { code: "journal_poisoned" });
});

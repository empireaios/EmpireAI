// Isolated lock holder: a parent copying these files must not open and close
// their inodes in this process, because POSIX record locks are process-owned.
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const STORES = [
  { suffix: '.missions.sqlite', appId: 0x454d5352, version: 3, maximum: 64 * 1024 * 1024,
    tables: 'mission_snapshot' },
  { suffix: '.mission-execution.sqlite', appId: 0x454d4558, version: 1, maximum: 16 * 1024 * 1024,
    tables: 'execution_events,execution_jobs,execution_meta' },
];
const held = [];
function close() {
  for (const db of held.reverse()) {
    try { if (db.isTransaction) db.exec('ROLLBACK'); } finally { db.close(); }
  }
}
function fail(error) {
  try { close(); } catch { /* preserve first refusal */ }
  if (process.connected) process.send({ kind: 'refused', reason: String(error?.message ?? error).slice(0, 180) });
  else process.exit(1);
}
try {
  const primary = process.argv[2];
  if (!primary || !path.isAbsolute(primary) || path.resolve(primary) !== primary ||
      primary.startsWith('/proc/') || primary.startsWith('/dev/')) throw new Error('Canonical absolute primary path required');
  for (const store of STORES) {
    const filename = primary + store.suffix;
    const before = fs.lstatSync(filename);
    if (!before.isFile() || before.nlink !== 1 || before.size > store.maximum ||
        fs.realpathSync(filename) !== filename ||
        ['-wal', '-shm', '-journal'].some(suffix => fs.existsSync(filename + suffix))) {
      throw new Error('Native store is missing, unsafe or has an active sidecar');
    }
    const db = new DatabaseSync(filename, { timeout: 0, allowExtension: false });
    held.push(db);
    db.exec('PRAGMA trusted_schema=OFF; PRAGMA busy_timeout=0;');
    if (db.prepare('PRAGMA journal_mode').get()?.journal_mode !== 'delete' ||
        db.prepare('PRAGMA application_id').get()?.application_id !== store.appId ||
        db.prepare('PRAGMA user_version').get()?.user_version !== store.version ||
        db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
          .all().map(row => row.name).join() !== store.tables ||
        db.prepare('PRAGMA quick_check').get()?.quick_check !== 'ok') throw new Error('Native store identity or integrity invalid');
    db.exec('BEGIN EXCLUSIVE');
    const after = fs.lstatSync(filename);
    if (after.dev !== before.dev || after.ino !== before.ino || after.size > store.maximum)
      throw new Error('Native store changed while acquiring lock');
  }
  process.send({ kind: 'ready' });
  process.on('message', message => {
    if (message?.kind !== 'release') return;
    try { close(); process.exit(0); } catch { process.exit(1); }
  });
  process.on('disconnect', () => { try { close(); } finally { process.exit(1); } });
} catch (error) { fail(error); }

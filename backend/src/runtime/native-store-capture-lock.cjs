// Isolated lock holder: a parent copying these files must not open and close
// their inodes in this process, because POSIX record locks are process-owned.
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const NATIVE_STORES = [
  { suffix: '.missions.sqlite', appId: 0x454d5352, version: 3, maximum: 64 * 1024 * 1024,
    tables: 'mission_snapshot' },
  { suffix: '.mission-execution.sqlite', appId: 0x454d4558, version: 1, maximum: 16 * 1024 * 1024,
    tables: 'execution_events,execution_jobs,execution_meta' },
];
function acquireNativeCaptureLocks(args) {
const held = [];
const paths = [];
function verifyPaths() {
  for (const {filename, dev, ino} of paths) {
    const current = fs.lstatSync(filename);
    if (!current.isFile() || current.nlink !== 1 || current.dev !== dev || current.ino !== ino || fs.realpathSync(filename) !== filename) throw new Error("Locked store path replaced");
  }
}
function close() {
  for (const db of held.reverse()) {
    try { if (db.isTransaction) db.exec('ROLLBACK'); } finally { db.close(); }
  }
}
try {
  const primary = args[0];
  if (!primary || !path.isAbsolute(primary) || path.resolve(primary) !== primary ||
      primary.startsWith('/proc/') || primary.startsWith('/dev/')) throw new Error('Canonical absolute primary path required');
  const domainMode = args[1] === 'work8-domains';
  const domains = ['commissioning/intelligence.sqlite', 'commissioning/pillow-institutional.sqlite',
    'commissioning/pillow-request-receipts.sqlite', 'commissioning/pillow-reasoning.sqlite',
    'commissioning/communications.sqlite', 'commissioning/openai-october-2026.sqlite',
    'commissioning/assurance.sqlite', 'finance/evidence.sqlite', 'commerce/runtime.sqlite'];
  const stores = domainMode ? domains.map(relative => ({ relative, maximum: 1024 * 1024 * 1024 })) : NATIVE_STORES;
  const identities = new Set();
  for (const store of stores) {
    const filename = domainMode ? path.join(primary, store.relative) : primary + store.suffix;
    const before = fs.lstatSync(filename);
    if (!before.isFile() || before.nlink !== 1 || before.size > store.maximum ||
        fs.realpathSync(filename) !== filename ||
        (!domainMode && ['-wal', '-shm', '-journal'].some(suffix => fs.existsSync(filename + suffix)))) {
      throw new Error('Native store is missing, unsafe or has an active sidecar');
    }
    const identity = `${before.dev}:${before.ino}`;
    if (identities.has(identity)) throw new Error('Aliased store refused');
    identities.add(identity);
    for (const suffix of ['-wal', '-shm', '-journal']) {
      const side = filename + suffix;
      if (fs.existsSync(side) && (!fs.lstatSync(side).isFile() || fs.lstatSync(side).nlink !== 1 || fs.realpathSync(side) !== side)) throw new Error('Unsafe store sidecar');
    }
    const db = new DatabaseSync(filename, { timeout: 0, allowExtension: false });
    held.push(db);
    db.exec('PRAGMA trusted_schema=OFF; PRAGMA busy_timeout=0;');
    const mode = db.prepare('PRAGMA journal_mode').get()?.journal_mode;
    if (!['delete', ...(domainMode ? ['wal'] : [])].includes(mode)) throw new Error('Unsupported journal mode');
    if (!domainMode && (
        db.prepare('PRAGMA application_id').get()?.application_id !== store.appId ||
        db.prepare('PRAGMA user_version').get()?.user_version !== store.version ||
        db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
          .all().map(row => row.name).join() !== store.tables ||
        db.prepare('PRAGMA quick_check').get()?.quick_check !== 'ok')) throw new Error('Native store identity or integrity invalid');
    db.exec(mode === 'wal' ? 'BEGIN IMMEDIATE' : 'BEGIN EXCLUSIVE');
    if (db.prepare('PRAGMA quick_check').get()?.quick_check !== 'ok') throw new Error('Store integrity invalid');
    const after = fs.lstatSync(filename);
    if (after.dev !== before.dev || after.ino !== before.ino || after.size > store.maximum)
      throw new Error('Native store changed while acquiring lock');
    paths.push({filename,dev:after.dev,ino:after.ino});
  }
  verifyPaths();
  return {verifyPaths,close};
} catch(error) { try { close(); } catch {} throw error; }
}
module.exports={acquireNativeCaptureLocks};
if(require.main===module){
let lease;
try {
 lease=acquireNativeCaptureLocks(process.argv.slice(2));
 process.send({kind:"ready"});
 process.on("message",message=>{if(message?.kind!=="release")return;try{lease.verifyPaths();lease.close();process.exit(0);}catch{process.exit(1);}});
 process.on("disconnect",()=>{try{lease.close();}finally{process.exit(1);}});
}catch(error){try{lease?.close();}catch{}if(process.connected)process.send({kind:"refused",reason:String(error?.message??error).slice(0,180)});else process.exit(1);}
}

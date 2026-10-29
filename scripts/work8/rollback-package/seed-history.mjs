// Offline reconstruction of one retained readback, never a new owner decision.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import path from 'node:path';
const retained=JSON.parse(fs.readFileSync(process.env.WORK8_HISTORY_FILE||'/examination/assets/accepted-history.json','utf8'));
const {events,version,current,...record}=retained.record;
assert.equal(version,1);assert.equal(events.length,1);assert.equal(events[0].decision,'DEFER');
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const root=process.env.WORK8_SEED_ROOT||'/data';
assert.ok(path.isAbsolute(root));
fs.mkdirSync(path.join(root,'commissioning'),{recursive:true});
const filename=path.join(root,'commissioning/pillow-institutional.sqlite');
assert.equal(fs.existsSync(filename),false);
const db=new DatabaseSync(filename);
db.exec(`CREATE TABLE identity(workspace TEXT PRIMARY KEY,body TEXT NOT NULL) STRICT;
CREATE TABLE records(workspace TEXT NOT NULL,id TEXT NOT NULL,kind TEXT NOT NULL,domain TEXT NOT NULL,authenticity TEXT NOT NULL,created TEXT NOT NULL,body TEXT NOT NULL,hash TEXT NOT NULL,PRIMARY KEY(workspace,id)) STRICT;
CREATE TABLE events(workspace TEXT NOT NULL,id TEXT NOT NULL,target TEXT NOT NULL,seq INTEGER NOT NULL,created TEXT NOT NULL,body TEXT NOT NULL,hash TEXT NOT NULL,PRIMARY KEY(workspace,id),UNIQUE(workspace,target,seq)) STRICT;
CREATE INDEX memory_scope ON records(workspace,domain,id);
CREATE INDEX memory_recent ON records(workspace,domain,created DESC);
CREATE INDEX memory_events ON events(workspace,target,seq);
PRAGMA application_id=1161907507; PRAGMA user_version=1;`);
db.prepare('INSERT INTO records VALUES(?,?,?,?,?,?,?,?)').run('ws_empire_1',record.id,record.kind,record.scope.domain,record.origin.authenticity,record.recordedAt,JSON.stringify(record),hash(record));
for(const [i,event] of events.entries())db.prepare('INSERT INTO events VALUES(?,?,?,?,?,?,?)').run('ws_empire_1',event.id,event.target,i+1,event.recordedAt,JSON.stringify(event),hash(event));
db.close();fs.chmodSync(filename,0o600);
// Snapshot-derived hashes are not the original database idempotency hashes.
// This examination checks readback/invariance only, and never replays a command.

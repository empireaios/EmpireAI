import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
// Compare committed rows and idempotency hashes, not mutable SQLite header counters.
const db=new DatabaseSync('/data/commissioning/pillow-institutional.sqlite',{readOnly:true,allowExtension:false,timeout:1000});
try{
 const snapshot={applicationId:db.prepare('PRAGMA application_id').get(),version:db.prepare('PRAGMA user_version').get(),identity:db.prepare('SELECT * FROM identity ORDER BY workspace').all(),records:db.prepare('SELECT * FROM records ORDER BY workspace,id').all(),events:db.prepare('SELECT * FROM events ORDER BY workspace,id').all()};
 process.stdout.write(createHash('sha256').update(JSON.stringify(snapshot)).digest('hex')+'\n');
}finally{db.close();}

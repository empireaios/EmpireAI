import fs from 'node:fs';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
const expected=JSON.parse(fs.readFileSync('/control/expected-records.json','utf8'));
const phase=process.argv[2];assert.ok(['normal','final'].includes(phase));
const database='/data/work8-exam/native-transition/volume/commissioning/pillow-institutional.sqlite';
const db=new DatabaseSync(database,{readOnly:true,allowExtension:false});
const receipt={schema:'work8-native-transition-independent-readback-v1',status:'FAIL',readerProcess:process.pid,readOnlySqlite:true,productionData:false,wholeRowsAccepted:[]};
try{assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');assert.equal(db.prepare('PRAGMA application_id').get().application_id,1161907507);assert.equal(db.prepare('PRAGMA user_version').get().user_version,1);
 db.exec('BEGIN');const rows=[];for(const item of expected){const {events,version,current,...base}=item;assert.deepEqual(events,[]);assert.equal(version,0);const actual=db.prepare('SELECT body,hash,authenticity FROM records WHERE workspace=? AND id=?').get('ws_empire_1',item.id);assert.equal(actual.authenticity,'SYNTHETIC');assert.deepEqual(JSON.parse(actual.body),base);assert.match(actual.hash,/^[a-f0-9]{64}$/);rows.push({id:item.id,bodySha256:createHash('sha256').update(actual.body).digest('hex'),storedIdempotencyHash:actual.hash});}db.exec('COMMIT');
 assert.equal(rows.length,phase==='normal'?2:3);if(phase==='final')assert.deepEqual(rows.slice(0,2),JSON.parse(fs.readFileSync('/evidence/normal-independent-readback.json','utf8')).rows);receipt.rows=rows;receipt.phase=phase;receipt.status='PASS_INDEPENDENT_PROCESS_READBACK_ONLY';
}finally{db.close();fs.writeFileSync('/evidence/'+phase+'-independent-readback.json',JSON.stringify(receipt,null,2)+'\n');}

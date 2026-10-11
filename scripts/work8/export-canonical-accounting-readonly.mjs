// Operator-run export only. No inference, source database writes, schema changes or checkpoint.
import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
const filename=process.argv[2];
if(!filename||process.argv.length!==3||!path.isAbsolute(filename)||fs.realpathSync(filename)!==filename||!fs.lstatSync(filename).isFile())throw Error('Explicit canonical regular-file path required');
const db=new DatabaseSync(filename,{readOnly:true,allowExtension:false,timeout:100});
try {
 db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF; BEGIN');
 if(db.prepare('PRAGMA application_id').get().application_id!==1162430793||db.prepare('PRAGMA user_version').get().user_version!==1||db.prepare('PRAGMA quick_check').get().quick_check!=='ok')throw Error('Canonical ledger integrity refused');
 for(const table of ['calls','call_providers'])if(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n>10000)throw Error('Export row bound exceeded');
 const calls=db.prepare('SELECT * FROM calls ORDER BY timestamp,id').all();
 const call_providers=db.prepare('SELECT * FROM call_providers ORDER BY call_id').all();
 const schema=db.prepare("SELECT name,sql FROM sqlite_schema WHERE type='table' AND name IN ('calls','call_providers') ORDER BY name").all();
 db.exec('COMMIT');
 const canonical={schema,calls,call_providers};
 const legacyFields=['id','timestamp','reserved_micro_usd','estimated_micro_usd','invoice_actual_micro_usd','status'];
 const legacy=calls.map(row=>Object.fromEntries(legacyFields.map(k=>[k,row[k]])));
 const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
 process.stdout.write(JSON.stringify({format:'work8-full-canonical-accounting-export-v1',observedAt:new Date().toISOString(),sourcePath:filename,readOnly:true,recordCount:calls.length,providerRowCount:call_providers.length,canonicalSha256:sha(canonical),legacyRecordDigestSha256:sha(legacy),...canonical},null,2)+'\n');
} finally {if(db.isTransaction)db.exec('ROLLBACK');db.close();}

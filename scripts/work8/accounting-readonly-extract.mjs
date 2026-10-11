import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {pathToFileURL} from 'node:url';

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const columns=['id','timestamp','reserved_micro_usd','estimated_micro_usd','invoice_actual_micro_usd','status'];
const canonical=row=>Object.fromEntries(columns.map(key=>[key,row[key]]));
const fingerprint=rows=>hash(rows.map(canonical));
/** Offline/read-only evidence extraction. Never opens a writer or resolves request IDs by guesswork. */
export function extractAccounting(filename,baseline=null){
 const stat=fs.lstatSync(filename);
 if(!path.isAbsolute(filename)||!stat.isFile()||stat.nlink!==1||stat.size>16*1024*1024||fs.realpathSync(filename)!==filename||!fs.existsSync(filename+'.initialized'))throw Error('LEDGER_PATH_REFUSED');
 const db=new DatabaseSync(filename,{readOnly:true,allowExtension:false,timeout:100});
 try{
  db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF; BEGIN');
  if(db.prepare('PRAGMA application_id').get()?.application_id!==1162430793||db.prepare('PRAGMA user_version').get()?.user_version!==1||db.prepare('PRAGMA quick_check').get()?.quick_check!=='ok')throw Error('LEDGER_INTEGRITY_REFUSED');
  const count=Number(db.prepare('SELECT COUNT(*) n FROM calls').get().n);
  const providers=Number(db.prepare('SELECT COUNT(*) n FROM call_providers').get().n);
  if(count>10000||providers>10000)throw Error('LEDGER_ROW_BOUND');
  if(db.prepare('SELECT 1 FROM calls WHERE length(CAST(usage_json AS BLOB))>65536 LIMIT 1').get())throw Error('USAGE_SIZE_BOUND');
  const rows=db.prepare('SELECT id,timestamp,reserved_micro_usd,estimated_micro_usd,invoice_actual_micro_usd,status FROM calls ORDER BY timestamp,id LIMIT 10001').all().map(canonical);
  if(new Set(rows.map(r=>r.id)).size!==rows.length)throw Error('DUPLICATE_CALL_ID');
  for(const r of rows){
   if(typeof r.id!=='string'||!Number.isFinite(Date.parse(r.timestamp)))throw Error('CALL_IDENTITY_INVALID');
   for(const k of columns.slice(2,5))if(r[k]!==null&&(!Number.isSafeInteger(r[k])||r[k]<0))throw Error('MONEY_INVALID');
   if(r.reserved_micro_usd<=0||r.estimated_micro_usd!==null&&r.estimated_micro_usd>r.reserved_micro_usd)throw Error('RESERVATION_BOUND');
  }
  const lineage=db.prepare('SELECT c.id,c.timestamp,c.model,c.provider_response_id,c.usage_json,p.provider,p.request_key FROM calls c LEFT JOIN call_providers p ON p.call_id=c.id ORDER BY c.timestamp,c.id LIMIT 10001').all().map(({usage_json,...row})=>({...row,usageSha256:usage_json===null?null:createHash('sha256').update(usage_json).digest('hex'),source:'calls LEFT JOIN call_providers',requestMapping:'UNRESOLVED_REQUIRES_CANONICAL_TRANSPORT_CORRELATION'}));
  const orphanProviderRows=Number(db.prepare('SELECT COUNT(*) n FROM call_providers p LEFT JOIN calls c ON c.id=p.call_id WHERE c.id IS NULL').get().n);
  db.exec('COMMIT');
  let comparison={status:'UNRESOLVED_BASELINE_ROWS_UNAVAILABLE',added:null,changed:null,removed:null,originalSubsetPreserved:null};
  if(baseline){
   if(baseline.schema!=='work8-readonly-accounting-extract-v1'||!Array.isArray(baseline.rows)||baseline.rows.length>10000||baseline.recordCount!==baseline.rows.length||new Set(baseline.rows.map(r=>r.id)).size!==baseline.rows.length||fingerprint(baseline.rows)!==baseline.recordDigestSha256)throw Error('BASELINE_INVALID');
   const before=new Map(baseline.rows.map(r=>[r.id,canonical(r)])),after=new Map(rows.map(r=>[r.id,r]));
   const added=rows.filter(r=>!before.has(r.id));
   const changed=rows.filter(r=>before.has(r.id)&&hash(r)!==hash(before.get(r.id))).map(r=>({before:before.get(r.id),after:r}));
   const removed=[...before.values()].filter(r=>!after.has(r.id));
   comparison={status:'COMPARED_TO_SUPPLIED_BASELINE_NOT_INDEPENDENTLY_AUTHENTICATED',baselineDigest:baseline.recordDigestSha256,added:added.map(r=>({...r,lineage:lineage.find(l=>l.id===r.id)})),changed,removed,originalSubsetPreserved:changed.length===0&&removed.length===0};
  }
  return {schema:'work8-readonly-accounting-extract-v1',observedAt:new Date().toISOString(),readOnly:true,recordCount:rows.length,recordDigestSha256:fingerprint(rows),rows,lineage,orphanProviderRows,comparison,invoiceActualUnknownCount:rows.filter(r=>r.invoice_actual_micro_usd===null).length,accountingWrites:0,inferenceCalls:0,requestAttributionVerified:false,limitations:['Authenticate the supplied baseline against the retained original aggregate digest before accepting a difference.','A provider request_key is a hash of workspace and transport correlation ID, not a Pillow request ID.','Timestamp correlation alone does not attribute an accounting call to an examination.','No inferred invoice actual, reservation release, payment or financial mutation.']};
 }finally{if(db.isTransaction)db.exec('ROLLBACK');db.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [filename,baselineFile]=process.argv.slice(2);
 if(!filename||process.argv.length>4)throw Error('Usage: node accounting-readonly-extract.mjs /absolute/ledger.sqlite [baseline-extract.json]');
 let baseline=null;if(baselineFile){if(fs.statSync(baselineFile).size>16*1024*1024)throw Error('BASELINE_SIZE_BOUND');baseline=JSON.parse(fs.readFileSync(baselineFile,'utf8'));}
 process.stdout.write(JSON.stringify(extractAccounting(filename,baseline),null,2)+'\n');
}

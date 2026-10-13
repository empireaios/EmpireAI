import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
const require=createRequire(import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function atom(value){
 if(value===null)return {type:'null'};
 if(typeof value==='bigint')return {type:'integer',decimal:String(value)};
 if(typeof value==='number'){assert.ok(Number.isFinite(value));return {type:'real',value:Object.is(value,-0)?'-0':String(value)};}
 if(typeof value==='string')return {type:'text',value};
 assert.ok(value instanceof Uint8Array,'SQLITE_VALUE_TYPE');return {type:'blob',base64:Buffer.from(value).toString('base64')};
}
const encode=value=>JSON.stringify(value);
export function readCanonicalSqlite(filename){
 assert.equal(fs.realpathSync(filename),filename);const before=sha(fs.readFileSync(filename));
 const db=new DatabaseSync(pathToFileURL(filename).href+'?immutable=1',{readOnly:true,allowExtension:false});
 try{
  assert.deepEqual(db.prepare('PRAGMA integrity_check').all().map(r=>Object.values(r)[0]),['ok']);
  const schema=db.prepare('SELECT type,name,tbl_name,sql FROM sqlite_schema ORDER BY type,name').all().map(r=>({...r}));
  const tables=Object.create(null);
  for(const row of schema.filter(r=>r.type==='table')){
   const quoted='"'+String(row.name).replaceAll('"','""')+'"';
   const columns=db.prepare('PRAGMA table_xinfo('+quoted+')').all().map(r=>String(r.name).toLowerCase());
   const properties=db.prepare('PRAGMA table_list').all().find(r=>r.schema==='main'&&r.name===row.name);
   assert.equal(properties?.type,'table','UNSUPPORTED_VIRTUAL_OR_SHADOW_TABLE');
   const rowidName=['rowid','_rowid_','oid'].find(name=>!columns.includes(name));
   assert.ok(properties?.wr===1||rowidName,'ROWID_UNOBSERVABLE');
   let alias='__inspection_rowid__';while(columns.includes(alias))alias+='x';
   const statement=db.prepare('SELECT '+(properties?.wr===1?'':rowidName+' AS "'+alias+'",')+'* FROM '+quoted);statement.setReadBigInts(true);
   const records=statement.all().map(record=>Object.keys(record).sort().map(key=>[key,atom(record[key])]));
   records.sort((a,b)=>encode(a).localeCompare(encode(b)));tables[row.name]=records;
  }
  return {schema,tables,userVersion:db.prepare('PRAGMA user_version').get().user_version,applicationId:db.prepare('PRAGMA application_id').get().application_id};
 }finally{db.close();assert.equal(sha(fs.readFileSync(filename)),before,'INSPECTION_MODIFIED_SOURCE');}
}
export function canonicalArchive(directory,manifest){
 const stores=Object.fromEntries(Object.keys(manifest.stores).sort().map(id=>[id,readCanonicalSqlite(path.join(directory,id,'checkpoint.db'))]));
 const json=Object.fromEntries(Object.keys(manifest.json).sort().map(id=>[id,{bytesSha256:sha(fs.readFileSync(path.join(directory,id+'.json'))),value:JSON.parse(fs.readFileSync(path.join(directory,id+'.json'),'utf8'))}]));
 const redis=JSON.parse(fs.readFileSync(path.join(directory,'redis.json'),'utf8'));
 const sessionKeys=redis.filter(row=>Buffer.from(row.key,'base64').toString('utf8').startsWith('empireai:session:'));
 const markers=Object.fromEntries(Object.keys(manifest.lifecycleMarkers??{}).sort().map(id=>[id,fs.readFileSync(path.join(directory,id+'.initialized')).toString('base64')]));
 return {stores,json,redis,markers,sessionRetention:{binaryKeyDumpAndTtl:sessionKeys,semanticOwnerAndExpiryReadback:'NOT_EXECUTED_REQUIRES_REAL_REDIS_INSPECTION'}};
}
export function compareCanonical(before,after){
 const differences=[];
 for(const section of ['stores','json','redis','markers','sessionRetention']){
  if(encode(before[section])!==encode(after[section])){
   const keys=[...new Set([...Object.keys(before[section]??{}),...Object.keys(after[section]??{})])].sort();
   differences.push(...keys.filter(key=>encode(before[section]?.[key])!==encode(after[section]?.[key])).map(key=>section+'.'+key));
   if(!keys.length)differences.push(section);
  }
 }
 assert.deepEqual(differences,[],'CANONICAL_RESTORATION_MISMATCH');return {equal:true,sections:['stores','json','redis','markers','sessionRetention']};
}
/** Historical inspection only: no app imports, activation, Redis commands or replay. */
export function examineInspectionRestoration({directory,digest,source,destination}){
 const {verifyRuntimeRecoverySet,stageRuntimeRecoveryInspection}=require('../../deployment/work8-recovery-set.cjs');
 const manifest=verifyRuntimeRecoverySet({directory,digest});assert.equal(manifest.sourceCommit,source);
 assert.equal(manifest.bootAllowed,false);assert.equal(manifest.completeLiveState,false);
 const before=canonicalArchive(directory,manifest);
 const staged=stageRuntimeRecoveryInspection({directory,digest,destination});
 const copy=path.join(staged.directory,'sealed-evidence');const restoredManifest=verifyRuntimeRecoverySet({directory:copy,digest});assert.deepEqual(restoredManifest,manifest);
 const after=canonicalArchive(copy,restoredManifest);const equality=compareCanonical(before,after);
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(destination,'INSPECTION_ONLY.json'),'utf8')),{bootAllowed:false,noExecutionAuthority:true,digest});
 verifyRuntimeRecoverySet({directory,digest});assert.deepEqual(canonicalArchive(directory,manifest),before);
 const result={schema:'HH4_ACTUAL_CAPTURE_INSPECTION_RESTORATION_V1',source,digest,status:'PASS_INSPECTION_RESTORATION_ONLY',equality,storeIds:Object.keys(before.stores),sourceCanonicalSha256:sha(encode(before)),restoredCanonicalSha256:sha(encode(after)),canonicalRecords:after,bootAllowed:false,noExecutionAuthority:true,operationalRestoration:false,replay:false,protectedCustody:false,semanticSessionReadback:false,unsupportedSqliteTypes:['virtual tables','shadow tables','nonfinite REAL values'],originalRequirementsAccepted:[]};
 fs.writeFileSync(path.join(destination,'canonical-inspection-result.json'),JSON.stringify(result,null,2),{flag:'wx',mode:0o600});return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===import.meta.filename){const[directory,digest,source,destination]=process.argv.slice(2);try{examineInspectionRestoration({directory,digest,source,destination});}catch(error){console.error(error);process.exitCode=1;}}

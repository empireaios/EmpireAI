/** One bounded attempt: unmodified old storage + critical persist + status + disk readback.
 * Not a production tool. No application startup, network, credentials or signal attachment.
 */
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import assert from 'node:assert/strict';import {spawnSync,execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
const OLD='21384342c401def948926904913840e63c18dff7';
const sha=b=>createHash('sha256').update(b).digest('hex');
if(process.env.EMPIREAI_ISOLATED_CAPTURE_PROOF!=='1'||process.env.RAILWAY_DEPLOYMENT_ID||process.env.VERCEL||process.env.NODE_ENV==='production')throw Error('ISOLATED_PROOF_ONLY');
const [legacyArg,outArg]=process.argv.slice(2);assert.ok(legacyArg&&outArg);
const legacy=fs.realpathSync(legacyArg),out=path.resolve(outArg);
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:legacy,encoding:'utf8'}).trim(),OLD);
assert.ok(!fs.existsSync(out),'Fresh private proof directory required');fs.mkdirSync(out,{mode:0o700});
const sourceHashes={};for(const f of ['backend/src/brain/sqlite-database.ts','backend/src/runtime/event-loop-cooperative.ts','backend/src/config/logger.ts','backend/src/config/env.ts','backend/package-lock.json']){
 const committed=execFileSync('git',['show',OLD+':'+f],{cwd:legacy});const actual=fs.readFileSync(path.join(legacy,f));assert.deepEqual(actual,committed);sourceHashes[f]=sha(actual);
}
const lock=JSON.parse(fs.readFileSync(path.join(legacy,'backend/package-lock.json')));const versions={};for(const dep of ['sql.js','tsx','pino','zod','dotenv']){const installed=JSON.parse(fs.readFileSync(path.join(legacy,'backend/node_modules',dep,'package.json'))).version;assert.equal(installed,lock.packages['node_modules/'+dep].version);versions[dep]=installed;}
// Pin cwd to an empty directory: dotenv cannot pick up an operator's local credentials.
process.chdir(out);globalThis.fetch=()=>{throw Error('PROVIDER_ACCESS_FORBIDDEN');};
const {EmpireDatabase,getSqlitePersistStats}=await import(pathToFileURL(path.join(legacy,'backend/src/brain/sqlite-database.ts')).href);
const childRead=(file)=>{const r=spawnSync(process.execPath,['-e',`const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync(process.argv[1],{readOnly:true});const integrity=db.prepare('PRAGMA integrity_check').get().integrity_check;const rows=db.prepare('SELECT id,value FROM proof_state ORDER BY id').all();db.close();process.stdout.write(JSON.stringify({integrity,rows}));`,file],{encoding:'utf8',timeout:10000,env:{PATH:process.env.PATH}});assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout);};
async function critical(db){const before=getSqlitePersistStats().criticalFlushSucceeded;const returned=db.requestCriticalPersist();assert.equal(returned,undefined);const deadline=Date.now()+10000;while(Date.now()<deadline){const s=getSqlitePersistStats();if(s.lastFlushError)throw Error('SAVE_FAILED');if(s.criticalFlushSucceeded>before&&!s.flushInFlight&&!s.pending)return {...s};await new Promise(r=>setTimeout(r,10));}throw Error('SAVE_COMPLETION_TIMEOUT');}
function capture(source,name){const target=path.join(out,name);fs.copyFileSync(source,target,fs.constants.COPYFILE_EXCL);const fd=fs.openSync(target,'r');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}const restored=path.join(out,'restored-'+name);fs.copyFileSync(target,restored,fs.constants.COPYFILE_EXCL);const result=childRead(restored);assert.equal(result.integrity,'ok');return {file:name,sha256:sha(fs.readFileSync(target)),restoredSha256:sha(fs.readFileSync(restored)),...result};}
const brainFile=path.join(out,'brain.db'),shadowFile=path.join(out,'shadow.db');const brain=new EmpireDatabase(brainFile),shadow=new EmpireDatabase(shadowFile);
for(const db of [brain,shadow])db.exec("CREATE TABLE proof_state(id INTEGER PRIMARY KEY,value TEXT); INSERT INTO proof_state VALUES(1,'baseline');");
await critical(brain);await critical(shadow);
brain.prepare('INSERT INTO proof_state VALUES(@id,@value)').run({id:2,value:'pending RAM control'});
assert.equal(childRead(brainFile).rows.some(r=>r.id===2),false);assert.equal(getSqlitePersistStats().pending,true);
const controlStats=await critical(brain);const control=capture(brainFile,'control.db');assert.equal(control.rows.some(r=>r.id===2),true);
// An already prepared producer remains usable after the apparent capture boundary.
const writer=brain.prepare('INSERT INTO proof_state VALUES(@id,@value)');writer.run({id:3,value:'late producer pending RAM'});
assert.equal(brain.prepare('SELECT value FROM proof_state WHERE id=3').get().value,'late producer pending RAM');
// Independent Shadow save overwrites module-global status, despite Brain still dirty.
shadow.prepare('INSERT INTO proof_state VALUES(@id,@value)').run({id:9,value:'shadow control'});const misleadingStats=await critical(shadow);
assert.equal(misleadingStats.pending,false);const incomplete=capture(brainFile,'incomplete-brain.db');assert.equal(incomplete.rows.some(r=>r.id===3),false);
const shadowCopy=capture(shadowFile,'shadow.db.copy');assert.equal(shadowCopy.rows.some(r=>r.id===9),true);
// A fresh same-file handle can overwrite a newer snapshot; the old revision has no alias fence.
const alias=new EmpireDatabase(brainFile);brain.prepare('INSERT INTO proof_state VALUES(@id,@value)').run({id:4,value:'newer primary RAM'});await critical(brain);
assert.equal(childRead(brainFile).rows.some(r=>r.id===4),true);alias.prepare('INSERT INTO proof_state VALUES(@id,@value)').run({id:5,value:'stale handle writer'});await critical(alias);
const overwritten=capture(brainFile,'overwritten.db');assert.equal(overwritten.rows.some(r=>r.id===4),false);assert.equal(overwritten.rows.some(r=>r.id===5),true);assert.equal(brain.prepare('SELECT value FROM proof_state WHERE id=4').get().value,'newer primary RAM');
// Preserve RAM delta as evidence before test-process termination, not as a production export claim.
const result={verdict:'CURRENT METHOD REJECTED',method:'Existing old critical persist, completion-status polling and copied-file restore',sourceRevision:OLD,sourceHashes,dependencyVersions:versions,node:process.version,evidenceMode:'EXACT_OLD_STORAGE_SOURCE_ISOLATED_SYNTHETIC_STATE',fullProductionTopologyReproduced:false,unmodifiedStorageSource:true,positiveControl:{pendingRowAbsentFromOldDisk:true,exportedAndRestored:true,stats:controlStats,artifact:control},failure:{preparedWriterAdmittedAfterSave:true,globalStatusCleanDespiteOtherHandlePending:true,status:misleadingStats,incompleteArtifact:incomplete,shadowArtifact:shadowCopy,staleSameFileHandleOverwritesNewerData:true,overwriteArtifact:overwritten},limits:['Full production process topology, RAM size, memory/disk pressure and Node runtime equivalence not established','No old-process attachment, safe all-writer quiescence, Redis/native store or full cutover proof'],productionTouched:false,providerCalls:0,commerce:'LOCKED',birth:'NOT_BORN',safeToPromote:false,recommendedAlternative:'Privately capture and independently restore the latest persisted production checkpoint, then seek explicit owner acceptance of the unknown pending-RAM loss before any controlled recovery/cutover; do not restart merely on this test.'};
fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});const fd=fs.openSync(path.join(out,'receipt.json'),'r');fs.fsyncSync(fd);fs.closeSync(fd);const dirfd=fs.openSync(out,'r');fs.fsyncSync(dirfd);fs.closeSync(dirfd);
console.log(JSON.stringify({verdict:result.verdict,pendingRamExportControl:true,writerBarrier:false,independentRestore:true,safeToPromote:false}));
// Do not call close(), which would run the old shutdown flush and obscure the evidence.
process.exit(0);

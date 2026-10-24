import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
export function validatePersistCommand(message,{capability,source,used}){
 assert.equal(used,false,'TARGET_PERSIST_ALREADY_USED');
 assert.deepEqual(Object.keys(message??{}).sort(),['action','capability','source']);
 assert.equal(message.action,'persist-restored-index-once');assert.equal(message.capability,capability);assert.equal(message.source,source);
}
export async function launchRestoredIndex(){
 const capability=process.argv[2],source=process.env.RAILWAY_GIT_COMMIT_SHA;
 assert.match(capability,/^[a-f0-9-]{36}$/);assert.match(source,/^[a-f0-9]{40}$/);
 assert.ok(process.connected&&process.send,'PARENT_IPC_REQUIRED');assert.equal(process.env.NODE_ENV,'test');assert.equal(process.env.EMPIRE_ENGINEERING_TEST_MODE,'true');
 assert.equal(process.env.EMPIRE_RUNTIME_PROFILE,'LOCKED_COMMISSIONING_V1');assert.equal(process.env.MISSION_AUTHORITY_EXECUTOR_ENABLED,'false');
 const root=process.env.RAILWAY_VOLUME_MOUNT_PATH;assert.equal(fs.realpathSync(root),root);assert.match(root,/^\/tmp\/work8-generated-capture-[^/]+\/volume$/);
 assert.ok(path.resolve(process.env.DATABASE_PATH).startsWith(root+path.sep));
 // Only a fresh parent-generated capability can opt into the single readonly
 // continuation. This validation runs before importing index/executor modules.
 const pendingFile=process.argv[3];
 if(pendingFile){
  assert.equal(path.dirname(pendingFile),path.dirname(root));assert.equal(path.basename(pendingFile),'pending-'+capability+'.json');
  const stat=fs.lstatSync(pendingFile);assert.ok(stat.isFile()&&!stat.isSymbolicLink()&&stat.size<=3145728);assert.equal(stat.mode&0o777,0o400);assert.equal(stat.uid,process.getuid());
  const plan=JSON.parse(fs.readFileSync(pendingFile,'utf8'));
  const {readPendingState,validatePendingPlan}=await import('./pending-restoration.mjs');
  validatePendingPlan(plan,{capability,source,expectedDigest:process.argv[4],state:readPendingState(process.env.DATABASE_PATH)});
  process.env.MISSION_AUTHORITY_EXECUTOR_ENABLED='true';
  process.send?.({event:'pending-admission-validated',capability,source,stage:plan.stage,digest:plan.digest,historicalAuthorityImported:false});
 }
 let used=false;
 process.on('message',async message=>{
  try{
   validatePersistCommand(message,{capability,source,used});used=true;
   const {getPillowHost}=await import('../../backend/dist/orchestration/pillow-host/pillow-host.js');assert.equal(getPillowHost().getStatus().lifecycle,'running','TARGET_PILLOW_NOT_RUNNING');
   const {getDatabase,persistDatabase}=await import('../../backend/dist/brain/database.js');getDatabase();
   const {getSqlitePersistStats}=await import('../../backend/dist/brain/sqlite-database.js');const before={...getSqlitePersistStats()};
   await persistDatabase();const after={...getSqlitePersistStats()};
   assert.ok(after.flushCount>before.flushCount,'TARGET_DURABLE_FLUSH_NOT_OBSERVED');
   process.send?.({event:'restored-index-persisted',source,capability,before,after});
  }catch(error){process.send?.({event:'restored-index-persist-failed',source,capability,error:String(error)});}
 });
 // Same real startup module and watchdog; no runtime flags/timers replaced.
 await import('../../backend/dist/index.js');
}
if(process.argv[1]===import.meta.filename)launchRestoredIndex().catch(error=>{console.error(error);process.exitCode=1;});

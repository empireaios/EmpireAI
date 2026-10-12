import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {TaskQueue} from '../brain/task-queue.js';
import {resolveShadowCeoDataRoot,resolveShadowCeoAuthorityDir} from '../orchestration/shadow-ceo-integration/durable-paths.js';
const require=createRequire(import.meta.url);
type RecoveryAdapter = {
 captureRuntimeRecoverySet(args:Record<string,unknown>):Promise<Work8RecoveryResult>;
 verifyRuntimeRecoverySet(args:{directory:string;digest:string}):unknown;
 finalizeRuntimeRecoverySet(args:Work8RecoveryResult):Work8RecoveryResult;
};
export type Work8RecoveryRequest={destination:string;sourceCommit:string;frontendRevision:string;requireComplete?:boolean};
export type Work8RecoveryResult={directory:string;digest:string;manifest:{completeLiveState:false;bootAllowed:false;[key:string]:unknown}};
// Atomic database inventory includes pending jobs, sessions and TTLs; it does
// not establish exclusion of remote producers before or after this command.
const redisSnapshot=`
if redis.call('DBSIZE') > 10000 then return redis.error_reply('RECOVERY_REDIS_KEY_LIMIT') end
local out = {}; local total = 0
for _, key in ipairs(redis.call('KEYS', '*')) do
 local dump = redis.call('DUMP', key); local ttl = redis.call('PTTL', key)
 if dump and ttl >= -1 then
  total = total + string.len(key) + string.len(dump)
  if total > 33554432 then return redis.error_reply('RECOVERY_REDIS_BYTE_LIMIT') end
  table.insert(out, {key, dump, ttl})
 end
end
return out`;
export async function captureRedisInventory(queue:TaskQueue) {
 const client=await queue.queue.client;
 const binaryClient=client as unknown as {evalBuffer?:(script:string,keys:number)=>Promise<Array<[Buffer,Buffer,number]>>};
 if(typeof binaryClient.evalBuffer!=='function') throw new Error('REDIS_BINARY_SNAPSHOT_UNAVAILABLE');
 const rows=await binaryClient.evalBuffer(redisSnapshot,0);
 return rows.map(([key,dump,ttl])=>({key:key.toString('base64'),dump:dump.toString('base64'),ttl})).sort((a,b)=>a.key.localeCompare(b.key));
}
export async function captureWork8RecoveryInventory(request:Work8RecoveryRequest,paths:{root:string;primaryPath:string;shadowPath:string},queue:TaskQueue):Promise<Work8RecoveryResult>{
 if(request.requireComplete!==false) throw new Error("FULL_RUNTIME_CAPTURE_UNPROVEN: Redis producers, watchdog, continuation and protected custody remain uncovered; only explicit scoped inspection is available");
 return (require('../../../deployment/work8-recovery-set.cjs') as RecoveryAdapter).captureRuntimeRecoverySet({...request,...paths,captureId:randomUUID(),
  authorityFile:path.join(resolveShadowCeoAuthorityDir(),'authority-store.json'),
  requestOwnersFile:path.join(resolveShadowCeoDataRoot(),'shadow-ceo-request-owners.json'),
  captureRedis:()=>captureRedisInventory(queue)});
}
export function verifyWork8RecoveryInventory(result:Work8RecoveryResult){return (require('../../../deployment/work8-recovery-set.cjs') as RecoveryAdapter).verifyRuntimeRecoverySet(result);}
export function invalidateWork8RecoveryInventory(destination:string){fs.rmSync(path.join(destination,'runtime-recovery.json'),{force:true});}

export function finalizeWork8RecoveryInventory(result:Work8RecoveryResult){return (require('../../../deployment/work8-recovery-set.cjs') as RecoveryAdapter).finalizeRuntimeRecoverySet(result);}

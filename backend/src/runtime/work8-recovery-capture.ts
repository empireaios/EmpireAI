import {consumeIsolatedRedisCapability} from './work8-isolated-redis-capability.js';
import {getActiveMembershipCapture} from './work8-primary-capture.js';
import {createRequire} from 'node:module';
import type {Redis} from 'ioredis';
import {createHash,randomUUID} from 'node:crypto';
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
export type Work8RecoveryRequest={destination:string;sourceCommit:string;frontendRevision:string;requireComplete?:boolean;captureRepositoryLifecycle?:boolean};
export type Work8RecoveryResult={directory:string;digest:string;manifest:{completeLiveState:false;bootAllowed:false;[key:string]:unknown}};
// Atomic database inventory includes pending jobs, sessions and TTLs; it does
// not establish exclusion of remote producers before or after this command.
const redisSnapshot=`
if redis.call('DBSIZE') > 10000 then return redis.error_reply('RECOVERY_REDIS_KEY_LIMIT') end
local clock = redis.call('TIME')
local capturedAt = tonumber(clock[1])*1000+math.floor(tonumber(clock[2])/1000)
local out = {}; local total = 0
for _, key in ipairs(redis.call('KEYS', '*')) do
 local dump = redis.call('DUMP', key); local ttl = redis.call('PTTL', key)
 if dump and ttl >= -1 then
  total = total + string.len(key) + string.len(dump)
  if total > 33554432 then return redis.error_reply('RECOVERY_REDIS_BYTE_LIMIT') end
  table.insert(out, {key, dump, ttl})
 end
end
return {capturedAt, out}`;
type RedisInventoryRow = {key:string;dump:string;ttl:number};
/** The server timestamp and PTTL values belong to one atomic snapshot, so client
 * queueing/network delays cannot shorten the original session lifetime. */
export async function captureRedisSnapshot(queue:TaskQueue):Promise<{capturedAt:number;rows:RedisInventoryRow[]}> {
 const client=await queue.queue.client;
 const binaryClient=client as unknown as {evalBuffer?:(script:string,keys:number)=>Promise<[number,Array<[Buffer,Buffer,number]>]>};
 if(typeof binaryClient.evalBuffer!=='function') throw new Error('REDIS_BINARY_SNAPSHOT_UNAVAILABLE');
 const [capturedAt,rows]=await binaryClient.evalBuffer(redisSnapshot,0);
 if(!Number.isSafeInteger(capturedAt)||capturedAt<=0)throw new Error('REDIS_SNAPSHOT_TIME_INVALID');
 return {capturedAt,rows:rows.map(([key,dump,ttl])=>({key:key.toString('base64'),dump:dump.toString('base64'),ttl})).sort((a,b)=>a.key.localeCompare(b.key))};
}
/** Preserve the established row-array API for inspection consumers. */
export async function captureRedisInventory(queue:TaskQueue) {
 return (await captureRedisSnapshot(queue)).rows;
}
export async function captureWork8RecoveryInventory(request:Work8RecoveryRequest,paths:{root:string;primaryPath:string;shadowPath:string;visualMemorySnapshot?:unknown;sessionContinuitySnapshot?:unknown;executiveDecisionJournalSnapshot?:unknown},queue:TaskQueue):Promise<Work8RecoveryResult>{
 if(request.requireComplete!==false) throw new Error("FULL_RUNTIME_CAPTURE_UNPROVEN: Redis producers, watchdog, continuation and protected custody remain uncovered; only explicit scoped inspection is available");
 const controllerMembershipReceipt=getActiveMembershipCapture();
 if(process.env.WORK8_REAL_GRAPH==='1'&&controllerMembershipReceipt?.schema!=='work8-controller-capture-v2')throw new Error('CONTROLLER_CAPTURE_RECEIPT_REQUIRED');
 return (require('../../../deployment/work8-recovery-set.cjs') as RecoveryAdapter).captureRuntimeRecoverySet({...request,...paths,controllerMembershipReceipt,captureId:randomUUID(),captureRepositoryLifecycle:request.captureRepositoryLifecycle===true,captureObserverWatchdog:process.env.WORK8_SUPERVISED_OBSERVERS==='1',
  authorityFile:path.join(resolveShadowCeoAuthorityDir(),'authority-store.json'),
  requestOwnersFile:path.join(resolveShadowCeoDataRoot(),'shadow-ceo-request-owners.json'),
  captureRedis:()=>captureRedisSnapshot(queue),captureRedisIdentity:async()=>{
   const client=await queue.queue.client as unknown as Redis;
   const identity=await redisIdentity(client);
   const ownerKey=queue.queue.toKey('capture-owner'),owner=await client.get(ownerKey);
   if(!owner||!await queue.queue.isPaused())throw new Error('REDIS_CAPTURE_OWNER_REQUIRED');
   return {...identity,ownerKey,owner,metaKey:queue.queue.toKey('meta')};
  }});
}
export function verifyWork8RecoveryInventory(result:Work8RecoveryResult){return (require('../../../deployment/work8-recovery-set.cjs') as RecoveryAdapter).verifyRuntimeRecoverySet(result);}
export function invalidateWork8RecoveryInventory(destination:string){fs.rmSync(path.join(destination,'runtime-recovery.json'),{force:true});}

export function finalizeWork8RecoveryInventory(result:Work8RecoveryResult){return (require('../../../deployment/work8-recovery-set.cjs') as RecoveryAdapter).finalizeRuntimeRecoverySet(result);}


async function redisIdentity(client:Redis){
 const runId=(await client.info('server')).match(/^run_id:([a-f0-9]{40})\r?$/m)?.[1];
 const db=Number(String(await client.call('CLIENT','INFO')).match(/(?:^| )db=(\d+)(?: |$)/)?.[1]);
 if(!runId||!Number.isSafeInteger(db)||db<0)throw new Error('REDIS_IDENTITY_UNAVAILABLE');
 return {runId,db};
}

/** Inspection staging only. Never resumes BullMQ or clears producer admission.
 * Source shutdown/quarantine is an operator precondition, not established here.
 * This API cannot authorize operational restoration or global writer exclusion.
 */
export async function restoreWork8RedisInspection(request:{directory:string;digest:string;mode?:'inspection-only';expectedCaptureOwner:string;expectedSource?:{runId:string;db:number};expectedTarget?:{runId:string;db:number};isolatedEndpointCapability?:string},target:Redis){
 if(request.mode!=='inspection-only')throw new Error('INSPECTION_ONLY_EXPLICIT_MODE_REQUIRED');
 const remote=!['127.0.0.1','::1'].includes(target.options.host??'');
 if(target.options.path||(remote&&!request.isolatedEndpointCapability))throw new Error('ISOLATED_LOOPBACK_TARGET_REQUIRED');
 const manifest=(require('../../../deployment/work8-recovery-set.cjs') as RecoveryAdapter).verifyRuntimeRecoverySet(request) as {sourceCommit:string;redisDigest:string;redisCapturedAt?:number;redisIdentity?:{runId:string;db:number;ownerKey:string;owner:string;metaKey:string}};
 const source=manifest.redisIdentity;
 if(!Number.isSafeInteger(manifest.redisCapturedAt)||manifest.redisCapturedAt!<=0||manifest.redisCapturedAt!>Date.now())throw new Error('REDIS_CAPTURE_TIME_REQUIRED');
 if(!source||!/^[a-f0-9]{40}$/.test(source.runId)||!Number.isSafeInteger(source.db)||!source.ownerKey||!source.metaKey||!source.owner)throw new Error('CAPTURE_REDIS_IDENTITY_REQUIRED');
 if(request.expectedCaptureOwner!==source.owner)throw new Error('STALE_CAPTURE_OWNER');
 const observed=await redisIdentity(target);
 if(observed.runId===source.runId&&observed.db===source.db)throw new Error('SOURCE_TARGET_REDIS_ALIAS');
 // A pinned source identity authenticates lineage without requiring the source
 // process to survive. The caller separately pins the replacement endpoint.
 if(request.expectedSource&&(request.expectedSource.runId!==source.runId||request.expectedSource.db!==source.db))throw new Error('SOURCE_REDIS_IDENTITY_CHANGED');
 if(observed.runId!==source.runId&&!request.expectedSource)throw new Error('SOURCE_REDIS_IDENTITY_CHANGED');
 if(observed.runId!==source.runId&&!request.expectedTarget)throw new Error('REPLACEMENT_TARGET_IDENTITY_REQUIRED');
 if(request.expectedTarget&&(request.expectedTarget.runId!==observed.runId||request.expectedTarget.db!==observed.db))throw new Error('TARGET_REDIS_IDENTITY_CHANGED');
 const bytes=fs.readFileSync(path.join(request.directory,'redis.json'));
 if(createHash('sha256').update(bytes).digest('hex')!==manifest.redisDigest)throw new Error('REDIS_INVENTORY_CHANGED');
 const rows=JSON.parse(bytes.toString()) as Array<{key:string;dump:string;ttl:number}>;
 const owner=rows.find(row=>Buffer.from(row.key,'base64').equals(Buffer.from(source.ownerKey)));
 const meta=rows.find(row=>Buffer.from(row.key,'base64').equals(Buffer.from(source.metaKey)));
 if(!owner||owner.ttl!==-1||!meta||meta.ttl!==-1)throw new Error('PERSISTENT_CAPTURE_FENCE_REQUIRED');
 const inspectionOwner=JSON.stringify({mode:'inspection-only',captureDigest:request.digest,noExecutionAuthority:true});
 // Lua is atomic against competing clients. Errors do not roll back Redis writes:
 // keep a persistent admission owner BEFORE any subsequent row can fail.
 const script=`
 local expiry=tonumber(table.remove(ARGV,1))
 local clock0=redis.call('TIME'); local now0=tonumber(clock0[1])*1000+math.floor(tonumber(clock0[2])/1000)
 if expiry>0 and now0>=expiry then return redis.error_reply('ISOLATED_CAPABILITY_EXPIRED') end
 local runId=string.match(redis.call('INFO','server'),'run_id:([a-f0-9]+)')
 if runId ~= ARGV[1] then return redis.error_reply('TARGET_REDIS_IDENTITY_CHANGED') end
 redis.call('SELECT',tonumber(ARGV[2]))
 local clock=redis.call('TIME'); local now=tonumber(clock[1])*1000+math.floor(tonumber(clock[2])/1000)
 if now < tonumber(ARGV[3]) then return redis.error_reply('TARGET_REDIS_CLOCK_BEFORE_CAPTURE') end
 table.remove(ARGV,1); table.remove(ARGV,1); table.remove(ARGV,1)
 if redis.call('DBSIZE') ~= 0 then return redis.error_reply('INSPECTION_TARGET_NOT_EMPTY') end
 redis.call('SET',KEYS[1],ARGV[1])
 local restored=redis.pcall('RESTORE',KEYS[1],0,ARGV[2],'REPLACE')
 if type(restored)=='table' and restored.err then redis.call('SET',KEYS[1],ARGV[1]); return redis.error_reply('OWNER_DUMP_INVALID') end
 local matches=redis.call('GET',KEYS[1])==ARGV[3]
 redis.call('SET',KEYS[1],ARGV[1])
 if not matches then return redis.error_reply('CAPTURE_OWNER_MISMATCH') end
 redis.call('RESTORE',KEYS[2],0,ARGV[4])
 if redis.call('HGET',KEYS[2],'paused') ~= '1' then return redis.error_reply('CAPTURE_PAUSE_REQUIRED') end
 for i=5,#ARGV,3 do
  local expiry=tonumber(ARGV[i+1])
  if expiry==0 or expiry>now then redis.call('RESTORE',ARGV[i],expiry,ARGV[i+2],'ABSTTL') end
 end
 return 1`;
 const args:Array<string|number|Buffer>=[observed.runId,observed.db,manifest.redisCapturedAt!,inspectionOwner,Buffer.from(owner.dump,'base64'),source.owner,Buffer.from(meta.dump,'base64')];
 for(const row of rows)if(row!==owner&&row!==meta)args.push(Buffer.from(row.key,'base64'),row.ttl===-1?0:manifest.redisCapturedAt!+row.ttl,Buffer.from(row.dump,'base64'));
 let capabilityExpiry=0;
 if(remote){
  if(await target.dbsize()!==0)throw new Error('INSPECTION_TARGET_NOT_EMPTY');
  const capability=consumeIsolatedRedisCapability(request.isolatedEndpointCapability!,{source:manifest.sourceCommit,captureDigest:request.digest,sourceRunId:source.runId,targetRunId:observed.runId,host:target.options.host!,port:target.options.port??6379,db:observed.db});
  capabilityExpiry=capability.expiresAt;
  if(Date.now()>=capability.expiresAt)throw new Error('ISOLATED_CAPABILITY_EXPIRED');
 }
 await target.eval(script,2,source.ownerKey,source.metaKey,capabilityExpiry,...args);
 return {mode:'inspection-only' as const,digest:request.digest,source, target:observed,owner:inspectionOwner,bootAllowed:false as const,noExecutionAuthority:true as const};
}


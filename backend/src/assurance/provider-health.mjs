import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {aggregateCapabilityHealth} from './capability-health.mjs';
/** Passive functional evidence only. No provider request or cost is incurred.
 * Usage receipts establish a provider response, not successful application delivery.
 */
export function readProviderHealth(filename, configured, now=Date.now(), maxAgeMs=6*3600000) {
 const stat=fs.lstatSync(filename);
 if(!stat.isFile()||stat.nlink!==1||stat.size>16*1024*1024||fs.realpathSync(filename)!==filename||!fs.existsSync(filename+'.initialized'))throw Error('Provider evidence unavailable');
 const db=new DatabaseSync(filename,{readOnly:true,allowExtension:false,timeout:1000});
 try{
  db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF; BEGIN');
  if(db.prepare('PRAGMA application_id').get()?.application_id!==1162430793||db.prepare('PRAGMA user_version').get()?.user_version!==1||db.prepare('PRAGMA quick_check').get()?.quick_check!=='ok')throw Error('Provider evidence invalid');
  const providers=configured.map(provider=>{
   const row=db.prepare('SELECT c.id,c.timestamp,c.status,c.usage_json,c.provider_response_id FROM calls c JOIN call_providers p ON p.call_id=c.id WHERE p.provider=? ORDER BY c.timestamp DESC,c.id DESC LIMIT 1').get(provider);
   if(!row)return {provider,status:'NOT_CHECKED',reason:'NO_RETAINED_FUNCTIONAL_CALL'};
   const at=Date.parse(row.timestamp),base={provider,evidenceId:row.id,observedAt:row.timestamp,scope:'PROVIDER_RESPONSE_NOT_APPLICATION_DELIVERY'};
   if(!Number.isFinite(at)||at>now)return {...base,status:'FAILED',reason:'INVALID_EVIDENCE_CLOCK'};
   if(row.status!=='usage_recorded')return {...base,status:'DEGRADED',reason:'LATEST_CALL_NOT_VERIFIED_COMPLETE'};
   const usage=row.usage_json?JSON.parse(row.usage_json):null;
   if(!row.provider_response_id||!usage||!Number.isSafeInteger(usage.inputTokens)||!Number.isSafeInteger(usage.outputTokens)||usage.inputTokens<0||usage.outputTokens<0||usage.totalTokens!==usage.inputTokens+usage.outputTokens)return {...base,status:'FAILED',reason:'FUNCTIONAL_RECEIPT_INVALID'};
   if(now-at>maxAgeMs)return {...base,status:'DEGRADED',reason:'FUNCTIONAL_EVIDENCE_STALE',retainedResponseVerified:true};
   return {...base,status:'HEALTHY',reason:'RECENT_ACCOUNTED_PROVIDER_RESPONSE',retainedResponseVerified:true};
  });
  return {status:configured.length?aggregateCapabilityHealth(providers):'EXTERNALLY_BLOCKED',providers,maxAgeMs,inferenceCalls:0,reason:configured.length?'PASSIVE_FUNCTIONAL_RECEIPTS':'PROVIDER_NOT_CONFIGURED'};
 }finally{if(db.isTransaction)db.exec('ROLLBACK');db.close();}
}

import type {IntelligenceStore,Row} from './store.js';
import {digest,type Evidence} from './model.js';
import {RetainedDiscoveryWorker} from '../runtime/commerce-runtime/governed/work8-source-discovery.js';
import {verifiedSavedSource} from '../runtime/commerce-runtime/governed/work8-source-projection.js';
const dayAt=(now:number)=>new Date(now+8*3600000).toISOString().slice(0,10);
/** Read-only decision derived from durable jobs and authenticated observations.
 * A failed or uncertain page is never resubmitted automatically. */
export function readWork8Acquisition(store:IntelligenceStore,workspace:string){
 const day=dayAt(store.now()),scan=new RetainedDiscoveryWorker(store).read(workspace,day),schedule=store.schedules(workspace).find(s=>s.id==='cj.catalog');
 const admissions=store.acquisitionAdmissions(workspace);
 const base={additionalPagesAdmitted:admissions.filter(a=>a.day===day).length,day,target:100,newCandidates:scan?.newCandidates??0,shortfall:scan?.shortfall??100,additionalPageLimit:10,pageSize:10,query:schedule?.subject.query??schedule?.subject.id??null,classification:'BOUNDED_FRESH_READ_PLAN',paidInference:0,externalWrites:0,automaticFailedPageRetries:0};
 const result=(status:string,detail:unknown=null)=>({...base,status,detail});
 if(scan?.status==='TARGET_REACHED')return result('TARGET_REACHED');
 if(scan?.snapshotTruncated)return result('SCAN_SOURCE_BOUND');
 if(!schedule?.enabled)return result('SCHEDULE_DISABLED_OR_MISSING');
 const since=Date.parse(day+'T00:00:00+08:00');
 const jobs=store.use(db=>db.prepare("SELECT body FROM jobs WHERE workspace=? AND created>=? AND created<? AND (json_extract(body,'$.requester')='SCHEDULER' OR json_extract(body,'$.requester')=?) ORDER BY created,id LIMIT 1001").all(workspace,since,since+86400000,'WORK8_DISCOVERY:'+day).map(r=>JSON.parse(String(r.body)) as Row));
 if(jobs.length>1000)return result('JOB_READ_BOUND');
 const pages=jobs.filter(j=>j.requester==='WORK8_DISCOVERY:'+day);
 const bad=pages.find(j=>['FAILED','PARTIAL','INTERRUPTED'].includes(j.status));if(bad)return result('PAGE_FAILED_REQUIRES_REVIEW',{jobId:bad.id,status:bad.status,failures:bad.failures});
 if(pages.some(j=>['QUEUED','RUNNING'].includes(j.status)))return result('PAGE_PENDING');
 if(pages.length>=10)return result('DAILY_PAGE_BOUND');
 const seed=jobs.filter(j=>j.requester==='SCHEDULER'&&j.capabilities.length===1&&j.capabilities[0]==='cj.catalog'&&digest(j.subject)===digest(schedule.subject)).at(-1);
 if(!seed)return result('WAITING_FOR_SCHEDULED_READ');
 if(seed.status!=='COMPLETED')return result('SCHEDULED_READ_NOT_COMPLETE',{jobId:seed.id,status:seed.status,failures:seed.failures});
 const last=pages.at(-1)??seed;
 const sourceId=last.evidence.at(-1);if(typeof sourceId!=='string')return result('SOURCE_MISSING');
 try{
  const {source,freshness}=verifiedSavedSource((w,id)=>store.get(w,'evidence',id) as Evidence|null,workspace,sourceId,store.now());
  if(source.provider!=='CJ'||source.capabilityId!=='cj.catalog'||source.endpoint!=='/product/list')return result('SOURCE_SCOPE_MISMATCH');
  if(freshness!=='FRESH')return result('SOURCE_STALE');
  const response=source.facts.response as Row;
  if(!Array.isArray(response?.list)||response.pageNum!==(last.subject.cataloguePage??1)||response.pageSize!==10||digest(source.subject)!==digest(last.subject)||(source.facts.request as Row|undefined)?.productNameEn!==(last.subject.query??last.subject.id))return result('SOURCE_PAGE_UNVERIFIED');
  if(response.list.length<10)return result('SOURCE_EXHAUSTED',{sourceId,observedCount:response.list.length});
  if(last.requester.startsWith('WORK8_DISCOVERY:')&&(source.subject.cataloguePage!==last.subject.cataloguePage||source.facts.request===null||typeof source.facts.request!=='object'||String((source.facts.request as Row).pageNum)!==String(last.subject.cataloguePage)))return result('PAGE_SOURCE_BINDING_INVALID');
 }catch(error){return result('SOURCE_UNVERIFIED',{reason:error instanceof Error?error.message:'UNKNOWN'});}
 const health=store.get(workspace,'health','cj.catalog');if(health?.retryAt&&Date.parse(health.retryAt)>store.now())return result('PROVIDER_BACKOFF',{retryAt:health.retryAt,failure:health.failure});
 return result('READY',{seedId:seed.id});
}
/** Called by the existing bounded intelligence tick, never a new timer/provider. */
export function advanceWork8Acquisition(store:IntelligenceStore,workspace:string){
 const scanner=new RetainedDiscoveryWorker(store),checkpoint=scanner.start(workspace);if(checkpoint.status!=='TARGET_REACHED')scanner.tick(workspace,checkpoint.day,checkpoint.fence);
 const state=readWork8Acquisition(store,workspace);if(state.status!=='READY')return state;
 try{const job=store.enqueueWork8Catalogue(workspace,state.day,(state.detail as {seedId:string}).seedId);return {...state,status:'PAGE_QUEUED',detail:{jobId:job.id,page:job.subject.cataloguePage}};}
 catch(error){return {...state,status:'ADMISSION_BLOCKED',detail:{reason:error instanceof Error?error.message:'UNKNOWN'}};}
}

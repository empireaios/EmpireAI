import {authorizeInvestigation,investigationGrantSchema} from './investigation.js';
import {readPillow} from '../advisor/pillow-read.js';
import type {FastifyInstance,FastifyRequest,FastifyReply} from 'fastify';
import {z} from 'zod';
import {productionIntelligence} from './store.js';
import {startIntelligence,resourceSchema,seedResourceGaps} from './runtime.js';
import {jobSchema,key,strategySchema,digest} from './model.js';
import {rankDiagnosis} from './engines.js';
const command=z.discriminatedUnion('action',[
 z.object({action:z.literal('investigation'),grant:investigationGrantSchema}).strict(),
 z.object({action:z.literal('close_investigation'),id:key,advisorRequestId:key,assessmentHash:z.string().length(64)}).strict(),
 z.object({action:z.literal('job'),job:jobSchema}).strict(),
 z.object({action:z.literal('schedule'),id:key,enabled:z.boolean()}).strict(),
 z.object({action:z.literal('resource'),resource:resourceSchema}).strict(),
 z.object({action:z.literal('strategy'),strategy:strategySchema}).strict(),
 z.object({action:z.literal('match'),source:z.enum(['Amazon','CJ']),subject:key,variant:key.optional(),targetProvider:z.enum(['Amazon','CJ']),targetId:key,targetVariant:key.optional(),marketplace:z.enum(['US','SG','UK','DE']),rationale:z.string().min(20).max(1000),evidenceRefs:z.array(key).min(2).max(6)}).strict(),
 z.object({action:z.literal('rank_synthetic'),id:key,metrics:z.object({impressions:z.number().nonnegative(),clicks:z.number().nonnegative(),carts:z.number().nonnegative(),purchases:z.number().nonnegative(),traffic:z.enum(['ORGANIC','PAID']),sourceType:z.literal('SYNTHETIC')}).strict()}).strict(),
]);
export function registerIntelligence(app:FastifyInstance,owner:(r:FastifyRequest,p:FastifyReply)=>Promise<unknown>){
 const s=productionIntelligence();if(!s)return;seedResourceGaps(s,'ws_empire_1');const stop=process.env.INTELLIGENCE_ENABLED==='true'?startIntelligence(s):async()=>{};app.addHook('onClose',async()=>{await stop();});
 app.post('/api/owner/advisor/intelligence',{preHandler:owner,bodyLimit:12000},async(r,reply)=>{try{
  const c=command.parse(r.body),w=r.user!.workspaceId;let result:unknown;
  if(c.action==='investigation'){
   const predecessors=[];
   for(const id of c.grant.predecessors){const read=await readPillow(process.env.RAILWAY_VOLUME_MOUNT_PATH!,w,id) as any;const prior=read.data?.requests?.find((x:any)=>x.requestId===id);if(!prior)throw Error('PREDECESSOR_UNAVAILABLE');predecessors.push({id,hash:digest({status:prior.status,failureClass:prior.failureClass,finalResult:prior.finalResult,responseText:prior.responseText})});}
   result=authorizeInvestigation(s,w,r.user!.id,c.grant);s.put(w,'investigations',c.grant.id,{...result as object,predecessorProof:predecessors});
  }
  else if(c.action==='close_investigation'){
   const row=s.get(w,'investigations',c.id);
   if(!row||row.status!=='ASSESSED_PENDING_ACCEPTANCE'||row.requestId!==c.advisorRequestId||row.assessment.sha256!==c.assessmentHash)throw Error('ACCEPTANCE_REQUIRED');
   const read=await readPillow(process.env.RAILWAY_VOLUME_MOUNT_PATH!,w,row.requestId) as any;
   const request=read.data?.requests?.find((x:any)=>x.requestId===row.requestId);
   if(request?.status!=='COMPLETED'||digest(request.responseText)!==row.assessment.sha256)throw Error('COMPLETED_RESPONSE_REQUIRED');
   const evidence=row.assessment.evidenceIds.map((id:string)=>s.get(w,'evidence',id));
   for(const eye of ['MARKET','SUPPLIER','INTERNET','EMPIRE'])if(!evidence.some((e:any)=>e?.eye===eye&&e.authenticity===(eye==='EMPIRE'?'INTERNAL_UNVERIFIED':'LIVE_PROVIDER')))throw Error('FOUR_EYES_EVIDENCE_REQUIRED');
   for(const proof of row.predecessorProof){const old=await readPillow(process.env.RAILWAY_VOLUME_MOUNT_PATH!,w,proof.id) as any;const prior=old.data?.requests?.find((x:any)=>x.requestId===proof.id);if(!prior||digest({status:prior.status,failureClass:prior.failureClass,finalResult:prior.finalResult,responseText:prior.responseText})!==proof.hash)throw Error('PREDECESSOR_CHANGED');}
   row.status='COMPLETE';row.closure={at:new Date(s.now()).toISOString(),owner:r.user!.id,advisorReadback:{requestId:c.advisorRequestId,assessmentHash:c.assessmentHash,attestedBy:'AUTHENTICATED_OWNER'},scope:'Investigation workflow acceptance; commercial qualification remains assessment-specific',birth:'NOT_BORN',commerce:'LOCKED',predecessorsPreserved:true};
   s.put(w,'investigations',row.id,row);result=row;
  }
  else if(c.action==='job')result=s.enqueue(w,'GRAND_KING:'+r.user!.id,c.job);
  else if(c.action==='schedule'){s.setSchedule(w,c.id,c.enabled);result={id:c.id,enabled:c.enabled};}
  else if(c.action==='resource'){const prior=s.get(w,'resources',c.resource.id);if(prior?.decision==='REJECTED'&&c.resource.decision==='PROPOSED')throw Error('REJECTION_PRESERVED');s.put(w,'resources',c.resource.id,{...c.resource,decisionBy:r.user!.id,decidedAt:new Date().toISOString(),prior,grantsPurchaseAuthority:false});result={id:c.resource.id};}
  else if(c.action==='strategy'){const prior=s.get(w,'strategy','active');if(prior&&c.strategy.version<=prior.version)throw Error('STRATEGY_VERSION');if(prior)s.put(w,'strategy',prior.id+':v'+prior.version,prior);s.put(w,'strategy','active',c.strategy);result=c.strategy;}
  else if(c.action==='match'){for(const id of c.evidenceRefs)if(!s.get(w,'evidence',id))throw Error('MISSING_EVIDENCE');const id='match_'+digest(c).slice(0,32);s.put(w,'matches',id,{...c,id,status:'OWNER_CONFIRMED',confidence:'OWNER_ASSERTED_NOT_PROVIDER_VERIFIED',at:new Date().toISOString()});result={id};}
  else{const id=c.id;const existing=s.get(w,'rank_growth',id);if(existing)throw Error('IMMUTABLE_HYPOTHESIS');s.put(w,'rank_growth',id,{id,authenticity:'SYNTHETIC',createdAt:new Date().toISOString(),originalMetrics:c.metrics,...rankDiagnosis(c.metrics)});result={id};}
  return {result,inferenceCalls:0,commerceEffects:0,grantsAuthority:false};
 }catch{return reply.code(400).send({error:'Intelligence command refused: invalid scope, bounds, reference or version'});}});
}

import type {FastifyInstance,FastifyRequest,FastifyReply} from 'fastify';
import {z} from 'zod';
import {productionIntelligence} from './store.js';
import {startIntelligence,resourceSchema,seedResourceGaps} from './runtime.js';
import {jobSchema,key,strategySchema,digest} from './model.js';
import {rankDiagnosis} from './engines.js';
const command=z.discriminatedUnion('action',[
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
  if(c.action==='job')result=s.enqueue(w,'GRAND_KING:'+r.user!.id,c.job);
  else if(c.action==='schedule'){s.setSchedule(w,c.id,c.enabled);result={id:c.id,enabled:c.enabled};}
  else if(c.action==='resource'){const prior=s.get(w,'resources',c.resource.id);if(prior?.decision==='REJECTED'&&c.resource.decision==='PROPOSED')throw Error('REJECTION_PRESERVED');s.put(w,'resources',c.resource.id,{...c.resource,decisionBy:r.user!.id,decidedAt:new Date().toISOString(),prior,grantsPurchaseAuthority:false});result={id:c.resource.id};}
  else if(c.action==='strategy'){const prior=s.get(w,'strategy','active');if(prior&&c.strategy.version<=prior.version)throw Error('STRATEGY_VERSION');if(prior)s.put(w,'strategy',prior.id+':v'+prior.version,prior);s.put(w,'strategy','active',c.strategy);result=c.strategy;}
  else if(c.action==='match'){for(const id of c.evidenceRefs)if(!s.get(w,'evidence',id))throw Error('MISSING_EVIDENCE');const id='match_'+digest(c).slice(0,32);s.put(w,'matches',id,{...c,id,status:'OWNER_CONFIRMED',confidence:'OWNER_ASSERTED_NOT_PROVIDER_VERIFIED',at:new Date().toISOString()});result={id};}
  else{const id=c.id;const existing=s.get(w,'rank_growth',id);if(existing)throw Error('IMMUTABLE_HYPOTHESIS');s.put(w,'rank_growth',id,{id,authenticity:'SYNTHETIC',createdAt:new Date().toISOString(),originalMetrics:c.metrics,...rankDiagnosis(c.metrics)});result={id};}
  return {result,inferenceCalls:0,commerceEffects:0,grantsAuthority:false};
 }catch{return reply.code(400).send({error:'Intelligence command refused: invalid scope, bounds, reference or version'});}});
}

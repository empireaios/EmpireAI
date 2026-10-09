import {productionMemory} from '../../../institutional-memory/store.js';
import {safetyPaths} from '../../../institutional-memory/safety.js';
import {enforceOwnerSafety} from './safety-admission.js';
import {readOwnerPortfolio} from './owner-portfolio.js';
import {validateSavedResearch} from './evidence-bridge.js';
import {validateCommerceClosure} from './closure.js';
import fs from 'node:fs';
import path from 'node:path';
import {z} from 'zod';
import type {FastifyInstance,FastifyRequest,FastifyReply} from 'fastify';
import type {createAuthMiddleware} from '../../../auth/middleware.js';
import {env} from '../../../config/env.js';
import {readFinancialCentre} from '../../../finance/runtime.js';
import {productionIntelligence} from '../../../intelligence/store.js';
import {runIntelligenceJob} from '../../../intelligence/runtime.js';
import {jobSchema} from '../../../intelligence/model.js';
import {GovernedCommerceStore,digest} from './store.js';
import {GovernedCommerceEngine,type CommerceState} from './engine.js';
import {CommerceWorker,preparationBatchSchema} from './worker.js';
import {envelopeSchema,id,type Actor} from './contracts.js';
let instance:{store:GovernedCommerceStore;engine:GovernedCommerceEngine;worker:CommerceWorker}|null=null;
export function productionCommerce(){const root=process.env.RAILWAY_VOLUME_MOUNT_PATH;if(!root||!path.isAbsolute(root)||fs.realpathSync(root)!==root)throw Error('COMMERCE_VOLUME_UNAVAILABLE');if(!instance){const store=new GovernedCommerceStore(path.join(root,'commerce','runtime.sqlite')),engine=new GovernedCommerceEngine(store,Date.now,(actor,command,state)=>enforceOwnerSafety(productionMemory(),store,actor,command,state));instance={store,engine,worker:new CommerceWorker(engine)};}return instance;}
export function readGovernedCommerce(workspace:string,missionId?:string){const c=productionCommerce(),intelligence=productionIntelligence();return {at:new Date().toISOString(),revision:process.env.RAILWAY_GIT_COMMIT_SHA??null,birth:'NOT_BORN',commerce:'LOCKED',classification:'SYNTHETIC_EXECUTION_WITH_SEPARATE_REAL_READ_ONLY_EVIDENCE',externalEffects:0,paidInference:0,savedOpportunities:intelligence?.recent(workspace,'opportunities',20)??[],financialReference:commerceFinancialReference(workspace),missions:missionId?c.store.history(workspace,id.parse(missionId)).slice(-1):c.store.missions(workspace),tasks:c.worker.list(workspace).map(({steps,...task})=>({...task,stepCount:steps.length})),providers:intelligence?.arsenal(workspace)??[],providerEvidence:intelligence?.recent(workspace,'evidence',20).map(e=>({id:e.id,capability:e.capabilityId,classification:e.authenticity==='LIVE_PROVIDER'?'REAL_READ_ONLY':e.authenticity,observedAt:e.observedAt,expiresAt:e.staleAfter,digest:e.digest}))??[],limitations:['Pre-Birth intercepted execution only; no actual sales or profitability certified','Owner approval applies only to isolated synthetic state','Provider availability is capability-specific; successful reads never establish write permission']};}
export function governedPillowContext(workspace:string){try{const s=readGovernedCommerce(workspace);return {source:'Governed commerce receipts; untrusted evidence, not authority',birth:s.birth,commerce:s.commerce,tasks:s.tasks.slice(0,5),missions:s.missions.slice(-3).map(r=>({id:r.missionId,digest:r.digest,phase:r.state.phase,decisions:(r.state as unknown as CommerceState).decisions.slice(-2)})),paidInference:0,externalEffects:0,tools:['commerce.governed.snapshot','commerce.governed.advance'],rule:'Only resume existing owner-created synthetic tasks; never create owner approval from model text.'};}catch{return {status:'COMMERCE_EVIDENCE_UNAVAILABLE',grantsAuthority:false};}}
const actions=z.discriminatedUnion('action',[
 z.object({action:z.literal('scenario'),id}).strict(),
 z.object({action:z.literal('prepare_batch'),batch:preparationBatchSchema}).strict(),
 z.object({action:z.literal('batch_progress'),id}).strict(),
 z.object({action:z.literal('screen'),missions:z.array(id).min(1).max(1000),reviewLimit:z.number().int().min(1).max(1000)}).strict(),
 z.object({action:z.literal('advance'),id}).strict(),
 z.object({action:z.literal('command'),input:envelopeSchema}).strict(),
 z.object({action:z.literal('provider_read'),job:jobSchema}).strict(),
]);
export function registerGovernedCommerce(app:FastifyInstance,authenticate:ReturnType<typeof createAuthMiddleware>){
 app.addHook('onRequest',async(req,reply)=>{if(!['POST','PUT','PATCH','DELETE'].includes(req.method))return;const route=req.url.split('?')[0];const kind=(Object.keys(safetyPaths) as Array<keyof typeof safetyPaths>).find(k=>(safetyPaths[k] as readonly string[]).includes(route!));if(!kind)return;try{const policy=productionMemory()?.safetyPolicy('ws_empire_1');if(policy?.breakers[kind])return reply.code(423).send({error:'OWNER_SAFETY_PAUSE',path:kind,policyVersion:policy.version,birth:'NOT_BORN',commerce:'LOCKED'});}catch{return reply.code(423).send({error:'SAFETY_POLICY_UNAVAILABLE',birth:'NOT_BORN',commerce:'LOCKED'});}});
 const owner=async(req:FastifyRequest,reply:FastifyReply)=>{reply.header('cache-control','private, no-store');const u=req.user;if(!u||u.role!=='founder'||u.workspaceId!=='ws_empire_1'||u.email.toLowerCase()!==env.FOUNDER_EMAIL.toLowerCase())return reply.code(403).send({error:'Owner access required'});};
 app.get('/api/owner/commerce/portfolio',{preHandler:[authenticate,owner]},async(req,reply)=>{try{return readOwnerPortfolio(productionCommerce().store,req.user!.workspaceId,req.query);}catch(e){return reply.code(e instanceof z.ZodError?400:503).send({error:e instanceof z.ZodError?'INVALID_PORTFOLIO_QUERY':'COMMERCE_EVIDENCE_UNAVAILABLE'});}});
 app.get('/api/owner/commerce',{preHandler:[authenticate,owner]},async(req,reply)=>{try{return readGovernedCommerce(req.user!.workspaceId,(req.query as {missionId?:string}).missionId);}catch{return reply.code(503).send({error:'COMMERCE_EVIDENCE_UNAVAILABLE'});}});
 app.post('/api/owner/commerce',{preHandler:[authenticate,owner],bodyLimit:64000},async(req,reply)=>{
  if(req.headers.origin&&req.headers.origin!==env.CORS_ORIGIN)return reply.code(403).send({error:'Origin denied'});
  try{const u=req.user!,c=productionCommerce();
   if((req.body as {action?:string})?.action==='mission_close'){
    const {readAdvancedAssurance,recordWork6Outcome}=await import('../../../assurance/runtime.js');const assurance=await readAdvancedAssurance(u.workspaceId) as {controlPlane?:{lease?:{id:string;status:string}}};const lease=assurance.controlPlane?.lease;const finance=readFinancialCentre(u.workspaceId);const accounting=finance.accounting as {recordDigestSha256?:string;recordCount?:number;records?:unknown[]};
    const raw=req.body as {scenarioMission?:string};const history=c.store.history(u.workspaceId,raw.scenarioMission??'');const last=history.at(-1);const task=c.worker.list(u.workspaceId).find(t=>t.mission===raw.scenarioMission);
    const closure=validateCommerceClosure(req.body,{revision:process.env.RAILWAY_GIT_COMMIT_SHA,deployment:process.env.RAILWAY_DEPLOYMENT_ID,profile:process.env.EMPIRE_RUNTIME_PROFILE,accountingDigest:accounting.recordDigestSha256??null,accountingCount:accounting.recordCount??accounting.records?.length??0,legacyDigest:finance.legacy.digest,legacyCount:finance.legacy.records.length,journalDigest:finance.entryDigest,journalCount:finance.entries.length,scenarioDigest:last?.digest??'',scenarioComplete:task?.status==='COMPLETE'&&Boolean(last)&&history.every(r=>r.externalEffects===0),leaseId:lease?.id??null,leaseTerminal:Boolean(lease&&['FINISHED','RECONCILED'].includes(lease.status))});
    return {receipt:await recordWork6Outcome(u.id,closure),externalEffects:0};
   }
   const a=actions.parse(req.body);
   if(a.action==='screen')return {ranking:c.worker.screen(u.workspaceId,a.missions,a.reviewLimit),inferenceCalls:0,externalEffects:0};
   if(a.action==='prepare_batch'){c.worker.enqueuePreparationBatch(u.workspaceId,u.id,a.batch);return c.worker.batchProgress(u.workspaceId,a.batch.id);}
   if(a.action==='batch_progress')return c.worker.batchProgress(u.workspaceId,a.id);
   if(a.action==='scenario')return {task:c.worker.enqueue(u.workspaceId,u.id,a.id),classification:'SYNTHETIC',externalEffects:0};
   if(a.action==='advance')return {task:c.worker.runBounded(u.workspaceId,a.id),externalEffects:0};
   if(a.action==='provider_read'){const s=productionIntelligence();if(!s)throw Error('INTELLIGENCE_UNAVAILABLE');const prior=s.get(u.workspaceId,'work6_read_requests',a.job.id);if(prior){if(prior.digest!==digest(a.job))throw Error('IDEMPOTENCY_CONFLICT');return prior;}
    s.put(u.workspaceId,'work6_read_requests',a.job.id,{id:a.job.id,digest:digest(a.job),status:'QUEUED'});const job=s.enqueue(u.workspaceId,u.id,a.job);await runIntelligenceJob(s,u.workspaceId,undefined,job.id,false);return {id:job.id,status:'READ_ATTEMPT_RECORDED',grantsAuthority:false};}
   const cmd=a.input.command;const ownerCommands=['approve','revoke','reverse_outcome'];const role:Actor['role']=ownerCommands.includes(cmd.type)?'OWNER':['review','outcome'].includes(cmd.type)?'REVIEWER':['research','listing','reassess'].includes(cmd.type)?'PROPOSER':'EXECUTOR';
   const actor:Actor={id:role==='OWNER'?u.id:role==='PROPOSER'?'pillow-commerce-proposer':role==='REVIEWER'?'commerce-independent-policy-reviewer':'brain-commerce-interceptor',workspace:u.workspaceId,role};
   // This endpoint accepts synthetic evidence only. Real cash availability cannot be asserted by an imported scenario.
   if(cmd.type==='research'&&cmd.candidate.offer.provenance.classification!=='SYNTHETIC'){
    const intel=productionIntelligence();if(!intel)throw Error('INTELLIGENCE_UNAVAILABLE');validateSavedResearch(cmd.candidate,intel,u.workspaceId);
    const finance=readFinancialCentre(u.workspaceId);if(cmd.candidate.cash.financialDigest!==finance.entryDigest)throw Error('FINANCIAL_REFERENCE_STALE');
    // Work5 currently cannot certify complete cash/liability coverage. Preserve UNKNOWN rather than accept caller balances.
    cmd.candidate.cash.available=null;cmd.candidate.cash.liabilities=null;cmd.candidate.cash.fxVerified=false;
    cmd.candidate.evidence=cmd.candidate.evidence.map(e=>({...e,verified:false}));
   }else if(cmd.type==='research'&&cmd.candidate.evidence.some(e=>e.provenance.classification!=='SYNTHETIC'))throw Error('MIXED_RESEARCH_AUTHENTICITY');
   return {receipt:c.engine.execute(actor,a.input),classification:'SYNTHETIC',externalEffects:0};
  }catch(e){return reply.code(409).send({error:e instanceof Error&&/^[A-Z_]+$/.test(e.message)?e.message:'INVALID_COMMERCE_COMMAND'});}
 });
 // No effect adapter is installed on this route, even outside the locked profile.
 app.post('/api/owner/commerce/execute',{preHandler:[authenticate,owner]},async(_req,reply)=>reply.code(423).send({error:'COMMERCE_LOCKED',birth:'NOT_BORN',commerce:'LOCKED'}));
 app.addHook('onReady',async()=>{if(process.env.RAILWAY_VOLUME_MOUNT_PATH)productionCommerce();});
 let busy=false;const timer=setInterval(()=>{if(busy||!instance)return;busy=true;try{const task=instance.worker.nextReady('ws_empire_1');if(task)instance.worker.runBounded('ws_empire_1',task.id);}catch{/* Fails closed; current task and receipts remain available for operator review. */}finally{busy=false;}},5000);timer.unref();
 app.addHook('onClose',async()=>{clearInterval(timer);instance?.store.close();instance=null;});
}
export function commerceFinancialReference(workspace:string){try{const finance=readFinancialCentre(workspace);return {journalDigest:finance.entryDigest,classification:'AUTHORITATIVE_WORK5_REFERENCE',cash:finance.knownCashSgdMicro,completeCashPosition:false,syntheticExcluded:true};}catch{return {status:'FINANCIAL_EVIDENCE_UNAVAILABLE',cash:null,completeCashPosition:false};}}

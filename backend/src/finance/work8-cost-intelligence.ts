import {z} from 'zod';
import {FinancialCentre, costSchema, hash} from './financial-centre.js';
const id=z.string().regex(/^[A-Za-z0-9_.:-]{1,160}$/),timestamp=z.string().datetime();
const resourceSchema=z.object({id,provider:id,service:z.string().min(1).max(200),
  state:z.enum(['ACTIVE','INACTIVE','PROPOSED','CANCELLED','UNKNOWN']),billingOwner:z.string().min(1).max(200).nullable(),
  fixedAmountMicro:z.number().int().nonnegative().max(1e12).nullable(),currency:z.string().regex(/^[A-Z]{3}$/).nullable(),
  renewalAt:timestamp.nullable(),cancellationTerms:z.string().max(1000).nullable(),sharedAllocationBps:z.number().int().min(0).max(10000).nullable(),
  evidenceRef:z.string().min(1).max(500),observedAt:timestamp}).strict();
const observationSchema=z.object({resource:resourceSchema,costs:z.array(z.object({id,data:costSchema}).strict()).max(500),
  providerSummary:z.object({currency:z.string().regex(/^[A-Z]{3}$/),billed:z.string().regex(/^\d+(\.\d+)?$/),effective:z.string().regex(/^\d+(\.\d+)?$/),recordCount:z.number().int().nonnegative(),periodStart:timestamp,periodEnd:timestamp,qualification:z.literal('AGGREGATED_PROVIDER_READBACK_NOT_PAYMENT')}).strict().optional(),
  complete:z.boolean(),exceptions:z.array(z.string().min(1).max(500)).max(50)}).strict();
type Observation=z.infer<typeof observationSchema>;
export interface ReadOnlyBillingPort {provider:string;discover(signal:AbortSignal):Promise<unknown[]>;read(resource:unknown,signal:AbortSignal):Promise<unknown>}
async function bounded<T>(read:(signal:AbortSignal)=>Promise<T>){const abort=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
 try{return await Promise.race([read(abort.signal),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{abort.abort();reject(Error('BILLING_TIMEOUT'));},5000);})]);}finally{if(timer)clearTimeout(timer);}}
const expectedProviders=['github','vercel','railway','openai','anthropic','gemini','cj','amazon','keepa','canva','domains','storage','databases','monitoring','research','other-integrations'];
/** Bounded, injected read-only discovery. Production schedules and credentials are deliberately absent. */
export class Work8CostIntelligence {
 constructor(private centre:FinancialCentre,private workspace:string,private owner:string,private clock=Date.now){
  if(!/^work8-twin:[A-Za-z0-9_.:-]{1,120}$/.test(workspace)||!owner)throw Error('ISOLATED_OWNER_REQUIRED');
  centre.db.exec('CREATE TABLE IF NOT EXISTS work8_cost_observations(workspace TEXT NOT NULL,id TEXT NOT NULL,digest TEXT NOT NULL,record TEXT NOT NULL,PRIMARY KEY(workspace,id))');
 }
 private persist(key:string,payload:unknown){const record={owner:this.owner,payload},digest=hash(record);const old=this.centre.db.prepare('SELECT digest FROM work8_cost_observations WHERE workspace=? AND id=?').get(this.workspace,key);
  if(old){if(old.digest!==digest)throw Error('OBSERVATION_IDENTITY_CONFLICT');return;}
  this.centre.db.prepare('INSERT INTO work8_cost_observations VALUES(?,?,?,?)').run(this.workspace,key,digest,JSON.stringify(record));}
 private history(){return this.centre.db.prepare('SELECT id,digest,record FROM work8_cost_observations WHERE workspace=? ORDER BY rowid').all(this.workspace).map(r=>{const value=JSON.parse(String(r.record));if(hash(value)!==r.digest||value.owner!==this.owner)throw Error('COST_EVIDENCE_INTEGRITY');return {id:String(r.id),payload:value.payload};});}
 async examine(runId:string,ports:ReadOnlyBillingPort[]){
  id.parse(runId);if(ports.length>20||new Set(ports.map(p=>p.provider)).size!==ports.length)throw Error('INVALID_PROVIDER_SET');
  const prior=this.history().find(r=>r.id==='run:'+runId);if(prior)return prior.payload;
  const started=this.clock(),exceptions:Array<{provider:string;code:string}>=[],observations:Observation[]=[];
  const attempt=this.history().filter(r=>r.id.startsWith(runId+':attempt:')).length;
  if(attempt>=3)throw Error('COST_DISCOVERY_RETRY_BUDGET');
  this.persist(runId+':attempt:'+attempt,{started,ports:ports.map(p=>p.provider)});
  for(const provider of expectedProviders)if(!ports.some(p=>p.provider===provider))exceptions.push({provider,code:'BILLING_INTERFACE_UNAVAILABLE_AMOUNT_UNKNOWN'});
  for(const port of ports){
   id.parse(port.provider);
   try{
    const resources=await bounded(s=>port.discover(s));if(!Array.isArray(resources)||resources.length>100)throw Error('RESOURCE_BOUND');
    for(const resource of resources){
     try{
      const o=observationSchema.parse(await bounded(s=>port.read(resource,s)));if(o.resource.provider!==port.provider)throw Error('PROVIDER_BINDING');
      if(Date.parse(o.resource.observedAt)>this.clock())throw Error('FUTURE_BILLING_EVIDENCE');
      const preceding=this.history().filter(r=>r.id.startsWith('observation:')).map(r=>observationSchema.parse(r.payload)).filter(x=>x.resource.id===o.resource.id&&x.resource.provider===port.provider).at(-1);
      if(preceding&&Date.parse(preceding.resource.observedAt)>Date.parse(o.resource.observedAt))throw Error('STALE_BILLING_EVIDENCE');
      if(observations.some(x=>x.resource.id===o.resource.id&&x.resource.provider===port.provider))throw Error('DUPLICATE_RESOURCE');
      for(const c of o.costs){if(c.data.provider!==port.provider)throw Error('COST_PROVIDER_BINDING');
       // Existing journal enforces invoice/payment evidence, source dedupe and replacement lineage.
       this.centre.append(this.workspace,this.owner,{id:c.id,type:'cost',data:c.data});}
      this.persist('observation:'+hash(o),o);observations.push(o);
     }catch{exceptions.push({provider:port.provider,code:'INVALID_OR_CONFLICTING_BILLING_EVIDENCE'});}
    }
   }catch{exceptions.push({provider:port.provider,code:'PROVIDER_UNAVAILABLE_OR_INVALID_DISCOVERY'});}
  }
  const result={runId,started,completed:this.clock(),observations,exceptions,noPaidInference:true,noExecutionAuthority:true};this.persist('run:'+runId,result);return result;
 }
 projection(){
  const history=this.history(),resources=new Map<string,Observation>(),alerts:Array<{provider:string;code:string;resource?:string}>=[];
  for(const r of history){if(r.id.startsWith('observation:')){const o=observationSchema.parse(r.payload),key=o.resource.provider+':'+o.resource.id,old=resources.get(key);
    if(old&&old.resource.renewalAt!==o.resource.renewalAt)alerts.push({provider:o.resource.provider,resource:o.resource.id,code:'RENEWAL_CHANGED'});
    if(old?.resource.fixedAmountMicro!==null&&old?.resource.fixedAmountMicro!==undefined&&o.resource.fixedAmountMicro!==null&&o.resource.fixedAmountMicro>old.resource.fixedAmountMicro)alerts.push({provider:o.resource.provider,resource:o.resource.id,code:'FIXED_COST_INCREASE'});
    if(old){for(const c of o.costs){const previous=old.costs.find(p=>p.data.entityId===c.data.entityId&&p.data.currency===c.data.currency&&p.data.classification==='VARIABLE');if(previous&&c.data.amountMicro>previous.data.amountMicro*1.2)alerts.push({provider:o.resource.provider,resource:o.resource.id,code:'VARIABLE_COST_SPIKE_REVIEW'});}}
    resources.set(key,o);
   }else if(r.payload.exceptions)alerts.push(...r.payload.exceptions);}
  const active=new Map<string,{id:string;data:z.infer<typeof costSchema>}>();
  for(const e of this.centre.entries(this.workspace))if(e.type==='cost')active.set(e.data.entityId,{id:e.id,data:e.data});
  const totals:Record<string,number>={};
  for(const c of active.values()){
   const d=c.data,key=d.currency+':'+d.stage+':'+d.authenticity;const next=(totals[key]??0)+d.amountMicro+d.taxMicro-d.creditMicro;if(!Number.isSafeInteger(next))throw Error('FINANCIAL_OVERFLOW');totals[key]=next;
   if(d.currency!=='SGD'&&!d.fx)alerts.push({provider:d.provider,code:'FX_UNAVAILABLE'});
   if(d.stage==='ACCRUED_UNBILLED'&&Date.parse(d.periodEnd)<this.clock())alerts.push({provider:d.provider,code:'DELAYED_INVOICE'});
  }
  for(const {resource:r,complete,exceptions} of resources.values()){
   if(r.state==='ACTIVE'&&(r.fixedAmountMicro===null||!r.billingOwner||!complete))alerts.push({provider:r.provider,resource:r.id,code:'UNKNOWN_ACTIVE_COST_OR_OWNER'});
   if(r.sharedAllocationBps===null)alerts.push({provider:r.provider,resource:r.id,code:'SHARED_ALLOCATION_UNKNOWN'});
   if(r.renewalAt&&Date.parse(r.renewalAt)<=this.clock()+7*86400000&&r.state==='ACTIVE')alerts.push({provider:r.provider,resource:r.id,code:'RENEWAL_DUE'});
   for(const code of exceptions)alerts.push({provider:r.provider,resource:r.id,code});
  }
  return {schema:'WORK8_COST_INTELLIGENCE_V1',resources:[...resources.values()].map(o=>o.resource),providerSummaries:[...resources.values()].filter(o=>o.providerSummary).map(o=>({provider:o.resource.provider,...o.providerSummary})),totalsByCurrencyStageAuthenticity:totals,
   alerts,observationsDigest:hash(history),canonicalEntriesDigest:hash(this.centre.entries(this.workspace)),
   totalsQualification:'UNREVIEWED_DISCOVERED_EVIDENCE_NOT_CONFIRMED_ACTUALS',operationalProfitIncluded:false,continuousLiveActivation:false};
 }
}
/** Adapts the connector's aggregate response without treating samples as complete rows
 * or rounding sub-micro charges into canonical invoice/payment records. */
export function vercelAggregateObservation(input:unknown,teamId:string,observedAt:string){
 const parsed=z.object({summary:z.object({currency:z.string(),totalBilledCost:z.number().finite().nonnegative(),totalEffectiveCost:z.number().finite().nonnegative(),recordCount:z.number().int().nonnegative(),periodStart:timestamp,periodEnd:timestamp}),context:z.object({summaryIncludesAllRecords:z.boolean(),sampleTruncated:z.boolean(),serviceGroupsTruncated:z.boolean()})}).parse(input);
 return observationSchema.parse({resource:{id:teamId,provider:'vercel',service:'Team billing aggregate',state:'ACTIVE',billingOwner:teamId,fixedAmountMicro:null,currency:parsed.summary.currency,renewalAt:null,cancellationTerms:null,sharedAllocationBps:null,evidenceRef:'vercel:billing-charges:'+hash(input),observedAt},costs:[],complete:false,
  providerSummary:{currency:parsed.summary.currency,billed:String(parsed.summary.totalBilledCost),effective:String(parsed.summary.totalEffectiveCost),recordCount:parsed.summary.recordCount,periodStart:parsed.summary.periodStart,periodEnd:parsed.summary.periodEnd,qualification:'AGGREGATED_PROVIDER_READBACK_NOT_PAYMENT'},
  exceptions:['SUBSCRIPTION_INVOICE_AND_PAYMENT_UNKNOWN','EXACT_REQUESTED_PERIOD_ALIGNMENT_UNVERIFIED',...(parsed.context.sampleTruncated?['CHARGE_ROW_SAMPLE_INCOMPLETE']:[]),...(parsed.context.serviceGroupsTruncated?['SERVICE_GROUPS_INCOMPLETE']:[]),...(!parsed.context.summaryIncludesAllRecords?['SUMMARY_INCOMPLETE']:[])]});
}

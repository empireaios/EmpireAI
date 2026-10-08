import {jobSchema} from '../intelligence/model.js';
import {investigationOutputFormat} from '../intelligence/model-output.js';
export type ProbeResult={status:'HEALTHY'|'DEGRADED'|'BLOCKED'|'UNVERIFIED';summary:string;evidence:unknown};
export function assessAdmission({now,pricing,configured,windowStart,windowEnd}:{now:number;pricing:Array<{provider:string;expiresAt:string;source:string}>;configured:string[];windowStart?:number;windowEnd?:number}):ProbeResult{
 const issues:string[]=[];
 if(!configured.length)return {status:'BLOCKED',summary:'No configured inference provider',evidence:{inferenceCalls:0}};
 if(!Number.isFinite(now)||(windowStart!==undefined&&now<windowStart)||(windowEnd!==undefined&&now>=windowEnd))issues.push('ADMISSION_WINDOW');
 const reviews=configured.map(provider=>{const p=pricing.find(r=>r.provider===provider);const expires=p?Date.parse(p.expiresAt):NaN;return {provider,status:!p||!p.source||!Number.isFinite(expires)?'UNVERIFIED':expires<=now?'EXPIRED':expires-now<=86400000?'EXPIRING':'CURRENT',expiresAt:p?.expiresAt??null,source:p?.source??null};});
 if(reviews.every(p=>['EXPIRED','UNVERIFIED'].includes(p.status)))issues.push('NO_VALID_PRICING');
 return {status:issues.length?'BLOCKED':reviews.some(p=>p.status!=='CURRENT')?'DEGRADED':'HEALTHY',summary:'Deterministic local inference admission; provider availability separately verified',evidence:{issues,reviews,inferenceCalls:0,pricingRenewed:false}};
}
/** Generate actual model-schema boundary witnesses and exercise the server validator. */
export function checkToolContract(format:any=investigationOutputFormat('plan'),validator:(input:unknown)=>boolean=input=>jobSchema.safeParse(input).success):ProbeResult{
 const failures:string[]=[];const schema=format.schema?.properties?.jobs?.items?.properties;
 if(!schema)return {status:'BLOCKED',summary:'Model-facing job schema missing',evidence:{failures:['SCHEMA_MISSING'],inferenceCalls:0}};
 const base:any={id:'synthetic_contract',objective:'Contract witness',capabilities:['empire.state'],subject:{id:'subject',marketplace:'US'},requestLimit:1,evidenceRefs:[]};
 const check=(label:string,value:any)=>{if(!validator(value))failures.push(label);};check('base',base);
 for(const n of [schema.objective.minLength,schema.objective.maxLength])if(Number.isInteger(n)&&n>=0&&n<100000)check('objective:'+n,{...base,objective:'x'.repeat(n)});else failures.push('OBJECTIVE_BOUND');
 const query=schema.subject.properties.query.anyOf?.find((s:any)=>s.type==='string')??schema.subject.properties.query;
 for(const n of [query.minLength,query.maxLength])if(Number.isInteger(n)&&n>=0&&n<100000)check('query:'+n,{...base,subject:{...base.subject,query:'x'.repeat(n)}});else failures.push('QUERY_BOUND');
 for(const n of [schema.requestLimit.minimum,schema.requestLimit.maximum])check('requestLimit:'+n,{...base,requestLimit:n});
 for(const marketplace of schema.subject.properties.marketplace.enum??[])check('marketplace:'+marketplace,{...base,subject:{...base.subject,marketplace}});
 for(const capability of schema.capabilities.items.enum??[])check('capability:'+capability,{...base,capabilities:[capability]});
 check('capabilities:max',{...base,capabilities:Array(schema.capabilities.maxItems).fill('empire.state')});
 for(const field of ['id','objective','capabilities','subject','requestLimit','evidenceRefs'])if(!format.schema.properties.jobs.items.required?.includes(field))failures.push('REQUIRED_FIELD:'+field);
 return {status:failures.length?'BLOCKED':'HEALTHY',summary:'Model/server scalar, enum, required-field and collection boundary compatibility',evidence:{failures,scope:'job boundary witnesses; not provider inference',inferenceCalls:0}};
}
export function assessWorkflowReceipt(r:{requestId?:string;status?:string;modelOutputDigest?:string;accountingRef?:string;handoff?:string;responsePersisted?:boolean;evidenceReturned?:boolean;missionState?:string;acceptanceRefs?:string[]}):ProbeResult{
 const faults:string[]=[];
 if(!r.requestId)faults.push('REQUEST_ID_MISSING');
 if(r.modelOutputDigest&&!r.accountingRef)faults.push('PAID_OUTPUT_ACCOUNTING_LINK_MISSING');
 if(r.modelOutputDigest&&r.handoff==='FAILED')faults.push('POST_INFERENCE_HANDOFF_FAILURE');
 if(r.status==='COMPLETED'&&r.responsePersisted!==true)faults.push('RESPONSE_PERSISTENCE_UNVERIFIED');
 if(r.status==='COMPLETED'&&r.evidenceReturned!==true)faults.push('EVIDENCE_RETURN_UNVERIFIED');
 if(r.missionState==='COMPLETE'&&(!r.acceptanceRefs?.length||r.status!=='COMPLETED'||r.responsePersisted!==true))faults.push('MISSION_CLOSURE_UNSUPPORTED');
 return {status:faults.length?'DEGRADED':r.status==='COMPLETED'?'HEALTHY':'UNVERIFIED',summary:'Durable workflow-stage consistency; original failures preserved',evidence:{faults,requestId:r.requestId??null,reuseCompletedOutput:!!r.modelOutputDigest&&r.handoff==='FAILED',repeatInference:false,settledInvoiceClaimed:false}};
}

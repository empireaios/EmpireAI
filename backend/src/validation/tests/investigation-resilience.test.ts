import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {IntelligenceStore} from '../../intelligence/store.js';
import {authorizeInvestigation,claimInvestigation,PillowInvestigation} from '../../intelligence/investigation.js';
import {jobSchema,investigationToolContract,digest} from '../../intelligence/model.js';
const instruction='Investigate existing product evidence with Four Eyes and report the actual gaps.';
const job={id:'state',objective:'Read current state',capabilities:['empire.state'],subject:{id:'empire'},requestLimit:1,evidenceRefs:[]};
function setup(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'resilience-'));const s=new IntelligenceStore(path.join(dir,'eyes.sqlite'));authorizeInvestigation(s,'owner','king',{id:'mission',instruction});const grant=claimInvestigation(s,'owner','request',instruction)!;return {s,grant,i:new PillowInvestigation(s,'owner',grant),done:()=>fs.rmSync(dir,{recursive:true,force:true})};}
test('partial noncritical validation retains rejects and delivers eligible evidence',async()=>{const x=setup();try{
 const result=await x.i.execute({jobs:[{...job,subject:{id:'bad',query:'x'.repeat(121)}},job]},1);
 assert.equal(result.jobs.length,1);assert.equal(result.jobs[0]!.status,'COMPLETED');assert.equal(result.rejectedJobs.length,1);assert.equal(result.rejectedJobs[0].code,'JOB_SCHEMA');assert.equal(x.s.list('owner','investigation_rejections').length,1);assert.equal(result.commerceEffects,0);
 await assert.rejects(x.i.execute({jobs:[job]},1),/CONSUMED/);
 }finally{x.done();}});
test('downstream enqueue interruption resumes original jobs without inference or duplication',async()=>{const x=setup();try{
 const enqueue=x.s.enqueue.bind(x.s);let once=true;x.s.enqueue=(...args)=>{if(once){once=false;throw Error('temporary storage failure');}return enqueue(...args);};
 x.i.observe('completed paid output',0,{provider:'openai',model:'fixture',requestKey:'receipt',usage:{totalTokens:12}});
 const first=await x.i.execute({jobs:[job]},1);assert.equal(first.jobs[0]!.status,'NOT_ENQUEUED');
 const resumed=await new PillowInvestigation(new IntelligenceStore(x.s.filename),'owner',x.grant).resume(1);assert.equal(resumed.jobs[0]!.status,'COMPLETED');assert.equal(x.s.jobs('owner').length,1);assert.equal(x.s.get('owner','investigations','mission')!.modelSteps.length,1);
 await assert.rejects(x.i.resume(1),/REFUSED/);
 }finally{x.done();}});
test('unknown running provider outcome is never replayed and failed authority cannot resume',async()=>{const x=setup();try{
 const id='inv_'+digest(['mission',1,0]).slice(0,32);x.s.enqueue('owner','PILLOW:request',{...job,id});x.s.claim('owner',id);
 const row=x.s.get('owner','investigations','mission')!;row.rounds=[{round:1,status:'STARTED',plans:[{...job,id}],jobIds:[id]}];x.s.put('owner','investigations','mission',row);
 const result=await x.i.resume(1);assert.equal(result.jobs[0]!.attempts,1);assert.equal(result.jobs[0]!.status,'RUNNING');assert.equal(x.s.get('owner','investigations','mission')!.rounds[0].status,'INCOMPLETE');
 x.i.fail(Error('interrupted'));await assert.rejects(x.i.resume(1),/REFUSED/);assert.throws(()=>claimInvestigation(x.s,'owner','different',instruction),/CONSUMED/);
 }finally{x.done();}});
test('paid output larger than old object bound survives failure intact with immutable provenance',()=>{const x=setup();try{
 const content='a'.repeat(90000);x.i.observe(content,0,{requestKey:'paid-call',provider:'openai',usage:{totalTokens:99}});x.i.fail(Error('downstream'));
 const row=x.s.get('owner','investigations','mission')!;const output=x.s.get('owner','model_outputs',row.modelSteps[0].outputId)!;assert.equal(output.content,content);assert.equal(output.sha256,digest(content));assert.equal(output.provenance.requestKey,'paid-call');assert.throws(()=>x.s.put('owner','model_outputs',output.id,{...output,content:'changed'}),/IMMUTABLE/);
 }finally{x.done();}});
test('exposed model contract covers the actual strict validator and limits',()=>{
 const schema=investigationToolContract.job as any;assert.equal(schema.additionalProperties,false);assert.deepEqual(schema.required,['id','objective','capabilities','subject']);assert.equal(schema.properties.subject.properties.query.maxLength,120);assert.equal(schema.properties.capabilities.maxItems,4);assert.equal(schema.properties.evidenceRefs.maxItems,12);assert.equal(schema.properties.requestLimit.maximum,12);assert.equal(schema.properties.requestLimit.type,'integer');assert.deepEqual(schema.properties.subject.properties.marketplace.enum,['US','SG','UK','DE','GLOBAL']);
 for(const query of ['x','x'.repeat(120)])assert.equal(jobSchema.safeParse({...job,subject:{id:'x',query}}).success,true);
 for(const invalid of [{...job,requestLimit:1.5},{...job,extra:true},{...job,subject:{id:'x',marketplace:'INVALID'}},{...job,subject:{id:'x',query:'x'.repeat(121)}}])assert.equal(jobSchema.safeParse(invalid).success,false);
});
test('retention protects historical investigation evidence and job receipts',async()=>{const x=setup();try{
 await x.i.execute({jobs:[job]},1);const before=x.s.list('owner','evidence');const future=new IntelligenceStore(x.s.filename,()=>Date.now()+200*86400000);future.prune('owner');assert.deepEqual(future.list('owner','evidence'),before);assert.equal(future.jobs('owner').length,1);
 }finally{x.done();}});
test('provider format derives every emitted field from the server contract with explicit acceptance subset',async()=>{
 const {investigationOutputFormat}=await import('../../intelligence/model-output.js');
 const {capabilities}=await import('../../intelligence/model.js');
 const clean=(value:any):any=>Array.isArray(value)?value.map(clean):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([key])=>key!=='default').map(([key,v])=>[key,clean(v)])):value;
 const server=clean(investigationToolContract.job) as any;
 for(const phase of ['plan','review','assessment'] as const){
  const format=investigationOutputFormat(phase) as any;const jobs=format.schema.properties.jobs;const output=jobs.items;
  assert.equal(format.strict,true);assert.equal(output.additionalProperties,false);assert.deepEqual(output.required,Object.keys(output.properties));
  assert.deepEqual(Object.keys(output.properties),Object.keys(server.properties).filter(k=>k!=='strategyRef'));
  for(const field of ['id','objective','evidenceRefs'])assert.deepEqual(output.properties[field],server.properties[field]);
  assert.deepEqual(output.properties.requestLimit,{...server.properties.requestLimit,maximum:3});
  assert.deepEqual(output.properties.capabilities,{...server.properties.capabilities,maxItems:3,items:{type:'string',enum:capabilities.filter(c=>c.implemented&&c.id!=='keepa.history').map(c=>c.id)}});
  for(const [field,schema] of Object.entries(server.properties.subject.properties))assert.deepEqual(output.properties.subject.properties[field],['variant','destination','query'].includes(field)?{anyOf:[schema,{type:'null'}]}:schema);
  assert.deepEqual(output.properties.subject.required,Object.keys(server.properties.subject.properties));assert.equal(output.properties.subject.additionalProperties,false);
  assert.equal(jobs.maxItems,phase==='assessment'?0:4);assert.equal(jobs.minItems,phase==='plan'?1:0);
  assert.deepEqual(Object.keys(format.schema.properties),['jobs','answer']);assert.equal(format.schema.additionalProperties,false);
 }
});

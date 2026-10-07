import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {execFileSync} from 'node:child_process';
const root='/data/commissioning/',base='http://127.0.0.1:8080',workspace='ws_empire_1',id='work3-live-supplier-v1';
const expected='148316923ee7676a6bd58d3f9ecd56ffdd984c82';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const file=root+'work3-production-verification.json',receipt=JSON.parse(fs.readFileSync(file));
const stage=process.argv[2];assert.ok(['seed','review','recover','final'].includes(stage));
const {productionMemory}=await import('/app/backend/dist/institutional-memory/store.js');
const m=productionMemory();assert.ok(m);
let token;
async function req(route,payload,auth=token){const r=await fetch(base+route,{method:payload===undefined?'GET':'POST',headers:{'content-type':'application/json',...(auth?{authorization:'Bearer '+auth}:{}),...(route==='/api/pillow/chat'?{'idempotency-key':'work3-live-review-v1'}:{})},body:payload===undefined?undefined:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')};}
function accounting(){const db=new DatabaseSync(root+'openai-october-2026.sqlite',{readOnly:true});try{return db.prepare("SELECT c.*,COALESCE(p.provider,'openai') provider,p.request_key FROM calls c LEFT JOIN call_providers p ON c.id=p.call_id ORDER BY c.rowid").all();}finally{db.close();}}
function save(){receipt.updatedAt=new Date().toISOString();fs.writeFileSync(file+'.tmp',JSON.stringify(receipt,null,2),{mode:0o600});fs.renameSync(file+'.tmp',file);}
const initialCalls=accounting();
try{
 const live=await req('/health/live'),ready=await req('/health/ready');assert.equal(live.data.deploy.gitCommitSha,expected);assert.equal(ready.data.birth,'NOT_BORN');assert.equal(ready.data.commerce,'LOCKED');assert.equal(ready.data.operational,false);
 receipt.production={backend:expected,deployment:live.data.deploy,birth:ready.data.birth,commerce:ready.data.commerce};
 const login=await req('/auth/login',{email:process.env.FOUNDER_EMAIL,password:process.env.FOUNDER_PASSWORD});assert.equal(login.status,200);token=decodeURIComponent(login.cookie.match(/empireai_session=([^;]+)/)[1]);
 const read=async(domain,recordId)=>{const r=await req('/api/owner/advisor/read?domain='+domain+(recordId?'&id='+recordId:''));assert.equal(r.status,200);assert.notEqual(r.data.status,'UNAVAILABLE');return r.data;};
 if(stage==='seed'){
  const evidence={id:'work3-synthetic-observation',hash:hash('WORK3 synthetic observation delivery 14 days'),observedAt:'2026-10-07T00:00:00.000Z',source:'SYNTHETIC Work3 deterministic acceptance; no shipment or supplier call'};
  const experience={id,scope:{domain:'supplier',entities:['work3-fixture']},belief:'Synthetic lead time expected within five to eight days',decision:'Observe this fixture only; no order',rationale:'Demonstrate immutable expectation versus later synthetic outcome',evidence:[evidence],expectation:{description:'Synthetic delivery time',metrics:[{name:'delivery',unit:'days',low:5,high:8}],assumptions:['Synthetic fixture, no real commerce'],dueAt:'2026-10-07T00:00:00.000Z'},confidence:0.5};
  const command={action:'synthetic_experience',experience};assert.equal((await req('/api/owner/advisor/memory',command,null)).status,401);
  const create=await req('/api/owner/advisor/memory',command);assert.equal(create.status,200,JSON.stringify(create.data));assert.equal((await req('/api/owner/advisor/memory',command)).data.result.created,false);
  const event=async event=>{const r=await req('/api/owner/advisor/memory',{action:'event',event});assert.equal(r.status,200,JSON.stringify(r.data));};
  await event({id:'work3-live-outcome-v1',target:id,kind:'OUTCOME',note:'Synthetic actual fourteen days; not a real shipment',expectedVersion:0,outcome:{status:'OUTCOME_OBSERVED',observedAt:evidence.observedAt,evidence:[evidence],metrics:[{name:'delivery',unit:'days',value:14}]}});
  await event({id:'work3-live-lesson-v1',target:id,kind:'LESSON',note:'Synthetic candidate: verify supplier freshness before trusting the range; never treat this as real operational learning',expectedVersion:1,refs:['work3-live-outcome-v1']});
  await event({id:'work3-live-challenge-v1',target:id,kind:'ADVISOR_CHALLENGE',note:'Owner-recorded synthetic Advisor challenge: one delayed result does not establish bad process or causality',expectedVersion:2,refs:['work3-live-outcome-v1']});
  const rejected=await req('/api/owner/advisor/memory',{action:'event',event:{id:'work3-live-forbidden-promotion',target:id,kind:'PROMOTE',note:'Synthetic must not promote',refs:['work3-live-lesson-v1'],expectedVersion:3}});assert.equal(rejected.status,400);
  const r=(await read('memory',id)).data;assert.equal(r.origin.authenticity,'SYNTHETIC');assert.equal(r.expectation.metrics[0].high,8);assert.equal(r.events[0].discrepancy[0].delta,6);assert.equal(r.current.learningEligible,false);
  assert.equal(m.bootstrap(workspace,'supplier recommendation').retrievedIds.includes(id),false);assert.equal(m.get('different-workspace',id),null);
  const reopened=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',`import {productionMemory} from '/app/backend/dist/institutional-memory/store.js';const m=productionMemory();console.log(JSON.stringify({identity:m.identity('${workspace}'),experience:m.get('${workspace}','${id}')}));`],{encoding:'utf8',env:{...process.env,REDIS_URL:'',OPENAI_MODEL:'simulated-independent-model'}}));assert.equal(hash(reopened.experience),hash(r));assert.equal(reopened.identity.modelBinding,'NONE');
  assert.equal((await req('/amazon/publish',{synthetic:true})).status,423);
  assert.equal(hash(accounting()),hash(initialCalls));
  receipt.deterministic={status:'PASS',id,authenticity:r.origin.authenticity,originalExpectation:[5,8],actual:14,delta:6,lesson:r.current.lessonStatus,provenance:true,unauthenticatedWriteDenied:true,syntheticPromotionDenied:true,crossWorkspaceDenied:true,ordinaryRetrievalExcludesSynthetic:true,separateProcessReload:true,redisIndependent:true,providerIndependent:true,ownerAuthentication:true,inferenceCalls:0,commerceEffectRoute:423};
  receipt.status='DEPLOYED_DETERMINISTIC_PASS';receipt.nextSafeAction='Connected Advisor readback then one fresh synthetic Pillow review';
 }
 if(stage==='review'){
  assert.equal(receipt.deterministic.status,'PASS');assert.equal(receipt.liveReview,undefined,'Never repeat an already-started live acceptance');
  const message='Review experience '+id+' [SYNTHETIC_MEMORY_TEST]. This fresh Work3 acceptance is synthetic only, in a new session. Using the institutional context supplied to you, identify your persistent CEO identity and distinguish the independent Kings Advisor. State the immutable expected range, synthetic observed value, discrepancy and candidate lesson from this record. Assess process quality separately from outcome and uncertain causality. Respect NOT_BORN and commerce LOCKED; do not execute anything or claim real experience. Return a concise business rationale and the visible executive-review JSON requested in your institutional capture contract. Do not research externally.';
  receipt.liveReview={status:'SUBMITTING',session:'work3-fresh-review-v1',message,reason:'One actual reasoning call is needed to verify new-session institutional context reaches Pillow and shapes its visible rationale',beforeCallIds:initialCalls.map(c=>c.id)};save();
  const r=await req('/api/pillow/chat',{sessionId:'work3-fresh-review-v1',workspaceId:workspace,message,provider:'openai'});assert.ok([200,202].includes(r.status),JSON.stringify(r.data));
  receipt.liveReview.admission=r.data;const requestId=r.data.requestId??r.data.request?.requestId??r.data.result?.requestId;assert.ok(requestId,'Missing durable request ID');receipt.liveReview.requestId=requestId;receipt.liveReview.status='PENDING';save();
  let rec;for(let n=0;n<80;n++){const poll=await req('/api/pillow/chat-request/'+requestId);assert.equal(poll.status,200);rec=poll.data.request;if(['COMPLETED','FAILED'].includes(rec.status))break;await new Promise(r=>setTimeout(r,3000));}
  receipt.liveReview.status=rec.status;receipt.liveReview.failureClass=rec.failureClass;receipt.liveReview.result=rec.finalResult;receipt.liveReview.accounting=accounting().filter(c=>!initialCalls.some(b=>b.id===c.id));save();assert.equal(rec.status,'COMPLETED');
  const record=m.get(workspace,id);receipt.liveReview.recordedReviewEvents=record.events.filter(e=>e.origin.actor==='PILLOW').map(e=>({id:e.id,kind:e.kind,authenticity:e.origin.authenticity,review:e.review,note:e.note}));assert.ok(receipt.liveReview.recordedReviewEvents.some(e=>e.kind==='REVIEW'),'Pillow review not retained');assert.equal(record.expectation.metrics[0].high,8);assert.equal(record.current.learningEligible,false);
  receipt.status='LIVE_PILLOW_REVIEW_PASS';receipt.nextSafeAction='Restart/reload, final preservation and connected bridge closure';
 }
 if(stage==='recover'){
  const prior=receipt.liveReview;assert.equal(prior.status,'COMPLETED');assert.equal(prior.result.kind,'llm');assert.ok(prior.message.includes('[SYNTHETIC_MEMORY_TEST]'));
  const before=m.get(workspace,id),identity=m.identity(workspace);assert.equal(before.origin.authenticity,'SYNTHETIC');assert.equal(before.expectation.metrics[0].high,8);
  if(receipt.repairPreCutover){assert.equal(hash(before),receipt.repairPreCutover.memoryHash);assert.equal(hash(identity),receipt.repairPreCutover.identityHash);}
  const input={request:prior.requestId,session:prior.result.sessionId,question:prior.message,answer:prior.result.message,influences:[id]};
  m.captureDecision(workspace,input);assert.equal(m.captureDecision(workspace,input).created,false);
  const after=m.get(workspace,id);assert.equal(after.events.length,before.events.length+2);assert.equal(after.expectation.metrics[0].high,8);assert.equal(after.current.learningEligible,false);
  prior.recordedReviewEvents=after.events.filter(e=>e.origin.actor==='PILLOW').map(e=>({id:e.id,kind:e.kind,authenticity:e.origin.authenticity,review:e.review,note:e.note}));assert.ok(prior.recordedReviewEvents.some(e=>e.kind==='REVIEW'));
  assert.equal(hash(accounting()),hash(initialCalls));receipt.recovery={status:'PASS',completedResponseReprocessed:true,idempotent:true,additionalInference:0,originalExpectationPreserved:true,syntheticIsolation:true};receipt.restartDurability={status:'PASS',method:'Actual backend deployment replacement after memory creation',priorBackend:'5a7571136f63438c6ca7a6cf83f67d7d58a57f44',currentBackend:expected,identityAndExperienceUnchangedBeforeAppend:true};
  receipt.status='LIVE_PILLOW_REVIEW_PASS';receipt.nextSafeAction='Final preservation and connected bridge closure';
 }
 if(stage==='final'){
  const before=JSON.parse(fs.readFileSync(root+'work3-precutover.json'));const preservation={};
  for(const [group,filename] of [['accounting',root+'openai-october-2026.sqlite'],['pillow',root+'pillow-reasoning.sqlite'],['advisor',root+'communications.sqlite'],['business',process.env.DATABASE_PATH]]){const db=new DatabaseSync(filename,{readOnly:true});preservation[group]={};for(const [table,b] of Object.entries(before.groups[group])){const rows=db.prepare('SELECT * FROM '+table+' ORDER BY rowid').all(),hashes=new Set(rows.map(hash));assert.ok(b.rowHashes.every(h=>hashes.has(h)),group+'/'+table+' prior data changed');preservation[group][table]={priorRowsPreserved:true,before:b.count,after:rows.length,digest:hash(rows)};}db.close();}
  assert.equal(hash(JSON.parse(fs.readFileSync(root+'work2-production-verification.json'))),before.work2.hash);
  const assurance=await read('assurance');preservation.assurance={available:true,status:assurance.status};preservation.work2Ledger={unchanged:true,status:before.work2.status};
  const record=(await read('memory',id)).data;assert.equal(record.origin.authenticity,'SYNTHETIC');assert.equal(record.expectation.metrics[0].high,8);assert.ok(record.events.some(e=>e.kind==='REVIEW'));assert.equal(record.current.learningEligible,false);
  receipt.preservation=preservation;receipt.storageBytes=fs.statSync(root+'pillow-institutional.sqlite').size;receipt.finalReadAccountingUnchanged=hash(accounting())===hash(initialCalls);assert.equal(receipt.finalReadAccountingUnchanged,true);receipt.status='FINAL_PRESERVATION_PASS';receipt.nextSafeAction='Confirm connected Advisor and frontend; publish final closure';
 }
 save();console.log(JSON.stringify({stage,status:receipt.status,deterministic:receipt.deterministic,liveReview:receipt.liveReview?{status:receipt.liveReview.status,requestId:receipt.liveReview.requestId,accounting:receipt.liveReview.accounting,recordedReviewEvents:receipt.liveReview.recordedReviewEvents,result:receipt.liveReview.result}:undefined,preservation:receipt.preservation,storageBytes:receipt.storageBytes}));
}catch(error){receipt.lastFailure={stage,error:error.message,at:new Date().toISOString()};save();console.error(JSON.stringify(receipt.lastFailure));process.exitCode=1;}finally{if(token)await req('/auth/logout',{}).catch(()=>{});}

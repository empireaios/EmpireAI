import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';

// Execute the source boundary rather than a copied implementation. This harness
// controls HTTP/IO and the comparator response; it is not native A5 acceptance or
// a replacement for the separate tests of the real canonical comparator.
const browserPath=new URL('../foundation/controller/scripts/work8/native-transition/browser.mjs',import.meta.url);
const source=fs.readFileSync(browserPath,'utf8');
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const plain=value=>JSON.parse(JSON.stringify(value));
function section(start,end){
 const begin=source.indexOf(start),finish=source.indexOf(end,begin+start.length);
 assert.ok(begin>=0&&finish>begin,`source section unavailable: ${start}`);
 return source.slice(begin,finish);
}
const helpers=section('function check(', '\nfunction signal(')+
 section('function privateRead(', '\nfunction validateFrozen(')+
 section('function validateFrozen(', '\ntry{')+
 section(' async function post(', '\n const sid=');
const normalReplay=section(" stage='CANONICAL_PAUSE_AND_REVOKE';",' // A NORMAL same-origin');
const sequence=['PAUSE_APPLIED','REVOKE_APPLIED','FROZEN_SNAPSHOT_OBSERVED','PAUSE_REPLAY_IDENTICAL','REVOKE_REPLAY_IDENTICAL','NORMAL_REPLAY_SNAPSHOT_OBSERVED'];
const canary='PRIVATE_OWNER_AND_RECORD_CANARY';
function fixture(){return {
 session:{status:'PAUSED',version:3,owner:canary},authority:{status:'REVOKED',version:2,grant:{private:canary}},
 liveCommerce:'LOCKED',birth:'NOT_BORN',actualCashMovement:0,next:null,
 tasks:Array.from({length:2},()=>({status:'COMPLETE',cursor:1,stepCount:1,paidInference:0})),
 records:Array.from({length:2},()=>({version:10,private:canary,finance:{events:[{},{ }],actualCashMovement:0,classification:'SIMULATION_EXCLUDED_FROM_ACTUALS'},orders:{privateOrder:{order:{createdAt:'2026-11-01T00:00:00.000Z',integrationMode:'SANDBOX'},outcome:'DELIVERED'}}})),
};}
function comparatorResult(pass=true){return {
 schema:'WORK8_V28_CANONICAL_COMPARISON_V1',pass,canonicalEqual:pass,persistenceEqual:true,
 canonicalSha256:'a'.repeat(64),observedCanonicalSha256:pass?'a'.repeat(64):'b'.repeat(64),
 persistenceSha256:'c'.repeat(64),observedPersistenceSha256:'c'.repeat(64),sourceIdentitySha256:'d'.repeat(64),
 diagnostics:pass?[]:[{code:'VALUE_CHANGED',path:'$.session.version',classification:'CANONICAL_CONTROL_OR_PERSISTED_PROJECTION',expectedSha256:'e'.repeat(64),observedSha256:'f'.repeat(64)}],
 totalIssues:pass?0:1,diagnosticsTruncated:false,observations:[],independentReview:'REQUIRED_BEFORE_ACCEPTANCE',
};}
function harness({comparisonPass=true,httpFaultAt=-1,httpStatus=200,duplicateMismatchAt=-1,readError=null,readbackPassed=true}={}){
 const files=new Map(),signals=[],requests=[],events=[],comparatorInputs=[];
 const receipt={status:'FAIL',wholeRowsAccepted:[],phases:[],operations:[]};
 const snapshots=[fixture(),fixture()];let snapshotIndex=0;
 const context={
  assert,SyntaxError,Date,Number,JSON,console:{error:message=>events.push({kind:'stderr',message})},
  fs:{writeFileSync:(path,data)=>{files.set(path,data);events.push({kind:'write',path});}},
  sha:digest,comparisonSequence:[],receipt,stage:'START',process:{exitCode:0},
  browser:{isConnected:()=>true},ownerPage:{isClosed:()=>false},
  read:name=>{if(/^(normal|returned|replayed)-readback-ready\.json$/.test(name))return {allPassed:readbackPassed};if(readError)throw readError;return {canonical:{private:canary},finance:[]};},
  signal:(name,value)=>{signals.push({name,value:plain(value)});return {status:'PRIVATE_HANDOFF'};},
  wait:async name=>events.push({kind:'wait',name}),
  sid:'LOCAL_TEST_ONLY',progress:{session:{version:2},authority:{version:1}},minimumCreatedAt:0,
  views:{normal:{commit:'1'.repeat(40)},recovery:{commit:'2'.repeat(40)}},
  observedSnapshot:async()=>{events.push({kind:'snapshot'});return {value:snapshots[snapshotIndex++],observation:{startedAtMs:1000,completedAtMs:1001}};},
  api:async(route,body)=>{
   const index=requests.length;requests.push(plain(body));events.push({kind:'request',action:body.transition?.action??body.authority?.action});
   const response=body.transition?{session:{status:'PAUSED',version:3}}:{authority:{status:'REVOKED',version:2}};
   if(index===duplicateMismatchAt)response.changed=true;
   return {status:index===httpFaultAt?httpStatus:200,body:response};
  },
  compareSnapshots:input=>{comparatorInputs.push(input);return comparatorResult(comparisonPass);},
 };
 vm.createContext(context);vm.runInContext(helpers,context,{filename:'browser.mjs'});
 return {context,files,signals,requests,events,comparatorInputs,receipt,snapshots,
  async run(){try{await vm.runInContext(`(async()=>{${normalReplay}})()`,context,{filename:'browser.mjs'});return null;}catch(error){context.recordFailure(error);return error;}},
  comparison(label='normal-replay'){return JSON.parse(files.get('/evidence/'+label+'-comparison.json'));},
 };
}
function assertDigest(receipt){const {receiptPayloadSha256,...payload}=receipt;assert.equal(receiptPayloadSha256,digest(payload));}

test('actual PAUSE then REVOKE then exact duplicates generate a bounded integrity-bound normal receipt',async()=>{
 const h=harness();assert.equal(await h.run(),null);
 assert.deepEqual(h.requests.map(body=>body.transition?.action??body.authority?.action),['PAUSE','REVOKE','PAUSE','REVOKE']);
 assert.deepEqual(h.requests[0],h.requests[2]);assert.deepEqual(h.requests[1],h.requests[3]);
 assert.deepEqual(h.events.filter(e=>['request','snapshot'].includes(e.kind)).map(e=>e.action??e.kind),['PAUSE','REVOKE','snapshot','PAUSE','REVOKE','snapshot']);
 const result=h.comparison();assertDigest(result);
 assert.deepEqual(result.comparisonContext.completedSequence,sequence);
 assert.equal(result.comparisonContext.observedPhase,'NORMAL_REPLAY');
 assert.equal(result.comparisonContext.originalPredicate,'A5-09_CANONICAL_AND_PERSISTED_STATE_PRESERVATION');
 assert.equal(result.comparisonContext.replayClassification,'EXACT_DUPLICATE_RESPONSES_IDENTICAL');
 assert.equal(result.comparisonContext.replayScope,'NORMAL_BEFORE_RECOVERY');
 assert.deepEqual(result.comparisonContext.expected,{sessionVersion:3,authorityVersion:2,recordVersions:[10,10],sessionStatus:'PAUSED',authorityStatus:'REVOKED'});
 assert.deepEqual(result.comparisonContext.persistenceReads,{expected:'READ_OK',observed:'READ_OK'});
 assert.equal(h.comparatorInputs.length,1);assert.equal(h.comparatorInputs[0].expected,h.snapshots[0]);assert.equal(h.comparatorInputs[0].observed,h.snapshots[1]);
 assert.ok(!JSON.stringify(result).includes(canary));assert.deepEqual(h.receipt.wholeRowsAccepted,[]);
});

test('controlled comparison failure writes diagnostic receipt before recording the original failure and retains it through cleanup',async()=>{
 const h=harness({comparisonPass:false});const error=await h.run();assert.match(error.message,/NORMAL_REPLAY_CANONICAL_COMPARISON_FAILED/);
 const result=h.comparison();assertDigest(result);assert.equal(result.pass,false);assert.deepEqual(result.diagnostics,comparatorResult(false).diagnostics);
 assert.equal(h.receipt.failure.code,'NORMAL_REPLAY_CANONICAL_COMPARISON_FAILED');
 assert.equal(h.receipt.failedStage,'CANONICAL_PAUSE_AND_REVOKE');
 const first=h.signals.filter(x=>x.name==='browser-first-failure.json');assert.equal(first.length,1);
 h.context.stage='CLEANUP';h.context.recordFailure(new Error('CONTROLLED_CLEANUP_FAILURE'));
 assert.equal(h.receipt.failure.code,'NORMAL_REPLAY_CANONICAL_COMPARISON_FAILED');assert.equal(h.receipt.cleanupFailure.code,'CONTROLLED_CLEANUP_FAILURE');
 assert.equal(h.receipt.status,'FAIL');assert.equal(h.context.process.exitCode,1);assert.deepEqual(h.receipt.wholeRowsAccepted,[]);
 assert.equal(h.signals.filter(x=>x.name==='browser-first-failure.json').length,1);assert.equal(h.comparison().receiptPayloadSha256,result.receiptPayloadSha256);
});

for(const [name,options,code,prefix]of [
 ['stale replay HTTP 409',{httpFaultAt:2,httpStatus:409},'FRONTEND_CANONICAL_COMMAND_REFUSED',sequence.slice(0,3)],
 ['unauthorized replay HTTP 401',{httpFaultAt:2,httpStatus:401},'FRONTEND_CANONICAL_COMMAND_REFUSED',sequence.slice(0,3)],
 ['forbidden REVOKE replay HTTP 403',{httpFaultAt:3,httpStatus:403},'FRONTEND_CANONICAL_COMMAND_REFUSED',sequence.slice(0,4)],
 ['nonidentical PAUSE duplicate',{duplicateMismatchAt:2},'PAUSE_REPLAY_NOT_IDENTICAL',sequence.slice(0,3)],
 ['nonidentical REVOKE duplicate',{duplicateMismatchAt:3},'REVOKE_REPLAY_NOT_IDENTICAL',sequence.slice(0,4)],
 ['initial PAUSE refusal',{httpFaultAt:0,httpStatus:409},'FRONTEND_CANONICAL_COMMAND_REFUSED',[]],
])test(`${name} fails closed without claiming completed replay or comparison`,async()=>{
 const h=harness(options);assert.ok(await h.run());assert.equal(h.receipt.failure.code,code);assert.deepEqual(h.context.comparisonSequence,prefix);
 assert.equal(h.files.has('/evidence/normal-replay-comparison.json'),false);assert.equal(h.comparatorInputs.length,0);assert.deepEqual(h.receipt.wholeRowsAccepted,[]);
});

for(const [name,error,status]of [
 ['missing persistence',Object.assign(new Error(canary),{code:'ENOENT'}),'MISSING'],
 ['invalid persistence JSON',new SyntaxError(canary),'JSON_INVALID'],
 ['other persistence IO failure',Object.assign(new Error(canary),{code:'EACCES'}),'READ_FAILED'],
])test(`${name} retains a bounded read classification without raw exception text`,async()=>{
 const h=harness({comparisonPass:false,readError:error});await h.run();const result=h.comparison();assertDigest(result);
 assert.deepEqual(result.comparisonContext.persistenceReads,{expected:status,observed:status});
 assert.deepEqual(plain(h.comparatorInputs[0].expectedPersistence),{});assert.deepEqual(plain(h.comparatorInputs[0].observedPersistence),{});
 assert.equal(result.pass,false);assert.ok(!JSON.stringify(result).includes(canary));
});

test('receipt revision and status projection is bounded and never exposes raw values',()=>{
 const h=harness();const expected={session:{version:-1,status:canary},authority:{version:2147483648,status:canary},records:Array.from({length:25},(_,i)=>({version:i===0?canary:i}))};
 h.context.compareRecorded('normal-replay',expected,{session:{version:3.5},authority:{version:null}}, {},{},'normal',{});
 const result=h.comparison();assertDigest(result);const context=result.comparisonContext;
 assert.equal(context.expected.sessionVersion,null);assert.equal(context.expected.authorityVersion,null);assert.equal(context.expected.recordVersions.length,16);assert.equal(context.expected.recordVersions[0],null);
 assert.equal(context.expected.sessionStatus,'UNCLASSIFIED');assert.equal(context.expected.authorityStatus,'UNCLASSIFIED');assert.equal(context.observed.sessionVersion,null);
 assert.deepEqual(context.completedSequence,[]);assert.equal(context.replayClassification,'NOT_ESTABLISHED');assert.ok(!JSON.stringify(result).includes(canary));
});

test('future comparison phases retain their distinct phase without claiming unobserved operations',()=>{
 const h=harness();for(const [label,phase]of [['returned','NORMAL_RETURN'],['replayed','NORMAL_RETURN_REPLAY']]){
  h.context.compareRecorded(label,fixture(),fixture(),{},{},label,{});const result=h.comparison(label);assertDigest(result);
  assert.equal(result.comparisonContext.observedPhase,phase);assert.deepEqual(result.comparisonContext.completedSequence,[]);assert.equal(result.comparisonContext.replayClassification,'NOT_ESTABLISHED');
 }
});

test('independent readback refusal remains failure even with a successful controlled comparator response',async()=>{
 const h=harness({readbackPassed:false});await h.run();assert.equal(h.comparison().pass,true);assert.equal(h.receipt.failure.code,'NORMAL_INDEPENDENT_READBACK_FAILED');assert.deepEqual(h.receipt.wholeRowsAccepted,[]);assert.equal(h.receipt.status,'FAIL');
});

test('failed NORMAL readback retains precedence when the comparison also fails, and its comparison receipt survives',async()=>{
 const h=harness({readbackPassed:false,comparisonPass:false});await h.run();assert.equal(h.comparison().pass,false);assertDigest(h.comparison());
 assert.equal(h.receipt.failure.code,'NORMAL_INDEPENDENT_READBACK_FAILED');assert.equal(h.receipt.status,'FAIL');assert.deepEqual(h.receipt.wholeRowsAccepted,[]);
});

for(const [label,start,end,code]of [
 ['returned',' const returnComparison=compareRecorded(',"\n stage='NORMAL_RETURN_IDEMPOTENT_REPLAY';",'RETURNED_INDEPENDENT_READBACK_FAILED'],
 ['replayed',' const replayComparison=compareRecorded(','\n receipt.phases.push({phase:\'NORMAL_RETURN\'', 'REPLAYED_INDEPENDENT_READBACK_FAILED'],
])test(`${label} readback retains precedence over a downstream comparison refusal`,async()=>{
 const h=harness({readbackPassed:false,comparisonPass:false});const frozen=fixture();
 Object.assign(h.context,{frozen,frozenRead:{observation:{}},returned:fixture(),returnedRead:{observation:{}},afterReplay:fixture(),replayedRead:{observation:{}},ownerContinuity:async()=>{}});
 try{await vm.runInContext(`(async()=>{${section(start,end)}})()`,h.context,{filename:'browser.mjs'});assert.fail('readback refusal was not raised');}catch(error){h.context.recordFailure(error);}
 assert.equal(h.receipt.failure.code,code);assert.equal(h.comparison(label).pass,false);assertDigest(h.comparison(label));assert.deepEqual(h.receipt.wholeRowsAccepted,[]);
});

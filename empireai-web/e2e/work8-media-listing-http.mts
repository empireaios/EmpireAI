import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
/** Actual authenticated route examination; kernel-isolated, disposable synthetic records only. */
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';
if(process.env.WORK8_KERNEL_EGRESS!=='CONNECT_DENIED_LISTEN_ALLOWED')throw Error('KERNEL_ISOLATION_REQUIRED');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'o19-http-'));fs.mkdirSync(path.join(root,'commissioning'));
Object.assign(process.env,{NODE_ENV:'test',FOUNDER_EMAIL:'owner@example.invalid',RAILWAY_VOLUME_MOUNT_PATH:root,DATABASE_PATH:path.join(root,'legacy.sqlite'),EMPIRE_RUNTIME_PROFILE:'LOCKED_COMMISSIONING_V1',EMPIRE_ENGINEERING_TEST_MODE:'true',INTELLIGENCE_DISABLED:'true',LOG_LEVEL:'fatal'});
globalThis.fetch=async()=>{throw Error('EXTERNAL_FETCH_FORBIDDEN')};
const backend=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../backend');
const load=(relative:string)=>import(pathToFileURL(path.join(backend,relative)).href);
const {default:Fastify}=await load('node_modules/fastify/fastify.js'),{default:cookie}=await load('node_modules/@fastify/cookie/plugin.js');
const {registerGovernedCommerce,productionCommerce}=await load('src/runtime/commerce-runtime/governed/runtime.ts');
const {createAuthMiddleware}=await load('src/auth/middleware.ts'),{InMemorySessionStore}=await load('src/auth/session-store.ts');
const {installLockedCommissioning}=await load('src/runtime/locked-commissioning.ts'),{acceptanceScenario}=await load('src/runtime/commerce-runtime/governed/scenario.ts');
const app=Fastify(),sessions=new InMemorySessionStore();await app.register(cookie);installLockedCommissioning(app);registerGovernedCommerce(app,createAuthMiddleware(sessions));
const user={id:'owner',email:'owner@example.invalid',name:'Examination owner',role:'founder',workspaceId:'ws_empire_1'} as const,p={workspace:user.workspaceId,owner:user.id},c=productionCommerce(),tokens={owner:(await sessions.create(user)).token,foreign:(await sessions.create({...user,workspaceId:'other'})).token};
const checks:string[]=[];const call=async(media:unknown,who:'owner'|'foreign'|null='owner')=>app.inject({method:'POST',url:'/api/owner/commerce',headers:who?{cookie:'empireai_session='+tokens[who]}:{},payload:{action:'twin_media',media}});
try{
const session=c.twin.transition(p,{id:'create',sessionId:'listing',expectedVersion:0,action:'CREATE'}),f=acceptanceScenario(session.twinWorkspace,user.id,Date.now());
c.twin.transition(p,{id:'resume',sessionId:'listing',expectedVersion:1,action:'RESUME'});
const first=c.engine.execute(f.actors.PROPOSER,{id:'research',missionId:'listing',expectedVersion:0,command:f.steps[0]!.command});let reference={sessionId:'listing',missionId:'listing',receiptDigest:first.digest};
const asset={id:'image',url:'https://example.invalid/original.svg',kind:'IMAGE',sha256:createHash('sha256').update('<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><rect width="220" height="220" fill="#225577"/><text x="10" y="110" fill="white">Owner-directed test media</text></svg>').digest('hex'),sourceIdentity:f.candidate.productId,rightsEvidence:'evidence-QUALITY',rightsStatus:'OWNER_REVIEWED',provenance:'Original examination media; no supplier licence or personal attestation'};
const propose={action:'PROPOSE',id:'proposal',reference,expectedVersion:0,instructions:'Prepare permitted test listing',assets:[asset],editingReceipt:'Local original image'};
assert.equal((await call(propose,null)).statusCode,401);assert.equal((await call(propose,'foreign')).statusCode,403);checks.push('Anonymous401 and foreignworkspace403');
let r=await call(propose);assert.equal(r.statusCode,200,r.body);let batchDigest=r.json().batchDigest;
r=await call({action:'APPROVE_INTERNAL',id:'internal',reference,expectedVersion:1,batchDigest});assert.equal(r.statusCode,200,r.body);
const listing={...f.listing,images:[{url:asset.url,sha256:asset.sha256,rightsEvidence:asset.rightsEvidence,license:asset.provenance}]},apply={action:'APPLY_LISTING',id:'apply',reference,expectedVersion:2,batchDigest,listing};
assert.notEqual((await call({...apply,expectedVersion:1})).statusCode,200);assert.notEqual((await call({...apply,reference:{...reference,receiptDigest:'0'.repeat(64)}})).statusCode,200);checks.push('Stale version and forged source refused');
r=await call(apply);assert.equal(r.statusCode,200,r.body);const binding=r.json().listingBinding,latest=c.store.history(session.twinWorkspace,'listing').at(-1)!;assert.deepEqual(latest.state.listing,listing);assert.equal(binding.candidateDigest,latest.state.candidateDigest);assert.equal(latest.state.approval,undefined);assert.equal(latest.state.review,undefined);checks.push('Authenticated actual route binds exact image and candidate digest; review remains required');
assert.notEqual((await call(apply)).statusCode,200);reference={...reference,receiptDigest:latest.digest};assert.equal(c.twinRuntime.media.read(p,reference).externalStatus,'NOT_SUBMITTED');checks.push('Old request replay rejected; no inherited publication approval');
const transferRequest={action:'TRANSFER_LISTING',id:'transfer',reference,expectedVersion:3,batchDigest,targetMissionId:'listing-owner-copy'};
assert.equal((await call(transferRequest,null)).statusCode,401);assert.equal((await call(transferRequest,'foreign')).statusCode,403);
r=await call(transferRequest);assert.equal(r.statusCode,200,r.body);const transferBinding=r.json().transferBinding;assert.equal(transferBinding.sourceReceiptDigest,latest.digest);assert.equal(transferBinding.candidateDigest,binding.candidateDigest);assert.equal(transferBinding.targetWorkspace,p.workspace);
assert.notEqual((await call(transferRequest)).statusCode,200);checks.push('Authenticated production transfer derives payload solely from durable approved binding; replay and foreign owners refused');
// New source identity requires a fresh proposal and both approval stages; only media submission interception follows.
r=await call({...propose,id:'proposal-new',reference,expectedVersion:4});assert.equal(r.statusCode,200,r.body);batchDigest=r.json().batchDigest;
assert.notEqual((await call({action:'APPROVE_EXTERNAL',id:'early',reference,expectedVersion:5,batchDigest})).statusCode,200);
assert.equal((await call({action:'APPROVE_INTERNAL',id:'internal-new',reference,expectedVersion:5,batchDigest})).statusCode,200);
assert.equal((await call({action:'APPROVE_EXTERNAL',id:'external-new',reference,expectedVersion:6,batchDigest})).statusCode,200);
assert.equal(c.twinRuntime.media.read(p,reference).externalStatus,'SIMULATED_SUBMISSION_INTERCEPTED');assert.equal((await app.inject({method:'POST',url:'/api/owner/commerce/execute',headers:{cookie:'empireai_session='+tokens.owner}})).statusCode,423);checks.push('Fresh separate approvals required; media submission intercepted; live execute423');
// Review and approve the actual production-created target; no test copying of source payload.
let commandVersion=2,commandSequence=0;
const canonical=async(command:unknown)=>{const response=await app.inject({method:'POST',url:'/api/owner/commerce',headers:{cookie:'empireai_session='+tokens.owner},payload:{action:'command',input:{id:'canonical-'+(++commandSequence),missionId:transferBinding.targetMissionId,expectedVersion:commandVersion,command}}});if(response.statusCode===200)commandVersion++;return response;};
const actualTarget=c.store.history(p.workspace,transferBinding.targetMissionId).at(-1)!;assert.equal(actualTarget.digest,transferBinding.targetReceiptDigest);assert.equal(actualTarget.state.candidateDigest,binding.candidateDigest);assert.deepEqual(actualTarget.state.listing,latest.state.listing);
assert.notEqual((await call({...transferRequest,id:'later-transfer',expectedVersion:7})).statusCode,200);
const capacity={account:'simulation',marketplace:'US',mode:'NEW_ASIN',asin:null,newAsinRemaining:10,unsoldRemaining:10,requestsPerSecond:5,eligibility:'ELIGIBLE',provenance:f.candidate.offer.provenance};
assert.notEqual((await canonical({type:'publication_intent',capacity})).statusCode,200);
assert.notEqual((await canonical({type:'approve',digest:binding.candidateDigest,expiresAt:new Date(Date.now()+3600000).toISOString(),maxExposure:100})).statusCode,200);
r=await canonical({type:'review',digest:binding.candidateDigest,decision:'APPROVE',reason:'Independent deterministic policy role; labelled isolated route examination'});assert.equal(r.statusCode,200,r.body);
r=await canonical({type:'approve',digest:binding.candidateDigest,expiresAt:new Date(Date.now()+3600000).toISOString(),maxExposure:100});assert.equal(r.statusCode,200,r.body);
r=await canonical({type:'publication_intent',capacity});assert.equal(r.statusCode,200,r.body);const publication=r.json().receipt;assert.equal(publication.state.publicationIntent.status,'INTERCEPTED');assert.equal(publication.state.candidateDigest,binding.candidateDigest);assert.deepEqual(publication.state.listing,latest.state.listing);assert.equal(publication.externalEffects,0);assert.notEqual(publication.state.review.actor,publication.state.approval.actor);assert.notEqual(publication.actor.id,publication.state.review.actor);assert.notEqual(publication.actor.id,publication.state.approval.actor);
assert.notEqual((await canonical({type:'publication_intent',capacity})).statusCode,200);checks.push('Production durable-binding transfer preserves candidate digest; independent policy/owner approvals gate canonical intercepted publication intent and reject repeat');
console.log(JSON.stringify({status:'PASS_SCOPED_AUTHENTICATED_HTTP',checks,binding,transferBinding,publication:{receiptDigest:publication.digest,candidateDigest:publication.state.candidateDigest,listingDigest:publication.state.listingDigest,imageSHA256:publication.state.listing.images[0].sha256,intercept:publication.state.publicationIntent,reviewer:publication.state.review.actor,owner:publication.state.approval.actor,executor:publication.actor.id},externalEffects:0,paidInference:0,limits:['No native UI assertion','Explicit authenticated durable-binding synthetic transfer; no genuine supplier qualification']},null,2));
}finally{await app.close();fs.rmSync(root,{recursive:true,force:true});}

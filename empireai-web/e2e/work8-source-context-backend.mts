/** Isolated authenticated actual data routes. Historical genuine observations; no provider or model calls. */
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const [backend,root,readyFile]=process.argv.slice(2);if(!backend||!root||!readyFile||process.env.WORK8_KERNEL_EGRESS!=='CONNECT_DENIED_LISTEN_ALLOWED')throw Error('ISOLATION_REQUIRED');
Object.assign(process.env,{NODE_ENV:'test',REDIS_OPTIONAL:'true',FOUNDER_EMAIL:'owner@example.invalid',RAILWAY_VOLUME_MOUNT_PATH:root,DATABASE_PATH:path.join(root,'commissioning','empireai-brain.db'),EMPIRE_RUNTIME_PROFILE:'LOCKED_COMMISSIONING_V1',EMPIRE_ENGINEERING_TEST_MODE:'true',INTELLIGENCE_DISABLED:'true'});
fs.mkdirSync(path.join(root,'commissioning'),{recursive:true});
Date.now=()=>Date.parse('2026-10-10T18:40:00Z');globalThis.fetch=async()=>{throw Error('EXTERNAL_FETCH_FORBIDDEN');};
const load=(p:string)=>import(pathToFileURL(path.join(backend,p)).href);
const [{default:Fastify},{default:cookie},{InMemorySessionStore},{createAuthMiddleware},{registerGovernedCommerce,productionCommerce,resolveWork8ProductContext},{productionIntelligence},{digest},{installLockedCommissioning}]=await Promise.all([load('node_modules/fastify/fastify.js'),load('node_modules/@fastify/cookie/plugin.js'),load('src/auth/session-store.ts'),load('src/auth/middleware.ts'),load('src/runtime/commerce-runtime/governed/runtime.ts'),load('src/intelligence/store.ts'),load('src/intelligence/model.ts'),load('src/runtime/locked-commissioning.ts')]);
const app=Fastify(),sessions=new InMemorySessionStore();await app.register(cookie);const auth=createAuthMiddleware(sessions);installLockedCommissioning(app);registerGovernedCommerce(app,auth);
// Actual initialized host and production authenticated history route; only queue and model transports are intercepted.
const [{buildApp},{env},{getPillowHost},{PillowSessionStore},{ReasoningState}]=await Promise.all([load('src/app.ts'),load('src/config/env.ts'),load('src/orchestration/pillow-host/index.ts'),load('src/orchestration/pillow-host/session-store.ts'),load('src/orchestration/pillow-host/reasoning-state.ts')]);
const empire=await buildApp({startWorkers:false,startScheduler:false,pillowEnabled:true,earlyListen:true});
const login=await empire.app.inject({method:'POST',url:'/auth/login',payload:{email:env.FOUNDER_EMAIL,password:env.FOUNDER_PASSWORD}});
if(login.statusCode!==200)throw Error('ACTUAL_HOST_AUTH_FAILED');
const actualCookie=String(login.headers['set-cookie']),user=login.json().user,intel=productionIntelligence();
const created=await empire.app.inject({method:'POST',url:'/api/pillow/session',headers:{cookie:actualCookie},payload:{}});
if(created.statusCode!==201)throw Error('ACTUAL_HOST_SESSION_FAILED:'+created.body);
const actualSession=created.json().session,host:any=getPillowHost();
// Ordinary canonical creation persists the empty conversation before cold history reads.
host.sessionStore=new PillowSessionStore(()=>new ReasoningState(path.join(root,'commissioning','pillow-reasoning.sqlite')));
const initialHistory=await empire.app.inject({method:'GET',url:'/api/pillow/history?sessionId='+encodeURIComponent(actualSession.sessionId),headers:{cookie:actualCookie}});
if(initialHistory.statusCode!==200||initialHistory.json().sessionId!==actualSession.sessionId||initialHistory.json().history.length!==0)throw Error('ACTUAL_CANONICAL_COLD_HISTORY_FAILED:'+initialHistory.body);
let providerCalls=0;
host.llmLayer={listAvailableProviders:()=>['openai'],complete:async()=>{providerCalls++;return {content:'INTERCEPTED TEST RESPONSE: historical product context only; no operational authority.',provider:'openai',model:'offline-fixture',mode:'general_intelligence',usage:{promptTokens:1,completionTokens:1,totalTokens:2}};}};

const records=JSON.parse(fs.readFileSync(path.join(backend,'../docs/work8/source-authentic-readback.json'),'utf8')),source=records[0].data;intel.evidence(user.workspaceId,source);
let previous:string|null=null;const candidateIds=[];
for(let i=0;i<2;i++){const sources=[{id:source.id,envelopeDigest:digest(source)}],state={id:'cj:retained-variant-'+i,productId:source.subject.id,subject:{...source.subject,variant:source.facts.response.variants[i].vid,destination:'US'},status:'DEFERRED',sources,evidenceSnapshotDigest:digest(sources),jobs:[]},body:{id:string;sequence:number;previous:string|null;state:typeof state;at:number}={id:'enrichment:'+String(i+1).padStart(8,'0'),sequence:i+1,previous,state,at:Date.now()},receipt:typeof body & {digest:string}={...body,digest:digest(body)};intel.put(user.workspaceId,'work8_enrichment',state.id,state);intel.put(user.workspaceId,'work8_enrichment_receipt',body.id,receipt);intel.put(user.workspaceId,'work8_enrichment_head','head',{sequence:i+1,digest:receipt.digest});previous=receipt.digest;candidateIds.push(state.id);}
const {acceptanceScenario}=await load('src/runtime/commerce-runtime/governed/scenario.ts');const simulation=acceptanceScenario(user.workspaceId,user.id,Date.now());for(let i=0;i<5;i++){const step=simulation.steps[i];productionCommerce().engine.execute(step.actor,{id:'a8-ui-step-'+i,missionId:'a8-labelled-ui-mission',expectedVersion:i,command:step.command});}
app.get('/auth/me',{preHandler:auth},async(req:any)=>({user:req.user}));
// Explicit intercepted inference boundary: input is rebound by the real resolver; no Pillow answer is fabricated.
app.post('/api/pillow/session',{preHandler:auth},async(req:any,reply:any)=>{if(req.user.id!==user.id)return reply.code(403).send({error:'OWNER_REQUIRED'});return {session:actualSession};});
app.get('/api/pillow/history',{preHandler:auth},async(req:any,reply:any)=>{
 if(req.user.id!==user.id||req.user.workspaceId!==user.workspaceId)return reply.code(403).send({error:'OWNER_REQUIRED'});
 // Fresh actual store on every read proves disk reload, not an operating-system process restart.
 host.sessionStore=new PillowSessionStore(()=>new ReasoningState(path.join(root,'commissioning','pillow-reasoning.sqlite')));
 const result=await empire.app.inject({method:'GET',url:'/api/pillow/history?sessionId='+encodeURIComponent(actualSession.sessionId),headers:{cookie:actualCookie}});
 fs.writeFileSync(path.join(root,'actual-host-history.json'),result.body);return reply.code(result.statusCode).send(result.json());
});
app.post('/api/pillow/chat',{preHandler:auth},async(req:any,reply:any)=>{
 if(req.user.id!==user.id||req.user.workspaceId!==user.workspaceId)return reply.code(403).send({error:'OWNER_REQUIRED'});
 capturedQueueInput=undefined;capturedQueueRecord=undefined;
 const admitted=await examination.inject({method:'POST',url:'/api/pillow/chat',headers:{authorization:'Bearer '+tokens.owner},payload:{...req.body,sessionId:actualSession.sessionId,workspaceId:user.workspaceId}});
 if(admitted.statusCode!==202)return reply.code(admitted.statusCode).send(admitted.json());
 const input=JSON.parse(capturedQueueInput.bodyText),bound=input.workspaceContext.productContext,before=providerCalls;
 await host.routePrompt({workspaceId:user.workspaceId,sessionId:actualSession.sessionId,message:input.message,reasoningOnly:true,actor:user.email,correlationId:admitted.json().result.requestId,workspaceContext:input.workspaceContext});
 if(providerCalls!==before+1)throw Error('ACTUAL_HOST_DID_NOT_REACH_INTERCEPTED_PROVIDER');
 fs.appendFileSync(path.join(root,'context-delivery.jsonl'),JSON.stringify({raw:req.body.workspaceContext.productContext,bound,message:req.body.message,classification:'INTERCEPTED_NO_INFERENCE',hostPersisted:true})+'\n');
 return reply.code(423).send({code:'A8_INFERENCE_INTERCEPTED',error:'Only labelled intercepted test response recorded; no inference authorised.'});
});
const tokens={owner:(await sessions.create(user)).token,foreign:(await sessions.create({...user,id:'foreign-owner',workspaceId:'foreign'})).token};
// Actual Tier0 handler, process-local acceptance only: no worker, no queue-body durability claim.
const [{handleDurablePillowChat},{configureChatRequestStore,getChatRequest,hashChatInput,dropChatRequestMemoryCacheForTests}]=await Promise.all([load('src/runtime/tier0-isolated-primary.ts'),load('src/runtime/pillow-chat-request-store.ts')]);
let capturedQueueInput:any,capturedQueueRecord:any;configureChatRequestStore({get:async()=>null,setex:async()=> 'OK',eval:async(_script:string,keyCount:number,...args:any[])=>{if(keyCount!==4)throw Error('UNEXPECTED_QUEUE_OPERATION');const argv=args.slice(keyCount);capturedQueueInput=JSON.parse(argv[5]);capturedQueueRecord=JSON.parse(argv[0]);return ['CREATED',argv[0]];}},{requireRedisDurability:true});
const examination=Fastify();examination.post('/api/pillow/chat',(request:any,reply:any)=>handleDurablePillowChat(request,reply,{authenticate:auth,probeSharedSessionStore:async()=>true}));
const bound=resolveWork8ProductContext({workspace:user.workspaceId,owner:user.id},{kind:'SOURCE_DOSSIER',candidateId:candidateIds[0]},true);
const input={message:'Verify bound historical product without inference',sessionId:'actual-handler-isolated',workspaceId:user.workspaceId,workspaceContext:{productContext:bound.reference}};
const result=await examination.inject({method:'POST',url:'/api/pillow/chat',headers:{authorization:'Bearer '+tokens.owner},payload:input});if(result.statusCode!==202)throw Error('ACTUAL_HANDLER_ACCEPTANCE_FAILED:'+result.statusCode);
const requestId=result.json().result.requestId,record=capturedQueueRecord,expectedInput={...input,workspaceContext:{productContext:bound}};
if(capturedQueueInput?.kind!=='reasoning'||capturedQueueInput.bodyText!==JSON.stringify(expectedInput))throw Error('ACTUAL_HANDLER_QUEUE_INPUT_MISMATCH');
if(record?.inputHash!==hashChatInput(user.workspaceId+':'+user.id+':'+input.sessionId,JSON.stringify(expectedInput)))throw Error('ACTUAL_HANDLER_BOUND_INPUT_HASH_MISMATCH');
const rejected=await examination.inject({method:'POST',url:'/api/pillow/chat',headers:{authorization:'Bearer '+tokens.owner},payload:{...input,workspaceContext:{productContext:{...bound.reference,contextDigest:'0'.repeat(64)}}}});if(rejected.statusCode!==409)throw Error('ACTUAL_HANDLER_FORGED_PIN_NOT_REJECTED');
fs.writeFileSync(path.join(root,'actual-tier0-admission.json'),JSON.stringify({classification:'ACTUAL_TIER0_HTTP_HANDLER_INTERCEPTED_QUEUE_NO_INFERENCE',status:'PASS',acceptedStatus:result.statusCode,forgedPinStatus:rejected.statusCode,inputHash:record.inputHash,expectedInputHash:hashChatInput(user.workspaceId+':'+user.id+':'+input.sessionId,JSON.stringify(expectedInput)),scope:'Actual HTTP authentication, server resolution and exact queue input bytes/hash through injected queue adapter; no Redis durability or model answer claim.'},null,2));dropChatRequestMemoryCacheForTests();
await app.listen({host:'127.0.0.1',port:3148});fs.writeFileSync(readyFile,JSON.stringify({tokens,candidateIds,sourceEvidenceId:source.id,sourceFactsDigest:source.digest,clock:'2026-10-10T18:40:00Z',clockClassification:'HISTORICAL_REPLAY_NOT_CURRENT_SOURCE_FRESHNESS',classification:'REAL_RETAINED_OBSERVATIONS_ISOLATED_AUTH_AND_ENRICHMENT_FIXTURE'}));

let stopping=false;async function shutdown(){if(stopping)return;stopping=true;await app.close();await examination.close();await empire.shutdown();process.exit(0);}process.once('SIGTERM',()=>{void shutdown();});process.once('SIGINT',()=>{void shutdown();});

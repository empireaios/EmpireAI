/** Genuine retained historical readback, isolated authentication; no inference, writes or authority replay. */
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';
// This Node 22-only fixture runs outside the browser; load its builtin at runtime.
const {DatabaseSync}=createRequire(import.meta.url)('node:sqlite');
const [backend,sourceFile,root,readyFile]=process.argv.slice(2);if(!backend||!sourceFile||!root||!readyFile||process.env.WORK8_KERNEL_EGRESS!=='CONNECT_DENIED_LISTEN_ALLOWED')throw Error('ISOLATION_REQUIRED');
Object.assign(process.env,{NODE_ENV:'test',FOUNDER_EMAIL:'owner@example.invalid',RAILWAY_VOLUME_MOUNT_PATH:root,DATABASE_PATH:path.join(root,'commissioning','empireai-brain.db'),EMPIRE_RUNTIME_PROFILE:'LOCKED_COMMISSIONING_V1',EMPIRE_ENGINEERING_TEST_MODE:'true',INTELLIGENCE_DISABLED:'true'});
fs.mkdirSync(path.join(root,'commissioning'),{recursive:true});globalThis.fetch=async()=>{throw Error('EXTERNAL_FETCH_FORBIDDEN');};
const source=JSON.parse(fs.readFileSync(sourceFile,'utf8'));const hash=(s:string|Buffer)=>createHash('sha256').update(s).digest('hex');
if(source.request.requestId!=='pcr_27fb1ed5ddb24f5a'||hash(source.finalResult.message)!==source.request.responseIntegrity.sha256||source.turns.find((t:any)=>t.role==='assistant').content!==source.finalResult.message)throw Error('HISTORICAL_SOURCE_INTEGRITY');
const file=path.join(root,'commissioning','pillow-reasoning.sqlite'),db=new DatabaseSync(file);db.exec('CREATE TABLE transcripts(workspace TEXT,session TEXT,updated TEXT,turns TEXT)');db.prepare('INSERT INTO transcripts VALUES(?,?,?,?)').run(source.source.workspace,source.session,source.updated,JSON.stringify(source.turns));db.close();
const load=(p:string)=>import(pathToFileURL(path.join(backend,p)).href);
const [{default:Fastify},{default:cookie},{InMemorySessionStore},{createAuthMiddleware},{registerAdvisorRoutes},{AdvisorStore},{archivePillowRequest}]=await Promise.all([load('node_modules/fastify/fastify.js'),load('node_modules/@fastify/cookie/plugin.js'),load('src/auth/session-store.ts'),load('src/auth/middleware.ts'),load('src/advisor/routes.ts'),load('src/advisor/store.ts'),load('src/runtime/pillow-request-receipts.ts')]);
archivePillowRequest({...source.request,workspaceId:source.source.workspace,finalResult:source.finalResult});
const before={transcript:hash(fs.readFileSync(file)),receipt:hash(fs.readFileSync(path.join(root,'commissioning','pillow-request-receipts.sqlite')))};
const app=Fastify(),sessions=new InMemorySessionStore();await app.register(cookie);app.addHook('onRequest',async(req:any,reply:any)=>{if(req.method!=='GET')return reply.code(423).send({error:'READ_ONLY_HISTORICAL_EXAMINATION',birth:'NOT_BORN',commerce:'LOCKED'});});
const user={id:'isolated-owner-history',email:'owner@example.invalid',name:'Isolated owner',role:'founder',workspaceId:source.source.workspace},auth=createAuthMiddleware(sessions);registerAdvisorRoutes(app,auth,new AdvisorStore(path.join(root,'commissioning','communications.sqlite')));app.get('/auth/me',{preHandler:auth},async(req:any)=>({user:req.user}));
// Retained same-product temporal journey; no positive eligibility or synthetic order admission.
const journeyFile=path.join(path.dirname(sourceFile),'genuine-deferred-journey.json');
const journey=JSON.parse(fs.readFileSync(journeyFile,'utf8'));
const [{productionIntelligence},{registerGovernedCommerce},{registerFinancialCentre},{readEmpire}]=await Promise.all([load('src/intelligence/store.ts'),load('src/runtime/commerce-runtime/governed/runtime.ts'),load('src/finance/runtime.ts'),load('src/advisor/read-model.ts')]);
if(journey.workspace!==source.source.workspace||journey.investigation.requestId!==source.request.requestId||!source.finalResult.message.includes(journey.productId))throw Error('JOURNEY_IDENTITY');
const intel=productionIntelligence();if(!intel)throw Error('JOURNEY_INTELLIGENCE_UNAVAILABLE');
for(const evidence of journey.marketEvidence){if(evidence.subject.id!==journey.productId||Date.parse(evidence.observedAt)<=Date.parse(journey.investigation.assessment.at))throw Error('JOURNEY_TEMPORAL_IDENTITY');intel.evidence(journey.workspace,evidence);}
intel.put(journey.workspace,'investigations',journey.investigation.id,journey.investigation);
registerGovernedCommerce(app,auth);registerFinancialCentre(app,auth);
const journeyRecords=['evidence:'+journey.marketEvidence[0].id,'investigations:'+journey.investigation.id,'governed_commerce','financial_centre','assurance'];
const baseline:Record<string,any>={};
for(const ref of journeyRecords){const [domain,...id]=ref.split(':');baseline[ref]=await readEmpire(new AdvisorStore(path.join(root,'commissioning','communications.sqlite')),journey.workspace,domain!,id.join(':')||undefined);}
if(baseline.governed_commerce.status!=='AVAILABLE'||baseline.governed_commerce.data.missions.length!==0||baseline.governed_commerce.data.durableSimulatedFinancials.length!==0)throw Error('JOURNEY_FALSE_ORDER_LINK');
if(baseline.financial_centre.status!=='AVAILABLE'||baseline.financial_centre.data.entries.length!==0)throw Error('JOURNEY_FALSE_FINANCIAL_LINK');
const journeyProof={productId:journey.productId,missionId:journey.investigation.id,requestId:source.request.requestId,records:journeyRecords,provenance:journey.provenance,fixtureHash:hash(fs.readFileSync(journeyFile)),baseline};
const tokens={owner:(await sessions.create(user)).token,foreign:(await sessions.create({...user,id:'foreign-owner',workspaceId:'foreign'})).token};
if(process.env.WORK8_OWNER_INJECT_ONLY!=='1')await app.listen({host:'127.0.0.1',port:3158});fs.writeFileSync(readyFile,JSON.stringify({tokens,requestId:source.request.requestId,responseHash:source.request.responseIntegrity.sha256,sourceFileHash:hash(fs.readFileSync(sourceFile,'utf8')),journey:journeyProof}));
let stopping=false;async function stop(){if(stopping)return;stopping=true;await app.close();const after={transcript:hash(fs.readFileSync(file)),receipt:hash(fs.readFileSync(path.join(root,'commissioning','pillow-request-receipts.sqlite')))};fs.writeFileSync(path.join(root,'preservation.json'),JSON.stringify({unchanged:JSON.stringify(before)===JSON.stringify(after),before,after,paidInference:0,externalEffects:0}));process.exit(0);}process.once('SIGTERM',()=>{void stop();});process.once('SIGINT',()=>{void stop();});

if(process.env.WORK8_OWNER_INJECT_ONLY==='1'){
 const assert: typeof import('node:assert/strict')=(await import('node:assert/strict')).default;
 for(const ref of journeyRecords){const [domain,...parts]=ref.split(':');const url='/api/owner/advisor/read?'+new URLSearchParams({domain:domain!,id:parts.join(':')});
  const allowed=await app.inject({method:'GET',url,headers:{cookie:'empireai_session='+tokens.owner}});assert.equal(allowed.statusCode,200);const body=allowed.json();assert.equal(body.status,baseline[ref].status);assert.equal(body.workspace,journey.workspace);assert.equal(body.grantsAuthority,false);
  assert.equal((await app.inject({method:'GET',url})).statusCode,401);assert.equal((await app.inject({method:'GET',url,headers:{cookie:'empireai_session='+tokens.foreign}})).statusCode,403);
 }
 console.log(JSON.stringify({status:'PASS_SCOPED_INJECT_ONLY_NOT_BROWSER',records:journeyRecords,baseline,paidInference:0,externalEffects:0}));await stop();
}

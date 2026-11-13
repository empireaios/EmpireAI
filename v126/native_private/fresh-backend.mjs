// New empty isolated native service; unchanged original auth and commerce modules.
// No imported history, fabricated decisions, automatic login, or automatic CREATE.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash,randomBytes} from 'node:crypto';
import {createRequire} from 'node:module';
import {allowedMediaPreparationRequest as allowedFreshRequest} from './media-scope.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
function preserveFirstFailure(error){
 const message=String(error?.message??error);const sourceLocations=String(error?.stack??'').match(/\/(?:app|control)\/[A-Za-z0-9_./-]+:\d+:\d+/g)?.slice(0,4)??[];
 const receipt={schema:'v128-connector-backend-first-failure-v1',errorClass:String(error?.name??'Error'),
  safeCode:/^CONNECTOR_[A-Z_]+$/.test(message)?message:null,messageSHA256:sha(message),sourceLocations,
  ownerActionObserved:false,wholeRowAccepted:false};
 try{fs.writeFileSync('/evidence/connector-backend-first-failure.json',JSON.stringify(receipt)+'\n',{flag:'wx',mode:0o600});}catch{}
 process.exit(1);
}
process.once('uncaughtException',preserveFirstFailure);process.once('unhandledRejection',preserveFirstFailure);
const CONFIG=JSON.parse(fs.readFileSync('/private/native-bootstrap.json','utf8'));
assert.equal(sha(CONFIG.founderEmail),'a437be3d7f2e7927959c2be2040016464de75d69529d9abd197e47a8caa21267');
assert.match(CONFIG.founderPassword,/^[A-Za-z0-9_-]{43,128}$/);
assert.match(CONFIG.adminPassword,/^[A-Za-z0-9_-]{43,128}$/);
assert.notEqual(CONFIG.founderPassword,CONFIG.adminPassword);
assert.equal(CONFIG.mode,'PRIVATE_LOOPBACK');
assert.equal(CONFIG.origin,'http://127.0.0.1:43117');
assert.ok(Number.isSafeInteger(CONFIG.expiresAtMs)&&CONFIG.expiresAtMs>Date.now()&&CONFIG.expiresAtMs-Date.now()<=1200000);
assert.match(CONFIG.authoritySHA256,/^[a-f0-9]{64}$/);
const POLICY=JSON.parse(fs.readFileSync('/private/owner-policy.json','utf8'));
assert.equal(POLICY.schema,1);assert.equal(POLICY.mode,'RELEASED');
assert.equal(POLICY.approvalSha256,CONFIG.authoritySHA256);
assert.equal(Date.parse(POLICY.expiresAt),CONFIG.expiresAtMs);
assert.deepEqual(fs.readdirSync('/state'),[],'FRESH_EMPTY_STATE_REQUIRED');
const build=JSON.parse(fs.readFileSync('/control/connector-build-manifest.json','utf8'));
assert.equal(build.applicationCommit,'6c1e63ba20619ee480742fd87dc810ca93152e22');
assert.deepEqual(build.backendOverlays.map(p=>p.destination).sort(),[
 'backend/dist/runtime/commerce-runtime/governed/runtime.js',
 'backend/dist/runtime/commerce-runtime/governed/runtime.js.map',
 'backend/dist/runtime/commerce-runtime/governed/work8-connector-media.js',
 'backend/dist/runtime/commerce-runtime/governed/work8-connector-media.js.map',
 'backend/dist/runtime/commerce-runtime/governed/work8-connector-source.js',
 'backend/dist/runtime/commerce-runtime/governed/work8-connector-source.js.map',
 'backend/dist/runtime/commerce-runtime/governed/work8-connector-walkthrough.js',
 'backend/dist/runtime/commerce-runtime/governed/work8-connector-walkthrough.js.map']);
const overlayPaths=new Set(build.backendOverlays.map(p=>p.destination));
for(const pin of JSON.parse(fs.readFileSync('/control/native-source-pins.json')).nativeSourcePins){
 const original=fs.readFileSync('/retained-app/'+pin.path);assert.equal(original.length,pin.bytes);assert.equal(sha(original),pin.sha256);
 if(!overlayPaths.has(pin.path)){const executed=fs.readFileSync('/app/'+pin.path);assert.equal(executed.length,pin.bytes);assert.equal(sha(executed),pin.sha256);}
}
for(const pin of build.backendOverlays){const b=fs.readFileSync('/app/'+pin.destination);assert.equal(b.length,pin.bytes);assert.equal(sha(b),pin.sha256);}
assert.equal(process.version,'v22.23.2');
assert.equal(sha(fs.readFileSync('/usr/local/bin/node')),'3517c2df0b2f8cd7f422b4b8450ef81c6889f08eb03e281d6de9079b15e6a327');
Object.assign(process.env,{NODE_ENV:'production',LOG_LEVEL:'error',HOST:'127.0.0.1',PORT:'4000',
 REDIS_URL:'redis://127.0.0.1:46379/0',REDIS_OPTIONAL:'false',DATABASE_PATH:'/state/commissioning/empireai-brain.db',
 RAILWAY_VOLUME_MOUNT_PATH:'/state',RAILWAY_GIT_COMMIT_SHA:'6c1e63ba20619ee480742fd87dc810ca93152e22',
 EMPIRE_RUNTIME_PROFILE:'LOCKED_COMMISSIONING_V1',EMPIRE_ENGINEERING_TEST_MODE:'true',
 EMPIRE_OWNER_WRITE_POLICY:'/private/owner-policy.json',FOUNDER_EMAIL:CONFIG.founderEmail,
 FOUNDER_PASSWORD:CONFIG.founderPassword,
 // Same email deliberately makes the second bootstrap entry unreachable: no invented admin identity.
 ADMIN_EMAIL:CONFIG.founderEmail,ADMIN_PASSWORD:CONFIG.adminPassword,
 SESSION_SECRET:randomBytes(32).toString('hex'),SESSION_TTL_SECONDS:'600',CORS_ORIGIN:CONFIG.origin,
 INTELLIGENCE_ENABLED:'false',INTELLIGENCE_DISABLED:'true',EMPIRE_CONNECTOR_ADAPTER_COMMIT:CONFIG.adapterPublicationCommit,
 EMPIRE_CONNECTOR_MEDIA_ROOT:'/private/media'});
const require=createRequire('/app/backend/package.json');
const Fastify=require('fastify'),cookie=require('@fastify/cookie'),cors=require('@fastify/cors');
const load=p=>import('/app/backend/dist/'+p);
const [{createTier0RedisClient,waitForRuntimeRedisReady},{SessionStore},{createAuthMiddleware},
 {registerTier0LoginRoute,createSharedSessionStoreGuard,registerTier0DurabilityErrorHandler},
 {probeRedisSessionStore},{installLockedCommissioning},{installCaptureHttpAdmission},{registerGovernedCommerce,productionCommerce},
 {registerExactNativeTier0SessionRoutes},{admitPinnedConnectorSource,readConnectorSourceCandidates},
 {admitPinnedConnectorWalkthrough,readConnectorWalkthrough}]=await Promise.all([
 load('runtime/tier0-redis.js'),load('auth/session-store.js'),load('auth/middleware.js'),
 load('runtime/tier0-isolated-primary.js'),load('runtime/application-readiness.js'),
 load('runtime/locked-commissioning.js'),load('runtime/capture-http-admission.js'),
 load('runtime/commerce-runtime/governed/runtime.js'),import('/control/native-tier0-session-routes.mjs'),
 load('runtime/commerce-runtime/governed/work8-connector-source.js'),
 load('runtime/commerce-runtime/governed/work8-connector-walkthrough.js')]);
const redis=createTier0RedisClient(process.env.REDIS_URL);await waitForRuntimeRedisReady(redis,2000);
assert.equal(await redis.dbsize(),0,'FRESH_PRIVATE_REDIS_REQUIRED');
const sessionStore=new SessionStore(redis),authenticate=createAuthMiddleware(sessionStore);
const guard=createSharedSessionStoreGuard(()=>probeRedisSessionStore(redis,1500));
const app=Fastify({logger:false,bodyLimit:16384,requestTimeout:5000});
// Additional scope guard precedes the unchanged native auth/policy handlers.
app.addHook('preValidation',async(req,reply)=>{
 if(Date.now()>=CONFIG.expiresAtMs)return reply.code(423).send({code:'ISOLATED_AUTHORITY_EXPIRED'});
 if(allowedFreshRequest(req.method,req.url,req.body))return;
 return reply.code(423).send({code:'OUTSIDE_FRESH_SESSION_SCOPE'});
});
installCaptureHttpAdmission(app);installLockedCommissioning(app);
await app.register(cors,{origin:CONFIG.origin,credentials:true});
await app.register(cookie,{secret:process.env.SESSION_SECRET});registerTier0DurabilityErrorHandler(app);
registerGovernedCommerce(app,authenticate);registerTier0LoginRoute(app,sessionStore,guard);
registerExactNativeTier0SessionRoutes(app,sessionStore,guard,authenticate);
// This operator-only native transaction admits precisely the retained connector observation.
// No HTTP import route, qualified dossier, mission, approval or owner decision is created.
const files={policy:'/private/connector-policy.json',rawReceipt:'/connector-inputs/cj-full-product-detail-readback.json',
 independentReview:'/connector-inputs/independent-cj-source-review.json'};
const admitted=admitPinnedConnectorSource(productionCommerce().store.db,files);
assert.equal(admitted.status,'ADMITTED_SOURCE_OBSERVATION_ONLY');
const replay=admitPinnedConnectorSource(productionCommerce().store.db,files);
assert.equal(replay.status,'ALREADY_ADMITTED');assert.deepEqual(replay.record,admitted.record);
const canonical=readConnectorSourceCandidates(productionCommerce().store.db,'ws_empire_1');
assert.equal(canonical.candidates.length,1);assert.equal(canonical.candidates[0].digest,admitted.record.digest);
const baseAdmissionBytes=Buffer.from(JSON.stringify({schema:'v128-native-connector-source-admission-v1',
 status:admitted.status,record:admitted.record,replayStatus:replay.status,canonical,
 buildManifestSHA256:sha(fs.readFileSync('/control/connector-build-manifest.json')),
 inputActor:'DELEGATED_TECHNICAL_OPERATOR',ownerActionObserved:false,ownerDecisionGranted:false,
 qualifiedDossierAdmitted:false,historyImported:false,productionAccess:false,wholeRowAccepted:false})+'\n');
const baseTemporary='/evidence/connector-source-admission.json.tmp',baseFinal='/evidence/connector-source-admission.json';
assert(!fs.existsSync(baseFinal),'BASE_ADMISSION_ALREADY_PRESENT');
const baseFD=fs.openSync(baseTemporary,'wx',0o600);
try{fs.writeFileSync(baseFD,baseAdmissionBytes);fs.fsyncSync(baseFD);}finally{fs.closeSync(baseFD);}
assert(!fs.existsSync(baseFinal),'BASE_ADMISSION_ALREADY_PRESENT');fs.renameSync(baseTemporary,baseFinal);
// The host independently binds the actual admitted record, then publishes a
// read-only technical policy into the existing read-only private mount.
const walkthroughPolicy='/private/connector-walkthrough-policy.json';
const policyDeadline=Math.min(CONFIG.expiresAtMs,Date.now()+30000);
while(!fs.existsSync(walkthroughPolicy)){
 assert(Date.now()<policyDeadline,'ACTUAL_CANDIDATE_POLICY_DEADLINE');
 await new Promise(resolve=>setTimeout(resolve,50));
}
const supplementFiles={policy:walkthroughPolicy,inventory:'/connector-inputs/inventory.json',
 inventoryReview:'/connector-inputs/inventory-review.json',currency:'/connector-inputs/currency.json',
 media:'/connector-inputs/retained-original.jpg',mediaCustody:'/connector-inputs/media-custody.json',
 mediaReview:'/connector-inputs/media-review.json',mediaBinding:'/connector-inputs/media-binding.json'};
const supplement=admitPinnedConnectorWalkthrough(productionCommerce().store.db,supplementFiles);
assert.equal(supplement.status,'ADMITTED_RETAINED_FACTS_AND_EXECUTED_DEFER');
const supplementReplay=admitPinnedConnectorWalkthrough(productionCommerce().store.db,supplementFiles);
assert.equal(supplementReplay.status,'ALREADY_ADMITTED');assert.deepEqual(supplementReplay.record,supplement.record);
const supplementReadback=readConnectorWalkthrough(productionCommerce().store.db,'ws_empire_1');
assert.deepEqual(supplementReadback.record,supplement.record);
fs.writeFileSync('/evidence/connector-walkthrough-admission.json',JSON.stringify({schema:'v128-native-walkthrough-admission-v1',
 status:supplement.status,record:supplement.record,replayStatus:supplementReplay.status,canonical:supplementReadback,
 buildManifestSHA256:sha(fs.readFileSync('/control/connector-build-manifest.json')),
 policySHA256:sha(fs.readFileSync(walkthroughPolicy)),inputActor:'DELEGATED_TECHNICAL_OPERATOR',
 ownerActionObserved:false,ownerDecisionGranted:false,productionAccess:false,wholeRowAccepted:false})+'\n',{flag:'wx',mode:0o600});
await app.listen({host:'127.0.0.1',port:4000});
fs.writeFileSync('/evidence/backend-ready.json',JSON.stringify({schema:'v126-fresh-native-ready-v1',
 source:'6c1e63ba20619ee480742fd87dc810ca93152e22',ownerEmailSHA256:sha(CONFIG.founderEmail),
 expectedOwner:'usr_'+sha(CONFIG.founderEmail).slice(0,16),workspace:'ws_empire_1',
 sourcePinsVerified:true,historyImported:false,ownerAuthenticated:false,ownerSessionCreated:false,
 externalCommerceEnabled:false,wholeRowAccepted:false,expiresAtMs:CONFIG.expiresAtMs,
 baseImageSourcePreserved:true,adapterPublicationCommit:CONFIG.adapterPublicationCommit,
 executedBackendOverlays:build.backendOverlays,connectorSourceRecordDigest:admitted.record.digest})+'\n',{flag:'wx',mode:0o600});
let closing=false;async function close(){if(closing)return;closing=true;await app.close();redis.disconnect();}
for(const s of ['SIGTERM','SIGINT'])process.on(s,()=>close().then(()=>process.exit(0)));
setTimeout(()=>close().then(()=>process.exit(0)),Math.max(1,CONFIG.expiresAtMs-Date.now()));

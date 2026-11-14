// Restored A08 native media only. No source admission, media preparation replay,
// imported authentication, scheduler, owner decision, or automatic login.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {createReviewAdmission,allowedReviewRoute} from './review-admission.mjs';
import {createReviewExporter} from './review-export.mjs';
import {createReadbackFence} from './review-finalization.mjs';
const CONTROL='/control/owner_review',STATE='/state/review',EVIDENCE='/evidence';
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const save=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx',mode:0o400});
const config=read('/private/review-bootstrap.json'),baseline=read(CONTROL+'/retained-a08-baseline.json');
assert.equal(config.operationIdentity,'V130-A10-PRIVATE-REVIEW-A01-20261114');
assert.equal(config.origin,new URL(config.origin).origin);assert.ok(config.origin.startsWith('https://'));
assert.equal(sha(config.founderEmail.trim().toLowerCase()),'a437be3d7f2e7927959c2be2040016464de75d69529d9abd197e47a8caa21267');
for(const key of ['founderPassword','adminPassword','sessionSecret','exportToken'])assert.match(config[key],/^[A-Za-z0-9_-]{43,128}$/);
assert.notEqual(config.founderPassword,config.adminPassword);
assert.notEqual(config.exportToken,config.founderPassword);assert.notEqual(config.exportToken,config.sessionSecret);
assert.match(config.publicationCommit,/^[a-f0-9]{40}$/);assert.match(config.sourceManifestSHA256,/^[a-f0-9]{64}$/);assert.equal(config.provider,'RAILWAY');assert.match(config.deploymentId,/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
assert.ok(config.expiresAtMs>Date.now()&&config.expiresAtMs-Date.now()<=1200000);
const restore=read(EVIDENCE+'/restore-readonly.json');assert.equal(restore.snapshotSHA256,baseline.snapshot.sha256);assert.equal(restore.restoredVersion,2);assert.equal(restore.preparationCommandsReplayed,0);
const ownerPolicy=read('/private/owner-policy.json');assert.equal(ownerPolicy.schema,1);assert.equal(ownerPolicy.mode,'RELEASED');assert.equal(ownerPolicy.approvalSha256,config.authoritySHA256);assert.equal(Date.parse(ownerPolicy.expiresAt),config.expiresAtMs);
Object.assign(process.env,{NODE_ENV:'production',LOG_LEVEL:'error',HOST:'127.0.0.1',PORT:'4000',REDIS_URL:'redis://127.0.0.1:46379/0',REDIS_OPTIONAL:'false',DATABASE_PATH:STATE+'/commissioning/empireai-brain.db',RAILWAY_VOLUME_MOUNT_PATH:STATE,RAILWAY_GIT_COMMIT_SHA:'6c1e63ba20619ee480742fd87dc810ca93152e22',EMPIRE_RUNTIME_PROFILE:'LOCKED_COMMISSIONING_V1',EMPIRE_ENGINEERING_TEST_MODE:'true',EMPIRE_OWNER_WRITE_POLICY:'/private/owner-policy.json',FOUNDER_EMAIL:config.founderEmail,FOUNDER_PASSWORD:config.founderPassword,ADMIN_EMAIL:config.founderEmail,ADMIN_PASSWORD:config.adminPassword,SESSION_SECRET:config.sessionSecret,SESSION_TTL_SECONDS:'600',CORS_ORIGIN:config.origin,INTELLIGENCE_ENABLED:'false',INTELLIGENCE_DISABLED:'true',EMPIRE_CONNECTOR_ADAPTER_COMMIT:config.publicationCommit,EMPIRE_OWNER_REVIEW_PUBLICATION_COMMIT:config.publicationCommit,EMPIRE_CONNECTOR_MEDIA_ROOT:'/private/media',EMPIRE_CONNECTOR_OWNER_REVIEW_MODE:'RESTORED_A08_V2'});
const require=createRequire('/app/backend/package.json'),Fastify=require('fastify'),cookie=require('@fastify/cookie'),cors=require('@fastify/cors');
const load=p=>import('/app/backend/dist/'+p);
const [{createTier0RedisClient,waitForRuntimeRedisReady},{SessionStore},{createAuthMiddleware},{registerTier0LoginRoute,createSharedSessionStoreGuard,registerTier0DurabilityErrorHandler},{probeRedisSessionStore},{installLockedCommissioning},{installCaptureHttpAdmission},{registerGovernedCommerce,productionCommerce},{registerExactNativeTier0SessionRoutes},{readConnectorMedia},{env}]=await Promise.all([
 load('runtime/tier0-redis.js'),load('auth/session-store.js'),load('auth/middleware.js'),load('runtime/tier0-isolated-primary.js'),load('runtime/application-readiness.js'),load('runtime/locked-commissioning.js'),load('runtime/capture-http-admission.js'),load('runtime/commerce-runtime/governed/runtime.js'),import(CONTROL+'/native-tier0-session-routes.mjs'),load('runtime/commerce-runtime/governed/work8-connector-media.js'),load('config/env.js')]);
const redis=createTier0RedisClient(process.env.REDIS_URL);await waitForRuntimeRedisReady(redis,2000);assert.equal(await redis.dbsize(),0,'FRESH_REVIEW_REDIS_REQUIRED');
const nativeSessions=new SessionStore(redis);
// The original login handler and native SessionStore still perform authentication
// and creation. Bound configured native TTL before each creation and reject any
// delayed result that would outlive the immutable service expiry.
const sessions={get:token=>nativeSessions.get(token),destroy:token=>nativeSessions.destroy(token),refresh:async()=>null,async create(user){
 const seconds=Math.min(600,Math.floor((config.expiresAtMs-Date.now())/1000)-1);if(seconds<1)throw Error('REVIEW_AUTH_EXPIRED');
 env.SESSION_TTL_SECONDS=seconds;const session=await nativeSessions.create(user);
 if(Date.parse(session.expiresAt)>config.expiresAtMs||Date.now()>=config.expiresAtMs){await nativeSessions.destroy(session.token);throw Error('REVIEW_AUTH_EXPIRED');}return session;
}};
const authenticate=createAuthMiddleware(sessions),guard=createSharedSessionStoreGuard(()=>probeRedisSessionStore(redis,1500));
const reviewClosesAtMs=config.expiresAtMs-90000;
const admission=createReviewAdmission({origin:config.origin,expiresAtMs:reviewClosesAtMs,baseline});
const app=Fastify({logger:false,bodyLimit:4096,requestTimeout:5000});
const custody=Fastify({logger:false,bodyLimit:256,requestTimeout:3000});
const db=()=>productionCommerce().store.db,view=()=>readConnectorMedia(db(),{workspace:baseline.workspace,owner:baseline.owner});
let stopped=false,closing=false;const readbackFence=createReadbackFence();
const exporter=createReviewExporter({config,stateRoot:STATE,receiptDir:EVIDENCE,controlRoot:CONTROL,outputRoot:'/state/review-export',closeAdmission:()=>admission.close(),onAcknowledged:()=>{setTimeout(()=>process.kill(process.ppid,'SIGUSR2'),50);}});
async function seal(reason){
 if(stopped)return;stopped=true;admission.close();
 try{await readbackFence.wait(Math.max(1,Math.min(5000,config.expiresAtMs-Date.now())));const fixed=await exporter.seal(reason);process.send?.({type:'encrypted-export-ready',sha256:fixed.sha256,bytes:fixed.bytes});}
 catch(error){try{save(EVIDENCE+'/export-failure.json',{schema:'A09_EXPORT_FAILURE_V1',reason,errorCode:/^[A-Z_]+$/.test(error?.message??'')?error.message:'EXPORT_FAILED',acceptanceClaimed:false});}catch{}}
}
app.addHook('onSend',async(_request,reply,payload)=>{reply.header('cache-control','private, no-store').header('referrer-policy','no-referrer').header('content-security-policy',"frame-ancestors 'none'").header('x-content-type-options','nosniff');return payload;});
app.addHook('preValidation',async(req,reply)=>{
 if(req.url==='/__owner-review/export'||req.url==='/__owner-review/export-ack')return;
 if(Date.now()>=config.expiresAtMs)return reply.code(423).send({code:'OWNER_REVIEW_EXPIRED'});
 if(!allowedReviewRoute(req.method,req.url))return reply.code(423).send({code:'OUTSIDE_OWNER_REVIEW_SCOPE'});
 if(req.headers.authorization)return reply.code(403).send({code:'NATIVE_COOKIE_REQUIRED'});
});
await app.register(cors,{origin:config.origin,credentials:true});await app.register(cookie,{secret:config.sessionSecret});
registerTier0DurabilityErrorHandler(app);installCaptureHttpAdmission(app);installLockedCommissioning(app);
function ownerBound(req){return req.user?.id===baseline.owner&&req.user.workspaceId===baseline.workspace&&req.user.role==='founder'&&sha(req.user.email.trim().toLowerCase())==='a437be3d7f2e7927959c2be2040016464de75d69529d9abd197e47a8caa21267';}
// Append the final synchronous fence AFTER the original route's asynchronous
// authentication. No lease timer may freeze v2 while a previously admitted
// request is waiting on a second authentication lookup before committing v3.
app.addHook('onRoute',route=>{
 if(!['/api/owner/commerce/portfolio','/api/owner/commerce'].includes(route.url))return;
 const native=route.preHandler===undefined?[]:Array.isArray(route.preHandler)?route.preHandler:[route.preHandler];
 route.preHandler=[...native,function(req,reply,done){
  if(!ownerBound(req)){reply.code(403).send({code:'REVIEW_OWNER_REQUIRED'});return;}
  if(req.method==='POST')try{
   const bound=admission.consume({user:req.user,sessionToken:req.sessionToken,view:view(),requestHeaders:req.headers,body:req.body});
   save(EVIDENCE+'/authenticated-owner-input.json',bound);readbackFence.begin();req.reviewInput=bound;
  }catch{reply.code(409).send({code:'REVIEW_INPUT_REFUSED_REFRESH_SAVED_HISTORY'});return;}
  done();
 }];
 if(route.url==='/api/owner/commerce'&&route.method==='POST'){
  const nativeHandler=route.handler;
  // Capture the native result before network completion, even if the caller
  // disconnects. A competing soft seal waits for this bounded readback fence.
  route.handler=async function(req,reply){
   try{return await nativeHandler.call(this,req,reply);}
   finally{if(req.reviewInput){
    try{
     const actual=view(),event=actual.history.at(-1);
     save(EVIDENCE+'/native-owner-outcome.json',{schema:'A09_NATIVE_OWNER_CHOICE_READBACK_V1',nativeReplyStatusAtReadback:reply.statusCode,httpResponseCompleted:false,authenticatedInputSHA256:sha(fs.readFileSync(EVIDENCE+'/authenticated-owner-input.json')),version:actual.version,event:event??null,ownerApproval:actual.ownerApproval,selectedAssetIds:actual.current.assets.map(a=>a.id),personalActorAttribution:'REQUIRES_INDEPENDENT_OWNER_HANDOFF_OBSERVATION',acceptanceClaimed:false});
     readbackFence.finish(true);
    }catch{readbackFence.finish(false);}
    void seal('OWNER_INPUT_TERMINAL');
   }}
  };
 }
});
registerGovernedCommerce(app,authenticate);registerTier0LoginRoute(app,sessions,guard);registerExactNativeTier0SessionRoutes(app,sessions,guard,authenticate);
app.get('/api/owner/commerce/review-session',{preHandler:[guard,authenticate]},async(req,reply)=>{
 if(!ownerBound(req))return reply.code(403).send({code:'REVIEW_OWNER_REQUIRED'});
 try{return admission.issue({user:req.user,sessionToken:req.sessionToken,view:view(),requestHeaders:req.headers});}
 catch{return reply.code(409).send({code:'REVIEW_SESSION_UNAVAILABLE'});}
});
custody.get('/__owner-review/export',async(req,reply)=>{
 if(!exporter.authenticated(req.headers['x-empire-review-controller-token']))return reply.code(401).send({code:'CONTROLLER_REQUIRED'});
 const fixed=exporter.ready;if(!fixed)return reply.code(409).send({code:'FIXED_EXPORT_NOT_READY'});
 return reply.header('x-empire-review-export-sha256',fixed.sha256).type('application/json').send(fixed.body);
});
custody.post('/__owner-review/export-ack',async(req,reply)=>{
 if(!exporter.authenticated(req.headers['x-empire-review-controller-token']))return reply.code(401).send({code:'CONTROLLER_REQUIRED'});
 try{assert.deepEqual(Object.keys(req.body??{}),['exportSHA256']);return await exporter.acknowledge(req.body.exportSHA256);}
 catch{return reply.code(409).send({code:'EXPORT_ACK_REFUSED'});}
});
await app.ready();
const original=view();assert.equal(original.version,2);assert.equal(original.proposal.digest,baseline.proposalEventDigest);assert.equal(original.proposal.batchDigest,baseline.batchDigest);assert.equal(original.ownerApproval,false);assert.deepEqual(original.current.assets,[]);
const eventRows=db().prepare('SELECT record FROM work8_connector_media ORDER BY version').all();assert.deepEqual(eventRows.map(r=>sha(String(r.record))),baseline.storeInventory.mediaEvents.map(r=>r.recordSHA256));
const schemaRows=db().prepare("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE sql IS NOT NULL ORDER BY type,name").all().map(row=>[row.type,row.name,row.tbl_name,row.sql]);
assert.equal(sha(JSON.stringify(schemaRows)),baseline.storeInventory.schemaSHA256);
assert.deepEqual(db().prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(row=>row.name),baseline.storeInventory.tables.map(row=>row.name));
for(const table of baseline.storeInventory.tables){
 const columns=db().prepare('PRAGMA table_info("'+table.name+'")').all().map(row=>row.name);assert.deepEqual(columns,table.columns);
 const rows=db().prepare('SELECT * FROM "'+table.name+'"').all();assert.equal(rows.length,table.rows);
 const encoded=rows.map(row=>JSON.stringify(columns.map(name=>row[name]))).sort();assert.equal(sha(JSON.stringify(encoded)),table.rowsSHA256);
}
save(EVIDENCE+'/startup-readonly.json',{schema:'A09_RESTORED_NATIVE_STARTUP_READONLY_V1',restoredVersion:original.version,proposalDigest:original.proposal.digest,batchDigest:original.proposal.batchDigest,originalRecordSHA256:eventRows.map(r=>sha(String(r.record))),allOriginalRowsAndSchemaUnchanged:true,ownerAuthenticated:false,ownerActionObserved:false,ownerApproval:false,selection:[],preparationReplayed:false,productionAccess:false,acceptanceClaimed:false});
await app.listen({host:'127.0.0.1',port:4000});
await custody.listen({host:'127.0.0.1',port:4001});
async function close(){if(closing)return;closing=true;await seal('SERVICE_TERMINATION');await Promise.all([app.close(),custody.close()]);redis.disconnect();}
process.on('SIGUSR1',()=>void seal('BOUNDED_DRAIN'));
process.on('SIGTERM',()=>void seal('SERVICE_TERMINATION'));
process.on('SIGINT',()=>void seal('SERVICE_TERMINATION'));
setTimeout(()=>void seal('SOFT_REVIEW_EXPIRY'),Math.max(1,reviewClosesAtMs-Date.now()));
setTimeout(()=>void close().finally(()=>process.exit(0)),Math.max(1,config.expiresAtMs+4500-Date.now()));

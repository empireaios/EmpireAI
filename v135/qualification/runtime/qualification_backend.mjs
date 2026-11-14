// Stage A uses native authentication and a newly empty native commerce store.
// This account is synthetic; no private restoration or media decision route exists.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {createHash,randomBytes,createPublicKey,publicEncrypt,constants,createCipheriv} from 'node:crypto';
import {validPortfolioQuery} from '/control/owner_review/host/portfolio-query.mjs';
const CONTROL='/control/qualification',STATE='/state/qualification';
const sha=b=>createHash('sha256').update(b).digest('hex');
const cfg=JSON.parse(fs.readFileSync(STATE+'/root-clock.json','utf8'));
assert.equal(process.getuid(),1001);assert.equal(process.getgid(),1001);
assert.equal(cfg.operationIdentity,'V135-A10-DELIVERY-QUALIFICATION-A02-20261114');
assert.equal(cfg.privateDataIncluded,false);assert.equal(cfg.ownerDecisionPermitted,false);
assert.equal(new URL(cfg.origin).origin,cfg.origin);assert.ok(cfg.origin.startsWith('https://'));
assert.ok(cfg.qualificationExpiresAtMs>Date.now());
const email='v135-qualification@example.invalid',password=randomBytes(48).toString('base64url'),admin=randomBytes(48).toString('base64url'),secret=randomBytes(48).toString('base64url');
assert.notEqual(sha(email),'a437be3d7f2e7927959c2be2040016464de75d69529d9abd197e47a8caa21267');
Object.assign(process.env,{NODE_ENV:'production',LOG_LEVEL:'error',HOST:'127.0.0.1',PORT:'4000',REDIS_URL:'redis://127.0.0.1:46379/0',REDIS_OPTIONAL:'false',DATABASE_PATH:STATE+'/commissioning/empireai-brain.db',RAILWAY_VOLUME_MOUNT_PATH:STATE,RAILWAY_GIT_COMMIT_SHA:'6c1e63ba20619ee480742fd87dc810ca93152e22',EMPIRE_RUNTIME_PROFILE:'LOCKED_COMMISSIONING_V1',EMPIRE_ENGINEERING_TEST_MODE:'true',FOUNDER_EMAIL:email,FOUNDER_PASSWORD:password,ADMIN_EMAIL:email,ADMIN_PASSWORD:admin,SESSION_SECRET:secret,SESSION_TTL_SECONDS:'600',CORS_ORIGIN:cfg.origin,INTELLIGENCE_ENABLED:'false',INTELLIGENCE_DISABLED:'true'});
// Explicitly no EMPIRE_OWNER_WRITE_POLICY, media root, restored mode or real owner identity.
for(const name of ['EMPIRE_OWNER_WRITE_POLICY','EMPIRE_CONNECTOR_MEDIA_ROOT','EMPIRE_CONNECTOR_OWNER_REVIEW_MODE'])assert.equal(process.env[name],undefined);
const require=createRequire('/app/backend/package.json'),Fastify=require('fastify'),cookie=require('@fastify/cookie'),cors=require('@fastify/cors');
const load=p=>import('/app/backend/dist/'+p);
const [{createTier0RedisClient,waitForRuntimeRedisReady},{SessionStore},{createAuthMiddleware},{registerTier0LoginRoute,createSharedSessionStoreGuard,registerTier0DurabilityErrorHandler},{probeRedisSessionStore},{installLockedCommissioning},{installCaptureHttpAdmission},{registerGovernedCommerce,productionCommerce},{registerExactNativeTier0SessionRoutes},{readConnectorMedia},{env}]=await Promise.all([
 load('runtime/tier0-redis.js'),load('auth/session-store.js'),load('auth/middleware.js'),load('runtime/tier0-isolated-primary.js'),load('runtime/application-readiness.js'),load('runtime/locked-commissioning.js'),load('runtime/capture-http-admission.js'),load('runtime/commerce-runtime/governed/runtime.js'),import('/control/owner_review/native-tier0-session-routes.mjs'),load('runtime/commerce-runtime/governed/work8-connector-media.js'),load('config/env.js')]);
const redis=createTier0RedisClient(process.env.REDIS_URL);await waitForRuntimeRedisReady(redis,2000);assert.equal(await redis.dbsize(),0,'FRESH_SYNTHETIC_REDIS_REQUIRED');
const nativeSessions=new SessionStore(redis);
const sessions={get:t=>nativeSessions.get(t),destroy:t=>nativeSessions.destroy(t),refresh:async()=>null,async create(user){
 const seconds=Math.min(600,Math.floor((cfg.qualificationExpiresAtMs-Date.now())/1000)-1);if(seconds<1)throw Error('QUALIFICATION_EXPIRED');
 env.SESSION_TTL_SECONDS=seconds;const session=await nativeSessions.create(user);
 if(Date.parse(session.expiresAt)>cfg.qualificationExpiresAtMs||Date.now()>=cfg.qualificationExpiresAtMs){await nativeSessions.destroy(session.token);throw Error('QUALIFICATION_EXPIRED');}return session;
}};
const authenticate=createAuthMiddleware(sessions),guard=createSharedSessionStoreGuard(()=>probeRedisSessionStore(redis,1500));
const allowed=new Set(['POST /auth/login','POST /auth/logout','GET /auth/me','GET /api/owner/commerce/portfolio','GET /api/owner/commerce/comparables']);
const app=Fastify({logger:false,bodyLimit:4096,requestTimeout:20000});
app.addHook('preValidation',async(req,reply)=>{
 if(Date.now()>=cfg.qualificationExpiresAtMs)return reply.code(423).send({code:'QUALIFICATION_EXPIRED'});
 const target=new URL(req.url,cfg.origin);
 const readQueryAllowed=!target.search||(req.method==='GET'&&target.pathname==='/api/owner/commerce/portfolio'&&validPortfolioQuery(target.search));
 if(!allowed.has(req.method+' '+target.pathname)||!readQueryAllowed)return reply.code(423).send({code:'OUTSIDE_READONLY_QUALIFICATION'});
 if(req.headers.authorization)return reply.code(403).send({code:'NATIVE_COOKIE_REQUIRED'});
});
app.addHook('onSend',async(_req,reply,payload)=>{reply.header('cache-control','private, no-store').header('referrer-policy','no-referrer').header('x-content-type-options','nosniff').header('x-empire-qualification','SYNTHETIC_NONOWNER_ONLY');return payload;});
await app.register(cors,{origin:cfg.origin,credentials:true});await app.register(cookie,{secret});
registerTier0DurabilityErrorHandler(app);installCaptureHttpAdmission(app);installLockedCommissioning(app);
registerGovernedCommerce(app,authenticate);registerTier0LoginRoute(app,sessions,guard);registerExactNativeTier0SessionRoutes(app,sessions,guard,authenticate);
await app.ready();
const userId='usr_'+sha(email).slice(0,16),workspace='ws_empire_1';
const empty=readConnectorMedia(productionCommerce().store.db,{workspace,owner:userId});
assert.deepEqual(empty,{availability:'NOT_PREPARED',rights:'PRIVATE_FACTUAL_PREPARATION_ONLY'});
const binding={purpose:'STAGE_A_SYNTHETIC_NONOWNER_QUALIFICATION_ONLY',operationIdentity:cfg.operationIdentity,origin:cfg.origin,sourceCommit:cfg.sourceCommit,projectId:cfg.projectId,environmentId:cfg.environmentId,serviceId:cfg.serviceId,deploymentId:cfg.deploymentId,qualificationExpiresAtMs:cfg.qualificationExpiresAtMs,qualificationSourceManifestSHA256:cfg.qualificationSourceManifestSHA256,nativeRuntimeManifestSHA256:cfg.runtimeManifestSHA256,emailSHA256:sha(email),expectedUserId:userId,workspaceId:workspace,instanceNonce:randomBytes(32).toString('base64url')};
assert.match(binding.qualificationSourceManifestSHA256,/^[a-f0-9]{64}$/);
const recipient=createPublicKey(fs.readFileSync(CONTROL+'/qualification-recipient-public.pem'));
assert.equal(recipient.asymmetricKeyType,'rsa');assert.equal(recipient.asymmetricKeyDetails.modulusLength,4096);
assert.equal(sha(recipient.export({format:'der',type:'spki'})),cfg.recipientSPKISHA256);
const key=randomBytes(32),nonce=randomBytes(12),aad=Buffer.from(JSON.stringify(binding)),plain=Buffer.from(JSON.stringify({email,password}));
const cipher=createCipheriv('aes-256-gcm',key,nonce);cipher.setAAD(aad);const encrypted=Buffer.concat([cipher.update(plain),cipher.final()]);
const envelope={schema:'V135_SYNTHETIC_AUTH_CREDENTIAL_ENVELOPE_V1',contentAlgorithm:'AES-256-GCM',keyWrapAlgorithm:'RSA-OAEP-SHA256',recipientSPKISHA256:cfg.recipientSPKISHA256,binding,nonceBase64:nonce.toString('base64'),wrappedKeyBase64:publicEncrypt({key:recipient,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},key).toString('base64'),authenticationTagBase64:cipher.getAuthTag().toString('base64'),ciphertextBase64:encrypted.toString('base64'),ciphertextSHA256:sha(encrypted),aadSHA256:sha(aad)};
key.fill(0);plain.fill(0);
const status={schema:'V135_SYNTHETIC_NATIVE_DELIVERY_STATUS_V1',...binding,privateDataIncluded:false,ownerDecisionPermitted:false,nativeReadOnlyIngress:true,nativeInternalStateMayChange:true,nativeMediaAvailability:empty.availability,genuineOwnerReviewClockStarted:false};
fs.writeFileSync(STATE+'/encrypted-credentials.json',JSON.stringify(envelope)+'\n',{flag:'wx',mode:0o400});
fs.writeFileSync(STATE+'/public-status.json',JSON.stringify(status)+'\n',{flag:'wx',mode:0o400});
await app.listen({host:'127.0.0.1',port:4000});
let closing=false;async function close(){if(closing)return;closing=true;try{await app.close();redis.disconnect();}finally{process.exit(0);}}
process.on('SIGTERM',()=>void close());process.on('SIGINT',()=>void close());
setTimeout(()=>void close(),Math.max(1,cfg.qualificationExpiresAtMs-Date.now()));

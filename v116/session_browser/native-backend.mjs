import {safeFailure} from './safe-failure.mjs';
// Narrow native Tier0/auth/commerce composition for A1 historical inspection/reload.
// This is an isolated technical application examination, not the full seven-role graph.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomBytes} from 'node:crypto';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';

const OUT='/output',VOLUME=OUT+'/volume',SOURCE='/source-volume',APP='/app';
const source='6c1e63ba20619ee480742fd87dc810ca93152e22';
const authoritySHA='f1170d9351861402fac03c99b9eb829c1d05941546c085bfcae4790b8a26add3';
const expectedOwner='usr_44a451d126ce7116',sessionId='v116_native_post_snapshot';
const ownerEmail='hh4-owner@example.test',ownerPassword='generated-hh4-owner-password';
const adminEmail='hh4-admin@example.test',adminPassword='generated-hh4-admin-password';
const start=Date.now(),deadline=start+205000,policy=OUT+'/owner-policy.json';
const sha=b=>createHash('sha256').update(b).digest('hex');
const result={schema:'v116-native-history-browser-backend-v1',status:'FAIL',source,
 classification:'GENERATED_TECHNICAL_NATIVE_SESSION_SUPPORT',genuineOwnerAcceptance:false,
 fullSevenRoleGraph:false,newBusinessExecution:false,wholeRowAccepted:false,events:[]};
let app,redis,c,baseline,usersBefore,phase='isolated-input-admission',closing=false;
const save=(name,value)=>{const bytes=JSON.stringify(value,null,2)+'\n';assert.ok(Buffer.byteLength(bytes)<=4*1024*1024,'RECEIPT_BOUND');const p=OUT+'/'+name;const fd=fs.openSync(p,'wx',0o600);try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}};
const record=(name,value={})=>result.events.push({name,at:Date.now(),...value});
function regular(p){const s=fs.lstatSync(p);assert.ok(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1,'REGULAR_SINGLE_LINK_REQUIRED');assert.equal(fs.realpathSync(p),p);return s;}
function inspectClosed(file){const db=new DatabaseSync(file,{readOnly:true,allowExtension:false,timeout:1000});try{db.exec('PRAGMA query_only=ON; BEGIN');assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');return state(db);}finally{if(db.isTransaction)db.exec('ROLLBACK');db.close();}}
function state(db){const schema=db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").all();const tables={};for(const {name}of schema.filter(x=>x.type==='table')){assert.match(name,/^[A-Za-z_][A-Za-z0-9_]*$/);tables[name]=db.prepare('SELECT * FROM "'+name+'"').all().map(x=>({...x})).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));}return {schema,tables};}
function readUsers(){const db=new DatabaseSync(VOLUME+'/commissioning/empireai-brain.db',{readOnly:true,allowExtension:false});try{return db.prepare('SELECT * FROM users ORDER BY id').all();}finally{db.close();}}
function admitCopy(){
 assert.equal(process.getuid(),0);assert.equal(fs.realpathSync(OUT),OUT);assert.ok(!fs.existsSync(VOLUME));
 assert.equal(sha(fs.readFileSync('/inputs/technical-authority.json')),authoritySHA);
 const m=JSON.parse(fs.readFileSync('/control/backend-state-inputs.json','utf8'));assert.equal(m.source,source);assert.equal(m.files.length,14);
 const found=[];function walk(p,rel=''){for(const e of fs.readdirSync(p,{withFileTypes:true})){const r=path.posix.join(rel,e.name),f=path.join(p,e.name);assert.ok(!e.isSymbolicLink());if(e.isDirectory())walk(f,r);else{regular(f);found.push(r);}}}walk(SOURCE);assert.deepEqual(found.sort(),m.files.map(x=>x.path).sort());
 fs.mkdirSync(VOLUME,{mode:0o700});
 for(const x of m.files){assert.ok(!path.isAbsolute(x.path)&&!x.path.split('/').includes('..'));const a=SOURCE+'/'+x.path,b=VOLUME+'/'+x.path;const before=regular(a);assert.equal(before.size,x.bytes);assert.equal(sha(fs.readFileSync(a)),x.sha256);for(const suffix of ['-wal','-shm','-journal'])assert.ok(!fs.existsSync(a+suffix),'SOURCE_SIDECAR_ABSENT');fs.mkdirSync(path.dirname(b),{recursive:true,mode:0o700});fs.copyFileSync(a,b,fs.constants.COPYFILE_EXCL);fs.chmodSync(b,0o600);assert.equal(sha(fs.readFileSync(b)),x.sha256);assert.equal(sha(fs.readFileSync(a)),x.sha256);assert.equal(regular(a).ino,before.ino);}
 const pack=JSON.parse(fs.readFileSync('/inputs/test1-committed-business-checkpoint.json','utf8'));assert.equal(pack.digest,m.checkpointDigest);assert.equal(pack.owner,expectedOwner);assert.equal(pack.sessionId,sessionId);const {digest,...body}=pack;assert.equal(sha(JSON.stringify(body)),digest);
 baseline=inspectClosed(VOLUME+'/commerce/runtime.sqlite');for(const [name,rows]of Object.entries(pack.tables)){assert.ok(baseline.tables[name]);assert.deepEqual(baseline.tables[name],rows.map(x=>({...x})).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))),'EXACT_NATIVE_CHECKPOINT_ROWS:'+name);}
 assert.equal(baseline.tables.commerce_runtime_receipts.length,20);assert.equal(baseline.tables.work8_sim_finance_events.length,4);assert.equal(baseline.tables.work8_twin_authority.length,0);assert.equal(baseline.tables.work8_preparation_authority.length,0);
 usersBefore=readUsers();assert.ok(usersBefore.some(x=>x.id==='094c4b0b-9ebe-40b4-b32e-215888dc86e7'&&x.email===ownerEmail&&x.role==='founder'));assert.ok(!usersBefore.some(x=>x.id===expectedOwner));
 save('native-input-state.json',{manifestSHA256:sha(fs.readFileSync('/control/backend-state-inputs.json')),all14FilesCopiedExact:true,originalSourceUntouched:true,commerceLogicalSHA256:sha(JSON.stringify(baseline)),tables:Object.fromEntries(Object.entries(baseline.tables).map(([k,v])=>[k,{rows:v.length,sha256:sha(JSON.stringify(v))}])),brainUsersSHA256:sha(JSON.stringify(usersBefore)),authIdentity:{nativeTier0Owner:expectedOwner,workerUserStoreOwner:'094c4b0b-9ebe-40b4-b32e-215888dc86e7',identityRemapped:false,explanation:'Original Tier0 primary authenticates configured bootstrap credentials and derives stable user ID; worker UserStore UUID is distinct original state.'}});
 return pack;
}
async function nativeRequest(url,body,cookie){const r=await fetch('http://127.0.0.1:4000'+url,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'content-type':'application/json'}),...(cookie?{cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(5000)});const v=await r.json();return {r,v};}
async function login(email,password){const {r,v}=await nativeRequest('/auth/login',{email,password});assert.equal(r.status,200);assert.equal(v.tier0Isolation,true);const token=r.headers.get('set-cookie')?.match(/empireai_session=([^;]+)/)?.[1];assert.ok(token);const cookie='empireai_session='+token;const me=await nativeRequest('/auth/me',undefined,cookie);assert.equal(me.r.status,200);assert.deepEqual(me.v.user,v.user);return {user:v.user,token,cookie};}
async function finalPreservation(){
 const browser=JSON.parse(fs.readFileSync(OUT+'/browser-result.json','utf8'));assert.equal(browser.status,'PASS_AWAITING_INDEPENDENT_A1_19_A1_20_REVIEW');
 const created=browser.events.find(e=>e.name==='native-ui-created-current-technical-session')?.session;assert.ok(created);assert.equal(created.owner,expectedOwner);assert.equal(created.action,'CREATE');assert.equal(created.status,'PAUSED');assert.equal(created.version,1);assert.notEqual(created.sessionId,sessionId);
 const final=state(c.store.db);assert.deepEqual(final.schema,baseline.schema);const additions=final.tables.work8_twin_events.filter(r=>!baseline.tables.work8_twin_events.some(b=>JSON.stringify(b)===JSON.stringify(r)));
 assert.equal(additions.length,2);const allowed=new Set(['v116_foreign_history_scope',created.sessionId]);for(const r of additions){assert.ok(allowed.has(r.session));const e=JSON.parse(r.record);assert.equal(e.action,'CREATE');assert.equal(e.status,'PAUSED');assert.equal(e.version,1);assert.equal(e.externalEffects,0);}
 final.tables.work8_twin_events=final.tables.work8_twin_events.filter(r=>!allowed.has(r.session));assert.deepEqual(final,baseline,'ALL_PREEXISTING_NATIVE_COMMERCE_ROWS_UNCHANGED');assert.deepEqual(readUsers(),usersBefore,'BRAIN_USERS_NOT_REPLACED_OR_MAPPED');
 assert.equal(c.twin.read({workspace:'ws_empire_1',owner:expectedOwner},sessionId).status,'PAUSED');assert.equal(c.store.db.prepare('SELECT count(*) n FROM work8_twin_authority').get().n,0);assert.equal(c.store.db.prepare('SELECT count(*) n FROM work8_preparation_authority').get().n,0);
 const resultBeforeClose={oldCommerceLogicalSHA256:sha(JSON.stringify(final)),beforeCommerceLogicalSHA256:sha(JSON.stringify(baseline)),oldCommerceRowsUnchanged:true,oldSessionUnchanged:true,receiptCount:20,financeEventCount:4,activeAuthorityRows:0,addedLifecycleEvents:additions.map(r=>JSON.parse(r.record)),brainUsersUnchanged:true};
 await app.close();app=null;c=null;
 const closed=inspectClosed(VOLUME+'/commerce/runtime.sqlite');assert.equal(closed.tables.commerce_runtime_receipts.length,20);assert.equal(closed.tables.work8_sim_finance_events.length,4);
 save('native-final.json',{schema:'v116-native-old-session-preservation-v1',status:'PASS_OLD_NATIVE_SESSION_RECORDS_PRESERVED',...resultBeforeClose,closedSQLiteIntegrity:'ok',closedStateSHA256:sha(JSON.stringify(closed)),genuineOwnerAcceptance:false});
 result.status='PASS_OLD_NATIVE_SESSION_RECORDS_PRESERVED';
}
try{
 const pack=admitCopy();
 for(const key of Object.keys(process.env))assert.ok(['PATH','HOME','LANG','TZ'].includes(key),'UNEXPECTED_INHERITED_ENVIRONMENT');
 Object.assign(process.env,{NODE_ENV:'production',LOG_LEVEL:'error',PORT:'4000',HOST:'127.0.0.1',REDIS_URL:'redis://127.0.0.1:46379/0',REDIS_OPTIONAL:'false',DATABASE_PATH:VOLUME+'/commissioning/empireai-brain.db',RAILWAY_VOLUME_MOUNT_PATH:VOLUME,RAILWAY_GIT_COMMIT_SHA:source,EMPIRE_RUNTIME_PROFILE:'LOCKED_COMMISSIONING_V1',EMPIRE_ENGINEERING_TEST_MODE:'true',EMPIRE_OWNER_WRITE_POLICY:policy,FOUNDER_EMAIL:ownerEmail,FOUNDER_PASSWORD:ownerPassword,ADMIN_EMAIL:adminEmail,ADMIN_PASSWORD:adminPassword,SESSION_SECRET:randomBytes(32).toString('hex'),SESSION_TTL_SECONDS:'600',CORS_ORIGIN:'http://localhost:43117',INTELLIGENCE_ENABLED:'false',INTELLIGENCE_DISABLED:'true'});
 phase='exact-native-module-composition';
 const require=createRequire(APP+'/backend/package.json');const Fastify=require('fastify'),cookie=require('@fastify/cookie'),cors=require('@fastify/cors');
 const load=p=>import(APP+'/backend/dist/'+p);
 const [{createTier0RedisClient,waitForRuntimeRedisReady},{SessionStore},{createAuthMiddleware},{registerTier0LoginRoute,createSharedSessionStoreGuard,registerTier0DurabilityErrorHandler},{probeRedisSessionStore},{installLockedCommissioning},{installCaptureHttpAdmission},{registerGovernedCommerce,productionCommerce},{registerExactNativeTier0SessionRoutes}]=await Promise.all([load('runtime/tier0-redis.js'),load('auth/session-store.js'),load('auth/middleware.js'),load('runtime/tier0-isolated-primary.js'),load('runtime/application-readiness.js'),load('runtime/locked-commissioning.js'),load('runtime/capture-http-admission.js'),load('runtime/commerce-runtime/governed/runtime.js'),import('/control/native-tier0-session-routes.mjs')]);
 redis=createTier0RedisClient(process.env.REDIS_URL);await waitForRuntimeRedisReady(redis,2000);assert.equal(await redis.dbsize(),0,'FRESH_PRIVATE_AUTH_REDIS');const sessionStore=new SessionStore(redis),authenticate=createAuthMiddleware(sessionStore),guard=createSharedSessionStoreGuard(()=>probeRedisSessionStore(redis,1500));
 app=Fastify({logger:false,bodyLimit:64000,requestTimeout:10000});installCaptureHttpAdmission(app);installLockedCommissioning(app);await app.register(cors,{origin:process.env.CORS_ORIGIN,credentials:true});await app.register(cookie,{secret:process.env.SESSION_SECRET});registerTier0DurabilityErrorHandler(app);registerGovernedCommerce(app,authenticate);registerTier0LoginRoute(app,sessionStore,guard);registerExactNativeTier0SessionRoutes(app,sessionStore,guard,authenticate);
 await app.listen({host:'127.0.0.1',port:4000});c=productionCommerce();assert.deepEqual(state(c.store.db),baseline,'NATIVE_CONSTRUCTORS_PRESERVE_EXISTING_BASELINE');
 phase='native-authentication-and-owner-scope';
 const missingPolicy=await nativeRequest('/api/owner/commerce/twin');assert.equal(missingPolicy.r.status,423);assert.equal(missingPolicy.v.code,'OWNER_WRITES_RESTRICTED');
 save('owner-policy.json',{schema:1,mode:'RELEASED',approvalSha256:authoritySHA,expiresAt:new Date(start+210000).toISOString()});fs.chmodSync(policy,0o400);
 const noSession=await nativeRequest('/api/owner/commerce/twin');assert.equal(noSession.r.status,401);const forged=await nativeRequest('/auth/me',undefined,'empireai_session=not-a-native-session');assert.equal(forged.r.status,401);const wrong=await nativeRequest('/auth/login',{email:ownerEmail,password:'not-the-fixture-password'});assert.equal(wrong.r.status,401);
 const owner=await login(ownerEmail,ownerPassword);assert.equal(owner.user.id,expectedOwner);assert.equal(owner.user.workspaceId,'ws_empire_1');assert.equal(owner.user.role,'founder');
 const admin=await login(adminEmail,adminPassword);assert.notEqual(admin.user.id,expectedOwner);assert.equal(admin.user.role,'admin');
 const foreignId='v116_foreign_history_scope',foreign=c.twin.transition({workspace:admin.user.workspaceId,owner:admin.user.id},{id:'v116_foreign_history_create',sessionId:foreignId,expectedVersion:0,action:'CREATE'});assert.equal(foreign.status,'PAUSED');
 const foreignRead=await nativeRequest('/api/owner/commerce/twin?sessionId='+foreignId,undefined,owner.cookie);assert.equal(foreignRead.r.status,403);assert.equal(foreignRead.v.error,'TWIN_OWNER_SCOPE_DENIED');
 const ownerList=await nativeRequest('/api/owner/commerce/twin?limit=100',undefined,owner.cookie);assert.equal(ownerList.r.status,200);assert.ok(ownerList.v.sessions.some(s=>s.sessionId===sessionId));assert.ok(!ownerList.v.sessions.some(s=>s.sessionId===foreignId));
 const projectionObservation={startedAtMs:Date.now()};const projection=await nativeRequest('/api/owner/commerce/twin?sessionId='+sessionId,undefined,owner.cookie);projectionObservation.completedAtMs=Date.now();assert.equal(projection.r.status,200);assert.equal(projection.v.session.owner,expectedOwner);assert.equal(projection.v.session.status,'PAUSED');assert.equal(projection.v.records.length,2);assert.equal(projection.v.authority.status,'NOT_GRANTED');
 await sessionStore.destroy(owner.token);await sessionStore.destroy(admin.token);const loggedOut=await nativeRequest('/auth/me',undefined,owner.cookie);assert.equal(loggedOut.r.status,401);assert.equal(await redis.dbsize(),0,'AUTH_PROBE_SESSIONS_REMOVED');
 record('native-authentication-controls',{missingPolicy423:true,noSession401:true,forgedSession401:true,wrongPassword401:true,actualOwner:owner.user,actualAdmin:admin.user,foreignSessionId:foreignId,foreignDirect403:true,foreignListExcluded:true,loggedOut401:true,sessionStore:'ORIGINAL_REDIS_SESSION_STORE',brainUsersRewritten:false});
 save('private-login.json',{email:ownerEmail,password:ownerPassword});
 save('backend-ready.json',{source,owner:owner.user,historicalSessionId:sessionId,foreignSessionId:foreignId,expectedHistoricalProjection:projection.v,projectionObservation,generatedTechnicalFounderOnly:true,genuineOwnerAcceptance:false,fullSevenRoleGraph:false,originalSessionAuthority:'NOT_GRANTED',nativeAuthPath:'ORIGINAL_EXPORTED_TIER0_LOGIN_AND_EXACT_NATIVE_SESSION_HANDLERS',technicalPolicyApprovalSHA256:authoritySHA});
 phase='actual-browser-wait';
 while(!fs.existsSync(OUT+'/browser-complete.json')){assert.ok(Date.now()<deadline,'NATIVE_BROWSER_DEADLINE');await new Promise(r=>setTimeout(r,50));}
 phase='post-browser-native-preservation';await finalPreservation();
}catch(e){result.firstFailure=safeFailure(e,phase,'native-backend.mjs');process.exitCode=1;}
finally{
 closing=true;
 if(app)try{await app.close();}catch{result.cleanupFailure='NATIVE_APP_CLOSE';process.exitCode=1;}
 redis?.disconnect();
 for(const p of [OUT+'/private-login.json',policy])if(fs.existsSync(p))fs.unlinkSync(p);
 result.credentialsRemoved=!fs.existsSync(OUT+'/private-login.json');result.policyRemoved=!fs.existsSync(policy);result.finishedAt=Date.now();
 save('backend-result.json',result);
}

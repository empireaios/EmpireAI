// Source-reviewed delegated technical operation, not an observed owner click.
// Invoke through exact-container docker exec /usr/local/bin/node --input-type=module -e <these bytes>.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const cfg=JSON.parse(fs.readFileSync('/private/native-bootstrap.json','utf8'));
assert.equal(sha(cfg.founderEmail),'a437be3d7f2e7927959c2be2040016464de75d69529d9abd197e47a8caa21267');assert.ok(cfg.expiresAtMs>Date.now()+60000);
assert.equal(fs.existsSync('/evidence/delegated-native-session.json'),false,'EXISTING_OPERATION_RECEIPT_REQUIRES_RECONCILIATION');
const result={schema:'v126-delegated-native-session-v1',status:'FAIL',inputActor:'DELEGATED_TECHNICAL_OPERATOR',
 ownerActionObserved:false,ownerDecisionGranted:false,wholeRowAccepted:false,historyImported:false,
 source:'6c1e63ba20619ee480742fd87dc810ca93152e22',startedAtMs:Date.now(),steps:[]};
let phase='unauthenticated-authentication-readback',cookie;
async function request(path,body,auth=true){
 const r=await fetch('http://127.0.0.1:4000'+path,{method:body===undefined?'GET':'POST',
  headers:{...(body===undefined?{}:{'content-type':'application/json'}),...(auth&&cookie?{cookie}:{})},
  ...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(4000)});
 const text=await r.text();assert.ok(text.length<1048576);const data=JSON.parse(text);
 result.steps.push({phase,path,status:r.status,publicError:typeof data.error==='string'?data.error:typeof data.code==='string'?data.code:null});
 return {r,data};
}
try{
 assert.equal((await request('/auth/me')).r.status,401);
 phase='wrong-password-refusal';assert.equal((await request('/auth/login',{email:cfg.founderEmail,password:'not-the-provisioned-native-password'},false)).r.status,401);
 phase='actual-native-login';const login=await request('/auth/login',{email:cfg.founderEmail,password:cfg.founderPassword},false);
 assert.equal(login.r.status,200);assert.equal(login.data.tier0Isolation,true);
 const token=login.r.headers.get('set-cookie')?.match(/empireai_session=([^;]+)/)?.[1];assert.ok(token);cookie='empireai_session='+token;
 phase='actual-native-principal';const me=await request('/auth/me');assert.equal(me.r.status,200);
 assert.equal(me.data.user.id,'usr_'+sha(cfg.founderEmail).slice(0,16));assert.equal(me.data.user.email,cfg.founderEmail);
 assert.equal(me.data.user.role,'founder');assert.equal(me.data.user.workspaceId,'ws_empire_1');result.nativePrincipal={id:me.data.user.id,role:me.data.user.role,workspaceId:me.data.user.workspaceId,emailSHA256:sha(me.data.user.email)};
 phase='fresh-empty-list';const before=await request('/api/owner/commerce/twin?limit=100');assert.equal(before.r.status,200);assert.deepEqual(before.data.sessions,[]);
 const key='v126-delegated-'+randomUUID();const body={action:'twin_lifecycle',transition:{id:key,sessionId:key,expectedVersion:0,action:'CREATE'}};
 phase='delegated-native-paused-create';const created=await request('/api/owner/commerce',body);assert.equal(created.r.status,200);
 assert.equal(created.data.session.status,'PAUSED');assert.equal(created.data.session.version,1);assert.equal(created.data.session.owner,me.data.user.id);
 assert.equal(created.data.externalEffects,0);assert.equal(created.data.paidInference,0);result.nativeSession=created.data.session;
 phase='same-request-idempotency-readback';const repeated=await request('/api/owner/commerce',body);assert.equal(repeated.r.status,200);assert.deepEqual(repeated.data,created.data);
 phase='fresh-native-projection';const projection=await request('/api/owner/commerce/twin?sessionId='+key);assert.equal(projection.r.status,200);
 assert.equal(projection.data.session.digest,created.data.session.digest);assert.equal(projection.data.session.status,'PAUSED');
 assert.equal(projection.data.authority.status,'NOT_GRANTED');assert.deepEqual(projection.data.records,[]);result.nativeProjection=projection.data;
 result.status='PASS_DELEGATED_NATIVE_AUTH_AND_FRESH_PAUSED_SESSION';
}catch(e){result.firstFailure={phase,name:e.name,messageSHA256:sha(String(e.message)),sourceLocations:String(e.stack??'').split('\n').filter(line=>/^\s+at /.test(line)).slice(0,3)};process.exitCode=1;}
finally{
 if(cookie){try{phase='native-logout';const out=await request('/auth/logout',{});assert.equal(out.r.status,200);const me=await request('/auth/me');assert.equal(me.r.status,401);result.nativeLogoutVerified=true;}catch(e){result.cleanupFailure={phase,name:e.name,messageSHA256:sha(String(e.message))};result.status='FAIL_LOGOUT';process.exitCode=1;}}
 cookie=null;result.finishedAtMs=Date.now();
 fs.writeFileSync('/evidence/delegated-native-session.json',JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
 console.log(JSON.stringify(result));
}

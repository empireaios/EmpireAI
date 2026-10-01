'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {configuration,PROFILE}=require('./locked-runtime.cjs');
const {runBounded}=require('./canary-launcher.cjs');
test('permanent profile is explicit, isolated, allows only bounded inference credentials and has no canary expiry',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'locked-profile-'));
 const env={EMPIRE_RUNTIME_PROFILE:PROFILE,RAILWAY_VOLUME_MOUNT_PATH:root,DATABASE_PATH:path.join(root,'commissioning','empireai-brain.db'),FOUNDER_EMAIL:'a@example.invalid',ADMIN_EMAIL:'b@example.invalid',FOUNDER_PASSWORD:'a'.repeat(32),ADMIN_PASSWORD:'b'.repeat(32),SESSION_SECRET:'c'.repeat(40),EMPIRE_LOCKED_REDIS_HOST:'redis.railway.internal',REDIS_URL:'redis://default:isolated@redis.railway.internal:6379/0'};
 try{const actual=configuration(env);assert.equal(actual.EMPIRE_RUNTIME_PROFILE,PROFILE);assert.equal(actual.LIVE_CJ_FULFILLMENT_ENABLED,'false');assert.equal(actual.EMPIRE_CANARY_EXPIRES_AT,undefined);const inference=configuration({...env,OPENAI_API_KEY:'offline-test-key'});assert.equal(inference.OPENAI_API_KEY,'offline-test-key');assert.equal(inference.DEFAULT_LLM_MODEL,'gpt-6.1-sol');assert.equal(inference.EMPIRE_ENGINEERING_TEST_MODE,'true');assert.equal(inference.COMMERCE_READINESS_BLOCKED,'true');assert.equal(inference.LIVE_PAYMENT_ENABLED,'false');assert.equal(configuration({...env,ANTHROPIC_API_KEY:'offline-claude'}).ANTHROPIC_API_KEY,'offline-claude');assert.equal(configuration({...env,GOOGLE_AI_API_KEY:'offline-google'}).GOOGLE_AI_API_KEY,'offline-google');assert.throws(()=>configuration({...env,AMAZON_REFRESH_TOKEN:'forbidden'}));assert.throws(()=>configuration({...env,DATABASE_PATH:'/data/empireai-brain.db'}));assert.throws(()=>configuration({...env,EMPIRE_CANARY_EXPIRES_AT:new Date().toISOString()}));}finally{fs.rmSync(root,{recursive:true});}
});
test('permanent supervisor has no expiry and still forwards controlled shutdown',async()=>{
 let pid;const result=await runBounded({command:process.execPath,args:['-e',"process.on('SIGTERM',()=>process.exit(0));console.log('ready');setInterval(()=>{},1000)"],env:{PATH:process.env.PATH},cwd:process.cwd(),expiresAt:null,stdio:['ignore','pipe','ignore'],onSpawn:child=>{pid=child.pid;child.stdout.once('data',()=>setTimeout(()=>process.emit('SIGTERM'),200));}});
 assert.ok(pid);assert.equal(result.code,0);assert.equal(result.reason,'signal');assert.equal(result.forcedTermination,false);
});

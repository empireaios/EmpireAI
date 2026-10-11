'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {configuration,PROFILE}=require('./locked-runtime.cjs');
const {runBounded}=require('./canary-launcher.cjs');
test('whole-volume capture refuses a second-store writer during later Redis copy',async()=>{
 const {ACK,backup,restore}=require('./locked-state-bundle.cjs');
 const {DatabaseSync}=require('node:sqlite'),{spawn}=require('node:child_process');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cross-store-capture-'));
 const application=path.join(root,'application'),redis=path.join(root,'redis'),signal=path.join(root,'write'),done=path.join(root,'done');
 fs.mkdirSync(application);fs.mkdirSync(redis);fs.mkdirSync(path.join(application,'finance'));
 const finance=path.join(application,'finance','evidence.sqlite');
 const db=new DatabaseSync(finance);db.exec('CREATE TABLE generation(value INTEGER); INSERT INTO generation VALUES(1)');db.close();
 fs.writeFileSync(path.join(application,'empireai-brain.db'),'unchanged primary fixture');
 const aof=path.join(redis,'appendonly.aof');fs.writeFileSync(aof,'retained Redis fixture');
 const child=spawn(process.execPath,['-e',`const fs=require('node:fs'),{DatabaseSync}=require('node:sqlite');const [signal,done,filename]=process.argv.slice(1);const timer=setInterval(()=>{if(!fs.existsSync(signal))return;clearInterval(timer);const db=new DatabaseSync(filename);db.exec('UPDATE generation SET value=2');db.close();fs.writeFileSync(done,'committed');},5);setTimeout(()=>process.exit(2),10000).unref();`,signal,done,finance],{stdio:['ignore','ignore','pipe']});
 let spawnError;
 const exited=new Promise(resolve=>{child.once('error',error=>{spawnError=error;resolve({error:String(error)});});child.once('exit',(code,signal)=>resolve({code,signal}));});
 child.stderr.resume();
 const read=fs.readFileSync;let reads=0,injected=false;
 const options={acknowledgement:ACK,buildSha:'a'.repeat(40),applicationRoot:application,redisRoot:redis,destination:path.join(root,'refused'),shutdownReceiptSha256:'b'.repeat(64)};
 try{
  fs.readFileSync=function(file,...args){
   if(file===aof&&++reads===2){
    injected=true;fs.writeFileSync(signal,'commit finance after application verification');
    const deadline=Date.now()+8000;
    while(!fs.existsSync(done)){if(Date.now()>deadline)throw Error('WRITER_BARRIER_TIMEOUT');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,5);}
   }
   return read.call(fs,file,...args);
  };
  assert.throws(()=>backup(options),/Source changed during backup/);
  assert.equal(injected,true);
  assert.equal(fs.existsSync(path.join(options.destination,'manifest.json')),false);
  fs.readFileSync=read;
  assert.deepEqual(await exited,{code:0,signal:null});
  const next={...options,destination:path.join(root,'stable')};const captured=backup(next);
  const restored=restore({acknowledgement:ACK,buildSha:options.buildSha,bundle:next.destination,destination:path.join(root,'restored'),manifestSha256:captured.manifestSha256});
  const check=new DatabaseSync(path.join(restored.applicationRoot,'finance','evidence.sqlite'),{readOnly:true});
  try{assert.equal(check.prepare('SELECT value FROM generation').get().value,2);}finally{check.close();}
 }finally{fs.readFileSync=read;if(!spawnError&&child.pid&&child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');await exited;fs.rmSync(root,{recursive:true,force:true});}
});
test('permanent profile is explicit, isolated, allows only bounded inference and named intelligence credentials and has no canary expiry',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'locked-profile-'));
 const env={EMPIRE_RUNTIME_PROFILE:PROFILE,RAILWAY_VOLUME_MOUNT_PATH:root,DATABASE_PATH:path.join(root,'commissioning','empireai-brain.db'),FOUNDER_EMAIL:'a@example.invalid',ADMIN_EMAIL:'b@example.invalid',FOUNDER_PASSWORD:'a'.repeat(32),ADMIN_PASSWORD:'b'.repeat(32),SESSION_SECRET:'c'.repeat(40),EMPIRE_LOCKED_REDIS_HOST:'redis.railway.internal',REDIS_URL:'redis://default:isolated@redis.railway.internal:6379/0'};
 try{const actual=configuration(env);assert.equal(actual.EMPIRE_RUNTIME_PROFILE,PROFILE);assert.equal(configuration({...env,RAILWAY_PUBLIC_DOMAIN:'twin.example.invalid'}).ASSURANCE_RUNTIME_ORIGIN,'https://twin.example.invalid');assert.equal(configuration({...env,ASSURANCE_RUNTIME_ORIGIN:'https://explicit.example.invalid'}).ASSURANCE_RUNTIME_ORIGIN,'https://explicit.example.invalid');assert.throws(()=>configuration({...env,ASSURANCE_RUNTIME_ORIGIN:'http://unsafe.example.invalid'}),/Invalid Assurance/);assert.equal(actual.LIVE_CJ_FULFILLMENT_ENABLED,'false');assert.equal(actual.EMPIRE_CANARY_EXPIRES_AT,undefined);const inference=configuration({...env,OPENAI_API_KEY:'offline-test-key'});assert.equal(inference.OPENAI_API_KEY,'offline-test-key');assert.equal(inference.DEFAULT_LLM_MODEL,'gpt-6.1-sol');assert.equal(inference.EMPIRE_ENGINEERING_TEST_MODE,'true');assert.equal(inference.COMMERCE_READINESS_BLOCKED,'true');assert.equal(inference.LIVE_PAYMENT_ENABLED,'false');assert.equal(configuration({...env,ANTHROPIC_API_KEY:'offline-claude'}).ANTHROPIC_API_KEY,'offline-claude');assert.equal(configuration({...env,GOOGLE_AI_API_KEY:'offline-google'}).GOOGLE_AI_API_KEY,'offline-google');assert.throws(()=>configuration({...env,AMAZON_REFRESH_TOKEN:'forbidden'}));assert.throws(()=>configuration({...env,DATABASE_PATH:'/data/empireai-brain.db'}));assert.throws(()=>configuration({...env,EMPIRE_CANARY_EXPIRES_AT:new Date().toISOString()}));}finally{fs.rmSync(root,{recursive:true});}
});
test('permanent supervisor has no expiry and still forwards controlled shutdown',async()=>{
 let pid;const result=await runBounded({command:process.execPath,args:['-e',"process.on('SIGTERM',()=>process.exit(0));console.log('ready');setInterval(()=>{},1000)"],env:{PATH:process.env.PATH},cwd:process.cwd(),expiresAt:null,stdio:['ignore','pipe','ignore'],onSpawn:child=>{pid=child.pid;child.stdout.once('data',()=>setTimeout(()=>process.emit('SIGTERM'),200));}});
 assert.ok(pid);assert.equal(result.code,0);assert.equal(result.reason,'signal');assert.equal(result.forcedTermination,false);
});

test('Work4 launcher forwards only named sensing credentials and explicit switches; commerce remains locked',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'locked-eyes-'));
 const env={EMPIRE_RUNTIME_PROFILE:PROFILE,RAILWAY_VOLUME_MOUNT_PATH:root,DATABASE_PATH:path.join(root,'commissioning','empireai-brain.db'),FOUNDER_EMAIL:'a@example.invalid',ADMIN_EMAIL:'b@example.invalid',FOUNDER_PASSWORD:'a'.repeat(32),ADMIN_PASSWORD:'b'.repeat(32),SESSION_SECRET:'c'.repeat(40),EMPIRE_LOCKED_REDIS_HOST:'redis.railway.internal',REDIS_URL:'redis://default:isolated@redis.railway.internal:6379/0',INTELLIGENCE_ENABLED:'true',INTELLIGENCE_DISABLED:'false',AMAZON_SP_API_CLIENT_ID:'test-client',AMAZON_SP_API_CLIENT_SECRET:'test-secret',AMAZON_SP_API_REFRESH_TOKEN:'test-refresh',AMAZON_SP_API_REGION:'NA',CJ_API_KEY:'test-cj',LIVE_CJ_FULFILLMENT_ENABLED:'true',LIVE_PAYMENT_ENABLED:'true',META_ADS_LAUNCH_ENABLED:'true'};
 try{const actual=configuration(env);for(const key of ['INTELLIGENCE_ENABLED','INTELLIGENCE_DISABLED','AMAZON_SP_API_CLIENT_ID','AMAZON_SP_API_CLIENT_SECRET','AMAZON_SP_API_REFRESH_TOKEN','AMAZON_SP_API_REGION','CJ_API_KEY'])assert.equal(actual[key],env[key]);for(const key of ['LIVE_CJ_FULFILLMENT_ENABLED','LIVE_PAYMENT_ENABLED','META_ADS_LAUNCH_ENABLED','PRODUCTION_DEPLOYMENT_ENABLED'])assert.equal(actual[key],'false');assert.equal(actual.COMMERCE_READINESS_BLOCKED,'true');assert.equal(actual.EMPIRE_TIER0_ISOLATION,'true');assert.equal(actual.EMPIRE_ENABLE_EXTENSION_ROUTES,'false');assert.throws(()=>configuration({...env,STRIPE_SECRET_KEY:'unapproved'}));assert.throws(()=>configuration({...env,INTELLIGENCE_ENABLED:'yes'}));}finally{fs.rmSync(root,{recursive:true});}
});

test('whole-volume stopped bundle retains finance and commerce and restores legacy layout',()=>{
 const {ACK,backup,restore}=require('./locked-state-bundle.cjs');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'whole-volume-'));
 try{for(const nested of [false,true]){
  const source=path.join(root,nested?'volume':'legacy'),redis=path.join(root,nested?'redis-volume':'redis-legacy');fs.mkdirSync(source);fs.mkdirSync(redis);
  const primary=nested?'commissioning/empireai-brain.db':'empireai-brain.db';
  for(const file of [primary,...(nested?['finance/evidence.sqlite','commerce/runtime.sqlite']:[])]){fs.mkdirSync(path.dirname(path.join(source,file)),{recursive:true});fs.writeFileSync(path.join(source,file),'isolated opaque fixture '+file);}
  fs.writeFileSync(path.join(redis,'appendonly.aof'),'isolated Redis inventory fixture');
  const destination=source+'-backup',buildSha='a'.repeat(40);
  const result=backup({acknowledgement:ACK,buildSha,applicationRoot:source,redisRoot:redis,destination,shutdownReceiptSha256:'b'.repeat(64),...(nested?{primaryRelativePath:primary}:{})});
  const recovered=restore({acknowledgement:ACK,buildSha,bundle:destination,destination:source+'-restore',manifestSha256:result.manifestSha256});
  for(const entry of result.inventory.application)assert.equal(fs.readFileSync(path.join(recovered.applicationRoot,entry.path),'utf8'),fs.readFileSync(path.join(source,entry.path),'utf8'));
  if(nested)assert.equal(result.inventory.application.length,3);
  assert.throws(()=>backup({acknowledgement:ACK,buildSha,applicationRoot:source,redisRoot:redis,destination:source+'-bad',shutdownReceiptSha256:'b'.repeat(64),primaryRelativePath:'../escape'}),/Unsupported/);
 }}finally{fs.rmSync(root,{recursive:true,force:true});}
});

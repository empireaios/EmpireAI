import assert from 'node:assert/strict';
import {test} from 'node:test';
import {buildApp} from '../../app.js';
import {getDatabase,resetDatabaseInstance} from '../../brain/database.js';
import {configureValidationEnvironment} from '../harness.js';

test('production early-listen exposes authenticated nonmutating memory inventory without extension writes',async()=>{
 configureValidationEnvironment();
 const priorProfile=process.env.EMPIRE_RUNTIME_PROFILE,priorMode=process.env.EMPIRE_ENGINEERING_TEST_MODE;
 process.env.EMPIRE_RUNTIME_PROFILE='LOCKED_COMMISSIONING_V1';
 process.env.EMPIRE_ENGINEERING_TEST_MODE='true';
 const empire=await buildApp({earlyListen:true,pillowEnabled:false,startWorkers:false,startScheduler:false});
 try{
  assert.equal(empire.app.hasRoute({method:'GET',url:'/strategic-memory/memories'}),true,'inventory must exist before deferred extension registration');
  assert.equal(empire.app.hasRoute({method:'POST',url:'/strategic-memory/memories'}),false);
  assert.equal((await empire.app.inject({url:'/strategic-memory/memories'})).statusCode,401);
  const session=await empire.brain.sessionStore.create({id:'memory-owner',email:'memory-owner@example.test',name:'Owner',role:'founder',workspaceId:'ws_memory_owner'});
  const db=getDatabase();
  const snapshot=()=>JSON.stringify({schema:db.prepare('SELECT name,sql FROM sqlite_master ORDER BY name').all(),memories:db.prepare('SELECT * FROM strategic_memories ORDER BY memory_id').all(),lifecycle:db.prepare('SELECT * FROM strategic_memory_lifecycle ORDER BY lifecycle_id').all()});
  const before=snapshot();
  for(const url of ['/strategic-memory/memories','/strategic-memory/memories?workspaceId=foreign']){
   const result=await empire.app.inject({url,headers:{cookie:'empireai_session='+session.token}});
   assert.equal(result.statusCode,200,result.body);assert.deepEqual(result.json(),{memories:[],total:0});
   assert.equal(snapshot(),before);
  }
  const denied=await empire.app.inject({method:'POST',url:'/strategic-memory/memories',headers:{cookie:'empireai_session='+session.token},payload:{}});
  assert.equal(denied.statusCode,423);assert.equal(denied.json().commerce,'LOCKED');assert.equal(denied.json().birth,'NOT_BORN');
  assert.equal(snapshot(),before);
 }finally{
  await empire.shutdown();resetDatabaseInstance();
  if(priorProfile===undefined)delete process.env.EMPIRE_RUNTIME_PROFILE;else process.env.EMPIRE_RUNTIME_PROFILE=priorProfile;
  if(priorMode===undefined)delete process.env.EMPIRE_ENGINEERING_TEST_MODE;else process.env.EMPIRE_ENGINEERING_TEST_MODE=priorMode;
 }
});

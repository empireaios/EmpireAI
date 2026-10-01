import assert from 'node:assert/strict';
import { test } from 'node:test';
import Fastify from 'fastify';
import { installLockedCommissioning } from '../../runtime/locked-commissioning.js';
test('permanent locked profile denies commerce and Birth mutations before handlers',async()=>{
 const old={profile:process.env.EMPIRE_RUNTIME_PROFILE,engineering:process.env.EMPIRE_ENGINEERING_TEST_MODE};
 process.env.EMPIRE_RUNTIME_PROFILE='LOCKED_COMMISSIONING_V1';process.env.EMPIRE_ENGINEERING_TEST_MODE='true';
 const app=Fastify();installLockedCommissioning(app);let calls=0;
 const routes=['/amazon/publish','/amazon/inventory','/amazon/price','/cj/orders','/fulfilment','/pillow-commissioning/birth','/api/pillow/mission-runtime/execute'];
 for(const url of routes)app.post(url,async()=>{calls++;return{ok:true};});
 app.get('/health/ready',async()=>({ready:true}));
 try{for(const url of routes)assert.equal((await app.inject({method:'POST',url,payload:{approved:true,force:true}})).statusCode,423);assert.equal(calls,0);const health=(await app.inject('/health/ready')).json();assert.equal(health.operational,false);assert.equal(health.commerce,'LOCKED');assert.equal(health.birth,'NOT_BORN');}
 finally{await app.close();if(old.profile===undefined)delete process.env.EMPIRE_RUNTIME_PROFILE;else process.env.EMPIRE_RUNTIME_PROFILE=old.profile;if(old.engineering===undefined)delete process.env.EMPIRE_ENGINEERING_TEST_MODE;else process.env.EMPIRE_ENGINEERING_TEST_MODE=old.engineering;}
});

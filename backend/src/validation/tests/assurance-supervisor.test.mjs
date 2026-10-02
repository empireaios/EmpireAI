import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {superviseAssurance} from '../../../../deployment/assurance-supervisor.cjs';
test('collector and inspector restart independently and cannot receive provider or founder secrets',async()=>{
 const launched=[],events=[];
 const stop=superviseAssurance({cwd:'/safe',env:{PATH:'/bin',REDIS_URL:'redis-test',FOUNDER_PASSWORD:'never-forward',OPENAI_API_KEY:'never-forward'},retryMs:5,onEvent:e=>events.push(e),spawnImpl:(_exe,args,options)=>{const c=new EventEmitter();c.kill=()=>{c.killed=true;};launched.push({c,args,options});return c;}});
 try{
  assert.equal(launched.length,2);
  assert.equal(launched[0].options.env.REDIS_URL,'redis-test');assert.equal(launched[1].options.env.REDIS_URL,undefined);
  for(const x of launched){assert.equal(x.options.env.FOUNDER_PASSWORD,undefined);assert.equal(x.options.env.OPENAI_API_KEY,undefined);}
  launched[0].c.emit('exit',1,null);await new Promise(r=>setTimeout(r,20));
  assert.equal(launched.length,3);assert.match(launched[2].args[0],/permanent-worker/);assert.equal(launched[1].c.killed,undefined);
  stop();launched[2].c.emit('exit',0,null);await new Promise(r=>setTimeout(r,20));assert.equal(launched.length,3);assert.equal(launched[1].c.killed,true);
 }finally{stop();}
});

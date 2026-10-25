'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),net=require('node:net');
const {command}=require('./fixtures/runtime-graph-redis.cjs');
const encode=a=>'*'+a.length+'\r\n'+a.map(v=>'$'+Buffer.byteLength(v)+'\r\n'+v+'\r\n').join('');
async function server(t,handler){const s=net.createServer(handler);await new Promise(r=>s.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>s.close(r)));return 'redis://:work8-synthetic-only@127.0.0.1:'+s.address().port+'/0';}
test('graph fixture authenticates before PING and fragmented INFO readback',async t=>{
 const seen=[];const url=await server(t,s=>{let pending='',authed=false;s.on('data',b=>{pending+=b.toString();if(!authed){assert.equal(pending,encode(['AUTH','work8-synthetic-only']));seen.push('AUTH');pending='';authed=true;s.write('+OK\r\n');}else if(pending===encode(['PING'])){seen.push('PING');pending='';s.write('+PONG\r\n');}else if(pending===encode(['INFO','server'])){seen.push('INFO');pending='';const value='redis_version:7.4.2\r\nrun_id:'+ 'a'.repeat(40)+'\r\n';s.write('$'+Buffer.byteLength(value)+'\r\n'+value.slice(0,5));setImmediate(()=>s.write(value.slice(5)+'\r\n'));}});});
 assert.equal(await command(url,['PING']),'PONG');assert.match(await command(url,['INFO','server']),/run_id:a{40}/);assert.deepEqual(seen,['AUTH','PING','AUTH','INFO']);
});
test('graph fixture refuses auth failure without issuing requested command',async t=>{
 let requests=0;const url=await server(t,s=>s.on('data',b=>{requests++;assert.equal(b.toString(),encode(['AUTH','work8-synthetic-only']));s.write('-WRONGPASS synthetic\r\n');}));
 await assert.rejects(command(url,['PING']),/REDIS_EXAMINATION_REFUSED/);assert.equal(requests,1);
});
test('graph fixture refuses unrelated credentials, endpoints, database and writes before connection',()=>{
 for(const url of ['redis://:other@127.0.0.1/0','redis://127.0.0.1/0','redis://:work8-synthetic-only@example.com/0','redis://:work8-synthetic-only@127.0.0.1/1','redis://:work8-synthetic-only@127.0.0.1/0?x=1'])assert.throws(()=>command(url,['PING']),/ISOLATED_GRAPH_REDIS_ONLY/);
 assert.throws(()=>command('redis://:work8-synthetic-only@127.0.0.1/0',['SET','x','y']),/ISOLATED_GRAPH_REDIS_ONLY/);
});

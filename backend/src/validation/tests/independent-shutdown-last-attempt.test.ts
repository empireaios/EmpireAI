import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from 'node:net';
import { Redis } from 'ioredis';
import {
  configureChatRequestStore, acceptDurableChatRequestClaim, claimNextReasoningRequest,
  settleReasoningRequest, getChatRequest, dropChatRequestMemoryCacheForTests,
} from '../../runtime/pillow-chat-request-store.js';
import { runOneDurableReasoningAttempt, startDurableReasoningSweeper } from '../../runtime/pillow-durable-reasoning-worker.js';
import { createServer as createHttpServer } from 'node:http';

test('independent: planned shutdown on final permitted attempt retains full admitted job for restart', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'independent-empire-shutdown-'));
  const listener = createServer(); listener.listen(0, '127.0.0.1'); await once(listener, 'listening');
  const port = (listener.address() as {port:number}).port;
  await new Promise<void>(r => listener.close(() => r()));
  const redisProcess = spawn(process.env.PILLOW_TEST_REDIS_SERVER ?? 'redis-server', ['--bind','127.0.0.1','--port',String(port),'--dir',dir,'--save','','--appendonly','yes','--appendfsync','always'], {stdio:['ignore','pipe','pipe']});
  const redisExit = once(redisProcess, 'exit');
  await new Promise<void>((resolve,reject) => {
    let output=''; const timer=setTimeout(()=>reject(new Error('local Redis startup timeout')),5000);
    redisProcess.once('error', reject);
    redisProcess.stdout!.on('data',chunk=>{output+=String(chunk);if(output.includes('Ready to accept connections')){clearTimeout(timer);resolve();}});
  });
  const redis = new Redis(`redis://127.0.0.1:${port}`, {lazyConnect:true,maxRetriesPerRequest:0});
  try {
    await redis.connect(); configureChatRequestStore(redis,{requireRedisDurability:true});
    const originalInput = {kind:'reasoning' as const,bodyText:JSON.stringify({message:'Held final-attempt recovery case',history:['keep me']}),sessionToken:'test-only-no-external-session'};
    const accepted = await acceptDurableChatRequestClaim({sessionId:'review-conversation',message:'Held final-attempt recovery case',ownerId:'review-owner',workspaceId:'review-workspace',input:originalInput});
    for(let n=1;n<=2;n++){
      const claim=await claimNextReasoningRequest({owner:`earlier-${n}`,leaseMs:10000,maxAttempts:3});
      assert.equal(claim?.request.attemptCount,n);
      assert.equal(await settleReasoningRequest({requestId:accepted.request.requestId,leaseToken:claim!.request.leaseToken!,failureClass:'NETWORK',error:'preexisting transient failure',retryDelayMs:0,maxAttempts:3}),true);
    }
    const controller=new AbortController();
    let interruptedToken:number|undefined;
    await runOneDurableReasoningAttempt({owner:'planned-deployment',signal:controller.signal,maxAttempts:3,execute:async(job)=>{
      assert.equal(job.request.attemptCount,3);interruptedToken=job.request.leaseToken;
      controller.abort();return {ok:false,failureClass:'NETWORK',error:'planned deployment aborted proxy'};
    }});
    dropChatRequestMemoryCacheForTests();
    const retained=await getChatRequest(accepted.request.requestId);
    assert.equal(retained?.status,'RETRYABLE','planned deployment must not turn final admitted attempt into fatal failure');
    const recovered=await claimNextReasoningRequest({owner:'after-deployment',leaseMs:10000,maxAttempts:3});
    assert.ok(recovered,'interrupted job must remain claimable');
    assert.deepEqual(recovered.input,originalInput);
    assert.equal(recovered.request.attemptCount,3);
    assert.equal(await settleReasoningRequest({requestId:accepted.request.requestId,leaseToken:interruptedToken!,result:{message:'stale result'}}),false);
    assert.equal(await settleReasoningRequest({requestId:accepted.request.requestId,leaseToken:recovered.request.leaseToken!,result:{kind:'llm',message:'Held recovery complete'}}),true);
    assert.equal((await getChatRequest(accepted.request.requestId))?.status,'COMPLETED');
  } finally {
    configureChatRequestStore(null);dropChatRequestMemoryCacheForTests();redis.disconnect();
    redisProcess.kill('SIGTERM');await redisExit;await rm(dir,{recursive:true,force:true});
  }
});

test('independent: inability to durably release work during stop must propagate as shutdown failure', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'independent-empire-release-failure-'));
  const listener = createServer(); listener.listen(0, '127.0.0.1'); await once(listener, 'listening');
  const port = (listener.address() as {port:number}).port;
  await new Promise<void>(r => listener.close(() => r()));
  const redisProcess = spawn(process.env.PILLOW_TEST_REDIS_SERVER ?? 'redis-server', ['--bind','127.0.0.1','--port',String(port),'--dir',dir,'--save','','--appendonly','yes','--appendfsync','always'], {stdio:['ignore','pipe','pipe']});
  const redisExit = once(redisProcess, 'exit');
  await new Promise<void>((resolve,reject) => {
    let output=''; const timer=setTimeout(()=>reject(new Error('local Redis startup timeout')),5000);
    redisProcess.once('error', reject);
    redisProcess.stdout!.on('data',chunk=>{output+=String(chunk);if(output.includes('Ready to accept connections')){clearTimeout(timer);resolve();}});
  });
  const redis = new Redis(`redis://127.0.0.1:${port}`, {lazyConnect:true,maxRetriesPerRequest:0,enableOfflineQueue:false});
  const http=createHttpServer();http.listen(0,'127.0.0.1');await once(http,'listening');
  try {
    await redis.connect();configureChatRequestStore(redis,{requireRedisDurability:true});
    await acceptDurableChatRequestClaim({sessionId:'release-failure',message:'Held release outage case',ownerId:'review-owner',workspaceId:'review-workspace',input:{kind:'reasoning',bodyText:'{}',sessionToken:'test-only'}});
    const request=once(http,'request');
    const observedErrors:unknown[]=[];
    const stop=startDurableReasoningSweeper({owner:'release-failure-review',workerPort:(http.address() as {port:number}).port,ready:async()=>true,onError:e=>observedErrors.push(e)});
    await request;
    redis.disconnect();
    await assert.rejects(stop(),'stop cannot claim success when the durable release failed');
    assert.equal(observedErrors.length,1);
  } finally {
    configureChatRequestStore(null);dropChatRequestMemoryCacheForTests();redis.disconnect();
    http.closeAllConnections();await new Promise<void>(r=>http.close(()=>r()));
    redisProcess.kill('SIGTERM');await redisExit;await rm(dir,{recursive:true,force:true});
  }
});

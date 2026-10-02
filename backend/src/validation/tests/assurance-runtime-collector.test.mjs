import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRuntimeCollector} from '../../assurance/runtime-collector.mjs';
import {reconcileSnapshot} from '../../assurance/independent-assurance.mjs';
const revision='a'.repeat(40);
test('independent health observation detects revision and authority drift',async()=>{
 let drift=false;const paths=[];
 const collector=createRuntimeCollector({origin:'https://runtime.example',expectedRevision:revision,clock:()=>1000,fetchImpl:async(url,options)=>{paths.push(url);assert.equal(options.redirect,'error');return Response.json(url.endsWith('/live')?{deploy:{gitCommitSha:revision}}:{ready:true,birth:'NOT_BORN',commerce:drift?'UNLOCKED':'LOCKED',operational:false});}});
 assert.equal(reconcileSnapshot(await collector(),1000,50).status,'PASS');drift=true;assert.equal(reconcileSnapshot(await collector(),1000,50).status,'FAIL');assert.equal(paths.length,4);
});
test('missing fields, oversized responses, network failures and invalid targets never pass',async()=>{
 assert.throws(()=>createRuntimeCollector({origin:'http://runtime.example',expectedRevision:revision}));
 assert.throws(()=>createRuntimeCollector({origin:'https://user:secret@runtime.example',expectedRevision:revision}));
 const make=fetchImpl=>createRuntimeCollector({origin:'https://runtime.example',expectedRevision:revision,clock:()=>1000,fetchImpl});
 assert.equal(reconcileSnapshot(await make(async()=>Response.json({}))(),1000,50).status,'FAIL');
 await assert.rejects(make(async()=>new Response('x'.repeat(32769)))());
 await assert.rejects(make(async()=>{throw Error('offline');})());
});

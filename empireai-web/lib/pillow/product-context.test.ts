import test from 'node:test';import assert from 'node:assert/strict';
import {validProductReference,readProductContext,selectProduct} from './product-context';
const ref={missionId:'genuine-candidate',receiptDigest:'a'.repeat(64)};
test('client refuses forged identity fields, scopes comparisons and requires exact server readback',async()=>{
 assert.ok(validProductReference(ref));assert.equal(validProductReference({...ref,owner:'forged'}),false);assert.equal(validProductReference({...ref,receiptDigest:'short'}),false);
 const first={reference:ref,label:'Source product · SKU'},second={reference:{...ref,missionId:'second'},label:'Other · SKU2'};
 assert.deepEqual(selectProduct([first],second,false),[second]);assert.deepEqual(selectProduct([first],second,true),[first,second]);assert.throws(()=>selectProduct([first],{...second,reference:{...second.reference,sessionId:'other'}},true));
 assert.throws(()=>selectProduct(Array.from({length:4},(_,i)=>({...first,reference:{...ref,missionId:String(i)}})),second,true));
 const old=globalThis.fetch;try{globalThis.fetch=async()=>new Response(JSON.stringify({...first,grantsAuthority:false}),{status:200});assert.deepEqual(await readProductContext(ref),first);
 globalThis.fetch=async()=>new Response(JSON.stringify({...first,reference:{...ref,receiptDigest:'b'.repeat(64)},grantsAuthority:false}),{status:200});await assert.rejects(readProductContext(ref));
 globalThis.fetch=async()=>new Response('{}',{status:409});await assert.rejects(readProductContext(ref));
 }finally{globalThis.fetch=old;}
});

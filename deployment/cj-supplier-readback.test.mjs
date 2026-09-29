import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {PID,cents,runSupplierReadback} from './cj-supplier-readback.mjs';
const env={ISOLATED_PROVIDER_READBACK:'1',CJ_SUPPLIER_POINT_LIMIT:'30',CJ_CREDENTIAL_MODE:'MCP_DIRECT',VERIFY_CJ_DIRECT_TOKEN:'MCP@CJ123@CJ:SECRET-TOKEN-123456789'};
const product={pid:PID,productSku:'SKU',variants:[{pid:PID,vid:'1234567890123456789',variantSku:'SKU-V',variantSellPrice:'2.35'}]};
const inventory={variantInventories:[{vid:'1234567890123456789',inventory:[{countryCode:'CN',cjInventory:3,factoryInventory:999,totalInventory:1002,stock:[{stockId:'warehouse-1',inventory:3,factoryInventory:999}]}]}]};
async function fixture(fn){const root=mkdtempSync(join(tmpdir(),'cj-supplier-'));try{await fn(join(root,'evidence'));}finally{rmSync(root,{recursive:true,force:true});}}
function transport(values,calls){return async(url,init)=>{calls.push({url,method:init.method,body:init.body});assert.equal(init.redirect,'error');return new Response(JSON.stringify({code:200,result:true,requestId:'request-'+calls.length,data:values[calls.length-1]}));};}
test('three bounded read operations retain exact variant warehouse quote and restart latch',()=>fixture(async dir=>{
 const calls=[];const t=transport([product,inventory,[{logisticName:'carrier',logisticPrice:4.2,logisticAging:'5-10'}]],calls);
 const r=await runSupplierReadback(env,dir,{testTransport:t});assert.equal(r.status,'OBSERVED_NOT_QUALIFIED');assert.equal(r.pointsReserved,30);assert.deepEqual(calls.map(c=>c.method),['GET','GET','POST']);
 assert.deepEqual(JSON.parse(calls[2].body),{startCountryCode:'CN',endCountryCode:'US',storageIdList:['warehouse-1'],shippingMode:2,products:[{quantity:1,vid:'1234567890123456789'}]});
 assert.equal(r.selected.cjUnits,3);assert.equal(r.derived.costAndFreightSubtotals[0].cents,655);assert.equal(r.actualEconomics,null);assert.equal(r.qualificationAllowed,false);assert.equal(r.receipts[2].summary.options[0].taxesFeeCents,null);
 assert.doesNotMatch(readFileSync(join(dir,'receipt.json'),'utf8'),/SECRET-TOKEN-123456789/);assert.deepEqual(JSON.parse(readFileSync(join(dir,'receipt.json'))),r);
 await assert.rejects(runSupplierReadback(env,dir,{testTransport:t}),/EEXIST/);assert.equal(calls.length,3);
}));
test('factory stock, missing subwarehouse, mismatched VID and inconsistent aggregates do not trigger freight',async()=>{
 for(const change of [w=>{w.cjInventory=0;w.stock[0].inventory=0;},w=>{w.stock=null;},w=>{w.cjInventory=4;}])await fixture(async dir=>{
 const stock=structuredClone(inventory);change(stock.variantInventories[0].inventory[0]);const calls=[];
 const r=await runSupplierReadback(env,dir,{testTransport:transport([product,stock],calls)});assert.equal(r.status,'OBSERVED_NOT_QUALIFIABLE');assert.equal(calls.length,2);
 });
 await fixture(async dir=>{const stock=structuredClone(inventory);stock.variantInventories[0].vid='other';const calls=[];const r=await runSupplierReadback(env,dir,{testTransport:transport([product,stock],calls)});assert.equal(r.selected,null);assert.equal(calls.length,2);});
});
test('provider refusal and transport uncertainty never retry, completed response survives',()=>fixture(async dir=>{
 let calls=0;const r=await runSupplierReadback(env,dir,{testTransport:async()=>{calls++;return new Response(JSON.stringify({code:1600005,result:false,requestId:'failure-id',message:env.VERIFY_CJ_DIRECT_TOKEN}));}});
 assert.equal(calls,1);assert.equal(r.status,'FAILED_CLOSED');assert.equal(r.receipts[0].providerCode,1600005);assert.doesNotMatch(readFileSync(join(dir,'receipt.json'),'utf8'),/SECRET-TOKEN-123456789/);
}));
test('production rerun and point expansion refuse before a request',async()=>{
 for(const patch of [{RAILWAY_DEPLOYMENT_ID:'protected'},{NODE_ENV:'production'},{GITHUB_RUN_ATTEMPT:'2'},{CJ_SUPPLIER_POINT_LIMIT:'300'},{VERIFY_CJ_API_KEY:'other'}])await fixture(async dir=>{let calls=0;await assert.rejects(runSupplierReadback({...env,...patch},dir,{testTransport:()=>{calls++;}}));assert.equal(calls,0);});
});
test('decimal arithmetic and malformed price remain explicit; echoed token fails closed',async()=>{
 assert.equal(cents('0.29'),29);assert.equal(cents(2.35),235);for(const v of ['1-3','NaN',null,1.234,-1,'1e3'])assert.equal(cents(v),null);
 await fixture(async dir=>{const p=structuredClone(product);p.variants[0].variantSku=env.VERIFY_CJ_DIRECT_TOKEN;const calls=[];const r=await runSupplierReadback(env,dir,{testTransport:transport([p],calls)});assert.equal(r.failure,'SECRET_ECHO_REFUSED');assert.equal(calls.length,1);assert.doesNotMatch(readFileSync(join(dir,'receipt.json'),'utf8'),/SECRET-TOKEN-123456789/);});
});

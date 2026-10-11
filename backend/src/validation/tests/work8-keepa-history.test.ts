import assert from 'node:assert/strict';
import test from 'node:test';
import {normalizeKeepaHistory} from '../../intelligence/keepa-history.js';
const fixture = () => ({products:[{asin:'B000000001',domainId:1,csv:[[1,2000,2,-1],null,null,[1,300,2,250]]}],tokensLeft:20,tokensConsumed:1});
test('labelled history fixture preserves identity, units, missing-value sentinels and token observations',()=>{
 const v=normalizeKeepaHistory(fixture(),'B000000001',1);
 assert.deepEqual(v.priceHistory,[1,2000,2,-1]);assert.equal(v.tokensConsumed,1);
});
test('wrong product, marketplace and ambiguous response cannot become product evidence',()=>{
 assert.throws(()=>normalizeKeepaHistory(fixture(),'B000000002',1));
 assert.throws(()=>normalizeKeepaHistory(fixture(),'B000000001',2));
 const f=fixture();f.products.push(f.products[0]);assert.throws(()=>normalizeKeepaHistory(f,'B000000001',1));
});
test('malformed, unordered, empty histories and invalid token balances fail closed',()=>{
 for(const history of [[1], [2,20,1,10], [1,NaN], [-1,20]]) {
  const f=fixture();f.products[0].csv[0]=history;assert.throws(()=>normalizeKeepaHistory(f,'B000000001',1));
 }
 const f=fixture();f.products[0].csv=[];assert.throws(()=>normalizeKeepaHistory(f,'B000000001',1));
 const g=fixture();g.tokensLeft=-1;assert.throws(()=>normalizeKeepaHistory(g,'B000000001',1));
});
test('history bound preserves complete timestamp-value pairs',()=>{
 const f=fixture();f.products[0].csv[0]=Array.from({length:70},(_,i)=>[i,2000+i]).flat();
 const v=normalizeKeepaHistory(f,'B000000001',1);assert.equal(v.priceHistory.length,120);assert.deepEqual(v.priceHistory.slice(0,2),[10,2010]);
});

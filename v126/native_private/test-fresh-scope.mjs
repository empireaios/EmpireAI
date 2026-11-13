import assert from 'node:assert/strict';
import {allowedFreshRequest as allow} from './fresh-scope.mjs';
const path='/api/owner/commerce';
const good={action:'twin_lifecycle',transition:{id:'request.v126-1',sessionId:'session.v126-1',expectedVersion:0,action:'CREATE'}};
assert.equal(allow('POST',path,good),true);
const bad=[
 {...good,owner:'forged'},
 {...good,action:'commerce_unlock'},
 {...good,transition:{...good.transition,action:'RESUME'}},
 {...good,transition:{...good.transition,expectedVersion:1}},
 {...good,transition:{...good.transition,expectedVersion:'0'}},
 {...good,transition:{...good.transition,owner:'forged'}},
 {...good,transition:{...good.transition,sessionId:'../old'}},
 {...good,transition:{...good.transition,id:'x'.repeat(101)}},
 {...good,transition:[]},null,[]
];
for(const body of bad)assert.equal(allow('POST',path,body),false);
for(const p of ['/api//owner/commerce','/api/owner/%63ommerce','/api/owner/commerce/../commerce','/api/owner\\commerce'])assert.equal(allow('POST',p,good),false);
for(const method of ['DELETE','PUT','PATCH'])assert.equal(allow(method,path,good),false);
assert.equal(allow('POST','/api/owner/commerce/twin',good),false);
assert.equal(allow('GET','/api/owner/advisor/intelligence'),false);
assert.equal(allow('GET','/api/owner/commerce/twin?sessionId=session.v126-1'),true);
assert.equal(allow('GET','/auth/me'),true);
assert.equal(allow('POST','/auth/login',{email:'scope-unit@example.invalid',password:'test'}),true);
console.log(JSON.stringify({schema:'v126-additive-fresh-scope-tests-v1',status:'PASS',positiveCases:4,negativeCases:20,
 nativeApplicationStarted:false,originalAcceptanceClaimed:false}));

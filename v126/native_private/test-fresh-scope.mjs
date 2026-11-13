import assert from 'node:assert/strict';
import {allowedFreshRequest as allow} from './fresh-scope.mjs';
for(const p of ['/auth/me','/api/owner/commerce/portfolio','/api/owner/commerce/portfolio?page=1'])assert.equal(allow('GET',p),true);
for(const p of ['/auth/login','/auth/logout'])assert.equal(allow('POST',p),true);
for(const [m,p,b]of [['POST','/api/owner/commerce',{action:'twin_lifecycle',transition:{action:'CREATE'}}],['GET','/api/owner/commerce/twin'],['GET','/health/ready'],['GET','/api/owner/commerce/comparables'],['POST','/auth/refresh'],['GET','/auth/%6de'],['GET','//auth/me']])assert.equal(allow(m,p,b),false);
console.log(JSON.stringify({scope:'connector-read-only-additional-guard',checks:12,nativeAcceptance:false}));

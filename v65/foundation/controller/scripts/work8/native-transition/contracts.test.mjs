import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=name=>fs.readFileSync(new URL(name,import.meta.url),'utf8');
const observer=source('origin-observer.cjs'),examine=source('examine.py'),browser=source('browser.mjs');
function harness({writeFailure=false}={}){
 const lines=[];
 class NextRequest{
  constructor(url,headers){this.value=url;this.method='POST';this.headerMap=headers;this.headers={get:key=>{assert.ok(['origin','host','x-forwarded-host','x-forwarded-proto','x-forwarded-port'].includes(key),'unexpected header inspection');return headers[key]??null;}};}
  get url(){assert.ok(this instanceof NextRequest);return this.value;}
  get body(){throw Error('body inspection forbidden');}
 }
 const descriptor=Object.getOwnPropertyDescriptor(NextRequest.prototype,'url');
 const context={URL,Reflect,Object,JSON,Number,Error,require:path=>{assert.equal(path,'/frontend/node_modules/next/dist/server/web/spec-extension/request.js');return {NextRequest};},process:{version:'v22.23.2',env:{WORK8_OBSERVER_PHASE:'NORMAL',HOSTNAME:'localhost'},stdout:{write:value=>{if(writeFailure&&lines.length)throw Error('diagnostic write failed');lines.push(JSON.parse(value.slice('WORK8_ORIGIN_OBSERVER '.length)));}}}};
 vm.runInNewContext(observer,context);return {NextRequest,lines,descriptor};
}
test('observer preserves actual getter receiver, URL result and descriptor semantics',()=>{
 const {NextRequest,lines,descriptor}=harness();const headers={origin:'http://localhost:43117',host:'localhost:43117'};const req=new NextRequest('http://localhost:43117/api/owner/advisor/memory?do-not-log-query',headers);
 const before={...headers};assert.equal(req.url,req.value);assert.deepEqual(headers,before);const after=Object.getOwnPropertyDescriptor(NextRequest.prototype,'url');assert.equal(after.configurable,descriptor.configurable);assert.equal(after.enumerable,descriptor.enumerable);assert.equal(after.set,descriptor.set);assert.equal(lines[1].originEqualsRequestUrlOrigin,true);assert.equal(lines[1].requestUrlOrigin,'http://localhost:43117');assert.ok(!JSON.stringify(lines).includes('do-not-log-query'));
});
test('observer records hostile comparison without trusting or changing forwarded metadata',()=>{
 const {NextRequest,lines}=harness();const req=new NextRequest('http://localhost:43117/api/owner/advisor/memory',{origin:'http://localhost:43119',host:'localhost:43117','x-forwarded-host':'hostile.invalid','x-forwarded-proto':'https','x-forwarded-port':'443'});void req.url;assert.equal(lines[1].originEqualsRequestUrlOrigin,false);assert.equal(lines[1].forwardedMetadata.trust,'OBSERVED_ONLY_NO_TRUST_ADDED');assert.equal(lines[1].forwardedMetadata.host,'hostile.invalid');assert.equal(req.value,'http://localhost:43117/api/owner/advisor/memory');
});
test('observer refuses credential-shaped metadata, unrelated routes and excessive events',()=>{
 const {NextRequest,lines}=harness();void new NextRequest('http://localhost:43117/api/auth/login',{origin:'http://localhost:43117'}).url;assert.equal(lines.length,1);const req=new NextRequest('http://localhost:43117/api/owner/advisor/memory?session=secret-canary',{origin:'http://username:secret-canary@localhost:43117',host:'secret-canary value','x-forwarded-proto':'secret-canary','x-forwarded-port':'secret-canary'});for(let i=0;i<50;i++)void req.url;assert.equal(lines.length,41);assert.ok(!JSON.stringify(lines).includes('secret-canary'));assert.equal(lines[1].origin,'[OMITTED]');
});
test('observation failure cannot change the application getter result',()=>{
 const {NextRequest}=harness({writeFailure:true});const req=new NextRequest('http://localhost:43117/api/owner/advisor/memory',{origin:'http://localhost:43117'});assert.equal(req.url,req.value);
});
test('all three starts retain localhost IPv4-first with actual operand gating before writes',()=>{
 assert.ok(examine.includes("'--env','HOSTNAME=localhost'"));assert.ok(examine.includes('NODE_OPTIONS=--dns-result-order=ipv4first --require=/examination/origin-observer.cjs'));assert.ok(examine.includes("'--env','NODE_OPTIONS=--dns-result-order=ipv4first'"));assert.ok(!examine.includes('HOSTNAME=0.0.0.0'));
 for(const call of ["start_front('normal','NORMAL')","start_front('recovery','RECOVERY')","start_front('normal','NORMAL_RETURN')"])assert.ok(examine.includes(call));
 assert.ok(examine.indexOf("marker('origin-preflight-complete.json');capture_frontend_origin(require_contract=True)")<examine.indexOf("marker('normal-complete.json')"));assert.ok(examine.includes('ACTUAL_SAME_ORIGIN_OPERANDS_NOT_OBSERVED'));assert.ok(examine.includes('ACTUAL_HOSTILE_ORIGIN_OPERANDS_NOT_OBSERVED'));assert.ok(examine.includes('LOCALHOST_IPV4_LISTENER_NOT_ESTABLISHED'));
});
test('bootstrap completion and real login form precede login; later phases preserve owner context',()=>{
 assert.ok(browser.includes("target.waitForResponse(r=>new URL(r.url()).pathname==='/api/auth/me'"));assert.ok(browser.includes('await response.finished()'));assert.ok(browser.includes("getByRole('button',{name:'Enter EmpireAI',exact:true})"));assert.ok(browser.includes("await button.waitFor({state:'visible',timeout:60000})"));assert.ok(browser.indexOf("initializationBarrier(page,'NORMAL')")<browser.indexOf("api('/api/auth/login'"));
 for(const phase of ['RECOVERY','NORMAL_RETURN'])assert.ok(browser.includes("await phaseInitialization('"+phase+"')"));assert.ok(browser.includes("mechanism:'AUTHENTICATED_READBACK_BARRIER'"));assert.ok(!browser.includes('initializationBarrier(page,phase'));assert.equal((browser.match(/api\('\/api\/auth\/login'/g)||[]).length,1);assert.ok(browser.includes("assert.equal(initialSession.sameSite,'Lax')"));assert.ok(browser.includes("form.method='POST'"));assert.ok(browser.includes("name:'Submit invalid origin probe'"));assert.ok(!browser.includes('setExtraHTTPHeaders'));
});

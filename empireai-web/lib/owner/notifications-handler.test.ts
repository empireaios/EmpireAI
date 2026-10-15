import test from 'node:test';import assert from 'node:assert/strict';import {ownerNotifications} from './notifications-handler';
test('authenticated owner inbox proxy keeps fixed scope and bounded notice-only actions',async()=>{
 const oldFetch=globalThis.fetch,oldUrl=process.env.BRAIN_API_URL;process.env.BRAIN_API_URL='http://127.0.0.1:4000';const seen:{url:string;init?:RequestInit}[]=[];globalThis.fetch=async(url,init)=>{seen.push({url:String(url),init});return Response.json({notifications:[],hasMore:false,nextCursor:null});};
 const req=(method:string,body?:unknown,extra:Record<string,string>={},query='')=>new Request('https://owner.example/api/owner/notifications'+query,{method,headers:{cookie:'empireai_session=fixture-session',origin:'https://owner.example','content-type':'application/json',...extra},body:body===undefined?undefined:JSON.stringify(body)});
 try{
  assert.equal((await ownerNotifications(req('GET',undefined,{cookie:''}))).status,401);
  for(const q of ['?companyId=other','?after=a&after=b'])assert.equal((await ownerNotifications(req('GET',undefined,{},q))).status,400);
  assert.equal((await ownerNotifications(req('POST',{action:'sync'},{origin:'https://other.example'}))).status,403);
  for(const b of [{action:'sync',companyId:'other'},{action:'acknowledge',notificationId:'../control'},{action:'acknowledge',notificationId:'.'},{action:'acknowledge',notificationId:'..'},{action:'approve',incidentId:'x'}])assert.equal((await ownerNotifications(req('POST',b))).status,400);assert.equal(seen.length,0);
  const got=await ownerNotifications(req('GET',undefined,{},'?after=notice-25'));assert.equal(got.status,200);assert.equal(got.headers.get('cache-control'),'private, no-store');const url=new URL(seen[0]!.url);assert.equal(url.pathname,'/global-notifications');assert.deepEqual(Object.fromEntries(url.searchParams),{companyId:'co-grand-king',source:'assurance',limit:'25',after:'notice-25'});assert.equal(new Headers(seen[0]!.init?.headers).get('cookie'),'empireai_session=fixture-session');
  assert.equal((await ownerNotifications(req('POST',{action:'sync',assuranceAfter:'inc-100'}))).status,200);assert.ok(seen[1]!.url.endsWith('/global-notifications/sync'));assert.deepEqual(JSON.parse(String(seen[1]!.init?.body)),{companyId:'co-grand-king',assuranceAfter:'inc-100'});
  assert.equal((await ownerNotifications(req('POST',{action:'acknowledge',notificationId:'notice-25'}))).status,200);assert.ok(seen[2]!.url.endsWith('/global-notifications/notice-25/acknowledge'));assert.deepEqual(JSON.parse(String(seen[2]!.init?.body)),{companyId:'co-grand-king'});
  assert.equal((await ownerNotifications(req('POST',{action:'sync',assuranceAfter:'x'.repeat(5000)}))).status,413);assert.equal(seen.length,3);
 }finally{globalThis.fetch=oldFetch;if(oldUrl===undefined)delete process.env.BRAIN_API_URL;else process.env.BRAIN_API_URL=oldUrl;}
});

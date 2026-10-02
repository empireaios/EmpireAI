import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ownerOverviewGET} from './route-handler';
test('saved owner evidence requires founder session in the owner workspace; no provider access',async()=>{
 const original=globalThis.fetch,old=process.env.BRAIN_API_URL,vercel=process.env.VERCEL;
 process.env.BRAIN_API_URL='http://127.0.0.1:4444';delete process.env.VERCEL;
 let calls=0;let role='operator',workspaceId='ws_empire_1';let status=200;
 globalThis.fetch=(async(input,init)=>{calls++;assert.equal(String(input),'http://127.0.0.1:4444/auth/me');assert.equal(init?.method,'GET');assert.equal(init?.cache,'no-store');return Response.json({user:{role,workspaceId}},{status});}) as typeof fetch;
 const url='http://localhost/api/owner/overview',headers={cookie:'empireai_session=offline'};
 try{
  assert.equal((await ownerOverviewGET(new Request(url))).status,401);
  assert.equal((await ownerOverviewGET(new Request(url+'?workspaceId=other',{headers}))).status,400);assert.equal(calls,0);
  assert.equal((await ownerOverviewGET(new Request(url,{headers}))).status,403);
  role='founder';workspaceId='other';assert.equal((await ownerOverviewGET(new Request(url,{headers}))).status,403);
  workspaceId='ws_empire_1';const ok=await ownerOverviewGET(new Request(url,{headers}));assert.equal(ok.status,200);assert.match(ok.headers.get('cache-control')??'',/no-store/);
  const data=await ok.json();assert.equal(data.authority.approvalAllowed,false);assert.equal(data.candidates.filter((c:{qualified:boolean})=>c.qualified).length,0);assert.equal(data.mode,'HISTORICAL_PROVIDER_EVIDENCE');
  status=401;assert.equal((await ownerOverviewGET(new Request(url,{headers}))).status,401);
  status=500;assert.equal((await ownerOverviewGET(new Request(url,{headers}))).status,503);
 }finally{globalThis.fetch=original;if(old===undefined)delete process.env.BRAIN_API_URL;else process.env.BRAIN_API_URL=old;if(vercel===undefined)delete process.env.VERCEL;else process.env.VERCEL=vercel;}
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GET} from '../../app/api/owner/orders/route';
test('stored orders require owner scope and issue only a fixed read, never sync',async()=>{
 const original=globalThis.fetch,old=process.env.BRAIN_API_URL,vercel=process.env.VERCEL;
 process.env.BRAIN_API_URL='http://127.0.0.1:4444';delete process.env.VERCEL;
 let role='operator',workspaceId='ws_empire_1';const calls:string[]=[];
 globalThis.fetch=(async(input,init)=>{const url=String(input);calls.push(url);assert.equal(init?.method,'GET');assert.equal(init?.cache,'no-store');
 if(url.endsWith('/auth/me'))return Response.json({user:{role,workspaceId}});
 assert.equal(url,'http://127.0.0.1:4444/commerce/amazon-us/orders/imported');return Response.json({providerId:'amazon-us',orders:[],importStatus:null,commerceEffect:'none'});
 }) as typeof fetch;
 const url='http://localhost/api/owner/orders',headers={cookie:'empireai_session=offline'};
 try{
 assert.equal((await GET(new Request(url))).status,401);assert.equal(calls.length,0);
 assert.equal((await GET(new Request(url+'?workspaceId=other',{headers}))).status,400);
 assert.equal((await GET(new Request(url,{headers}))).status,403);
 role='founder';workspaceId='other';assert.equal((await GET(new Request(url,{headers}))).status,403);
 workspaceId='ws_empire_1';const response=await GET(new Request(url,{headers}));assert.equal(response.status,200);assert.match(response.headers.get('cache-control')??'',/private, no-store/);assert.equal(calls.filter(x=>x.includes('/commerce/')).length,1);
 }finally{globalThis.fetch=original;if(old===undefined)delete process.env.BRAIN_API_URL;else process.env.BRAIN_API_URL=old;if(vercel===undefined)delete process.env.VERCEL;else process.env.VERCEL=vercel;}
});

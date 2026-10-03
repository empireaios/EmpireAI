import {test} from 'node:test';
import assert from 'node:assert/strict';
import {memoryReadPreservingRevision,summarizeMemoryEvidence} from './memory-evidence';
import {GET} from '../../app/api/owner/memory/route';
const record={memoryId:'m1',workspaceId:'ws_empire_1',category:'failures',status:'ACTIVE',source:'secret-source',insight:'secret-insight',metadata:{token:'secret-token'},updatedAt:'2026-10-03T10:00:00Z'};
test('memory inventory exposes scoped aggregate lifecycle metadata, never private content',()=>{
 const summary=summarizeMemoryEvidence({memories:[record,{...record,memoryId:'m2',status:'SUPERSEDED',source:''}],total:2});
 assert.equal(summary.total,2);assert.equal(summary.active,1);assert.equal(summary.superseded,1);assert.equal(summary.archived,0);assert.equal(summary.withSource,1);assert.equal(summary.byCategory.failures,2);
 assert.doesNotMatch(JSON.stringify(summary),/secret|m1|m2/);
 for(const invalid of [{memories:[record],total:2},{memories:[record,record],total:2},...['workspaceId','status','category','updatedAt'].map(key=>({memories:[{...record,[key]:'invalid'}],total:1}))])assert.throws(()=>summarizeMemoryEvidence(invalid));
 assert.equal(summarizeMemoryEvidence({memories:[],total:0}).latestChange,null);
});
test('memory inspection requires owner scope and read-preserving release before any memory call',async()=>{
 const original=globalThis.fetch,old=process.env.BRAIN_API_URL,vercel=process.env.VERCEL;
 process.env.BRAIN_API_URL='http://127.0.0.1:4444';delete process.env.VERCEL;
 let role='founder',workspaceId='ws_empire_1',revision='3605c4202dae07ab8a41aed0c202e2f48aa1eacb';const calls:string[]=[];
 globalThis.fetch=(async(input,init)=>{const url=String(input);calls.push(url);assert.equal(init?.method,'GET');assert.equal(init?.cache,'no-store');
 if(url.endsWith('/auth/me'))return Response.json({user:{role,workspaceId}});
 if(url.endsWith('/health/live'))return Response.json({deploy:{gitCommitSha:revision}});
 assert.equal(url,'http://127.0.0.1:4444/strategic-memory/memories');return Response.json({memories:[record],total:1});
 }) as typeof fetch;
 const url='http://localhost/api/owner/memory',headers={cookie:'empireai_session=offline'};
 try{
 assert.equal((await GET(new Request(url))).status,401);assert.equal(calls.length,0);
 assert.equal((await GET(new Request(url+'?workspaceId=other',{headers}))).status,400);
 role='operator';assert.equal((await GET(new Request(url,{headers}))).status,403);
 role='founder';workspaceId='other';assert.equal((await GET(new Request(url,{headers}))).status,403);
 workspaceId='ws_empire_1';assert.equal((await GET(new Request(url,{headers}))).status,503);assert.equal(calls.some(x=>x.includes('/strategic-memory/')),false);
 revision=memoryReadPreservingRevision;const response=await GET(new Request(url,{headers}));assert.equal(response.status,200);assert.match(response.headers.get('cache-control')??'',/private, no-store/);assert.doesNotMatch(await response.text(),/secret/);
 }finally{globalThis.fetch=original;if(old===undefined)delete process.env.BRAIN_API_URL;else process.env.BRAIN_API_URL=old;if(vercel===undefined)delete process.env.VERCEL;else process.env.VERCEL=vercel;}
});

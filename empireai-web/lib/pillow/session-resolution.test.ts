import test from 'node:test';import assert from 'node:assert/strict';
import {resolvePillowConversation} from './session-resolution';
import {PillowRequestError} from './client';

test('navigation, focus and send reuse authenticated history; archives and stale IDs resolve without trusting cache',async()=>{
 const original=globalThis.fetch,windowDescriptor=Object.getOwnPropertyDescriptor(globalThis,'window');
 Object.defineProperty(globalThis,'window',{configurable:true,value:{location:{origin:'https://owner.example.invalid'}}});
 let creates=0,reads=0,readStatus=200,workspace='ws',archiveAcknowledged=true;const archivePayloads:unknown[]=[];
 const session={sessionId:'canonical',workspaceId:'ws',conversationHistory:[],approvalState:'none',repositoryFingerprint:'fixture',currentMission:null,tokenUsage:{promptTokens:0,completionTokens:0,totalTokens:0,requestCount:0},createdAt:'2026-10-18T00:00:00Z',updatedAt:'2026-10-18T00:00:00Z'};
 globalThis.fetch=async(input,init)=>{
  const url=new URL(String(input),'https://owner.example.invalid');
  assert.equal(init?.credentials,'include');
  if(url.pathname==='/api/pillow/session'){
   creates++;const body=JSON.parse(String(init?.body));assert.equal(body.workspaceId,'ws');
   if(body.historicalBrowserTurns)archivePayloads.push(body.historicalBrowserTurns);
   return Response.json({session,historicalArchiveAccepted:archiveAcknowledged&&!!body.historicalBrowserTurns?.length},{status:201});
  }
  assert.equal(url.pathname,'/api/pillow/history');reads++;
  if(readStatus!==200)return Response.json({error:'Read refused'},{status:readStatus});
  return Response.json({...session,workspaceId:workspace,history:[{role:'user',content:'Server context',timestamp:session.createdAt,productContext:{source:'bound',grantsAuthority:false}}],historicalArchive:[]});
 };
 try{
  const bootstraps=await Promise.all(Array.from({length:6},()=>resolvePillowConversation({ownerId:'owner',workspaceId:'ws'})));
  const first=bootstraps[0]!;assert.ok(bootstraps.every(value=>value===first));assert.equal(creates,1,'concurrent bootstrap/navigation resolutions coalesce through history read');
  // A cancelled route need not persist its snapshot: a later mount still uses
  // the authenticated hint and reads history rather than creating again.
  assert.equal((await resolvePillowConversation({ownerId:'owner',workspaceId:'ws'})).session.sessionId,'canonical');assert.equal(creates,1);
  for(const surface of ['products','listings','orders','focus','send','followup','products','focus']){
   const resolved=await resolvePillowConversation({ownerId:'owner',workspaceId:'ws',cachedSessionId:first.session.sessionId});
   assert.equal(resolved.session.sessionId,'canonical',surface);assert.deepEqual(resolved.session.conversationHistory,first.session.conversationHistory);
  }
  assert.equal(creates,1,'repeated navigation/focus/send uses no additional creation budget');assert.equal(reads,10);
  readStatus=403;await assert.rejects(()=>resolvePillowConversation({ownerId:'foreign',workspaceId:'ws',cachedSessionId:'canonical'}),e=>e instanceof PillowRequestError&&e.status===403);assert.equal(creates,1);
  readStatus=200;workspace='foreign';await assert.rejects(()=>resolvePillowConversation({ownerId:'owner',workspaceId:'ws',cachedSessionId:'forged'}),/history unavailable/);assert.equal(creates,1);
  await assert.rejects(()=>resolvePillowConversation({ownerId:'owner',workspaceId:'ws',cachedSessionId:'canonical'}),/workspace mismatch/);assert.equal(creates,1);
  workspace='ws';const turns=[{role:'user' as const,content:'Local unverified turn',timestamp:session.createdAt}];
  const restored=await resolvePillowConversation({ownerId:'owner',workspaceId:'ws',cachedSessionId:'canonical',historicalBrowserTurns:turns});assert.equal(creates,2);assert.deepEqual(archivePayloads,[turns]);assert.deepEqual(restored.session.conversationHistory,first.session.conversationHistory);
  archiveAcknowledged=false;await assert.rejects(()=>resolvePillowConversation({ownerId:'owner',workspaceId:'ws',cachedSessionId:'canonical',historicalBrowserTurns:turns}),/archive is not ready/);
  archiveAcknowledged=true;const before=creates;let missing=true;const successfulFetch=globalThis.fetch;
  globalThis.fetch=async(input,init)=>{if(missing&&String(input).includes('history')){missing=false;return Response.json({error:'Session not found'},{status:404});}return successfulFetch(input,init);};
  assert.equal((await resolvePillowConversation({ownerId:'owner',workspaceId:'ws',cachedSessionId:'obsolete'})).session.sessionId,'canonical');assert.equal(creates,before+1);
 }finally{globalThis.fetch=original;if(windowDescriptor)Object.defineProperty(globalThis,'window',windowDescriptor);else Reflect.deleteProperty(globalThis,'window');}
});

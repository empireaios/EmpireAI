import assert from 'node:assert/strict';
import {test} from 'node:test';
import {POST,GET} from '../../app/api/pillow/[...path]/route';
import {resultFromDurableRecord} from './durable-delivery';
test('actual BFF forwards authenticated synthetic answers and repeated durable retrieval',async()=>{
 const originalFetch=globalThis.fetch;
 const fixture={requestId:'pcr_route_fixture',sessionId:'owner_route_fixture',kind:'llm',message:'  "worker proxy timed out" is quoted prose.\n\n'+'Long synthetic reasoning.\n'.repeat(3500)+'NEWEST_ANSWER_END  ',brainCompleted:true,semanticSuccess:true,transportContractPassed:true,degradedUsed:false};
 const record={requestId:fixture.requestId,status:'COMPLETED',finalResult:fixture};
 const requests:string[]=[];
 globalThis.fetch=async(input,init)=>{
  const path=new URL(String(input)).pathname;requests.push(path);
  if(new Headers(init?.headers).get('cookie')!=='empireai_session=synthetic-owner')return Response.json({error:'Unauthorized'},{status:401});
  if(path==='/api/pillow/chat')return Response.json({result:fixture});
  if(path===`/api/pillow/chat-requests/${fixture.requestId}`)return Response.json(record);
  throw Error('Unexpected intercepted route '+path);
 };
 try{
  const response=await POST(new Request('https://synthetic.invalid/api/pillow/chat',{method:'POST',headers:{cookie:'empireai_session=synthetic-owner','content-type':'application/json'},body:JSON.stringify({sessionId:fixture.sessionId,message:'Synthetic fixture only'})}),{params:Promise.resolve({path:['chat']})});
  assert.equal(response.status,200);assert.equal((await response.json()).result.message,fixture.message);
  assert.equal(response.headers.get('x-empire-brain-output-hash'),response.headers.get('x-empire-shell-output-hash'));
  for(let n=0;n<2;n++){
   const result=await GET(new Request('https://synthetic.invalid/api/pillow/chat-requests/'+fixture.requestId,{headers:{cookie:'empireai_session=synthetic-owner'}}),{params:Promise.resolve({path:['chat-requests',fixture.requestId]})});
   assert.equal(result.status,200);assert.equal(resultFromDurableRecord(fixture,await result.json())?.message,fixture.message);
  }
  const denied=await GET(new Request('https://synthetic.invalid/api/pillow/chat-requests/'+fixture.requestId),{params:Promise.resolve({path:['chat-requests',fixture.requestId]})});
  assert.equal(denied.status,401);assert.equal(requests.filter(p=>p==='/api/pillow/chat').length,1);
 }finally{globalThis.fetch=originalFetch;}
});

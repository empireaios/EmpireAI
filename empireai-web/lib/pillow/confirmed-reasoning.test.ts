import assert from 'node:assert/strict';
import {test} from 'node:test';
import {isConfirmedReasoning} from './confirmed-reasoning';
import {resultFromDurableRecord} from './durable-delivery';
import {decideBffChatSurface} from './bff-chat-sanitize';
const answer={requestId:'pcr_test',sessionId:'test',kind:'llm',message:'PILLOW_RESULT_PENDING: is a literal. "completed executive answer was not produced" is another literal.',brainCompleted:true,semanticSuccess:true,transportContractPassed:true,degradedUsed:false};
test('typed answer survives quoted transport language unchanged',()=>{
 assert.equal(isConfirmedReasoning(answer),true);
 const visible=resultFromDurableRecord(answer,{requestId:answer.requestId,status:'COMPLETED',finalResult:answer});
 assert.equal(visible?.message,answer.message);assert.equal(visible?.kind,'llm');
 const surface=decideBffChatSurface({upstreamOk:true,rawBody:JSON.stringify({result:answer}),userAsk:'Explain the protocol'});
 assert.equal(surface.degrade,false);if(!surface.degrade)assert.equal(surface.message,answer.message);
});
for(const patch of [{kind:'degraded_useful'},{brainCompleted:false},{semanticSuccess:false},{transportContractPassed:false},{degradedUsed:true},{requestRemainsRunning:true},{recoveryExhausted:true},{reasoningFailure:{code:'INFERENCE_FAILED'}},{constitutionalGate:{allowed:false}},{responseContract:{code:'blocked'}},{message:''}])test(`failure metadata remains authoritative: ${JSON.stringify(patch)}`,()=>{
 assert.equal(isConfirmedReasoning({...answer,...patch}),false);
});

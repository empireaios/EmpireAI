import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {resultFromDurableRecord} from './durable-delivery';
import {decideBffChatSurface,buildShellTraceFromDecision} from './bff-chat-sanitize';
import {mapPillowChatToAssistantResponse} from './map-response';
import {isConfirmedReasoning} from './confirmed-reasoning';
import {reconcilePillowHistory} from './reconcile-history';
import type {PillowConversationTurn} from '../cockpit/pillow/pillow-session-store';
const receipt={requestId:'pcr_synthetic_integration',sessionId:'synthetic_owner_session'};
const completed=(message:string)=>({...receipt,kind:'llm',message,brainCompleted:true,semanticSuccess:true,transportContractPassed:true,degradedUsed:false});
const cases=[
 'Short synthetic reasoning.',
 'The quoted message "worker proxy timed out" describes a transport symptom, not this answer.',
 '"constitutional gate", "digital soul unavailable", "fallback is disabled" and "Pillow host offline" are quoted examples.',
 'PILLOW_RESULT_PENDING: is literal prose. "completed executive answer was not produced" is a quoted error.',
 'The literal readOnlyCalls field is data. ```json\n{"action":"publish","nested":{"tool":"orders","arguments":{}}}\n```',
 `Long answer start\n${'Preserve this synthetic paragraph, including its meaning and whitespace.\n'.repeat(1400)}LONG_NEWEST_ANSWER_END`,
];
for(const message of cases)test(`durable BFF mapping and reconciled transcript preserve ${message.slice(0,55)}`,()=>{
 const result=completed(message), record={...receipt,status:'COMPLETED',finalResult:result};
 const first=resultFromDurableRecord(receipt,record)!;
 assert.deepEqual(first,resultFromDurableRecord(receipt,record));
 assert.equal(isConfirmedReasoning(first),true);
 const decision=decideBffChatSurface({upstreamOk:true,rawBody:JSON.stringify({result:first}),userAsk:'Synthetic integration fixture'});
 assert.equal(decision.degrade,false);if(decision.degrade)throw Error('Unexpected failure');
 assert.equal(decision.message,message);
 const mapped=mapPillowChatToAssistantResponse({...first,message:decision.message},'Synthetic integration fixture');
 assert.equal(mapped.interactionSummary,message);
 const server:PillowConversationTurn={id:'server',role:'pillow',content:mapped.interactionSummary,recordedAt:'2026-10-04T00:00:00.000Z',screenPath:'/cockpit/pillow',requestId:receipt.requestId,source:'server_persisted_transcript'};
 const archive={...server,id:'archive',content:'Old pending receipt',source:'historical_browser_cache' as const};
 assert.deepEqual(reconcilePillowHistory([server],[archive]),[server]);
 assert.equal(reconcilePillowHistory([server],[archive]).at(-1)?.content,message);
});
for(const patch of [{status:'FAILED'},{status:'FAILED_FATAL'},{status:'INCOMPLETE'},{status:'RESULT_UNAVAILABLE'},{semanticSuccess:false},{brainCompleted:false},{transportContractPassed:false},{degradedUsed:true},{recoveryExhausted:true},{reasoningFailure:{code:'PROVIDER_INCOMPLETE',reason:'max_output_tokens'}},{constitutionalGate:{allowed:false}},{responseContract:{code:'blocked'}}])test(`contradictory completion remains failure ${JSON.stringify(patch)}`,()=>{
 const result={...completed('Synthetic failed provider output'),...patch};
 assert.equal(isConfirmedReasoning(result),false);
 const delivered=resultFromDurableRecord(receipt,{status:'COMPLETED',finalResult:result})!;
 assert.equal(delivered.kind,'error');
 const decision=decideBffChatSurface({upstreamOk:true,rawBody:JSON.stringify({result}),userAsk:'Synthetic'});
 assert.equal(decision.degrade,true);
 const trace=buildShellTraceFromDecision({decision,upstreamStatus:200,httpStatus:502});
 assert.equal(trace.brainCompleted,false);assert.notEqual(trace.brainCompletionState,'SUCCESS');
 assert.equal(mapPillowChatToAssistantResponse(delivered,'Synthetic').confidence,'unavailable');
});
test('HTTP failure cannot be certified by completion flags',()=>{
 const decision=decideBffChatSurface({upstreamOk:false,rawBody:JSON.stringify({result:completed('Synthetic')}),userAsk:'Synthetic'});
 assert.equal(decision.degrade,true);
});
test('production hydration and provenance retain PR41 implementation contracts',()=>{
 const source=readFileSync(new URL('../cockpit/global-assistant/GlobalAiAssistantProvider.tsx',import.meta.url),'utf8');
 assert.match(source,/content: turn\.content,/);
 assert.match(source,/reconcilePillowHistory\(serverTurns, archiveTurns\)/);
 assert.match(source,/preservePillowLocalArchive\(previous, turns, historyOwnerId\)/);
 assert.match(source,/filter\(t => t\.source === "server_persisted_transcript"\)/);
 assert.match(source,/isStatus \|\| preserveReasoning/);
 assert.doesNotMatch(source,/toExecutiveSurfaceMessage\(turn\.content/);
});

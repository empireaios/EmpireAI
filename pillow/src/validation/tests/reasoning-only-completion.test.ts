import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OpenAIIntegrationLayer } from "../../openai/engine.js";
import type { BrainLLMAdapter } from "../../openai/brain-adapter.js";
import type { OperationalContext } from "../../context/types.js";
import type { IntelligencePlatformEngine } from "../../intelligence-platform/engine.js";

const context: OperationalContext = {
  manifest: { contextVersion: "PILLOW-004", task: "general", artifactIds: [], paths: [], sliceCount: 0,
    totalBytes: 0, estimatedTokens: 0, cached: false, repositoryFingerprint: "isolated-test",
    builtAt: "2026-09-20T00:00:00.000Z", durationMs: 0 },
  slices: [], intelligenceSnapshot: { healthScore: 0, currentMission: null, journeyPosition: null, healthIssueCount: 0 },
};

describe("reasoning-only completion cannot execute tools", () => {
  for (const executiveConversationMode of [false, true]) {
    it(`blocks capabilities and artifact writes with conversational mode ${executiveConversationMode}`, async () => {
      let modelCalls = 0;
      let platformTouches = 0;
      const adapter: BrainLLMAdapter = {
        listAvailableProviders: () => ["openai"],
        complete: async (request) => {
          modelCalls++;
          assert.match(request.messages.find(m => m.role === "system")!.content, /REASONING ONLY: Only explicitly supplied read-only receipts establish retrieval or calculation/);
          assert.match(request.messages.find(m => m.role === "system")!.content, /No commands, approvals, episodes, listings, orders, payments or other external actions are executed/);
          assert.match(request.messages.find(m => m.role === "system")!.content, /Repository health was not assessed/);
          assert.doesNotMatch(request.messages.find(m => m.role === "system")!.content, /Repository health score:/);
          return { content: "This is advice only; nothing was executed.", provider: "openai", model: "mock" };
        },
      };
      const platform = new Proxy({}, { get() { platformTouches++; throw new Error("tool_or_artifact_path_reached"); } }) as IntelligencePlatformEngine;
      const layer = new OpenAIIntegrationLayer(adapter, platform);
      for (let attempt = 0; attempt < 3; attempt++) {
        const result = await layer.complete({
          operationalContext: context, userMessage: "Create an image, publish it and execute code now",
          workspaceId: "ws-isolated", correlationId: "retry-same-request", reasoningOnly: true,
          executiveConversationMode,
          constitutionalGateAttestation: { passed: true, gatedAt: "test", purpose: "chat" },
        });
        assert.equal(result.artifacts, undefined);
        assert.equal(result.capabilitiesUsed, undefined);
        assert.equal(result.intelligenceRouting, undefined);
      }
      assert.equal(modelCalls, 3);
      assert.equal(platformTouches, 0);
    });
  }
  it("does not bypass the constitutional gate", async () => {
    const adapter: BrainLLMAdapter = { listAvailableProviders: () => ["openai"], complete: async () => { throw new Error("model must not run"); } };
    await assert.rejects(new OpenAIIntegrationLayer(adapter).complete({
      operationalContext: context, userMessage: "advice", workspaceId: "ws-isolated", correlationId: "test", reasoningOnly: true,
    }), /Constitutional gate required/);
  });
});

it('rejects malformed tool protocol after one provider call without dispatch or follow-up',async()=>{
 let calls=0,tools=0;
 const adapter:BrainLLMAdapter={listAvailableProviders:()=>['openai'],complete:async()=>{calls++;return{provider:'openai',model:'mock',content:'{"readOnlyCalls":[]} extra text {"readOnlyCalls":[]}'};}};
 await assert.rejects(new OpenAIIntegrationLayer(adapter).complete({operationalContext:context,userMessage:'Evaluate the supplied figures',workspaceId:'ws-isolated',correlationId:'malformed-protocol',reasoningOnly:true,constitutionalGateAttestation:{passed:true,gatedAt:'test',purpose:'chat'},executeReadOnlyCalls:async()=>{tools++;return[];}}),/Malformed read-only tool protocol/);
 assert.equal(calls,1);assert.equal(tools,0);
});

it('valid read-only calculation uses one receipt round and preserves commentary phase',async()=>{
 let calls=0,tools=0;
 const adapter:BrainLLMAdapter={listAvailableProviders:()=>['openai'],complete:async(request)=>{
  calls++;
  if(calls===1)return{provider:'openai',model:'mock',content:'{"readOnlyCalls":[{"name":"calculate","arguments":{"operation":"add","left":"2","right":"5"}}]}'};
  assert.equal(request.messages.at(-2)?.phase,'commentary');
  return{provider:'openai',model:'mock',content:'The supplied quantities total seven.'};
 }};
 const result=await new OpenAIIntegrationLayer(adapter).complete({operationalContext:context,userMessage:'Combine supplied quantities',workspaceId:'ws-isolated',correlationId:'valid-protocol',reasoningOnly:true,constitutionalGateAttestation:{passed:true,gatedAt:'test',purpose:'chat'},executeReadOnlyCalls:async()=>{tools++;return[{value:'7',simulated:false}];}});
 assert.equal(calls,2);assert.equal(tools,1);assert.equal(result.content,'The supplied quantities total seven.');
});

for (const content of ['Progress: {"readOnlyCalls":[]}', '```json\n{"readOnlyCalls":[]}\n```', '[{"readOnlyCalls":[]}]']) it('rejects prefixed, fenced and nested tool intent without another inference',async()=>{
 let calls=0,tools=0;
 const adapter:BrainLLMAdapter={listAvailableProviders:()=>['openai'],complete:async()=>{calls++;return{provider:'openai',model:'mock',content};}};
 await assert.rejects(new OpenAIIntegrationLayer(adapter).complete({operationalContext:context,userMessage:'Evaluate supplied quantities',workspaceId:'ws-isolated',correlationId:'wrapped-protocol',reasoningOnly:true,constitutionalGateAttestation:{passed:true,gatedAt:'test',purpose:'chat'},executeReadOnlyCalls:async()=>{tools++;return[];}}),/read-only tool|tool envelope/i);
 assert.equal(calls,1);assert.equal(tools,0);
});

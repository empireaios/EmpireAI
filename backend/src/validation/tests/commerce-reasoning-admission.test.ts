import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isLiveCommerceEffectAsk, projectLiveCommerceRefusal } from '../../orchestration/pillow-host/executive-authority-surface.js';

// Mechanism-derived grammar classes only. No owner acceptance text or scenario.
test('commerce discussion and unconditional prohibitions are not execution requests', () => {
  for (const text of [
    'Compare whether to publish a listing or defer the launch.',
    'Estimate the cost to place an order in a real marketplace.',
    'Explain why a merchant might buy ads.',
    'Should we purchase inventory?',
    'Do not publish a live listing. Calculate the margin.',
    'Never pay the supplier. Review the forecast.',
    'Discuss the alternatives. Do not create listings or purchase orders.',
    'If we launch ads, what would the cost be?',
    'Model the payment timing. Real commerce remains locked.',
    'Write a report about whether to purchase inventory.',
    'Create a forecast for a live marketplace listing.',
    'Run a simulation of advertising campaigns.',
  ]) assert.equal(isLiveCommerceEffectAsk(text), false, text);
});

test('independent effects cannot be laundered by analysis, disclaimers or denials', () => {
  for (const text of [
    'Publish the live listing.', 'Purchase the inventory order.',
    'Pay the supplier.', 'Spend $35 on ads.',
    'Write to the external marketplace.', 'Send the payment.',
    'Hypothetical only. Publish the live listing now.',
    'Compare prices and purchase the order.',
    'Do not publish the listing unless the margin is positive.',
    'Do not spend money. Then pay the supplier.',
    'Review the offer, but launch the ad campaign.',
    'If the margin is positive, place the order.',
    'Explain the payment and you should pay the supplier.',
  ]) assert.equal(isLiveCommerceEffectAsk(text), true, text);
});

import { executeReasoningProxy } from '../../runtime/pillow-durable-reasoning-worker.js';
test('commerce refusal is terminal incomplete reasoning, including legacy responses', async () => {
  const original = globalThis.fetch;
  try {
    for (const result of [projectLiveCommerceRefusal(''), {kind:'authority_refusal',message:'Refused'}]) {
      globalThis.fetch = async () => Response.json({result});
      const outcome = await executeReasoningProxy({request:{requestId:'fixture',leaseToken:1},input:{kind:'reasoning',bodyText:'{}',sessionToken:'fixture'}} as any,9999);
      assert.deepEqual(outcome,{ok:false,failureClass:'BRAIN_FATAL',error:'live_commerce_refused'});
    }
    const refused=projectLiveCommerceRefusal('');
    assert.equal(refused.brainCompleted,false);
    assert.equal(refused.semanticSuccess,false);
    assert.equal(refused.reasoningFailure.retryable,false);
  } finally {globalThis.fetch=original;}
});

test('action families retain local polarity and mixed-request boundaries', () => {
  for (const effect of ['publish a listing','purchase inventory','pay the supplier','spend money on ads','write external records','update marketplace stock','delete marketplace listings','send a payment']) {
    for(const lead of ['Explain why one might ', 'Evaluate whether to ', 'Compare the risks if we ', 'Do not ', 'Never '])
      assert.equal(isLiveCommerceEffectAsk(lead+effect),false,lead+effect);
    for(const lead of ['Please ', 'Can you ', 'Analysis only. ', 'Review the evidence, then ', 'Explain the cost and ', 'If approved, '])
      assert.equal(isLiveCommerceEffectAsk(lead+effect),true,lead+effect);
  }
});

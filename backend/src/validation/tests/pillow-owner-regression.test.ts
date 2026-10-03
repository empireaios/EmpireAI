import assert from 'node:assert/strict';
import {test} from 'node:test';
import {assessDecisionQuality,hasStrongSpecificRecommendation} from '../../orchestration/pillow-host/executive-decision-quality.js';
import {classifyReasoningFailure} from '../../runtime/reasoning-failure.js';

const truth = {financial:{orders:0,realisedRevenueUsd:0}} as Parameters<typeof assessDecisionQuality>[1];
test('status review cannot join unrelated launch mentions to a recommendation',()=>{
  const text='There are zero orders. Marketplace readiness and unit economics are unverified. Launch remains blocked. I recommend we complete the evidence review and document what is still missing.';
  assert.deepEqual(assessDecisionQuality(text,truth).violations,[]);
  assert.equal(hasStrongSpecificRecommendation('I recommend a launch readiness review.'),false);
  assert.equal(hasStrongSpecificRecommendation('We should clarify what prevents launch.'),false);
});
test('genuine unconditional launch recommendation remains rejected',()=>{
  assert.ok(assessDecisionQuality('We have zero orders. I recommend we launch immediately.',truth).violations.includes('GOAL_SOLUTION_CAUSAL_LEAP'));
  assert.ok(assessDecisionQuality('Unit economics remain unverified. Therefore I recommend we launch immediately.',truth).violations.includes('MATERIAL_ASSUMPTION_TREATED_AS_ESTABLISHED'));
});
test('a condition on an unrelated recommendation cannot authorize launch',()=>{
  const text='We have zero orders. If we verify the layout, we should publish the internal report. I recommend we launch the product immediately.';
  assert.ok(assessDecisionQuality(text,truth).violations.includes('GOAL_SOLUTION_CAUSAL_LEAP'));
});
test('negation in one clause cannot conceal an affirmative action in another',()=>{
  assert.equal(hasStrongSpecificRecommendation('Do not wait; I recommend we launch immediately.'),true);
  assert.equal(hasStrongSpecificRecommendation('We should not launch.'),false);
  assert.equal(hasStrongSpecificRecommendation('I recommend we launch only if unit economics are verified.'),true);
  assert.deepEqual(assessDecisionQuality('I recommend we launch only if unit economics are verified.',truth).violations,[]);
});
test('post-answer rejection is distinct from provider failure and never retryable',()=>{
  const rejected=classifyReasoningFailure(true,new Error('ANSWER_INTEGRITY_REJECTED:GOAL_SOLUTION_CAUSAL_LEAP'));
  assert.equal(rejected.code,'ANSWER_REJECTED');
  assert.equal(rejected.retryable,false);
  assert.match(rejected.message,/received a provider answer/);
  assert.equal(classifyReasoningFailure(true,new Error('storage')).code,'POSTPROCESS_FAILED');
  assert.equal(classifyReasoningFailure(false,new Error('provider')).code,'INFERENCE_FAILED');
});

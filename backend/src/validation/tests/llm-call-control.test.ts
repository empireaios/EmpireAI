import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseLLMTimeout, withLLMDeadline } from '../../brain/llm/call-control.js';
import { LLMRouter } from '../../brain/llm/llm-router.js';
import type { LLMProvider } from '../../brain/llm/provider.js';
import type { LLMProviderName } from '../../brain/types.js';

test('timeouts are finite integer bounded and reject malformed configuration', () => {
  assert.equal(parseLLMTimeout(undefined), 45000);
  assert.equal(parseLLMTimeout('120000'), 120000);
  for (const input of ['', ' ', '-1', '0', 'NaN', 'Infinity', '1.5', '120001', '1e3']) assert.throws(() => parseLLMTimeout(input));
});
test('deadline aborts the actual in-flight fake provider once', async () => {
  let calls = 0, aborted = 0;
  await assert.rejects(withLLMDeadline(signal => new Promise((_resolve, reject) => {
    calls++;
    signal.addEventListener('abort', () => { aborted++; reject(signal.reason); }, { once: true });
  }), 15), /timed out/);
  assert.equal(calls, 1); assert.equal(aborted, 1);
});
test('already cancelled caller cannot invoke provider; caller cancellation propagates', async () => {
  const early = new AbortController(); early.abort(new Error('owner cancelled')); let calls = 0;
  await assert.rejects(withLLMDeadline(async () => { calls++; }, 100, early.signal), /owner cancelled/);
  assert.equal(calls, 0);
  const controller = new AbortController(); let received: AbortSignal | undefined;
  const pending = withLLMDeadline(signal => { received = signal; return new Promise(() => {}); }, 100, controller.signal);
  controller.abort(new Error('owner cancelled'));
  await assert.rejects(pending, /owner cancelled/); assert.equal(received?.aborted, true);
});
test('fast success clears timer and provider errors are never retried', async () => {
  let received: AbortSignal | undefined, calls = 0;
  assert.equal(await withLLMDeadline(async signal => { received = signal; return 7; }, 10), 7);
  await new Promise(resolve => setTimeout(resolve, 25)); assert.equal(received?.aborted, false);
  await assert.rejects(withLLMDeadline(async () => { calls++; throw new Error('provider failure'); }, 20), /provider failure/);
  assert.equal(calls, 1);
});
test('a noncooperative provider remains bounded locally without claiming remote cancellation', async () => {
  await assert.rejects(withLLMDeadline(() => new Promise(() => {}), 10), /timed out/);
});

test('an unavailable selected provider never silently charges an available fallback', () => {
  const router = new LLMRouter();
  const providers = (router as unknown as { providers: Map<LLMProviderName, LLMProvider> }).providers;
  providers.set('openai', { name: 'openai', isAvailable: () => false,
    complete: async () => { throw new Error('must not dispatch'); } });
  providers.set('anthropic', { name: 'anthropic', isAvailable: () => true,
    complete: async () => { throw new Error('must not dispatch'); } });
  assert.throws(() => router.resolve('openai'), /implicit fallback refused/);
  assert.equal(router.resolve('anthropic').name, 'anthropic');
});

import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { OpenAIProvider } from '../../brain/llm/openai-provider.js';
import { AnthropicProvider } from '../../brain/llm/anthropic-provider.js';
import { GeminiProvider } from '../../brain/llm/gemini-provider.js';
import { withLLMDeadline } from '../../brain/llm/call-control.js';
const request = { workspaceId: 'offline', correlationId: 'offline-cancellation', messages: [{ role: 'user' as const, content: 'offline synthetic test' }] };

for (const name of ['openai', 'anthropic'] as const) {
  test(`${name} real SDK receives per-request maxRetries zero and performs one fake fetch on 503`, async () => {
    let calls = 0;
    const fetcher = async () => { calls++; return new Response(JSON.stringify({ error: { message: 'offline unavailable', type: 'api_error' } }), { status: 503, headers: { 'content-type': 'application/json' } }); };
    const client = name === 'openai' ? new OpenAI({ apiKey: 'offline-not-a-real-key', fetch: fetcher as unknown as NonNullable<ConstructorParameters<typeof OpenAI>[0]>['fetch'] }) : new Anthropic({ apiKey: 'offline-not-a-real-key', fetch: fetcher as unknown as NonNullable<ConstructorParameters<typeof Anthropic>[0]>['fetch'] });
    const provider = name === 'openai' ? new OpenAIProvider() : new AnthropicProvider();
    const stub = mock.method(provider as unknown as { getClient(): unknown }, 'getClient', () => client);
    try { await assert.rejects(provider.complete(request)); assert.equal(calls, 1); }
    finally { stub.mock.restore(); }
  });
  test(`${name} actual SDK fake fetch sees timeout abort`, async () => {
    let calls = 0, aborted = false;
    const fetcher: typeof fetch = async (_url, init) => new Promise((_resolve, reject) => {
      calls++; const signal = init?.signal;
      if (signal?.aborted) { aborted = true; reject(signal.reason); return; }
      signal?.addEventListener('abort', () => { aborted = true; reject(signal.reason); }, { once: true });
    });
    const client = name === 'openai' ? new OpenAI({ apiKey: 'offline-not-a-real-key', fetch: fetcher as unknown as NonNullable<ConstructorParameters<typeof OpenAI>[0]>['fetch'] }) : new Anthropic({ apiKey: 'offline-not-a-real-key', fetch: fetcher as unknown as NonNullable<ConstructorParameters<typeof Anthropic>[0]>['fetch'] });
    const provider = name === 'openai' ? new OpenAIProvider() : new AnthropicProvider();
    const stub = mock.method(provider as unknown as { getClient(): unknown }, 'getClient', () => client);
    try { await assert.rejects(withLLMDeadline(signal => provider.complete({ ...request, signal }), 30)); assert.equal(calls, 1); assert.equal(aborted, true); }
    finally { stub.mock.restore(); }
  });
}
test('Gemini adapter forwards cancellation and rejects already-aborted work before client acquisition', async () => {
  const provider = new GeminiProvider(); let calls = 0, aborted = false;
  const stub = mock.method(provider as unknown as { getClient(): unknown }, 'getClient', () => ({ getGenerativeModel: () => ({
    generateContent: (_body: unknown, options: { signal: AbortSignal }) => new Promise((_resolve, reject) => {
      calls++; options.signal.addEventListener('abort', () => { aborted = true; reject(options.signal.reason); }, { once: true });
    }),
  }) }));
  try {
    await assert.rejects(withLLMDeadline(signal => provider.complete({ ...request, signal }), 15));
    assert.equal(calls, 1); assert.equal(aborted, true);
    const controller = new AbortController(); controller.abort();
    await assert.rejects(provider.complete({ ...request, signal: controller.signal }));
    assert.equal(stub.mock.callCount(), 1);
  } finally { stub.mock.restore(); }
});
test('Gemini installed SDK propagates signal into its actual fetch transport', async () => {
  let calls = 0, aborted = false;
  const fetchStub = mock.method(globalThis, 'fetch', async (_url: unknown, options?: RequestInit) => new Promise<Response>((_resolve, reject) => {
    calls++;
    if (options?.signal?.aborted) { aborted = true; reject(options.signal.reason); return; }
    options?.signal?.addEventListener('abort', () => { aborted = true; reject(options.signal?.reason); }, { once: true });
  }));
  const provider = new GeminiProvider();
  const stub = mock.method(provider as unknown as { getClient(): unknown }, 'getClient', () => new GoogleGenerativeAI('offline-not-a-real-key'));
  try {
    await assert.rejects(withLLMDeadline(signal => provider.complete({ ...request, signal }), 30));
    assert.equal(calls, 1); assert.equal(aborted, true);
  } finally { stub.mock.restore(); fetchStub.mock.restore(); }
});

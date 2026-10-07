import { COMMISSIONING_CEILING_MICRO_USD } from "../brain/llm/commissioning-inference-budget.js";
import type { FastifyInstance } from 'fastify';
import { LOCKED_PROVIDERS, configuredLockedProviders } from '../brain/llm/locked-provider-orchestration.js';
const PROFILE = 'LOCKED_COMMISSIONING_V1';
export function installLockedCommissioning(app: FastifyInstance): void {
  const profile = process.env.EMPIRE_RUNTIME_PROFILE;
  if (!profile) return;
  if (profile !== PROFILE || process.env.EMPIRE_ENGINEERING_TEST_MODE !== 'true') throw new Error('Invalid locked runtime profile');
  // Deny mutations before any route handler, on both primary and worker. The
  // existing reasoning-only chat worker cannot dispatch commerce tools.
  const allowed = new Set(['/auth/login','/auth/logout','/api/pillow/chat','/api/pillow/session',
    '/api/pillow/mission-runtime/create-mission','/api/pillow/mission-runtime/history',
    // Fixed isolated Assurance records only; each route still enforces founder authentication.
    '/api/pillow/assurance-demo/inject','/api/pillow/assurance-demo/correct',
    '/advisor/mcp','/advisor/oauth/register','/advisor/oauth/token',
    '/api/owner/advisor/consent','/api/owner/advisor/revoke',
    '/api/owner/advisor/validate','/api/owner/advisor/import']);
  app.addHook('onRequest', async (request, reply) => {
    const route = new URL(request.url, 'http://localhost').pathname;
    if (!['GET','HEAD','OPTIONS'].includes(request.method) && !(request.method === 'POST' && allowed.has(route))) {
      return reply.code(423).send({ code:'LOCKED_COMMISSIONING', birth:'NOT_BORN', commerce:'LOCKED', operational:false });
    }
  });
  app.addHook('onSend', async (request, _reply, payload) => {
    if (request.url.split('?')[0] !== '/health/ready' || typeof payload !== 'string') return payload;
    const value=JSON.parse(payload);
    return JSON.stringify({...value,readinessScope:'transport_and_storage_only',operational:false,
      runtimeProfile:PROFILE,birth:'NOT_BORN',commerce:'LOCKED',
      authorizedCapabilities:{commerce:false,paidProviders:false,birth:false,boundedTextInference:true},
      inference:{provider:'openai',model:'gpt-6.1-sol',credentialConfigured:Boolean(process.env.OPENAI_API_KEY?.trim()),
        providers:Object.entries(LOCKED_PROVIDERS).map(([provider,p])=>({provider,model:p.model,credentialConfigured:configuredLockedProviders().includes(provider as keyof typeof LOCKED_PROVIDERS),ceilingUsd:p.ceiling===null?null:p.ceiling/1_000_000})),
        commissioningCeilingUsd:COMMISSIONING_CEILING_MICRO_USD,readiness:'subject_to_credential_and_durable_budget_admission'}});
  });
}

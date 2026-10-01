import type { FastifyInstance } from 'fastify';
const PROFILE = 'LOCKED_COMMISSIONING_V1';
export function installLockedCommissioning(app: FastifyInstance): void {
  const profile = process.env.EMPIRE_RUNTIME_PROFILE;
  if (!profile) return;
  if (profile !== PROFILE || process.env.EMPIRE_ENGINEERING_TEST_MODE !== 'true') throw new Error('Invalid locked runtime profile');
  // Deny mutations before any route handler, on both primary and worker. The
  // existing reasoning-only chat worker cannot dispatch commerce tools.
  const allowed = new Set(['/auth/login','/auth/logout','/api/pillow/chat',
    '/api/pillow/mission-runtime/create-mission','/api/pillow/mission-runtime/history']);
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
      authorizedCapabilities:{commerce:false,paidProviders:false,birth:false}});
  });
}

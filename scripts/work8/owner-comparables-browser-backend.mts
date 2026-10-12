import fs from 'node:fs';import path from 'node:path';
const [root, port, receipts] = process.argv.slice(2);
if (!root || !port || !receipts || process.env.WORK8_KERNEL_EGRESS !== 'CONNECT_DENIED_LISTEN_ALLOWED') throw Error('ISOLATED_INBOUND_EXAM_REQUIRED');
process.env.NODE_ENV = 'test';process.env.DATABASE_PATH = path.join(root, 'brain.sqlite');process.env.RAILWAY_VOLUME_MOUNT_PATH = root;process.env.EMPIRE_RUNTIME_PROFILE = 'LOCKED_COMMISSIONING_V1';
fs.mkdirSync(path.join(root, 'commissioning'), {recursive: true});
const [{default: Fastify}, {default: cookie}, {InMemorySessionStore, UserStore}, {createAuthMiddleware}, {registerAuthRoutes}, {hashPassword}, {getDatabase, closeDatabase}, {IntelligenceStore}, {registerWork8ComparableRoutes}] = await Promise.all([
  import('../../backend/node_modules/fastify/fastify.js'),import('../../backend/node_modules/@fastify/cookie/plugin.js'),import('../../backend/src/auth/session-store.js'),import('../../backend/src/auth/middleware.js'),import('../../backend/src/auth/routes.js'),import('../../backend/src/auth/seed-users.js'),import('../../backend/src/brain/database.js'),import('../../backend/src/intelligence/store.js'),import('../../backend/src/runtime/commerce-runtime/governed/work8-comparable-routes.js')]);
// Only the login identity is an isolated fixture. Product facts are exact retained LIVE_PROVIDER receipts.
const at = Date.parse('2026-10-12T17:12:00Z'), store = new IntelligenceStore(path.join(root, 'commissioning', 'intelligence.sqlite'), () => at);
const evidence = JSON.parse(fs.readFileSync(receipts, 'utf8'));
for (const item of evidence) store.evidence('ws_empire_1', item);
const app = Fastify();await app.register(cookie);const sessions = new InMemorySessionStore(), auditLogger = {write: () => {}} as never;
await registerAuthRoutes(app, {sessionStore: sessions, auditLogger});
registerWork8ComparableRoutes(app, {authenticate: createAuthMiddleware(sessions), owner: async (request, reply) => {
  if (request.user?.role !== 'founder' || request.user?.workspaceId !== 'ws_empire_1' || request.user?.email !== 'comparables-fixture@example.test') return reply.code(403).send({error: 'Owner access required'});
}, intelligence: () => store, now: () => at});
const users = new UserStore(getDatabase());
users.create({email: 'comparables-fixture@example.test', workspaceId: 'ws_empire_1', name: 'Isolated examination owner', role: 'founder', passwordHash: await hashPassword('fixture-comparables-only')});
users.create({email: 'foreign-fixture@example.test', workspaceId: 'ws_other', name: 'Isolated foreign owner', role: 'founder', passwordHash: await hashPassword('fixture-foreign-only')});
await app.listen({host: '127.0.0.1', port: Number(port)});
fs.writeFileSync(path.join(root, 'ready.json'), JSON.stringify({ready: true, port: Number(port),clock: '2026-10-12T17:12:00Z',productData: 'RETAINED_GENUINE_PROVIDER_RECEIPTS',receiptIds: evidence.map((e: {id: string}) => e.id)}));
process.on('SIGTERM', async () => {await app.close();closeDatabase();process.exit(0);});

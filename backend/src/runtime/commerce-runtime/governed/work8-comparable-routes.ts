import type {FastifyInstance, preHandlerHookHandler} from 'fastify';
import type {IntelligenceStore} from '../../../intelligence/store.js';
import type {Evidence} from '../../../intelligence/model.js';
import {projectWork8ComparableContext} from './work8-comparable-context.js';

/** Native authenticated Owner Console read. No caller-supplied evidence or external refresh. */
export function registerWork8ComparableRoutes(app: FastifyInstance, options: {
  authenticate: preHandlerHookHandler; owner: preHandlerHookHandler;
  intelligence: () => IntelligenceStore | null; now?: () => number;
}) {
  app.get('/api/owner/commerce/comparables', {preHandler: [options.authenticate, options.owner]}, async (request, reply) => {
    reply.header('cache-control', 'private, no-store');
    if (Object.keys(request.query as object).length) return reply.code(400).send({error: 'COMPARABLE_QUERY_UNSUPPORTED'});
    try {
      const store = options.intelligence();
      if (!store) return reply.code(503).send({error: 'COMPARABLE_SOURCE_UNAVAILABLE'});
      const workspace = request.user!.workspaceId;
      const ids = store.recent(workspace, 'evidence', 100).filter(e => e.provider === 'CJ' || e.provider === 'Amazon').map(e => e.id);
      return {...projectWork8ComparableContext((ws, id) => store.get(ws, 'evidence', id) as Evidence | null, workspace, ids, (options.now ?? Date.now)()), availability: 'RETAINED_SOURCE_READ'};
    } catch {
      return reply.code(503).send({error: 'COMPARABLE_SOURCE_UNAVAILABLE'});
    }
  });
}

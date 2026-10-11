import {z} from 'zod';
import type {FastifyInstance,FastifyReply,FastifyRequest} from 'fastify';
import type {createAuthMiddleware} from '../../../auth/middleware.js';
import type {Work8TwinSessions} from './work8-twin.js';

const key=z.string().min(1).max(100).regex(/^[A-Za-z0-9_.:-]+$/);
const query=z.object({sessionId:key.optional(),after:key.or(z.literal('')).default(''),limit:z.coerce.number().int().min(1).max(100).default(50)}).strict();
type Guard=(req:FastifyRequest,reply:FastifyReply)=>Promise<unknown>;

/** No caller-supplied owner/workspace and no execution or live-effect adapter. */
export function registerWork8TwinRoutes(app:FastifyInstance,options:{
 authenticate:ReturnType<typeof createAuthMiddleware>;owner:Guard;
 sessions:()=>Work8TwinSessions;
 projection?:(p:{workspace:string;owner:string},sessionId:string,after:string,limit:number)=>unknown;
}){
 const guards=[options.authenticate,options.owner];
 const principal=(req:FastifyRequest)=>({workspace:req.user!.workspaceId,owner:req.user!.id});
 const failure=(reply:FastifyReply,error:unknown)=>{
  if(error instanceof z.ZodError)return reply.code(400).send({error:'INVALID_TWIN_REQUEST'});
  const code=error instanceof Error?error.message:'';
  const publicErrors=['TWIN_NOT_FOUND','TWIN_OWNER_SCOPE_DENIED','TWIN_VERSION_CONFLICT','TWIN_TRANSITION_DENIED','TWIN_IDEMPOTENCY_CONFLICT'];
  return reply.code(code==='TWIN_NOT_FOUND'?404:code==='TWIN_OWNER_SCOPE_DENIED'?403:publicErrors.includes(code)?409:503)
   .send({error:publicErrors.includes(code)?code:'TWIN_EVIDENCE_UNAVAILABLE'});
 };
 app.get('/api/owner/commerce/twin',{preHandler:guards},async(req,reply)=>{
  reply.header('cache-control','private, no-store');
  try{const q=query.parse(req.query),sessions=options.sessions(),p=principal(req);return q.sessionId?(options.projection?options.projection(p,q.sessionId,q.after,q.limit):sessions.snapshot(p,q.sessionId,q.after,q.limit)):sessions.list(p,q.after,q.limit);}
  catch(error){return failure(reply,error);}
 });
}

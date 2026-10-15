import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { createAuthMiddleware } from '../auth/middleware.js';
import type { Work8RecoveryRequest, Work8RecoveryResult } from './work8-recovery-capture.js';

/** Opt-in isolated examination adapter to the existing recovery path. Source and
 * destination are operator configuration, never untrusted request parameters. */
export function registerWork8RecoveryRoutes(app: FastifyInstance, options: {
 authenticate: ReturnType<typeof createAuthMiddleware>; founderEmail: string;
 capture: (request: Work8RecoveryRequest) => Promise<Work8RecoveryResult>;
 config?: NodeJS.ProcessEnv;
}) {
 const config = options.config ?? process.env;
 if (config.WORK8_RECOVERY_EXAMINATION !== 'true') return;
 if (config.NODE_ENV === 'production' || config.RAILWAY_DEPLOYMENT_ID || config.EMPIRE_ROLE !== 'brain-worker')
  throw Error('RECOVERY_EXAMINATION_ISOLATION_REQUIRED');
 const root = config.WORK8_RECOVERY_OUTPUT_DIRECTORY;
 const sourceCommit = config.RAILWAY_GIT_COMMIT_SHA, frontendRevision = config.WORK8_FRONTEND_REVISION;
 if (!root || !path.isAbsolute(root) || fs.realpathSync(root) !== root || !fs.statSync(root).isDirectory() ||
     !/^[a-f0-9]{40}$/.test(sourceCommit ?? '') || !/^[a-f0-9]{40}$/.test(frontendRevision ?? ''))
  throw Error('RECOVERY_EXAMINATION_CONFIGURATION_REQUIRED');
 const pending = new WeakMap<FastifyRequest, {id:string;destination:string}>();
 let busy = false;
 const owner = async (req: FastifyRequest, reply: any) => {
  reply.header('cache-control','private, no-store');const u = req.user;
  if (!u || u.role !== 'founder' || u.workspaceId !== 'ws_empire_1' || u.email.toLowerCase() !== options.founderEmail.toLowerCase())
   return reply.code(403).send({error:'Owner access required'});
 };
 const receipt = (id:string,value:unknown) => fs.writeFileSync(path.join(root,id+'.json'),JSON.stringify(value),{flag:'wx',mode:0o600});
 app.addHook('onResponse',async req=>{
  const job=pending.get(req);if(!job)return;pending.delete(req);
  // The triggering HTTP request must leave BOTH primary and worker admissions
  // before capture attempts to drain them.
  setImmediate(()=>{void (async()=>{
   try {const result=await options.capture({destination:job.destination,sourceCommit:sourceCommit!,frontendRevision:frontendRevision!,requireComplete:false});
    receipt(job.id,{id:job.id,status:'SCOPED_INSPECTION_ONLY',digest:result.digest,completeLiveState:false,bootAllowed:false});
   } catch {receipt(job.id,{id:job.id,status:'REFUSED',completeLiveState:false,bootAllowed:false});}
   finally {busy=false;}
  })().catch(()=>{busy=false;});});
 });
 app.post('/api/owner/commerce/twin/recovery-inventory',{preHandler:[options.authenticate,owner]},async(req,reply)=>{
  if (!req.body || JSON.stringify(req.body)!=='{"scope":"INSPECTION_ONLY"}')
   return reply.code(400).send({error:'EXPLICIT_INSPECTION_SCOPE_REQUIRED',completeLiveState:false});
  if(busy)return reply.code(409).send({error:'RECOVERY_CAPTURE_BUSY'});
  busy=true;const id=randomUUID();pending.set(req,{id,destination:path.join(root,id)});
  return reply.code(202).send({id,status:'ACCEPTED_FOR_EXAMINATION',completeLiveState:false,bootAllowed:false});
 });
 app.get('/api/owner/commerce/twin/recovery-inventory/:id',{preHandler:[options.authenticate,owner]},async(req,reply)=>{
  const id=(req.params as {id:string}).id;
  if(!/^[a-f0-9-]{36}$/.test(id))return reply.code(400).send({error:'INVALID_CAPTURE_ID'});
  const file=path.join(root,id+'.json');
  if(!fs.existsSync(file))return reply.code(404).send({error:'NO_TERMINAL_RECEIPT'});
  return JSON.parse(fs.readFileSync(file,'utf8'));
 });
}

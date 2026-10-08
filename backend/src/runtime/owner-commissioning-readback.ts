import { readAdvancedAssurance, assuranceOwnerCommand } from '../assurance/runtime.js';
import { COMMISSIONING_CEILING_MICRO_USD } from "../brain/llm/commissioning-inference-budget.js";
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import type { FastifyInstance } from 'fastify';
import type { createAuthMiddleware } from '../auth/middleware.js';
import { env } from '../config/env.js';
import { inferenceLedgerPath } from '../brain/llm/locked-inference.js';
import { readAnswerGateDiagnostic } from './answer-gate-diagnostics.js';
import { readProviderReceipts } from './provider-receipt-readback.js';
import { readReasoningCertification } from './reasoning-certification-readback.js';
import { auditCommissioningAccess } from './commissioning-access-audit.js';

/** Read the existing ledger in one snapshot. Never initialize, settle or release reservations. */
export function readCommissioningAccounting(filename: string) {
  const stat = fs.lstatSync(filename);
  if (!stat.isFile() || stat.nlink !== 1 || stat.size > 16 * 1024 * 1024 || fs.realpathSync(filename) !== filename || !fs.existsSync(filename + '.initialized')) throw Error('Ledger unavailable');
  const db = new DatabaseSync(filename, { readOnly: true, allowExtension: false, timeout: 100 });
  try {
    db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF; BEGIN');
    if (db.prepare('PRAGMA application_id').get()?.application_id !== 1162430793 || db.prepare('PRAGMA user_version').get()?.user_version !== 1 || db.prepare('PRAGMA quick_check').get()?.quick_check !== 'ok') throw Error('Ledger invalid');
    const rows = db.prepare('SELECT id,timestamp,reserved_micro_usd,estimated_micro_usd,invoice_actual_micro_usd,status FROM calls ORDER BY timestamp,id LIMIT 10001').all();
    if (rows.length > 10000) throw Error('Ledger exceeds readback bound');
    let held = 0, estimated = 0, invoice = 0, invoiceUnknown = 0, estimateUnknown = 0;
    for (const row of rows) {
      for (const key of ['reserved_micro_usd','estimated_micro_usd','invoice_actual_micro_usd']) if (row[key] !== null && (!Number.isSafeInteger(row[key]) || Number(row[key]) < 0)) throw Error('Ledger quantity invalid');
      if (Number(row.reserved_micro_usd) <= 0 || (row.estimated_micro_usd !== null && Number(row.estimated_micro_usd) > Number(row.reserved_micro_usd))) throw Error('Ledger bound invalid');
      held += Number(row.reserved_micro_usd);
      if (row.estimated_micro_usd === null) estimateUnknown++; else estimated += Number(row.estimated_micro_usd);
      if (row.invoice_actual_micro_usd === null) invoiceUnknown++; else invoice += Number(row.invoice_actual_micro_usd);
    }
    if (![held,estimated,invoice].every(Number.isSafeInteger)) throw Error('Ledger arithmetic invalid');
    db.exec('COMMIT');
    return { schema: 'owner-commissioning-accounting-v1', observedAt: new Date().toISOString(), readOnly: true,
      recordCount: rows.length, recordDigestSha256: createHash('sha256').update(JSON.stringify(rows)).digest('hex'),
      ceilingMicroUsd: COMMISSIONING_CEILING_MICRO_USD, heldMicroUsd: held, remainingMicroUsd: null,
      recordedEstimateMicroUsd: estimated, estimateUnknownCount: estimateUnknown,
      invoiceActualMicroUsd: invoiceUnknown ? null : invoice, invoiceUnknownCount: invoiceUnknown,
      reservationReleased: false, inferenceCalls: 0 };
  } finally { if (db.isTransaction) db.exec('ROLLBACK'); db.close(); }
}

export function registerOwnerCommissioningReadback(app: FastifyInstance, authenticate: ReturnType<typeof createAuthMiddleware>, readback = () => readCommissioningAccounting(inferenceLedgerPath()), audit = auditCommissioningAccess) {
  // Independent capability, scoped to two non-commercial readbacks. Disabled unless provisioned.
  const operatorAuthenticate = async (request: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply) => {
    const moduleUrl=new URL('../../src/assurance/commissioning-operator.mjs',import.meta.url).href;
    const {authorizeCommissioningRead}=await import(moduleUrl);
    const granted=authorizeCommissioningRead({method:request.method,url:request.url,token:request.headers['x-empire-commissioning-token']},
      {profile:process.env.EMPIRE_RUNTIME_PROFILE,tokenSha256:process.env.COMMISSIONING_OPERATOR_TOKEN_SHA256,expiresAt:process.env.COMMISSIONING_OPERATOR_EXPIRES_AT});
    // Fixed fields only: never log the supplied credential, headers or query values.
    reply.header('cache-control','private, no-store');
    try { audit({requestId:request.id,granted}); }
    catch { return reply.code(503).send({error:'Commissioning authorization audit unavailable'}); }
    if(!granted)return reply.code(403).send({error:'Commissioning read access required'});
  };
  app.get('/api/commissioning/read-only/accounting',{preHandler:operatorAuthenticate},async(_request,reply)=>{
    try{return reply.send(readback());}catch{return reply.code(503).send({error:'Current accounting unavailable; allowance unknown'});}
  });
  app.get('/api/commissioning/read-only/assurance',{preHandler:operatorAuthenticate},async(_request,reply)=>{
    try{
      const root=process.env.RAILWAY_VOLUME_MOUNT_PATH;
      if(!root||!root.startsWith('/')||fs.realpathSync(root)!==root)throw Error('Volume unavailable');
      const moduleUrl=new URL('../../src/assurance/owner-evidence.mjs',import.meta.url).href;
      const {readOwnerAssurance}=await import(moduleUrl);
      return reply.send({...readOwnerAssurance(root+'/commissioning/assurance.sqlite'),accounting:readback()});
    }catch{return reply.code(503).send({status:'UNKNOWN',error:'Durable Assurance evidence unavailable'});}
  });
  app.get<{Params:{requestId:string}}>('/api/pillow/commissioning-provider-receipts/:requestId', {preHandler:authenticate}, async (request, reply) => {
    reply.header('cache-control','private, no-store');
    const user=request.user;
    if (!user || user.role!=='founder' || user.workspaceId!=='ws_empire_1' || user.email.toLowerCase()!==env.FOUNDER_EMAIL.toLowerCase()) return reply.code(403).send({error:'Owner access required'});
    if (process.env.EMPIRE_RUNTIME_PROFILE!=='LOCKED_COMMISSIONING_V1') return reply.code(404).send({error:'Unavailable'});
    try {const receipts=readProviderReceipts(inferenceLedgerPath(),user.workspaceId,request.params.requestId);return reply.code(receipts.length?200:404).send({readOnly:true,receipts});}
    catch {return reply.code(503).send({error:'Provider receipt unavailable'});}
  });
  app.get<{Params:{requestId:string}}>('/api/pillow/answer-gate-diagnostics/:requestId', {preHandler:authenticate}, async (request, reply) => {
    reply.header('cache-control','private, no-store');
    const user=request.user;
    if (!user || user.role!=='founder' || user.workspaceId!=='ws_empire_1' || user.email.toLowerCase()!==env.FOUNDER_EMAIL.toLowerCase()) return reply.code(403).send({error:'Owner access required'});
    if (process.env.EMPIRE_RUNTIME_PROFILE!=='LOCKED_COMMISSIONING_V1') return reply.code(404).send({error:'Unavailable'});
    try { const record=readAnswerGateDiagnostic(request.params.requestId); return reply.code(record?200:404).send({readOnly:true,record}); }
    catch { return reply.code(503).send({error:'Diagnostic unavailable'}); }
  });
  app.post<{Params:{action:string}}>('/api/pillow/assurance-demo/:action', {preHandler:authenticate}, async(request,reply)=>{
    reply.header('cache-control','private, no-store');
    const user=request.user;
    if(!user||user.role!=='founder'||user.workspaceId!=='ws_empire_1'||user.email.toLowerCase()!==env.FOUNDER_EMAIL.toLowerCase())return reply.code(403).send({error:'Owner access required'});
    if(process.env.EMPIRE_RUNTIME_PROFILE!=='LOCKED_COMMISSIONING_V1')return reply.code(404).send({error:'Unavailable'});
    if(!['inject','correct'].includes(request.params.action))return reply.code(400).send({error:'Invalid demonstration action'});
    try{
      const root=process.env.RAILWAY_VOLUME_MOUNT_PATH;
      if(!root||!root.startsWith('/')||fs.realpathSync(root)!==root)throw Error('Volume unavailable');
      const moduleUrl=new URL('../../src/assurance/owner-demo.mjs',import.meta.url).href;
      const {changeDemo}=await import(moduleUrl);
      return reply.send(changeDemo(root+'/commissioning/assurance.sqlite',request.params.action));
    }catch{return reply.code(503).send({error:'Isolated demonstration unavailable'});}
  });
  app.post('/api/pillow/assurance/control', {preHandler:authenticate,bodyLimit:16000}, async(request,reply)=>{
    reply.header('cache-control','private, no-store');
    const user=request.user;
    if(!user||user.role!=='founder'||user.workspaceId!=='ws_empire_1'||user.email.toLowerCase()!==env.FOUNDER_EMAIL.toLowerCase())return reply.code(403).send({error:'Owner access required'});
    if(process.env.EMPIRE_RUNTIME_PROFILE!=='LOCKED_COMMISSIONING_V1')return reply.code(404).send({error:'Unavailable'});
    try{return reply.send(await assuranceOwnerCommand(user.id,request.body));}
    catch(error){return reply.code(409).send({error:'Assurance command rejected',code:error instanceof Error?error.message.slice(0,160):'ACTION_DENIED'});}
  });
  app.get('/api/pillow/assurance', {preHandler:authenticate}, async(request,reply)=>{
    reply.header('cache-control','private, no-store');
    const user=request.user;
    if(!user||user.role!=='founder'||user.workspaceId!=='ws_empire_1'||user.email.toLowerCase()!==env.FOUNDER_EMAIL.toLowerCase())return reply.code(403).send({error:'Owner access required'});
    if(process.env.EMPIRE_RUNTIME_PROFILE!=='LOCKED_COMMISSIONING_V1')return reply.code(404).send({error:'Unavailable'});
    try{
      const root=process.env.RAILWAY_VOLUME_MOUNT_PATH;
      if(!root||!root.startsWith('/')||fs.realpathSync(root)!==root)throw Error('Volume unavailable');
      const moduleUrl=new URL('../../src/assurance/owner-evidence.mjs',import.meta.url).href;
      const {readOwnerAssurance}=await import(moduleUrl);
      return reply.send({...readOwnerAssurance(root+'/commissioning/assurance.sqlite'),accounting:readback(),pillowCertification:readReasoningCertification(),...await readAdvancedAssurance(user.workspaceId)});
    }catch{return reply.code(503).send({status:'UNKNOWN',error:'Durable Assurance evidence unavailable'});}
  });
  app.get('/api/pillow/commissioning-accounting', { preHandler: authenticate }, async (request, reply) => {
    reply.header('cache-control', 'private, no-store');
    const user = request.user;
    if (!user || user.role !== 'founder' || user.workspaceId !== 'ws_empire_1' || user.email.toLowerCase() !== env.FOUNDER_EMAIL.toLowerCase()) return reply.code(403).send({ error: 'Owner access required' });
    if (process.env.EMPIRE_RUNTIME_PROFILE !== 'LOCKED_COMMISSIONING_V1') return reply.code(404).send({ error: 'Unavailable' });
    try { return reply.send(readback()); }
    catch { return reply.code(503).send({ error: 'Current accounting unavailable; allowance unknown' }); }
  });
}

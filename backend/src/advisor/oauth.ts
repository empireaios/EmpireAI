import { randomBytes,createHash } from 'node:crypto';
import type { FastifyInstance,FastifyRequest,FastifyReply } from 'fastify';
import { z } from 'zod';
import { digest } from './package.js';
import type { AdvisorStore } from './store.js';
export const issuer='https://empireai-locked-runtime-production.up.railway.app';
export const resource=issuer+'/advisor/mcp';
export const scope='empire.read';
const opaque=()=>randomBytes(32).toString('base64url');
const callback='https://chatgpt.com/connector_platform_oauth_redirect';
const authSchema=z.object({client_id:z.string().max(100),redirect_uri:z.literal(callback),response_type:z.literal('code'),scope:z.literal(scope),resource:z.literal(resource),state:z.string().min(16).max(512),code_challenge:z.string().regex(/^[A-Za-z0-9_-]{43}$/),code_challenge_method:z.literal('S256')}).strict();
// ChatGPT sends this optional display hint. Validate and discard it; it grants no authority.
const authorizationSchema=authSchema.extend({ui_locales:z.string().min(1).max(128).regex(/^[A-Za-z]{1,8}(?:-[A-Za-z0-9]{1,8})*(?: [A-Za-z]{1,8}(?:-[A-Za-z0-9]{1,8})*)*$/).optional()}).transform(({ui_locales: _locale,...authorization})=>authorization);
type OwnerAuth=(request:FastifyRequest,reply:FastifyReply)=>Promise<void>;
export function registerAdvisorOAuth(app:FastifyInstance,store:AdvisorStore,owner:OwnerAuth){
 app.get('/.well-known/oauth-protected-resource',async()=>({resource,authorization_servers:[issuer],scopes_supported:[scope],bearer_methods_supported:['header']}));
 app.get('/.well-known/oauth-authorization-server',async()=>({issuer,authorization_endpoint:issuer+'/advisor/oauth/authorize',token_endpoint:issuer+'/advisor/oauth/token',registration_endpoint:issuer+'/advisor/oauth/register',response_types_supported:['code'],grant_types_supported:['authorization_code'],token_endpoint_auth_methods_supported:['none'],code_challenge_methods_supported:['S256'],scopes_supported:[scope],authorization_response_iss_parameter_supported:true}));
 app.post('/advisor/oauth/register',{bodyLimit:2048},async(request,reply)=>{
  const p=z.object({redirect_uris:z.tuple([z.literal(callback)]),client_name:z.string().max(100).optional(),token_endpoint_auth_method:z.literal('none'),grant_types:z.array(z.enum(['authorization_code','refresh_token'])).max(2).optional(),response_types:z.tuple([z.literal('code')]).optional()}).strip().safeParse(request.body);
  if(!p.success)return reply.code(400).send({error:'invalid_client_metadata'});
  const id=opaque();
  store.use(db=>{db.prepare('DELETE FROM oauth_clients WHERE created<? AND id NOT IN (SELECT client FROM oauth_tokens)').run(Date.now()-86400000);if(Number(db.prepare('SELECT count(*) n FROM oauth_clients').get()?.n)>1000)throw Error('Registration capacity');db.prepare('INSERT INTO oauth_clients VALUES(?,?,?)').run(id,callback,Date.now());});
  return reply.code(201).send({client_id:id,redirect_uris:[callback],token_endpoint_auth_method:'none',grant_types:['authorization_code'],response_types:['code']});
 });
 app.get('/advisor/oauth/authorize',async(request,reply)=>{
  const p=authorizationSchema.safeParse(request.query);
  if(!p.success||!store.use(db=>db.prepare('SELECT id FROM oauth_clients WHERE id=?').get(p.data.client_id)))return reply.code(400).send({error:'invalid_request'});
  return reply.redirect('https://empire-ai.co/cockpit/advisor?'+new URLSearchParams(p.data).toString());
 });
 app.post('/api/owner/advisor/consent',{preHandler:owner,bodyLimit:4096},async(request,reply)=>{
  const p=authSchema.safeParse(request.body);if(!p.success)return reply.code(400).send({error:'invalid_request'});
  const client=store.use(db=>db.prepare('SELECT redirect FROM oauth_clients WHERE id=?').get(p.data.client_id));
  if(client?.redirect!==p.data.redirect_uri)return reply.code(400).send({error:'invalid_client'});
  const code=opaque();store.use(db=>{db.prepare('DELETE FROM oauth_codes WHERE expires<?').run(Date.now());db.prepare('INSERT INTO oauth_codes VALUES(?,?,?,?,?,?,?)').run(digest(code),p.data.client_id,p.data.redirect_uri,p.data.code_challenge,request.user!.id,request.user!.workspaceId,Date.now()+120000);});
  store.audit(request.user!.id,'AUTHORIZE_READ',p.data.client_id,'GRANTED');
  return {redirect:callback+'?'+new URLSearchParams({code,state:p.data.state,iss:issuer}).toString()};
 });
 app.addContentTypeParser('application/x-www-form-urlencoded',{parseAs:'string'},(_request,body,done)=>{try{done(null,Object.fromEntries(new URLSearchParams(String(body))));}catch{done(Error('Invalid form'));}});
 app.post('/advisor/oauth/token',{bodyLimit:4096},async(request,reply)=>{
  reply.header('cache-control','no-store');
  const p=z.object({grant_type:z.literal('authorization_code'),code:z.string().max(100),client_id:z.string().max(100),redirect_uri:z.literal(callback),resource:z.literal(resource),code_verifier:z.string().regex(/^[A-Za-z0-9._~-]{43,128}$/)}).strict().safeParse(request.body);
  if(!p.success)return reply.code(400).send({error:'invalid_request'});
  const token=opaque(),v=p.data;
  const ok=store.use(db=>{db.exec('BEGIN IMMEDIATE');try{const c=db.prepare('SELECT * FROM oauth_codes WHERE hash=?').get(digest(v.code));if(!c||c.client!==v.client_id||c.redirect!==v.redirect_uri||Number(c.expires)<Date.now()||c.challenge!==createHash('sha256').update(v.code_verifier).digest('base64url')){db.exec('ROLLBACK');return false;}db.prepare('DELETE FROM oauth_codes WHERE hash=?').run(digest(v.code));db.prepare('DELETE FROM oauth_tokens WHERE expires<?').run(Date.now());db.prepare('INSERT INTO oauth_tokens VALUES(?,?,?,?,?)').run(digest(token),v.client_id,String(c.owner),String(c.workspace),Date.now()+30*86400000);db.exec('COMMIT');return true;}catch(error){if(db.isTransaction)db.exec('ROLLBACK');throw error;}});
  if(!ok)return reply.code(400).send({error:'invalid_grant'});
  return {access_token:token,token_type:'Bearer',expires_in:30*86400,scope};
 });
 app.post('/api/owner/advisor/revoke',{preHandler:owner,bodyLimit:512},async(request)=>{
  const clientId=z.object({clientId:z.string().max(100).optional()}).strict().parse(request.body??{}).clientId;
  store.use(db=>{db.exec('BEGIN IMMEDIATE');try{for(const table of ['oauth_tokens','oauth_codes']){if(clientId)db.prepare('DELETE FROM '+table+' WHERE owner=? AND workspace=? AND client=?').run(request.user!.id,request.user!.workspaceId,clientId);else db.prepare('DELETE FROM '+table+' WHERE owner=? AND workspace=?').run(request.user!.id,request.user!.workspaceId);}db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');throw error;}});store.audit(request.user!.id,'REVOKE_READ',clientId??'all-owner-grants','REVOKED');return {revoked:true};
 });
}
export function authorizeAdvisor(store:AdvisorStore,header:unknown){
 if(typeof header!=='string'||!/^Bearer [A-Za-z0-9_-]{43}$/.test(header))return null;
 return store.use(db=>db.prepare('SELECT client,owner,workspace FROM oauth_tokens WHERE hash=? AND expires>?').get(digest(header.slice(7)),Date.now()))??null;
}

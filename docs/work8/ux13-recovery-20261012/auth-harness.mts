/** Isolated browser fixture: real auth + owner routes, same integrated disk transaction.
 * No production startup, schedulers, provider calls, Redis or deployment.
 */
import { mkdtempSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {pathToFileURL} from "node:url";
const source=process.argv[2];if(!source)throw Error("Exact backend source path required");
import { execFileSync } from "node:child_process";

if (process.env.NODE_ENV === "production" || process.env.RAILWAY_DEPLOYMENT_ID || process.env.VERCEL) {
  throw new Error("Offline browser harness cannot run on hosted production");
}
const dir = mkdtempSync(join(tmpdir(), "pillow-commerce-browser-"));
mkdirSync(join(dir,'commissioning'));
const database = join(dir,"brain.sqlite");
process.env.NODE_ENV = "test";
process.env.DATABASE_PATH = database;
process.env.INTELLIGENCE_DISABLED='true';
process.env.CORS_ORIGIN = "http://localhost:3113";
process.env.RAILWAY_VOLUME_MOUNT_PATH=dir; process.env.EMPIRE_RUNTIME_PROFILE='LOCKED_COMMISSIONING_V1'; process.env.EMPIRE_ENGINEERING_TEST_MODE='true'; process.env.FOUNDER_EMAIL='offline-owner@example.test';
globalThis.fetch = async () => { throw new Error("Provider/network calls disabled in offline browser harness"); };
const [{default:Fastify},{default:cookie},{InMemorySessionStore},{createAuthMiddleware},
  {registerAuthRoutes},{registerPillowCommercePresaleRoutes},{closeDatabase}] = await Promise.all([
  import(pathToFileURL(source+'/backend/node_modules/fastify/fastify.js').href),import(pathToFileURL(source+'/backend/node_modules/@fastify/cookie/plugin.js').href),import(pathToFileURL(source+'/backend/src/auth/session-store.js').href),
  import(pathToFileURL(source+'/backend/src/auth/middleware.js').href),import(pathToFileURL(source+'/backend/src/auth/routes.js').href),
  import(pathToFileURL(source+'/backend/src/orchestration/pillow-commerce-presale/routes/pillow-commerce-presale-routes.js').href),
  import(pathToFileURL(source+'/backend/src/brain/database.js').href),
]);
const {UserStore}=await import(pathToFileURL(source+'/backend/src/auth/session-store.js').href);
const {hashPassword}=await import(pathToFileURL(source+'/backend/src/auth/seed-users.js').href);
const {getDatabase}=await import(pathToFileURL(source+'/backend/src/brain/database.js').href);
const examUser=new UserStore(getDatabase()).create({email:'offline-owner@example.test',name:'Offline owner',role:'founder',workspaceId:'ws_empire_1',passwordHash:await hashPassword('offline-browser-only')});
const app=Fastify();
await app.register(cookie);
app.addHook("onRequest",async(request,reply)=>{
  if (request.method!=="GET" && !["/auth/login","/auth/logout","/api/owner/commerce","/exam/retained-reply"].includes(request.url)) {
    return reply.code(405).send({error:"Read-only offline harness"});
  }
});
const sessionStore=new InMemorySessionStore(), auditLogger={write:()=>{}} as never;
await registerAuthRoutes(app,{sessionStore,auditLogger});
await registerPillowCommercePresaleRoutes(app,{authenticate:createAuthMiddleware(sessionStore),auditLogger});
const {registerGovernedCommerce,productionCommerce}=await import(pathToFileURL(source+'/backend/src/runtime/commerce-runtime/governed/runtime.ts').href);
registerGovernedCommerce(app,createAuthMiddleware(sessionStore));
const c=productionCommerce(),p={workspace:'ws_empire_1',owner:examUser.id};
const {digest}=await import(pathToFileURL(source+'/backend/src/runtime/commerce-runtime/governed/store.ts').href);
const {acceptDurableChatRequest,completeChatRequest,configureChatRequestStore}=await import(pathToFileURL(source+'/backend/src/runtime/pillow-chat-request-store.ts').href);
configureChatRequestStore(null);
c.twin.transition(p,{id:'create',sessionId:'preview-exam',expectedVersion:0,action:'CREATE'});
app.post('/exam/retained-reply',{preHandler:createAuthMiddleware(sessionStore)},async(req,reply)=>{
 if(req.user?.id!==examUser.id)return reply.code(403).send({error:'isolated exam owner only'});
 const body=req.body as {requestMessage:string;contextDigest:string};
 const request=await acceptDurableChatRequest({sessionId:'synthetic-chat',ownerId:p.owner,workspaceId:p.workspace,message:body.requestMessage,requestId:'pcr_labelled_synthetic_preview'});
 const message=JSON.stringify({schema:'WORK8_UX_PROPOSAL_V1',contextDigest:body.contextDigest,color:'BLUE',rationale:'Explicit synthetic saved model-response fixture, no provider call or actual model assessment.'});
 await completeChatRequest(request.requestId,{kind:'llm',message,fixtureClassification:'LABELLED_SYNTHETIC_NO_PROVIDER_CALL'});
 return {requestId:request.requestId,responseDigest:digest(message),classification:'LABELLED_SYNTHETIC_NO_PROVIDER_CALL'};
});
await app.listen({host:"127.0.0.1",port:4113});
console.log("OFFLINE_FIXTURE backend http://127.0.0.1:4113; browser login offline-owner@example.test / offline-browser-only; expires in 15 minutes");
let stopping=false;
async function stop() {
  if(stopping)return; stopping=true;
  await app.close(); closeDatabase(); rmSync(dir,{recursive:true,force:true}); process.exit(0);
}
process.on("SIGINT",()=>void stop()); process.on("SIGTERM",()=>void stop());
setTimeout(()=>void stop(),15*60_000).unref();

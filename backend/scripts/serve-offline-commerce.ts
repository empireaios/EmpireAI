/** Isolated browser fixture: real auth + owner routes, same integrated disk transaction.
 * No production startup, schedulers, provider calls, Redis or deployment.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

if (process.env.NODE_ENV === "production" || process.env.RAILWAY_DEPLOYMENT_ID || process.env.VERCEL) {
  throw new Error("Offline browser harness cannot run on hosted production");
}
const dir = mkdtempSync(join(tmpdir(), "pillow-commerce-browser-"));
const database = join(dir,"brain.sqlite");
process.env.NODE_ENV = "test";
process.env.DATABASE_PATH = database;
process.env.CORS_ORIGIN = "http://127.0.0.1:3100";
try {
  execFileSync(process.execPath,["--import","tsx","--test","src/validation/tests/pillow-commerce-presale.test.ts"],{
    cwd:resolve(import.meta.dirname,".."),timeout:60_000,stdio:"pipe",
    env:{...process.env,PILLOW_COMMERCE_FIXTURE_EXPORT:database},
  });
} catch (error) { rmSync(dir,{recursive:true,force:true}); throw error; }
globalThis.fetch = async () => { throw new Error("Provider/network calls disabled in offline browser harness"); };
const [{default:Fastify},{default:cookie},{InMemorySessionStore},{createAuthMiddleware},
  {registerAuthRoutes},{registerPillowCommercePresaleRoutes},{closeDatabase}] = await Promise.all([
  import("fastify"),import("@fastify/cookie"),import("../src/auth/session-store.js"),
  import("../src/auth/middleware.js"),import("../src/auth/routes.js"),
  import("../src/orchestration/pillow-commerce-presale/routes/pillow-commerce-presale-routes.js"),
  import("../src/brain/database.js"),
]);
const app=Fastify();
await app.register(cookie);
app.addHook("onRequest",async(request,reply)=>{
  if (request.method!=="GET" && !["/auth/login","/auth/logout"].includes(request.url)) {
    return reply.code(405).send({error:"Read-only offline harness"});
  }
});
const sessionStore=new InMemorySessionStore(), auditLogger={write:()=>{}} as never;
await registerAuthRoutes(app,{sessionStore,auditLogger});
await registerPillowCommercePresaleRoutes(app,{authenticate:createAuthMiddleware(sessionStore),auditLogger});
await app.listen({host:"127.0.0.1",port:4100});
console.log("OFFLINE_FIXTURE backend http://127.0.0.1:4100; browser login offline-owner@example.test / offline-browser-only; expires in 15 minutes");
let stopping=false;
async function stop() {
  if(stopping)return; stopping=true;
  await app.close(); closeDatabase(); rmSync(dir,{recursive:true,force:true}); process.exit(0);
}
process.on("SIGINT",()=>void stop()); process.on("SIGTERM",()=>void stop());
setTimeout(()=>void stop(),15*60_000).unref();

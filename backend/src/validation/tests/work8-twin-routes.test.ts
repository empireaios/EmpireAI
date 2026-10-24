import test from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import {registerWork8TwinRoutes} from '../../runtime/commerce-runtime/governed/work8-twin-routes.js';
import {Work8TwinSessions} from '../../runtime/commerce-runtime/governed/work8-twin.js';
import {GovernedCommerceStore} from '../../runtime/commerce-runtime/governed/store.js';
import {createAuthMiddleware} from '../../auth/middleware.js';
import {InMemorySessionStore} from '../../auth/session-store.js';

// Entirely local fixture sessions; no browser, owner credential or external session service.
test('twin read route requires session and owner and derives identity only from authenticated principal',async()=>{
 const store=new GovernedCommerceStore(':memory:'),twin=new Work8TwinSessions(store),app=Fastify(),sessions=new InMemorySessionStore();
 const user={id:'test-owner',workspaceId:'test-workspace',email:'owner@example.invalid',name:'Fixture',role:'founder' as const};
 const token=(await sessions.create(user)).token,headers={authorization:'Bearer '+token};
 registerWork8TwinRoutes(app,{authenticate:createAuthMiddleware(sessions),sessions:()=>twin,owner:async(req,reply)=>{
  if(req.user?.role!=='founder'||req.user.workspaceId!==user.workspaceId||req.user.email!==user.email)return reply.code(403).send({error:'Owner access required'});
 }});
 twin.transition({workspace:user.workspaceId,owner:user.id},{id:'create',sessionId:'examination',expectedVersion:0,action:'CREATE'});
 try{
  const url='/api/owner/commerce/twin?sessionId=examination';
  assert.equal((await app.inject({url})).statusCode,401);
  for(const patch of [{role:'admin' as const},{workspaceId:'other'},{email:'other@example.invalid'}]){
   const t=(await sessions.create({...user,...patch})).token;
   assert.equal((await app.inject({url,headers:{authorization:'Bearer '+t}})).statusCode,403);
  }
  const ok=await app.inject({url,headers});assert.equal(ok.statusCode,200);assert.equal(ok.headers['cache-control'],'private, no-store');
  assert.equal((await app.inject({url:'/api/owner/commerce/twin',headers})).json().sessions[0].sessionId,'examination');
  assert.equal(ok.json().session.owner,user.id);assert.equal(ok.json().session.status,'PAUSED');assert.equal(ok.json().actualCashMovement,0);
  for(const tail of ['&workspace=other','&owner=other','&limit=101','&sessionId=duplicate'])assert.equal((await app.inject({url:url+tail,headers})).statusCode,400);
  assert.equal((await app.inject({url:'/api/owner/commerce/twin?sessionId=missing',headers})).statusCode,404);
  const sameEmailDifferentIdentity=(await sessions.create({...user,id:'other-owner'})).token;
  assert.equal((await app.inject({url,headers:{authorization:'Bearer '+sameEmailDifferentIdentity}})).statusCode,403);
  // This endpoint cannot mutate lifecycle or execute effects, even with authenticated credentials.
  assert.equal((await app.inject({method:'POST',url:'/api/owner/commerce/twin',headers,payload:{action:'RESUME'}})).statusCode,404);
  assert.equal(twin.read({workspace:user.workspaceId,owner:user.id},'examination').status,'PAUSED');
 }finally{await app.close();store.close();}
});

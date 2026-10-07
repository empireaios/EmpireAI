import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import Fastify from 'fastify';
import {AdvisorStore} from '../../advisor/store.js';
import {registerAdvisorOAuth,authorizeAdvisor,resource,scope} from '../../advisor/oauth.js';

test('ChatGPT ui_locales authorization reaches consent without changing OAuth security',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'advisor-oauth-client-'));
 const store=new AdvisorStore(path.join(root,'proof.sqlite')),app=Fastify();
 registerAdvisorOAuth(app,store,async(req,reply)=>{
  if(req.headers.authorization!=='Bearer owner-fixture'){await reply.code(401).send({error:'Unauthorized'});return;}
  req.user={id:'owner-fixture',workspaceId:'workspace-fixture'} as typeof req.user;
 });
 const post=(url:string,payload:object,owner=false)=>app.inject({method:'POST',url,payload,headers:owner?{authorization:'Bearer owner-fixture'}:{}});
 try{
  const redirect='https://chatgpt.com/connector_platform_oauth_redirect';
  const registration=await post('/advisor/oauth/register',{redirect_uris:[redirect],token_endpoint_auth_method:'none'});
  const client_id=registration.json().client_id,verifier='v'.repeat(64);
  const auth={response_type:'code',client_id,redirect_uri:redirect,scope,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256',resource,state:'s'.repeat(32),ui_locales:'en-US'};
  const authorize=(params:Record<string,string>)=>app.inject({method:'GET',url:'/advisor/oauth/authorize?'+new URLSearchParams(params)});
  for(const locale of ['en-US','en-US en','zh-Hant-TW']){
   const response=await authorize({...auth,ui_locales:locale});assert.equal(response.statusCode,302,response.body);
   const target=new URL(String(response.headers.location));assert.equal(target.origin,'https://empire-ai.co');assert.equal(target.pathname,'/cockpit/advisor');
   assert.equal(target.searchParams.has('ui_locales'),false);
   for(const [key,value] of Object.entries(auth))if(key!=='ui_locales')assert.equal(target.searchParams.get(key),value);
  }
  const {ui_locales,...plain}=auth;assert.equal((await authorize(plain)).statusCode,302);
  for(const patch of [{client_id:'unknown'},{redirect_uri:'https://evil.example/callback'},{scope:'empire.write'},{resource:'https://evil.example/mcp'},{state:''},{code_challenge:'bad'},{code_challenge_method:'plain'},{response_type:'token'},{ui_locales:'x'.repeat(129)},{ui_locales:'en-US\r\nLocation: evil'},{extra:'not-allowed'}] as Record<string,string>[])assert.equal((await authorize({...auth,...patch})).statusCode,400,JSON.stringify(patch));
  const duplicate=await app.inject({method:'GET',url:'/advisor/oauth/authorize?'+new URLSearchParams(auth)+'&ui_locales=en'});assert.equal(duplicate.statusCode,400);
  assert.equal((await post('/api/owner/advisor/consent',plain)).statusCode,401);
  const consent=await post('/api/owner/advisor/consent',plain,true);assert.equal(consent.statusCode,200);
  const callback=new URL(consent.json().redirect);assert.equal(callback.searchParams.get('state'),auth.state);
  const exchange={grant_type:'authorization_code',code:callback.searchParams.get('code'),client_id,redirect_uri:redirect,resource,code_verifier:verifier};
  for(const patch of [{code_verifier:'z'.repeat(64)},{client_id:'unknown'},{redirect_uri:'https://evil.example/callback'},{resource:'https://evil.example/mcp'}])assert.equal((await post('/advisor/oauth/token',{...exchange,...patch})).statusCode,400);
  const token=await post('/advisor/oauth/token',exchange);assert.equal(token.statusCode,200);assert.equal(token.json().scope,scope);
  assert.equal((await post('/advisor/oauth/token',exchange)).statusCode,400);
  const bearer='Bearer '+token.json().access_token;assert.equal(authorizeAdvisor(store,bearer)?.workspace,'workspace-fixture');
  await post('/api/owner/advisor/revoke',{clientId:client_id},true);assert.equal(authorizeAdvisor(store,bearer),null);
 }finally{await app.close();fs.rmSync(root,{recursive:true,force:true});}
});

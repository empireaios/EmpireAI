import {proxyBrainRequest} from '../brain/server-proxy';
import {verifyOwnerRuntime} from './runtime-identity.mjs';

const headers={'cache-control':'private, no-store','content-type':'text/html; charset=utf-8',
 'content-security-policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
 'x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const escape=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

/** Authenticated historical simulation only; no browser script, mutation or arbitrary proxy. */
export async function recoveryCommerceGET(request:Request):Promise<Response>{
 const url=new URL(request.url),query=url.searchParams,sessionId=query.get('sessionId')??'';
 if([...query.keys()].join(',')!=='sessionId'||!/^[A-Za-z0-9_.:-]{1,100}$/.test(sessionId))return new Response('One valid session ID is required.',{status:400,headers});
 try{
  // proxyBrainRequest forwards the session cookie only, never a caller owner/workspace header.
  const history=await proxyBrainRequest('/api/owner/recovery/commerce?sessionId='+encodeURIComponent(sessionId),request,{method:'GET',upstreamTimeoutMs:10000});
  if(!history.ok)return new Response('Authenticated recovery history unavailable.',{status:history.status,headers});
  const [live,ready]=await Promise.all(['/health/live','/health/ready'].map(p=>proxyBrainRequest(p,request,{method:'GET',upstreamTimeoutMs:10000})));
  if(!live.ok||!ready.ok||!verifyOwnerRuntime(await live.json(),await ready.json()))return new Response('Recovery pair or write restriction is not verified.',{status:503,headers});
  const data=await history.json();
  if(data.schema!=='WORK8_RECOVERY_COMMERCE_V1'||data.readOnly!==true||data.liveCommerce!=='LOCKED'||data.birth!=='NOT_BORN'||data.actualCashMovement!==0||!Array.isArray(data.records))return new Response('Recovery history could not be verified.',{status:503,headers});
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Historical simulated orders</title><style>body{font:16px system-ui;max-width:70rem;margin:auto;padding:1rem;color:#eee;background:#101820}pre{white-space:pre-wrap;overflow-wrap:anywhere}main{min-width:0}</style></head><body><main><h1>Historical simulated orders — read only</h1><p>Simulation only. No actual revenue, payments, fulfilment or movement of goods is established. Only committed financial events are shown; future planned events have not occurred.</p><p>Owner writes remain restricted. Pillow NOT_BORN; commerce LOCKED. Viewing this history grants no execution authority.</p><pre>${escape(JSON.stringify(data,null,2))}</pre></main></body></html>`,{status:200,headers});
 }catch{return new Response('Recovery identity or history unavailable.',{status:503,headers});}
}

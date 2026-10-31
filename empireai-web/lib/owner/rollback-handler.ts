import {advisorProxy} from './advisor-handler';
import {proxyBrainRequest} from '../brain/server-proxy';
import {verifyOwnerRuntime} from './runtime-identity.mjs';

const headers = {'cache-control':'private, no-store', 'content-type':'text/html; charset=utf-8',
  'content-security-policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  'x-content-type-options':'nosniff', 'referrer-policy':'no-referrer'};
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

/** Dedicated recovery view: same authenticated BFF, no decision controls or scripts. */
export async function rollbackGET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const id = url.searchParams.get('id') ?? '';
  if (id && !/^[A-Za-z0-9_.:-]{1,160}$/.test(id)) return new Response('Invalid record ID',{status:400,headers});
  const upstream = new URL('/api/owner/advisor/read',url.origin);
  upstream.searchParams.set('domain','memory');
  if (id) upstream.searchParams.set('id',id);
  // This call keeps the existing founder/workspace authentication; health alone is insufficient.
  const history = await advisorProxy(new Request(upstream,{headers:request.headers}),['read']);
  if (!history.ok) return new Response('Authenticated history unavailable. Sign in using the existing login page.',{status:history.status,headers});
  try {
    const [live,ready] = await Promise.all(['/health/live','/health/ready'].map(p=>proxyBrainRequest(p,request,{method:'GET',upstreamTimeoutMs:10000})));
    if (!live.ok || !ready.ok || !verifyOwnerRuntime(await live.json(),await ready.json()))
      return new Response('Recovery pair is not verified or writes are not restricted.',{status:503,headers});
    const data = await history.json();
    return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>EmpireAI recovery history</title><style>body{font:16px system-ui;max-width:70rem;margin:auto;padding:1rem;color:#eee;background:#101820}pre{white-space:pre-wrap;overflow-wrap:anywhere}input,button{font:inherit;max-width:100%;box-sizing:border-box;padding:.5rem}label{display:block}main{min-width:0}</style></head><body><main><h1>Recovery history — read only</h1><p>Owner decisions are restricted. Pillow NOT_BORN; commerce LOCKED.</p><form method="get"><label>Record ID <input name="id" maxlength="160" value="${escape(id)}"></label><button type="submit">Read history</button></form><pre>${escape(JSON.stringify(data,null,2))}</pre></main></body></html>`,{status:200,headers});
  } catch { return new Response('Recovery identity or history unavailable.',{status:503,headers}); }
}

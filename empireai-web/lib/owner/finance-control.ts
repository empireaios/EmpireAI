import {proxyBrainRequest} from '@/lib/brain/server-proxy';

export function isSameOriginOwnerRequest(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const requestURL = new URL(request.url), suppliedOrigin = new URL(origin);
    if (!['http:', 'https:'].includes(requestURL.protocol) || suppliedOrigin.origin !== origin) return false;
    // Next normalizes loopback Request URLs to localhost. The inbound Host
    // remains the browser's actual authority; forwarded-host headers are not trusted.
    const host = request.headers.get('host');
    if (host === null) return origin === requestURL.origin;
    if (!host || host.length > 255 || /[\s,/@\\?#]/.test(host)) return false;
    const target = new URL(requestURL.protocol + '//' + host);
    if (target.host !== host.toLowerCase() || target.username || target.password) return false;
    return origin === target.origin;
  } catch { return false; }
}

export async function financePost(request:Request,endpoint:string){const deny=(error:string,status:number)=>Response.json({error},{status,headers:{'cache-control':'private, no-store'}});if(!isSameOriginOwnerRequest(request))return deny('Same-origin required',403);if(!request.headers.get('content-type')?.startsWith('application/json'))return deny('JSON required',415);try{const reader=request.body?.getReader();let n=0;const parts:Uint8Array[]=[];if(reader)while(true){const chunk=await reader.read();if(chunk.done)break;n+=chunk.value.byteLength;if(n>64000){await reader.cancel();return deny('Evidence too large',413);}parts.push(chunk.value);}const body=Buffer.concat(parts).toString('utf8');JSON.parse(body);return proxyBrainRequest(endpoint,request,{method:'POST',headers:{'content-type':'application/json'},body,upstreamTimeoutMs:15000});}catch{return deny('Result unconfirmed; refresh before retrying the same record ID',503);}}

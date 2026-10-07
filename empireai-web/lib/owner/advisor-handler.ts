import {resolveBrainApiUrl} from '../brain/server-proxy';
export async function advisorProxy(request:Request,segments:string[]):Promise<Response>{
 const route=segments.join('/');
 const allowed=request.method==='GET'?(route==='read'||/^result\/[A-Za-z0-9_-]{1,100}$/.test(route)):request.method==='POST'&&['validate','import','consent','revoke'].includes(route);
 const headers={'cache-control':'private, no-store'};
 if(!allowed)return Response.json({error:'Route unavailable'},{status:404,headers});
 if(request.method==='POST'&&request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Same-origin request required'},{status:403,headers});
 const raw=request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith('empireai_session='))?.slice(17);
 if(!raw)return Response.json({error:'Sign in to continue'},{status:401,headers});
 try{
  let body:string|undefined;
  if(request.method==='POST'){
   const reader=request.body?.getReader();const parts:Uint8Array[]=[];let bytes=0;
   if(reader)while(true){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.byteLength;if(bytes>96000){await reader.cancel();return Response.json({error:'Package too large'},{status:413,headers});}parts.push(chunk.value);}
   body=Buffer.concat(parts).toString('utf8');
  }
  const upstream=await fetch(resolveBrainApiUrl()+'/api/owner/advisor/'+route+new URL(request.url).search,{method:request.method,headers:{authorization:'Bearer '+decodeURIComponent(raw),'content-type':'application/json'},body,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});
  return new Response(upstream.body,{status:upstream.status,headers:{...headers,'content-type':'application/json'}});
 }catch{return Response.json({error:'Advisor service unavailable. No completion is confirmed.'},{status:503,headers});}
}

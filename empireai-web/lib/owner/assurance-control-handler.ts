import {proxyBrainRequest} from '../brain/server-proxy';
import {validateOwnerCommand,validateEngineeringCommand} from './assurance-contract';
export async function assuranceControl(request:Request):Promise<Response>{
 const deny=(error:string,status:number)=>Response.json({error},{status,headers:{'cache-control':'private, no-store'}});
 if(request.method!=='POST'||new URL(request.url).search)return deny('Unsupported request',400);
 if(request.headers.get('origin')!==new URL(request.url).origin)return deny('Same-origin request required',403);
 if(!request.headers.get('cookie')?.split(';').some(c=>/^empireai_session=.+/.test(c.trim())))return deny('Sign in to continue',401);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return deny('JSON required',415);
 try{
  const reader=request.body?.getReader();let bytes=0;const parts:Uint8Array[]=[];
  if(reader)while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>16384){await reader.cancel();return deny('Command too large',413);}parts.push(part.value);}
  const value=JSON.parse(Buffer.concat(parts).toString('utf8'));
  if(!validateOwnerCommand(value)&&!validateEngineeringCommand(value))return deny('Invalid owner command',400);
  const response=await proxyBrainRequest('/api/pillow/assurance/control',request,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(value),upstreamTimeoutMs:15000});
  response.headers.set('cache-control','private, no-store');return response;
 }catch{return deny('Command outcome unconfirmed. Check the action receipt before retrying.',503);}
}

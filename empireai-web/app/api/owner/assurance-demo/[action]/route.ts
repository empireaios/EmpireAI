import {proxyBrainRequest} from '@/lib/brain/server-proxy';
export const runtime='nodejs';
export async function POST(request:Request,{params}:{params:Promise<{action:string}>}){
 const {action}=await params;
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Same-origin request required'},{status:403});
 if(!['inject','correct'].includes(action))return Response.json({error:'Invalid action'},{status:400});
 return proxyBrainRequest('/api/pillow/assurance-demo/'+action,request,{method:'POST',cache:'no-store',upstreamTimeoutMs:10000});
}

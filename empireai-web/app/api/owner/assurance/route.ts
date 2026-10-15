import {proxyBrainRequest} from '@/lib/brain/server-proxy';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 if(new URL(request.url).search)return Response.json({error:'Unsupported request'},{status:400});
 return proxyBrainRequest('/api/pillow/assurance',request,{method:'GET',cache:'no-store',upstreamTimeoutMs:10000});
}

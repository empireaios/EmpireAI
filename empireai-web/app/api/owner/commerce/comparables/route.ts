import {proxyBrainRequest} from '@/lib/brain/server-proxy';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){return proxyBrainRequest('/api/owner/commerce/comparables',request,{method:'GET',cache:'no-store',upstreamTimeoutMs:15000});}

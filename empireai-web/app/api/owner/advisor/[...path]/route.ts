import {advisorProxy} from '@/lib/owner/advisor-handler';
export const runtime='nodejs';
export const dynamic='force-dynamic';
async function handle(request:Request,{params}:{params:Promise<{path:string[]}>}){return advisorProxy(request,(await params).path);}
export const GET=handle;
export const POST=handle;

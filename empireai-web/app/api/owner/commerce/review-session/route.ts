import {proxyOwnerReview} from '@/lib/owner/review-proxy';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){return proxyOwnerReview(request,false);}

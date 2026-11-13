import {proxyOwnerReview} from '@/lib/owner/review-proxy';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request){return proxyOwnerReview(request,true);}

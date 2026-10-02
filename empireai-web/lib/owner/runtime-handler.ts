import {proxyBrainRequest, resolveBrainApiUrl} from '../brain/server-proxy';
import {ownerOverviewGET} from './route-handler';
const headers = {'cache-control':'private, no-store'};
export async function ownerRuntimeGET(request: Request): Promise<Response> {
 const access = await ownerOverviewGET(request);
 if (!access.ok) return access;
 try {
  const [live, ready] = await Promise.all(['/health/live','/health/ready'].map(path => proxyBrainRequest(path,request,{method:'GET',upstreamTimeoutMs:10_000})));
  if (!live.ok || !ready.ok) throw new Error('Runtime unavailable');
  const identity = await live.json(); const state = await ready.json();
  const verified = ['d6e69910384a00b11711a50ccbc2d70826549fa5', '807a54eab8b62cfdec4c7aea1f6e8966671dddaa', 'af0efc15cfb228b718a716cffa26a8caf3ee443b', 'be2423ee711e1866d1a4b21dcde133155aaffb07', '4eb442823d219b26908c6e3fdd9ce1c1ffdf209b', '8dcc9284d1222aacc51908ca177c0f01154ac6c0'].includes(identity.deploy?.gitCommitSha) && state.birth === 'NOT_BORN' && state.commerce === 'LOCKED' && state.operational === false;
  return Response.json({verified,checkedAt:new Date().toISOString(),backend:resolveBrainApiUrl(),backendRevision:identity.deploy?.gitCommitSha,frontendRevision:process.env.VERCEL_GIT_COMMIT_SHA ?? null,transportReady:state.ready === true,readinessScope:state.readinessScope,birth:state.birth,commerce:state.commerce,operational:state.operational},{status:verified?200:503,headers});
 } catch { return Response.json({error:'Live runtime identity unavailable; readiness is unknown'},{status:503,headers}); }
}

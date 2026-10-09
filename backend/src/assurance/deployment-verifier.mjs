import {createHash} from 'node:crypto';

// Server-side, read-only platform verification. Caller text is never evidence.
// Credentials are optional at startup; missing credentials keep the lease closed.
export function createDeploymentVerifier({env=process.env,fetcher=fetch,now=Date.now}={}) {
 return async ({workspace,lease,revision,ownerId})=>{
  if(env.EMPIRE_RUNTIME_PROFILE!=='LOCKED_COMMISSIONING_V1'||workspace!=='ws_empire_1'||!lease||lease.ownerId!==ownerId||lease.status!=='ACTIVE'||lease.expiresAt>now())throw Error('LEASE_PRECONDITION');
  const required=['ASSURANCE_RAILWAY_PROJECT_TOKEN','ASSURANCE_VERCEL_READ_TOKEN','RAILWAY_PROJECT_ID','RAILWAY_ENVIRONMENT_ID','RAILWAY_SERVICE_ID','RAILWAY_DEPLOYMENT_ID','ASSURANCE_VERCEL_PROJECT_ID','ASSURANCE_VERCEL_TEAM_ID','ASSURANCE_VERCEL_PRODUCTION_HOST'];
  if(required.some(k=>typeof env[k]!=='string'||!env[k]))throw Error('DEPLOYMENT_VERIFIER_UNCONFIGURED');
  if(!/^[a-f0-9]{40}$/.test(revision)||revision!==env.RAILWAY_GIT_COMMIT_SHA||lease.scope.some(s=>!['backend','frontend'].includes(s)))throw Error('DEPLOYMENT_SCOPE_INVALID');
  const startedAt=now(),signal=AbortSignal.timeout(10000);
  const json=async(url,options,stageOverride)=>{
   const stage=stageOverride??(url.includes('backboard.railway.com')?'RAILWAY_READ':url.includes('/v13/')?'VERCEL_ALIAS':'VERCEL_HISTORY');
   const fail=(code)=>Object.assign(Error(code),{diagnostic:{stage,code}});
   try{
   const r=await fetcher(url,{...options,signal,redirect:'error',cache:'no-store'});
   if(!r.ok)throw fail('HTTP_'+(Number.isInteger(r.status)?r.status:'UNKNOWN'));
   const body=await r.text();if(body.length>1048576)throw Error('PLATFORM_RESPONSE_BOUND');
   const value=JSON.parse(body);
   if(value.errors?.length||value.error){
    // Map only documented, fixed provider errors. Never retain free-form messages.
    const errors=Array.isArray(value.errors)?value.errors:[];
    const known=new Set(['GRAPHQL_PARSE_FAILED','GRAPHQL_VALIDATION_FAILED','BAD_USER_INPUT','INTERNAL_SERVER_ERROR']);
    const denied=errors.some(e=>e?.message==='Not Authorized');
    const providerCode=errors.find(e=>known.has(e?.extensions?.code))?.extensions.code;
    throw fail(denied?'AUTHORIZATION_DENIED':providerCode??'API_ERROR');
   }
   return value;
   }catch(error){if(error?.diagnostic)throw error;throw fail(error?.name==='TimeoutError'||signal.aborted?'TIMEOUT':'RESPONSE_OR_NETWORK_ERROR');}
  };
  const railway=async(query,variables,stage='RAILWAY_READ')=>{
   const result=await json('https://backboard.railway.com/graphql/v2',{method:'POST',headers:{'content-type':'application/json','Project-Access-Token':env.ASSURANCE_RAILWAY_PROJECT_TOKEN},body:JSON.stringify({query,variables})},stage);
   if(!result.data)throw Error('PLATFORM_READ_FAILED');return result.data;
  };
  const vercel=async(path,params={})=>json('https://api.vercel.com'+path+'?'+new URLSearchParams({teamId:env.ASSURANCE_VERCEL_TEAM_ID,...params}),{method:'GET',headers:{Authorization:'Bearer '+env.ASSURANCE_VERCEL_READ_TOKEN}});
  const tokenScope=await railway('query LeaseTokenScope { projectToken { projectId environmentId } }',{},'RAILWAY_AUTH');
  if(tokenScope.projectToken?.projectId!==env.RAILWAY_PROJECT_ID||tokenScope.projectToken?.environmentId!==env.RAILWAY_ENVIRONMENT_ID)throw Object.assign(Error('TOKEN_SCOPE_MISMATCH'),{diagnostic:{stage:'RAILWAY_AUTH',code:'TOKEN_SCOPE_MISMATCH'}});
  // Enumerate the complete bounded history, not merely the newest successful row.
  const deploymentQuery=`query LeaseDeployments($input: DeploymentListInput!, $after: String) { deployments(input:$input, first:50, after:$after) { edges { node { id status meta } } pageInfo { hasNextPage endCursor } } }`;
  const railwayRows=[];let after=null,complete=false;
  for(let page=0;page<10;page++){
   const data=await railway(deploymentQuery,{input:{projectId:env.RAILWAY_PROJECT_ID,environmentId:env.RAILWAY_ENVIRONMENT_ID,serviceId:env.RAILWAY_SERVICE_ID},after});
   const connection=data.deployments;if(!Array.isArray(connection?.edges)||typeof connection.pageInfo?.hasNextPage!=='boolean')throw Error('PLATFORM_COVERAGE_UNKNOWN');
   railwayRows.push(...connection.edges.map(e=>e.node));
   if(!connection.pageInfo.hasNextPage){complete=true;break;}
   if(!connection.pageInfo.endCursor||connection.pageInfo.endCursor===after)throw Error('PLATFORM_COVERAGE_UNKNOWN');after=connection.pageInfo.endCursor;
  }
  if(!complete)throw Error('PLATFORM_COVERAGE_BOUND');
  const terminal=new Set(['SUCCESS','REMOVED','FAILED','CRASHED','SKIPPED']);
  if(railwayRows.some(r=>!terminal.has(r.status)))throw Error('DEPLOYMENT_IN_PROGRESS');
  const running=railwayRows.filter(r=>r.status==='SUCCESS');
  if(running.length!==1||running[0].id!==env.RAILWAY_DEPLOYMENT_ID||running[0].meta?.commitHash!==revision)throw Error('DEPLOYMENT_IDENTITY_MISMATCH');
  const frontend=await vercel('/v13/deployments/'+encodeURIComponent(env.ASSURANCE_VERCEL_PRODUCTION_HOST));
  if(frontend.readyState!=='READY'||frontend.target!=='production'||frontend.projectId!==env.ASSURANCE_VERCEL_PROJECT_ID||!frontend.alias?.includes(env.ASSURANCE_VERCEL_PRODUCTION_HOST)||!/^[a-f0-9]{40}$/.test(frontend.meta?.githubCommitSha??''))throw Error('DEPLOYMENT_IDENTITY_MISMATCH');
  const vercelRows=[];let until,vercelComplete=false;
  for(let page=0;page<10;page++){
   const data=await vercel('/v7/deployments',{projectId:env.ASSURANCE_VERCEL_PROJECT_ID,target:'production',limit:'100',...(until?{until:String(until)}:{})});
   if(!Array.isArray(data.deployments)||!data.pagination)throw Error('PLATFORM_COVERAGE_UNKNOWN');vercelRows.push(...data.deployments);
   if(data.pagination.next===null){vercelComplete=true;break;}
   if(!Number.isFinite(data.pagination.next)||data.pagination.next===until)throw Error('PLATFORM_COVERAGE_UNKNOWN');until=data.pagination.next;
  }
  if(!vercelComplete)throw Error('PLATFORM_COVERAGE_BOUND');
  if(vercelRows.some(r=>!['READY','ERROR','CANCELED'].includes(r.state)))throw Error('DEPLOYMENT_IN_PROGRESS');
  if(!vercelRows.some(r=>r.uid===frontend.id&&r.state==='READY'))throw Error('DEPLOYMENT_IDENTITY_MISMATCH');
  if(now()-startedAt>10000||now()<startedAt)throw Error('DEPLOYMENT_EVIDENCE_STALE');
  const evidence={workspace,ownerId,leaseId:lease.id,fence:lease.fence,revision,noActiveChanges:true,verifiedAt:startedAt,source:'AUTHENTICATED_RAILWAY_AND_VERCEL_API',railwayDeployment:running[0].id,vercelDeployment:frontend.id,frontendRevision:frontend.meta.githubCommitSha,railwayRecords:railwayRows.length,vercelRecords:vercelRows.length};
  return {...evidence,evidenceId:createHash('sha256').update(JSON.stringify(evidence)).digest('hex')};
 };
}

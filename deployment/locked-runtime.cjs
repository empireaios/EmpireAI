'use strict';
// The operator launcher never imports application writers. Its guarded controller
// durably admits and demotes each application entrypoint before import.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { assuranceRuntimeOrigin } = require('./assurance-supervisor.cjs');
const { runBounded } = require('./canary-launcher.cjs');
const { resolveRuntimeRevision } = require('./runtime-revision.cjs');
const { canaryExitCode, assertRuntimeVersion } = require('./canary-launcher.cjs');
const PROFILE = 'LOCKED_COMMISSIONING_V1';
function configuration(input) {
  if (input.EMPIRE_RUNTIME_PROFILE !== PROFILE) throw Error('Explicit locked profile required');
  const root = input.RAILWAY_VOLUME_MOUNT_PATH;
  if (!root || !path.isAbsolute(root) || fs.realpathSync(root) !== root || !fs.statSync(root).isDirectory()) throw Error('Attached canonical volume required');
  const database = path.join(root, 'commissioning', 'empireai-brain.db');
  if (input.DATABASE_PATH !== database) throw Error('Dedicated fresh commissioning path required');
  if (input.EMPIRE_CANARY_EXPIRES_AT || input.EMPIRE_CANARY_ACK) throw Error('Temporary canary profile cannot be promoted');
  const intelligenceKeys=['AMAZON_SP_API_CLIENT_ID','AMAZON_SP_API_CLIENT_SECRET','AMAZON_SP_API_REFRESH_TOKEN','AMAZON_SP_API_REGION','CJ_API_KEY'];
  for(const flag of ['INTELLIGENCE_ENABLED','INTELLIGENCE_DISABLED'])if(input[flag]!==undefined&&!['true','false'].includes(input[flag]))throw Error('Explicit intelligence switch required');
  const verifierKeys=['ASSURANCE_RAILWAY_PROJECT_TOKEN','ASSURANCE_VERCEL_READ_TOKEN','ASSURANCE_VERCEL_PROJECT_ID','ASSURANCE_VERCEL_TEAM_ID','ASSURANCE_VERCEL_PRODUCTION_HOST'];
  const allowedSecrets = new Set([...verifierKeys,'FOUNDER_PASSWORD','ADMIN_PASSWORD','SESSION_SECRET','OPENAI_API_KEY','ANTHROPIC_API_KEY','GOOGLE_AI_API_KEY','COMMISSIONING_OPERATOR_TOKEN_SHA256',...intelligenceKeys]);
  for (const [key,value] of Object.entries(input)) if (value && /PASSWORD|SECRET|TOKEN|API_KEY|ACCESS_KEY|CREDENTIAL|PRIVATE_KEY/i.test(key) && !allowedSecrets.has(key)) throw Error('Provider credentials forbidden during locked commissioning');
  for (const role of ['FOUNDER','ADMIN']) if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input[role+'_EMAIL']||'') || (input[role+'_PASSWORD']||'').length < 24) throw Error('Explicit strong owner credentials required');
  if (input.FOUNDER_EMAIL===input.ADMIN_EMAIL || input.FOUNDER_PASSWORD===input.ADMIN_PASSWORD || (input.SESSION_SECRET||'').length<32 || [input.FOUNDER_PASSWORD,input.ADMIN_PASSWORD].includes(input.SESSION_SECRET)) throw Error('Independent identities and secrets required');
  const redis = new URL(input.REDIS_URL);
  if (!['redis:','rediss:'].includes(redis.protocol) || !redis.password || redis.hostname!==input.EMPIRE_LOCKED_REDIS_HOST || redis.search || redis.hash || !['','/','/0'].includes(redis.pathname)) throw Error('Dedicated authenticated Redis required');
  const keys=['EMPIRE_LOCKED_REDIS_HOST','WORK8_CONTROLLER_JOURNAL_PATH','WORK8_RUNTIME_UID','WORK8_RUNTIME_GID','WORK8_WRITER_ISOLATION_LIBRARY','WORK8_WRITER_ISOLATION_SHA256','EMPIRE_BRAIN_WORKER_PORT','EMPIRE_GENERATION_DIRECTORY','EMPIRE_GENERATION','EMPIRE_CUTOVER_DIGEST','EMPIRE_GENERATION_DEVICE','EMPIRE_GENERATION_INODE',...intelligenceKeys,...verifierKeys,'INTELLIGENCE_ENABLED','INTELLIGENCE_DISABLED','COMMISSIONING_OPERATOR_TOKEN_SHA256','COMMISSIONING_OPERATOR_EXPIRES_AT','ANTHROPIC_API_KEY','GOOGLE_AI_API_KEY','OPENAI_API_KEY','PATH','HOME','TMPDIR','LANG','TZ','PORT','REDIS_URL','FOUNDER_EMAIL','FOUNDER_PASSWORD','ADMIN_EMAIL','ADMIN_PASSWORD','SESSION_SECRET','CORS_ORIGIN','RAILWAY_VOLUME_MOUNT_PATH','RAILWAY_PROJECT_ID','RAILWAY_ENVIRONMENT_ID','RAILWAY_SERVICE_ID','RAILWAY_GIT_COMMIT_SHA','RAILWAY_DEPLOYMENT_ID'];
  const env=Object.fromEntries(keys.filter(k=>input[k]!==undefined).map(k=>[k,input[k]]));
  env.ASSURANCE_RUNTIME_ORIGIN=assuranceRuntimeOrigin(input);
  Object.assign(env,{EMPIRE_RUNTIME_PROFILE:PROFILE,NODE_ENV:'production',NODE_OPTIONS:'--max-old-space-size=1536 --require='+JSON.stringify(path.join(__dirname,'runtime-generation-preload.cjs')),DATABASE_PATH:database,
    DEFAULT_LLM_PROVIDER:'openai',DEFAULT_LLM_MODEL:'gpt-6.1-sol',EMPIRE_ENGINEERING_TEST_MODE:'true',EMPIRE_TIER0_ISOLATION:'true',EMPIRE_ENABLE_EXTENSION_ROUTES:'false',EMPIRE_REQUIRE_DATA_VOLUME:'true',EMPIRE_PERSISTENCE_GATE:'strict',
    EMPIRE_SHUTDOWN_TIMEOUT_MS:'15000',EMPIREAI_REPO_ROOT:path.resolve(__dirname,'..'),SHADOW_CEO_DATA_DIR:database+'.shadow',
    REDIS_OPTIONAL:'false',WORKER_CONCURRENCY:'1',HOST:'0.0.0.0',LIVE_PAYMENT_ENABLED:'false',LIVE_CJ_FULFILLMENT_ENABLED:'false',META_ADS_LAUNCH_ENABLED:'false',PRODUCTION_DEPLOYMENT_ENABLED:'false',LIVE_OPS_PRODUCTION_NOT_ELIGIBLE:'true',COMMERCE_READINESS_BLOCKED:'true'});
  return env;
}
async function main(){
  assertRuntimeVersion(process.versions.node);
  const cwd=path.resolve(__dirname,'..');
  if(fs.existsSync(path.join(cwd,'.env')))throw Error('Repository dotenv forbidden');
  const env=configuration(process.env), dir=path.dirname(env.DATABASE_PATH);
  // Rollbacks can omit Railway Git metadata. Pin both children to the image's
  // build receipt; never accept a conflicting runtime environment revision.
  env.RAILWAY_GIT_COMMIT_SHA=resolveRuntimeRevision(cwd,env.RAILWAY_GIT_COMMIT_SHA);
  if(process.getuid()!==0)throw Error('Distinct operator launcher required');
  for(const key of ['WORK8_CONTROLLER_JOURNAL_PATH','WORK8_RUNTIME_UID','WORK8_RUNTIME_GID','WORK8_WRITER_ISOLATION_LIBRARY','WORK8_WRITER_ISOLATION_SHA256'])if(!env[key])throw Error('Complete writer controller configuration required');
  // Prepared storage ownership and operator history are verified by the controller.
  // Do not create/chown a live volume or silently fall back to legacy admission.
  delete env.NODE_OPTIONS;delete env.NODE_PATH;delete env.LD_AUDIT;delete env.LD_PRELOAD;
  env.WORK8_ACTUAL_WRITER_GRAPH='1';
  let leaseTimer;
  const result=await runBounded({command:process.execPath,args:[path.join(__dirname,'launcher-loss-guard.cjs'),'20000','20000',process.execPath,path.join(__dirname,'runtime-writer-controller.cjs')],env,cwd,expiresAt:null,graceMs:20000,stdio:['inherit','inherit','inherit','ipc'],onSpawn:child=>{
    const renew=()=>{if(child.connected)child.send({type:'launcher_progress'},()=>{});};
    renew();leaseTimer=setInterval(renew,5000);
    console.log(JSON.stringify({event:'locked_runtime_start',profile:PROFILE,launchId:crypto.randomUUID(),childPid:child.pid,source:env.RAILWAY_GIT_COMMIT_SHA,birth:'NOT_BORN',commerce:'LOCKED',operational:false}));
  }}).finally(()=>clearInterval(leaseTimer));
  console.log(JSON.stringify({event:'locked_runtime_stop',...result}));process.exitCode=canaryExitCode(result);
}
module.exports={PROFILE,configuration};
if(require.main===module)main().catch(()=>{console.error('Locked commissioning runtime refused startup or clean shutdown');process.exitCode=1;});


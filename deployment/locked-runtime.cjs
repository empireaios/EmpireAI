'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { runBounded, canaryExitCode, assertRuntimeVersion } = require('./canary-launcher.cjs');
const PROFILE = 'LOCKED_COMMISSIONING_V1';
function configuration(input) {
  if (input.EMPIRE_RUNTIME_PROFILE !== PROFILE) throw Error('Explicit locked profile required');
  const root = input.RAILWAY_VOLUME_MOUNT_PATH;
  if (!root || !path.isAbsolute(root) || fs.realpathSync(root) !== root || !fs.statSync(root).isDirectory()) throw Error('Attached canonical volume required');
  const database = path.join(root, 'commissioning', 'empireai-brain.db');
  if (input.DATABASE_PATH !== database) throw Error('Dedicated fresh commissioning path required');
  if (input.EMPIRE_CANARY_EXPIRES_AT || input.EMPIRE_CANARY_ACK) throw Error('Temporary canary profile cannot be promoted');
  const allowedSecrets = new Set(['FOUNDER_PASSWORD','ADMIN_PASSWORD','SESSION_SECRET']);
  for (const [key,value] of Object.entries(input)) if (value && /PASSWORD|SECRET|TOKEN|API_KEY|ACCESS_KEY|CREDENTIAL|PRIVATE_KEY/i.test(key) && !allowedSecrets.has(key)) throw Error('Provider credentials forbidden during locked commissioning');
  for (const role of ['FOUNDER','ADMIN']) if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input[role+'_EMAIL']||'') || (input[role+'_PASSWORD']||'').length < 24) throw Error('Explicit strong owner credentials required');
  if (input.FOUNDER_EMAIL===input.ADMIN_EMAIL || input.FOUNDER_PASSWORD===input.ADMIN_PASSWORD || (input.SESSION_SECRET||'').length<32 || [input.FOUNDER_PASSWORD,input.ADMIN_PASSWORD].includes(input.SESSION_SECRET)) throw Error('Independent identities and secrets required');
  const redis = new URL(input.REDIS_URL);
  if (!['redis:','rediss:'].includes(redis.protocol) || !redis.password || redis.hostname!==input.EMPIRE_LOCKED_REDIS_HOST || redis.search || redis.hash || !['','/','/0'].includes(redis.pathname)) throw Error('Dedicated authenticated Redis required');
  const keys=['PATH','HOME','TMPDIR','LANG','TZ','PORT','REDIS_URL','FOUNDER_EMAIL','FOUNDER_PASSWORD','ADMIN_EMAIL','ADMIN_PASSWORD','SESSION_SECRET','CORS_ORIGIN','RAILWAY_VOLUME_MOUNT_PATH','RAILWAY_PROJECT_ID','RAILWAY_ENVIRONMENT_ID','RAILWAY_SERVICE_ID','RAILWAY_GIT_COMMIT_SHA','RAILWAY_DEPLOYMENT_ID'];
  const env=Object.fromEntries(keys.filter(k=>input[k]!==undefined).map(k=>[k,input[k]]));
  Object.assign(env,{EMPIRE_RUNTIME_PROFILE:PROFILE,NODE_ENV:'production',NODE_OPTIONS:'--max-old-space-size=1536',DATABASE_PATH:database,
    EMPIRE_ENGINEERING_TEST_MODE:'true',EMPIRE_TIER0_ISOLATION:'true',EMPIRE_ENABLE_EXTENSION_ROUTES:'false',EMPIRE_REQUIRE_DATA_VOLUME:'true',EMPIRE_PERSISTENCE_GATE:'strict',
    EMPIRE_SHUTDOWN_TIMEOUT_MS:'15000',EMPIREAI_REPO_ROOT:path.resolve(__dirname,'..'),SHADOW_CEO_DATA_DIR:database+'.shadow',
    REDIS_OPTIONAL:'false',WORKER_CONCURRENCY:'1',HOST:'0.0.0.0',LIVE_PAYMENT_ENABLED:'false',LIVE_CJ_FULFILLMENT_ENABLED:'false',META_ADS_LAUNCH_ENABLED:'false',PRODUCTION_DEPLOYMENT_ENABLED:'false',LIVE_OPS_PRODUCTION_NOT_ELIGIBLE:'true',COMMERCE_READINESS_BLOCKED:'true'});
  return env;
}
async function main(){
  assertRuntimeVersion(process.versions.node);
  const cwd=path.resolve(__dirname,'..');
  if(fs.existsSync(path.join(cwd,'.env')))throw Error('Repository dotenv forbidden');
  const env=configuration(process.env), dir=path.dirname(env.DATABASE_PATH);
  fs.mkdirSync(dir,{recursive:true,mode:0o700});
  if(fs.realpathSync(dir)!==dir)throw Error('Redirected data directory refused');
  const result=await runBounded({command:process.execPath,args:['backend/dist/index.js'],env,cwd,expiresAt:null,onSpawn:child=>{
    console.log(JSON.stringify({event:'locked_runtime_start',profile:PROFILE,launchId:crypto.randomUUID(),childPid:child.pid,source:env.RAILWAY_GIT_COMMIT_SHA,birth:'NOT_BORN',commerce:'LOCKED',operational:false}));
  }});
  console.log(JSON.stringify({event:'locked_runtime_stop',...result}));process.exitCode=canaryExitCode(result);
}
module.exports={PROFILE,configuration};
if(require.main===module)main().catch(()=>{console.error('Locked commissioning runtime refused startup or clean shutdown');process.exitCode=1;});

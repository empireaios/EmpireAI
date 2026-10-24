'use strict';
const path=require('node:path');
const {admit}=require('./runtime-generation.cjs');
const {resolveRuntimeRevision}=require('./runtime-revision.cjs');
const revision=resolveRuntimeRevision(path.resolve(__dirname,'..'),process.env.RAILWAY_GIT_COMMIT_SHA);
const entry=path.basename(process.argv[1]||'');
const roles={'locked-runtime.cjs':'launcher','permanent-worker.mjs':'assurance-worker','permanent-inspector.mjs':'assurance-inspector','index.js':process.env.EMPIRE_ROLE==='brain-worker'?'brain-worker':'primary'};
if(!roles[entry])throw Error('RUNTIME_GENERATION_ENTRYPOINT_REFUSED');
admit({root:process.env.EMPIRE_GENERATION_DIRECTORY,expectedGeneration:process.env.EMPIRE_GENERATION,expectedSource:revision,cutoverDigest:process.env.EMPIRE_CUTOVER_DIGEST,role:roles[entry],volumeRoot:process.env.RAILWAY_VOLUME_MOUNT_PATH,redisUrl:process.env.REDIS_URL,expectedDevice:process.env.EMPIRE_GENERATION_DEVICE,expectedInode:process.env.EMPIRE_GENERATION_INODE});

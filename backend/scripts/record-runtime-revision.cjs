'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const {valid}=require('../../deployment/runtime-revision.cjs');
const revision=process.env.RAILWAY_GIT_COMMIT_SHA||execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
if(!valid(revision))throw Error('Exact build revision required');
const target=path.join(root,'backend/dist/runtime-revision.json'),temporary=target+'.'+process.pid;
fs.writeFileSync(temporary,JSON.stringify({revision})+'\n',{mode:0o444,flag:'wx'});
fs.renameSync(temporary,target);

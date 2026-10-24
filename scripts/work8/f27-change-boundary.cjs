'use strict';
const fs=require('node:fs'),{execFileSync}=require('node:child_process'),{createHash}=require('node:crypto');
const baseline='4c00e533a278eae92ccfbd9ac4378ee656f0d222';
const baselineTree='3940745ad47fc7498e5a3217ce8ed0d55381592b';
const workflowDigest='cd70b7d75b6ca22e8b8dc8b2b47b7bb4dd3149ee631cc00c9f3711dc16d654b4';
const allowed=new Set(['scripts/work8/f27-outer-controller.cjs','scripts/work8/tests/f27-clock-origin.test.cjs','scripts/work8/hh3-owned-process-group.mjs','scripts/work8/hh3-compiled-coordinator.mjs','scripts/work8/f27-change-boundary.cjs','scripts/work8/tests/f27-change-boundary.test.cjs','scripts/work8/tests/hh3-owned-process-group.test.mjs','.github/workflows/pillow-runtime-repair-ci.yml']);
const retained={
 f29:{artifact:11787397943,sha256:'af95b409e98c3a9b07d809fe30032d6397b68cddd548d9e39c8a1130e07ca70e',accepted:'both required pair fault assertions'},
 'reasoning-admission':{artifact:11787204240,sha256:'962d6f34603042dc7a437b400f8e524ec863960b53abf38d5a82331588cebd47',passed:1950},
 'response-delivery':{artifact:11787268583,sha256:'67d32707d386372118550ab004bc41340f78286e2d48719c56a01345134db5bf',passed:1381}
};
function mayReuse(paths,digest,tree,ancestor,modes){return tree===baselineTree&&ancestor===true&&digest===workflowDigest&&Array.isArray(paths)&&paths.length>0&&paths.every(p=>allowed.has(p)&&modes?.[p]==='100644');}
function inspect(){
 let paths=[],digest=null,tree=null,ancestor=false,modes={},currentSource=null;
 const git=args=>execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
 try{
  currentSource=git(['rev-parse','HEAD']);tree=git(['rev-parse',baseline+'^{tree}']);
  git(['merge-base','--is-ancestor',baseline,'HEAD']);ancestor=true;
  paths=git(['diff','--name-only','--no-renames','-z',baseline,'HEAD']).split('\0').filter(Boolean);
  for(const path of paths){const entry=git(['ls-tree','HEAD','--',path]);modes[path]=entry.split(' ')[0];}
  digest=createHash('sha256').update(fs.readFileSync('.github/workflows/pillow-runtime-repair-ci.yml')).digest('hex');
 }catch{}
 return {reuse:mayReuse(paths,digest,tree,ancestor,modes),paths,workflowDigest:digest,baselineTree:tree,currentSource};
}
module.exports={mayReuse,inspect,baseline,baselineTree,workflowDigest};
if(require.main===module){
 const boundary=inspect();
 if(process.argv[2]==='--receipt'){
  const kind=process.argv[3],output=process.argv[4];
  if(!boundary.reuse||!Object.hasOwn(retained,kind)||!output)throw Error('Retained evidence requires verified exact boundary and known examination');
  const receipt={recordType:'RETAINED_ACCEPTED_EXAMINATION_NOT_NEW_EXECUTION',kind,testedSource:baseline,testedTree:baselineTree,run:38342212050,node:'22.23.2',...retained[kind],currentBoundary:boundary,scope:'Only accepted F29 and corpora retained. F27, HH3 and mandatory runtime suite must execute; prior run overall failure is not reused as success.'};
  fs.writeFileSync(output,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
 }else{
  console.log('run_f29='+String(!boundary.reuse));console.log('run_corpora='+String(!boundary.reuse));console.log('retained_source='+baseline);console.log('retained_run=38342212050');
 }
}

'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{test}=require('node:test');
const source=fs.readFileSync('campaign-x/source/scripts/work8/run-writer-integration.sh','utf8');
const code=source.split('    node <<"MOUNT_CHECK"\n')[1].split('\nMOUNT_CHECK')[0];
function examine({nativeNoexec=false,dataExec=false,uid=0}={}){
 let receipt;
 const mounts=['/work8-native','/work8-exam','/tmp'].map((p,i)=>`${i+1} 0 0:${i+1} / ${p} rw,nosuid,nodev${(i===0?nativeNoexec:!dataExec)?',noexec':''} - tmpfs tmpfs rw`).join('\n');
 const mock={readFileSync:()=>mounts,statSync:()=>({uid:0,mode:0o40755}),lstatSync:()=>({uid,mode:0o100444,isFile:()=>true,nlink:1}),writeFileSync:(_p,value)=>receipt=JSON.parse(value)};
 vm.runInNewContext(code,{require:n=>n==='node:fs'?mock:require(n),process:{env:{WORK8_EVIDENCE_DIR:'/evidence'}}});return receipt;
}
test('mount preflight accepts only executable protected native mount and noexec data mounts',()=>{assert.equal(examine().runtimeWritable,false);assert.match(source,/--tmpfs \/work8-native:rw,exec,nosuid,nodev,mode=0755,size=1m/);assert.match(source,/--tmpfs \/work8-exam:rw,noexec,nosuid,nodev/);});
test('mount preflight refuses noexec native image and executable data',()=>{assert.throws(()=>examine({nativeNoexec:true}),/NATIVE_EXEC_DATA_NOEXEC_REQUIRED/);assert.throws(()=>examine({dataExec:true}),/NATIVE_EXEC_DATA_NOEXEC_REQUIRED/);});
test('mount preflight refuses runtime-owned native artifact',()=>{assert.throws(()=>examine({uid:65534}));});

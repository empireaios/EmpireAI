/* Packaging only: no application imports, startup, authority or network access. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto'),{createRequire}=require('node:module');
const hash=x=>createHash('sha256').update(x).digest('hex');
const [expectedUidText,expectedGidText]=process.argv.slice(2);
const receipt={schema:'work8-isolated-compiler-permissions-v1',status:'FAIL',applicationStarted:false,networkRequired:false,providerCredentialsSupplied:false,denials:[],generated:[]};
let stage='PROCESS_IDENTITY';
function check(value,code){assert.ok(value,code);}
function equal(actual,expected,code){assert.deepEqual(actual,expected,code);}
function stat(file){const s=fs.lstatSync(file);check(!s.isSymbolicLink(),'SYMLINK_REFUSED');return {uid:s.uid,gid:s.gid,mode:(s.mode&0o7777).toString(8),regularFile:s.isFile(),directory:s.isDirectory(),bytes:s.size};}
function refuseWrite(classification,file){
 let fd,error;
 try{fd=fs.openSync(file,'a');}catch(e){error=e;}
 finally{if(fd!==undefined)fs.closeSync(fd);}
 check(error&&['EACCES','EROFS','EPERM'].includes(error.code),'IMMUTABLE_WRITE_NOT_REFUSED');
 receipt.denials.push({classification,operation:'open_for_append_without_writing',code:error.code,refused:true});
}
try{
 equal(process.versions.node,'22.23.2','NODE_VERSION_MISMATCH');
 const uid=process.getuid(),gid=process.getgid(),groups=process.getgroups();
 check(Number.isSafeInteger(Number(expectedUidText))&&Number(expectedUidText)>0,'UNPRIVILEGED_UID_REQUIRED');
 check(Number.isSafeInteger(Number(expectedGidText))&&Number(expectedGidText)>0,'UNPRIVILEGED_GID_REQUIRED');
 equal(uid,Number(expectedUidText),'UID_MISMATCH');equal(gid,Number(expectedGidText),'GID_MISMATCH');
 check(groups.every(x=>x===gid),'UNREVIEWED_SUPPLEMENTARY_GROUP');
 const status=fs.readFileSync('/proc/self/status','utf8'),fields={};
 for(const key of ['Uid','Gid','Groups','CapInh','CapPrm','CapEff','CapBnd','CapAmb','NoNewPrivs']){
  const row=status.split(String.fromCharCode(10)).find(line=>line.startsWith(key+':'));check(row!==undefined,'PROCESS_STATE_FIELD_UNAVAILABLE');fields[key]=row.slice(key.length+1).trim();
 }
 for(const key of ['CapInh','CapPrm','CapEff','CapBnd','CapAmb'])check(/^0+$/.test(fields[key]),'CAPABILITY_PRESENT');
 equal(fields.NoNewPrivs,'1','NO_NEW_PRIVILEGES_REQUIRED');
 check(fields.Uid.split(/\s+/).every(x=>Number(x)===uid),'PROCESS_UID_STATE_MISMATCH');
 check(fields.Gid.split(/\s+/).every(x=>Number(x)===gid),'PROCESS_GID_STATE_MISMATCH');
 const inheritedUmask=process.umask();process.umask(0o077);
 receipt.process={uid,gid,groups,linuxStatus:fields,inheritedUmask:inheritedUmask.toString(8),outputUmask:process.umask().toString(8),nodeVersion:process.versions.node,executable:fs.realpathSync('/proc/self/exe')};
 stage='READONLY_INPUT_TRAVERSAL';
 const planBytes=fs.readFileSync('/reviewed-plan.json'),plan=JSON.parse(planBytes);
 receipt.planSha256=hash(planBytes);receipt.compilerScriptSha256=hash(fs.readFileSync(__filename));
 const ts=createRequire('/app/backend/package.json')('typescript');equal(ts.version,plan.compilerVersion,'COMPILER_VERSION_MISMATCH');
 receipt.compilerVersion=ts.version;receipt.sourceInputs=[];
 for(const entry of plan.backendOverlay){
  check(/^backend\/src\/[A-Za-z0-9_./-]+\.(ts|mjs|js)$/.test(entry.path)&&!entry.path.split('/').includes('..'),'SOURCE_PATH_REFUSED');
  const file=path.join('/source',entry.path),bytes=fs.readFileSync(file);equal(hash(bytes),entry.sha256,'SOURCE_BYTES_MISMATCH');
  receipt.sourceInputs.push({path:entry.path,sha256:entry.sha256,bytes:bytes.length});
 }
 equal(receipt.sourceInputs.length,6,'REVIEWED_SOURCE_COUNT_MISMATCH');
 receipt.readonlyInputTraversal=true;
 stage='IMMUTABLE_WRITE_REFUSAL';
 refuseWrite('retained_application','/app/backend/package.json');
 refuseWrite('reviewed_source',path.join('/source',plan.backendOverlay[0].path));
 refuseWrite('compiler_scripts',__filename);
 refuseWrite('reviewed_plan','/reviewed-plan.json');
 refuseWrite('policy_fixture_no_authority','/policy/control.json');
 refuseWrite('unrelated_host_fixture','/unrelated/sentinel');
 stage='GENERATED_OUTPUT_OWNERSHIP';
 equal(fs.realpathSync('/output'),'/output','OUTPUT_ALIAS_REFUSED');
 const output=stat('/output');equal(output.uid,uid,'OUTPUT_OWNER_MISMATCH');equal(output.gid,gid,'OUTPUT_GROUP_MISMATCH');equal(output.mode,'700','OUTPUT_MODE_MISMATCH');
 receipt.outputMountRoot=output;
 const probeDirectory='/output/.permission-probe/nested';fs.mkdirSync(probeDirectory,{recursive:true,mode:0o700});
 const probe=path.join(probeDirectory,'generated.txt'),proof=Buffer.from('PACKAGING_PERMISSION_PROOF_NO_AUTHORITY\n');
 const fd=fs.openSync(probe,'wx',0o600);try{fs.writeFileSync(fd,proof);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
 equal(fs.readFileSync(probe),proof,'OUTPUT_READBACK_MISMATCH');
 receipt.outputProof={traversal:true,create:true,write:true,fsync:true,readback:true,file:stat(probe),directory:stat(probeDirectory)};
 fs.unlinkSync(probe);fs.rmdirSync(probeDirectory);fs.rmdirSync('/output/.permission-probe');
 stage='REVIEWED_CHANGED_TYPESCRIPT_COMPILATION';
 for(const entry of plan.backendOverlay){
  if(!entry.path.endsWith('.ts'))continue;
  const relative=entry.path.slice('backend/src/'.length),text=fs.readFileSync(path.join('/source',entry.path),'utf8');
  const compiled=ts.transpileModule(text,{fileName:relative,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,sourceMap:true,esModuleInterop:true,isolatedModules:true},reportDiagnostics:true});
  equal((compiled.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0,'CHANGED_TYPESCRIPT_SYNTAX_ERROR');
  const javascript='backend/dist/'+relative.replace(/\.ts$/,'.js');
  for(const [name,bytes,expected] of [[javascript,compiled.outputText,entry.javascriptSha256],[javascript+'.map',compiled.sourceMapText,entry.mapSha256]]){
   equal(hash(bytes),expected,'REVIEWED_COMPILED_BYTES_MISMATCH');
   const file=path.join('/output',name);fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});fs.writeFileSync(file,bytes,{flag:'wx',mode:0o600});
   equal(hash(fs.readFileSync(file)),expected,'GENERATED_OUTPUT_READBACK_MISMATCH');
   const meta=stat(file);equal(meta.uid,uid,'GENERATED_OWNER_MISMATCH');equal(meta.gid,gid,'GENERATED_GROUP_MISMATCH');equal(meta.mode,'600','GENERATED_MODE_MISMATCH');
   receipt.generated.push({path:name,sha256:expected,...meta});
  }
 }
 equal(receipt.generated.length,6,'GENERATED_FILE_COUNT_MISMATCH');
 for(const entry of plan.backendOverlay)equal(hash(fs.readFileSync(path.join('/source',entry.path))),entry.sha256,'READONLY_SOURCE_CHANGED');
 equal(hash(fs.readFileSync('/reviewed-plan.json')),receipt.planSha256,'READONLY_PLAN_CHANGED');
 receipt.status='PASS_ISOLATED_COMPILER_OUTPUT_CONTRACT';receipt.authorityGranted=false;
}catch(error){
 receipt.failedStage=stage;
 const named=String(error?.message||'').match(/^([A-Z][A-Z0-9_]{3,100})(?:\n|$)/)?.[1];
 receipt.failure={name:['Error','AssertionError','TypeError'].includes(error?.name)?error.name:'OTHER_ERROR',code:named??(['EACCES','EROFS','EPERM','ENOENT','ENOTDIR','EEXIST','ENOSPC'].includes(error?.code)?error.code:'UNCLASSIFIED_COMPILER_FAILURE'),syscall:['open','mkdir','write','read','stat','lstat','unlink','rmdir'].includes(error?.syscall)?error.syscall:null,sourceFrames:(String(error?.stack||'').match(/isolated-compiler\.cjs:\d+:\d+/g)||[]).slice(0,8),arbitraryErrorValuesRetained:false};
 process.exitCode=1;
}finally{console.log('WORK8_COMPILER_RECEIPT '+JSON.stringify(receipt));}

import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {SQL,CONTROL,nativeRoot}=require('../../deployment/o33-path-contract.cjs');
// Read-only initialization barrier, never a substitute for fenced capture.
// A watchdog is produced only by the actual successful complete inspector pass.
export function inspectCaptureReadiness({volume,startedAt,now=Date.now(),runtimeUid=65534}){
 const checked=[],blockers=[];
 const check=(name,relative,kind,limit)=>{
  try{
   const file=path.join(volume,relative),s=fs.lstatSync(file);
   if(fs.realpathSync(file)!==file||s.isSymbolicLink()||s.uid!==runtimeUid||s.gid!==runtimeUid)throw Error('PATH_IDENTITY');
   if(kind==='directory'){if(!s.isDirectory())throw Error('DIRECTORY_REQUIRED');}
   else{
    if(!s.isFile()||s.nlink!==1||s.size<1||s.size>limit)throw Error('FILE_SHAPE');
    if(kind==='sql'){const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW),header=Buffer.alloc(16);try{if(fs.readSync(fd,header,0,16,0)!==16||header.toString()!=='SQLite format 3\0')throw Error('SQLITE_HEADER');}finally{fs.closeSync(fd);}}
    if(kind==='json'||kind==='watchdog'){
     const value=JSON.parse(fs.readFileSync(file,'utf8'));if(!value||typeof value!=='object'||Array.isArray(value))throw Error('JSON_OBJECT');
     if(kind==='watchdog'){
      if(!Number.isSafeInteger(value.observedAt)||value.observedAt<startedAt||value.observedAt>now||now-value.observedAt>90000||typeof value.status!=='string')throw Error('CURRENT_INSPECTOR_PASS_REQUIRED');
      if(fs.existsSync(file+'.tmp'))throw Error('INSPECTOR_WRITE_UNSETTLED');
      checked.push({name,observedAt:value.observedAt,status:value.status,healthAsserted:false});return;
     }
    }
   }
   checked.push({name});
  }catch(error){blockers.push({name,reason:error.code||error.message});}
 };
 for(const [name,relative]of Object.entries(SQL))check(name,relative,'sql',1024*1024*1024);
 for(const relative of CONTROL)check(relative,relative,relative.endsWith('.watchdog')?'watchdog':relative.endsWith('.initialized')?'marker':'json',relative.endsWith('.initialized')||relative.endsWith('.watchdog')?65536:4194304);
 for(const [name,file]of [['visual',nativeRoot(volume,'visual')],['visual-records',path.join(nativeRoot(volume,'visual'),'records')],['session',nativeRoot(volume,'session')]])check(name,path.relative(volume,file),'directory');
 return {scope:'INITIALIZATION_READINESS_ONLY_NOT_CAPTURE_PROOF',ready:blockers.length===0,checked,blockers};
}

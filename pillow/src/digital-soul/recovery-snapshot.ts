import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {createHash} from 'node:crypto';
import {acquireVisualMemoryLock} from '../visual-memory-engine/recovery-lock.js';
import {DIGITAL_SOUL_DECISION_STORE_RELATIVE} from './paths.js';
export type ExecutiveDecisionJournalSnapshot={schema:'EXECUTIVE_DECISION_JOURNAL_INSPECTION_V1';sourcePath:string;coordinationRoot:string;operationalRestoreAvailable:false;file:null|{mode:number;bytes:string}};
export function executiveDecisionCoordinationRoot(repositoryRoot:string):string {
 const root=path.resolve(repositoryRoot);if(fs.realpathSync(root)!==root)throw Error('EXECUTIVE_DECISION_ROOT_UNSAFE');
 let parent=root;for(const part of ['docs','governance','digital-soul']){parent=path.join(parent,part);try{const stat=fs.lstatSync(parent);if(!stat.isDirectory()||stat.isSymbolicLink()||fs.realpathSync(parent)!==parent)throw Error('EXECUTIVE_DECISION_ROOT_UNSAFE');}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}}
 // All declared cooperating processes must share this writable namespace. It is
 // separate from immutable application/governance files; no historical migration.
 const base=path.resolve(process.env.RAILWAY_VOLUME_MOUNT_PATH||os.tmpdir());
 if(fs.realpathSync(base)!==base)throw Error('EXECUTIVE_DECISION_LOCK_NAMESPACE_UNSAFE');
 const namespace=path.join(base,'.work8-executive-journal-locks');
 try{fs.mkdirSync(namespace,{mode:0o700});}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;}
 const st=fs.lstatSync(namespace);if(!st.isDirectory()||st.isSymbolicLink()||fs.realpathSync(namespace)!==namespace)throw Error('EXECUTIVE_DECISION_LOCK_NAMESPACE_UNSAFE');
 return path.join(namespace,createHash('sha256').update(path.join(root,DIGITAL_SOUL_DECISION_STORE_RELATIVE)).digest('hex'));
}
export function acquireExecutiveDecisionJournalLock(repositoryRoot:string):()=>void{return acquireVisualMemoryLock(executiveDecisionCoordinationRoot(repositoryRoot));}
export async function withExecutiveDecisionJournalSnapshot<T>(repositoryRoot:string,capture:(snapshot:ExecutiveDecisionJournalSnapshot)=>Promise<T>):Promise<T>{
 const sourcePath=path.resolve(repositoryRoot,DIGITAL_SOUL_DECISION_STORE_RELATIVE),release=acquireExecutiveDecisionJournalLock(repositoryRoot);
 try{let file:ExecutiveDecisionJournalSnapshot['file']=null;let fd:number|undefined;
  try{fd=fs.openSync(sourcePath,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
  if(fd!==undefined)try{const stat=fs.fstatSync(fd);if(!stat.isFile()||stat.nlink!==1||stat.size>33554432)throw Error('EXECUTIVE_DECISION_JOURNAL_UNSAFE');const bytes=fs.readFileSync(fd);for(const line of bytes.toString().split('\n').filter(line=>line.trim())){const record=JSON.parse(line);if(!record||typeof record.id!=='string'||!record.id)throw Error('EXECUTIVE_DECISION_JOURNAL_INVALID');}file={mode:stat.mode&0o777,bytes:bytes.toString('base64')};}finally{fs.closeSync(fd);}
  return await capture({schema:'EXECUTIVE_DECISION_JOURNAL_INSPECTION_V1',sourcePath,coordinationRoot:executiveDecisionCoordinationRoot(repositoryRoot),operationalRestoreAvailable:false,file});
 }finally{release();}
}

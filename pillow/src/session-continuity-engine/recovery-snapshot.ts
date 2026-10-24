import fs from 'node:fs';
import path from 'node:path';
import {acquireVisualMemoryLock} from '../visual-memory-engine/recovery-lock.js';
export type SessionContinuityRecoverySnapshot={schema:'SESSION_CONTINUITY_INSPECTION_V1';sourceStoragePath:string;persistenceEnabled:boolean;operationalRestoreAvailable:false;files:Array<{path:'session-snapshot.json';mode:number;bytes:string}>};
export function acquireSessionContinuityLock(root:string):()=>void {return acquireVisualMemoryLock(root);}
export function readSessionSnapshotFile(file:string):{bytes:Buffer;mode:number}|null {
 let fd:number;
 try{fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return null;throw error;}
 try{const st=fs.fstatSync(fd);if(!st.isFile()||st.nlink!==1||st.size>8388608)throw Error('SESSION_CONTINUITY_FILE_UNSAFE');const bytes=fs.readFileSync(fd);const value=JSON.parse(bytes.toString());if(!value||typeof value.sessionId!=='string'||!value.sessionId||value.lastContinuity?.sessionId!==value.sessionId)throw Error('SESSION_CONTINUITY_IDENTITY_INVALID');return {bytes,mode:st.mode&0o777};}finally{fs.closeSync(fd);}
}
export async function withSessionContinuitySnapshot<T>(root:string,enabled:boolean,capture:(snapshot:SessionContinuityRecoverySnapshot)=>Promise<T>):Promise<T>{
 const absolute=path.resolve(root),release=acquireSessionContinuityLock(absolute);
 try{
  if(fs.existsSync(absolute)&&fs.readdirSync(absolute).some(name=>name!=='session-snapshot.json'))throw Error('SESSION_CONTINUITY_UNKNOWN_FILE');
  const stored=fs.existsSync(absolute)?readSessionSnapshotFile(path.join(absolute,'session-snapshot.json')):null;
  return await capture({schema:'SESSION_CONTINUITY_INSPECTION_V1',sourceStoragePath:absolute,persistenceEnabled:enabled,operationalRestoreAvailable:false,files:stored?[{path:'session-snapshot.json',mode:stored.mode,bytes:stored.bytes.toString('base64')}]:[]});
 }finally{release();}
}

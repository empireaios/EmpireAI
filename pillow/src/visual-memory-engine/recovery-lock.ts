import fs from 'node:fs';
import path from 'node:path';
export class VisualMemoryCaptureBusyError extends Error { constructor(){super("VISUAL_MEMORY_SHARED_CAPTURE_BUSY");this.name="VisualMemoryCaptureBusyError";} }
/** Stable exclusion for updated cooperating processes. Never steal stale locks. */
export function acquireVisualMemoryLock(storageRoot:string):()=>void {
 const root=path.resolve(storageRoot),parent=path.dirname(root);
 if(fs.realpathSync(parent)!==parent)throw Error('VISUAL_MEMORY_LOCK_PATH_UNSAFE');
 try{const current=fs.lstatSync(root);if(!current.isDirectory()||current.isSymbolicLink()||fs.realpathSync(root)!==root)throw Error('VISUAL_MEMORY_LOCK_ROOT_UNSAFE');}
 catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
 const lock=root+'.capture-write-lock';
 try{fs.mkdirSync(lock,{mode:0o700});}catch(error){if((error as NodeJS.ErrnoException).code==='EEXIST')throw new VisualMemoryCaptureBusyError();throw error;}
 const identity=fs.lstatSync(lock);let released=false;
 return ()=>{if(released)return;const current=fs.lstatSync(lock);if(!current.isDirectory()||current.isSymbolicLink()||current.dev!==identity.dev||current.ino!==identity.ino)throw Error('VISUAL_MEMORY_LOCK_IDENTITY_CHANGED');fs.rmdirSync(lock);released=true;};
}

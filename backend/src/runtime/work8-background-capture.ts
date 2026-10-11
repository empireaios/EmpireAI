import {CaptureHttpAdmission} from './capture-http-admission.js';
// Reuse the established admission/drain implementation for the four registered
// local background loops. Other processes, durable reasoning and Redis producers
// remain outside this boundary; this is not a global live-snapshot attestation.
const background=new CaptureHttpAdmission();
export async function runCaptureAwareBackground<T>(job:()=>T|Promise<T>):Promise<T|undefined>{
 let release:()=>void;
 try{release=background.admit();}catch{return undefined;}
 try{return await job();}finally{release();}
}
export function withDrainedWork8Background<T>(capture:()=>T|Promise<T>,timeoutMs=30000){return background.withDrainedAdmission(capture,timeoutMs);}

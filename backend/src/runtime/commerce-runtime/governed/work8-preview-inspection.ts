import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
/** The only inspectable artifact is the server-owned implementation of the
 * existing isolated colour preview. Never resolves a client path or URL.
 * TS examination and compiled JS runtime inspect their respective module. */
export function inspectPreviewImplementation(){
 const extension=import.meta.url.endsWith('.ts')?'.ts':'.js';
 const file=fileURLToPath(new URL('./work8-preparation-authority'+extension,import.meta.url));
 const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);let bytes:Buffer;
 try{const stat=fs.fstatSync(fd);if(!stat.isFile()||stat.size>65536||stat.size===0)throw Error('PREVIEW_IMPLEMENTATION_UNAVAILABLE');
 const buffer=Buffer.alloc(65537),length=fs.readSync(fd,buffer,0,buffer.length,0);if(length>65536||length===0)throw Error('PREVIEW_IMPLEMENTATION_UNAVAILABLE');bytes=buffer.subarray(0,length);
 }finally{fs.closeSync(fd);}
 return {target:'ISOLATED_OWNER_COLOUR_PREVIEW',artifact:'Server-owned preview implementation',inspectionScope:'SERVER_PREVIEW_IMPLEMENTATION_ONLY_NOT_FRONTEND_OR_APP_WIDE',sourceDigest:createHash('sha256').update(bytes).digest('hex'),sourceBytes:bytes.length,sourceContext:bytes.toString('utf8'),deploymentAuthorized:false};
}

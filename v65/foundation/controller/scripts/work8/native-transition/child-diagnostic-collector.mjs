// Exactly the parser used by the live coordinator and controlled startup tests.
// Streams are framed separately; arbitrary stdout/stderr is never retained.
import {sanitizeNativeRecord} from './native-diagnostic.mjs';
export function createChildDiagnosticCollector(onFirst){
 const buffers={stdout:'',stderr:''};let first=null,ignored=0;
 function line(text){const prefix='WORK8_NATIVE_FIRST_FAILURE ';if(!text.startsWith(prefix)||text.length>16384){ignored++;return;}try{const value=sanitizeNativeRecord(JSON.parse(text.slice(prefix.length)));if(!first){first=value;onFirst(value);}}catch{ignored++;}}
 return {push(stream,chunk){if(!['stdout','stderr'].includes(stream))throw Error('CHILD_DIAGNOSTIC_STREAM_REFUSED');buffers[stream]+=String(chunk);for(;;){const at=buffers[stream].indexOf('\n');if(at<0)break;line(buffers[stream].slice(0,at));buffers[stream]=buffers[stream].slice(at+1);}if(buffers[stream].length>16384){buffers[stream]='';ignored++;}},finish(){for(const stream of ['stdout','stderr']){if(buffers[stream])line(buffers[stream]);buffers[stream]='';}return first;},summary(){return {firstFailureObserved:first!==null,unclassifiedLinesOmitted:ignored,rawOutputRetained:false};}};
}

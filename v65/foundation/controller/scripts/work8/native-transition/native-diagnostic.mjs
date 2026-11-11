// Fixed safe diagnostic schema: excludes messages, paths, records and environment.
import fs from 'node:fs';
export const diagnosticState={moduleInitialized:null,applicationInitialized:null,captureRequestReached:null,privateReceiptWritten:null,captureFenceAcquired:null,captureFenceReleased:null,persistenceCompleted:null};
const allow=JSON.parse(fs.readFileSync(new URL('./native-diagnostic-codes.json',import.meta.url),'utf8'));
const codes=new Set(allow.codes),errnos=new Set(allow.errnos);
const files='assurance-records|whole-app-readback|audit-lifecycle-projection|store-applicability|live-brain-hook|live-brain-preflight|live-brain-observation|independent-brain-readback|coordinator|native-diagnostic|index|database|sqlite-database|quiesced-sqlite-save';
const frameFiles=new Set([...files.split('|').flatMap(x=>[x+'.js',x+'.mjs']),...(allow.startupFrameFiles??[])]);
const safeFrames=items=>items.filter(x=>typeof x==='string'&&/^[A-Za-z0-9_-]+\.(?:cjs|mjs|js):[0-9]{1,6}:[0-9]{1,6}$/.test(x)&&frameFiles.has(x.split(':')[0])).slice(0,8);
const token=(x,fallback='UNKNOWN')=>typeof x==='string'&&codes.has(x)?x:fallback;
const assuranceSchema='work8-v110-assurance-invariant-context-v1';
const assuranceActivitySchema='work8-v111-assurance-activity-context-v1';
const assuranceTypes=new Set(['MISSING','NULL','ARRAY','NUMBER','STRING','BOOLEAN','OBJECT','OTHER']);
const assuranceClasses=new Set(['EMPTY_COLLECTION','NONEMPTY_COLLECTION','NUMERIC_ZERO','NEGATIVE_ZERO','POSITIVE_INTEGER','NEGATIVE_NUMBER','NONFINITE_NUMBER','NONINTEGER_NUMBER','OUT_OF_SAFE_RANGE','MISSING','NULL','WRONG_TYPE']);
const assurancePairs={MISSING:['MISSING'],NULL:['NULL'],ARRAY:['EMPTY_COLLECTION','NONEMPTY_COLLECTION'],NUMBER:['NUMERIC_ZERO','NEGATIVE_ZERO','POSITIVE_INTEGER','NEGATIVE_NUMBER','NONFINITE_NUMBER','NONINTEGER_NUMBER','OUT_OF_SAFE_RANGE'],STRING:['WRONG_TYPE'],BOOLEAN:['WRONG_TYPE'],OBJECT:['WRONG_TYPE'],OTHER:['WRONG_TYPE']};
const assuranceAttribution=new Set(['EXISTING_INCIDENT_DIAGNOSTIC_FIELDS_ONLY','EXISTING_IDENTITY_CHANGED','NEW_INCIDENT','UNESTABLISHED']);
const assuranceHashFields=['incidentKeySha256','priorBodySha256','observedBodySha256','priorIdentitySha256','observedIdentitySha256','checkerSha256'];
// Optional context is a closed, bounded projection. Assertion operands and
// incident bodies are never copied, including from AssertionError.actual.
export function sanitizeAssuranceContext(value,assertion){
 const unavailable={schema:assuranceSchema,status:'UNAVAILABLE_OR_INVALID'};
 if(!value||typeof value!=='object'||value.schema!==assuranceSchema||value.domain!=='assurance'||value.store!=='cp_records'||value.invariant!==assertion||!codes.has(value.invariant)||value.rawIncidentRetained!==false||value.applicationAcceptance!==false)return unavailable;
 if(!['expectedType','priorType','observedType'].every(k=>assuranceTypes.has(value[k]))||!['priorClass','observedClass'].every(k=>assuranceClasses.has(value[k]))||!assuranceAttribution.has(value.changeAttribution)||!['normal','recovery','returned','replayed','final'].includes(value.readbackPhase)||!(value.identityEqual===null||typeof value.identityEqual==='boolean'))return unavailable;
 if(value.expectedType!=='NUMBER'||!['NUMERIC_ZERO','UNCHANGED_BASELINE'].includes(value.expectedClass)||!['prior','observed'].every(k=>assurancePairs[value[k+'Type']].includes(value[k+'Class'])))return unavailable;
 if(!assuranceHashFields.every(k=>typeof value[k]==='string'&&/^[a-f0-9]{64}$/.test(value[k])||(['priorBodySha256','priorIdentitySha256'].includes(k)||['observedBodySha256','observedIdentitySha256'].includes(k)&&assertion==='CONTROL_PLANE_RECORD_DELETED'&&value.observedType==='MISSING')&&value[k]===null))return unavailable;
 if(value.expectedClass==='UNCHANGED_BASELINE'&&(typeof value.priorBodySha256!=='string'||typeof value.priorIdentitySha256!=='string'||value.changeAttribution==='NEW_INCIDENT'))return unavailable;
 if(value.changeAttribution==='NEW_INCIDENT'&&(value.expectedClass!=='NUMERIC_ZERO'||value.priorType!=='MISSING'||value.priorClass!=='MISSING'||value.priorBodySha256!==null||value.priorIdentitySha256!==null||value.identityEqual!==null))return unavailable;
 return {schema:assuranceSchema,domain:'assurance',store:'cp_records',invariant:assertion,...Object.fromEntries(assuranceHashFields.map(k=>[k,value[k]])),...Object.fromEntries(['expectedType','priorType','observedType','expectedClass','priorClass','observedClass','identityEqual','changeAttribution','readbackPhase'].map(k=>[k,value[k]])),rawIncidentRetained:false,applicationAcceptance:false};
}
export function sanitizeAssuranceActivityContext(value,assertion){
 const unavailable={schema:assuranceActivitySchema,status:'UNAVAILABLE_OR_INVALID'};
 if(!value||typeof value!=='object'||value.schema!==assuranceActivitySchema||value.domain!=='assurance'||value.store!=='cp_events'||assertion!=='NEW_RECOVERY_ACTIVITY'||value.invariant!==assertion||!codes.has(assertion)||!['RECOVERY_ADMITTED','RECOVERY_RESULT'].includes(value.eventType)||!['normal','recovery','returned','replayed','final'].includes(value.readbackPhase)||value.rawEventsRetained!==false||value.applicationAcceptance!==false)return unavailable;
 if(!['priorCount','observedCount'].every(k=>Number.isSafeInteger(value[k])&&value[k]>=0&&value[k]<=50000&&!Object.is(value[k],-0))||!['priorSha256','observedSha256','checkerSha256'].every(k=>typeof value[k]==='string'&&/^[a-f0-9]{64}$/.test(value[k])))return unavailable;
 return {schema:assuranceActivitySchema,domain:'assurance',store:'cp_events',invariant:assertion,...Object.fromEntries(['eventType','priorCount','observedCount','priorSha256','observedSha256','checkerSha256','readbackPhase'].map(k=>[k,value[k]])),rawEventsRetained:false,applicationAcceptance:false};
}
export function runtimeIdentity(){try{const f=Object.fromEntries(fs.readFileSync('/proc/self/status','utf8').split('\n').filter(x=>x.includes(':')).map(x=>{const i=x.indexOf(':');return [x.slice(0,i),x.slice(i+1).trim()];}));return {pid:process.pid,effectiveUid:process.geteuid(),effectiveGid:process.getegid(),capabilities:Object.fromEntries(['CapInh','CapPrm','CapEff','CapBnd','CapAmb'].filter(k=>/^[a-f0-9]{16}$/.test(f[k])).map(k=>[k,f[k]])),noNewPrivileges:f.NoNewPrivs==='1',seccomp:Number(f.Seccomp)};}catch{return {pid:process.pid,effectiveUid:process.geteuid(),effectiveGid:process.getegid()};}}
export function safeNativeFailure(error,stage,operation,state=diagnosticState,identityScope='NATIVE_BRAIN_WORKER'){
 const message=String(error?.message??'').split('\n')[0],assertion=token(message,token(message.split(':')[0],token(error?.code,'UNCLASSIFIED_NATIVE_ERROR')));
 const code=String(error?.code??'');
 return {schema:'work8-v31-native-first-failure-v1',firstFailure:true,stage:token(stage),assertion,operation:token(operation),errno:errnos.has(code)?code:null,sourceFrames:safeFrames(String(error?.stack??'').match(/[A-Za-z0-9_-]+\.(?:cjs|mjs|js):[0-9]+:[0-9]+/g)??[]),identityScope:token(identityScope,'NATIVE_BRAIN_WORKER'),identity:runtimeIdentity(),state:Object.fromEntries(Object.keys(diagnosticState).map(k=>[k,typeof state[k]==='boolean'?state[k]:null])),containerLifecycle:{role:identityScope==='SQLJS_MODULE_PREFLIGHT'?'module':'backend',status:null,exitCode:null,oomKilled:null},...(error?.assuranceContext!==undefined?{assuranceContext:sanitizeAssuranceContext(error.assuranceContext,assertion)}:{}),...(error?.assuranceActivityContext!==undefined?{assuranceActivityContext:sanitizeAssuranceActivityContext(error.assuranceActivityContext,assertion)}:{}),rawErrorOrRecordsRetained:false};
}
let first=false;
export function emitNativeFailure(error,stage,operation,state=diagnosticState,identityScope){const value=safeNativeFailure(error,stage,operation,state,identityScope);if(!first){first=true;console.error('WORK8_NATIVE_FIRST_FAILURE '+JSON.stringify(value));}return value;}

export function sanitizeNativeRecord(value){
 if(!value||value.schema!=='work8-v31-native-first-failure-v1')throw Error('NATIVE_DIAGNOSTIC_SCHEMA_REFUSED');
 const id=value.identity??{},caps=id.capabilities??{},state=value.state??{},life=value.containerLifecycle??{},n=x=>Number.isSafeInteger(x)&&x>=0&&x<=2147483647?x:null;
 const frames=Array.isArray(value.sourceFrames)?safeFrames(value.sourceFrames):[];
 return {schema:value.schema,firstFailure:true,stage:token(value.stage),assertion:token(value.assertion),operation:token(value.operation),errno:errnos.has(value.errno)?value.errno:null,sourceFrames:frames,identityScope:token(value.identityScope,'NATIVE_BRAIN_WORKER'),identity:{pid:n(id.pid),effectiveUid:n(id.effectiveUid),effectiveGid:n(id.effectiveGid),capabilities:Object.fromEntries(['CapInh','CapPrm','CapEff','CapBnd','CapAmb'].filter(k=>typeof caps[k]==='string'&&/^[a-f0-9]{16}$/.test(caps[k])).map(k=>[k,caps[k]])),noNewPrivileges:typeof id.noNewPrivileges==='boolean'?id.noNewPrivileges:null,seccomp:n(id.seccomp)},state:Object.fromEntries(Object.keys(diagnosticState).map(k=>[k,typeof state[k]==='boolean'?state[k]:null])),containerLifecycle:{role:['backend','module','browser','redis'].includes(life.role)?life.role:null,status:['created','running','paused','restarting','removing','exited','dead'].includes(life.status)?life.status:null,exitCode:Number.isInteger(life.exitCode)&&life.exitCode>=-255&&life.exitCode<=255?life.exitCode:null,oomKilled:typeof life.oomKilled==='boolean'?life.oomKilled:null},...(value.origin?{origin:sanitizeStartupOrigin(value.origin)}:{}),...(value.assuranceContext!==undefined?{assuranceContext:sanitizeAssuranceContext(value.assuranceContext,token(value.assertion))}:{}),...(value.assuranceActivityContext!==undefined?{assuranceActivityContext:sanitizeAssuranceActivityContext(value.assuranceActivityContext,token(value.assertion))}:{}),rawErrorOrRecordsRetained:false};
}

// Observe the existing helper's synchronous fence acquisition, including when its
// awaited persistence rejects before the callback. This grants no write authority.
export function observeFencePromise(db,promise){diagnosticState.captureFenceAcquired=db.captureWriteFence===true;return Promise.resolve(promise).finally(()=>{diagnosticState.captureFenceReleased=db.captureWriteFence===false;});}

function sanitizeStartupOrigin(origin){
 const integer=x=>Number.isSafeInteger(x)&&x>=0&&x<=2147483647?x:null,hex=(x,n)=>typeof x==='string'&&new RegExp('^[a-f0-9]{'+n+'}$').test(x)?x:null,digits=x=>typeof x==='string'&&/^[0-9]{1,30}$/.test(x)?x:null;
 const knownEntries=new Set((allow.startupEntrypoints??[]).map(x=>x.slice(x.lastIndexOf('/')+1)));
 return {role:(allow.startupRoles??[]).includes(origin.role)?origin.role:'admitted-child',pid:integer(origin.pid),parentPid:integer(origin.parentPid),startTicks:digits(origin.startTicks),entrypoint:knownEntries.has(origin.entrypoint)?origin.entrypoint:'UNRECOGNIZED_ENTRY',entrySha256:hex(origin.entrySha256,64),source:hex(origin.source,40),generationSha256:hex(origin.generationSha256,64),observedMonotonicNs:digits(origin.observedMonotonicNs),messageSha256:hex(origin.messageSha256,64)};
}

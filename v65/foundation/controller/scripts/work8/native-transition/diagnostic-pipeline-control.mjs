// Negative-control driver: exact production collector and retainFirst function.
// It never imports application entrypoints or starts application writers.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createChildDiagnosticCollector} from './child-diagnostic-collector.mjs';
import {sanitizeNativeRecord} from './native-diagnostic.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url));
const [mode,membershipPath,evidence,behavior='exit']=process.argv.slice(2);
assert.equal(process.version,'v22.23.2');
assert.ok(['protected-entrypoint','system-errno','untrusted-message'].includes(mode));
assert.ok(['exit','timeout','invalid-utf8','unterminated-stdout'].includes(behavior));
if(behavior==='invalid-utf8')process.stdout.write(Buffer.from([0xff,0xfe,0x0a]));
if(behavior==='unterminated-stdout')process.stdout.write('private arbitrary unterminated stdout');
const source=fs.readFileSync(path.join(dir,'coordinator.mjs'),'utf8');
const line=source.split('\n').find(line=>line.startsWith('function retainFirst(value)'));
assert.ok(line&&line.endsWith('}'),'EXACT_COORDINATOR_RECORDER_REQUIRED');
// Execute the unchanged, source-extracted one-line production recorder. Only
// its storage sink is redirected to this synthetic test's private directory.
const recorder=Function('sanitizeNativeRecord','write','console',
  'let firstNativeFailure=null;'+line+';return {retainFirst,get:()=>firstNativeFailure};')(
    sanitizeNativeRecord,(name,value)=>fs.writeFileSync(path.join(evidence,name),JSON.stringify(value)),console);
const collector=createChildDiagnosticCollector(recorder.retainFirst);
const child=spawn(process.execPath,[path.join(dir,'child-startup-fixture.cjs'),mode,membershipPath],
  {env:{PATH:process.env.PATH,HOME:'/tmp'},stdio:['ignore','pipe','pipe']});
for(const [stream,pipe] of [['stdout',child.stdout],['stderr',child.stderr]])
  pipe.on('data',bytes=>collector.push(stream,bytes.toString('utf8')));
const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);});
collector.finish();assert.equal(code,1);const first=recorder.get();assert.ok(first);
assert.equal(first.identity.pid,child.pid);assert.notEqual(first.identity.pid,process.pid);
assert.equal(first.origin.parentPid,process.pid);
// An actual later coordinator error cannot displace the first child error.
recorder.retainFirst({...first,assertion:'ACTUAL_RUNTIME_EXITED',origin:undefined});
assert.equal(recorder.get().identity.pid,child.pid);
if(behavior==='timeout')await new Promise(resolve=>setTimeout(resolve,60000));
process.exitCode=1;

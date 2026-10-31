'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
assert.equal(process.getuid(),65534);assert.equal(process.getgid(),65534);
assert.match(fs.readFileSync('/proc/self/status','utf8'),/^CapEff:\s*0+$/m);
let refused=false;try{fs.writeFileSync('/probe-policy/control.json','forbidden');}catch(error){refused=['EACCES','EPERM','EROFS'].includes(error.code);}assert.ok(refused);
const fork=spawnSync(process.execPath,['-e','process.exit(0)'],{timeout:1000,stdio:'ignore'});assert.equal(fork.error?.code,'EPERM');
process.send({ready:true,uid:process.getuid(),gid:process.getgid(),policyWriteRefused:true,processCreationRefused:true});
setTimeout(()=>process.exit(0),8000);

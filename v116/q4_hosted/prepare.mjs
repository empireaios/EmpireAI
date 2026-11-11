import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
assert.equal(process.versions.node,'22.23.2');
assert.equal(process.getuid(),0);
assert.equal(process.getgid(),0);
assert.equal(process.env.NODE_OPTIONS,undefined);
assert.equal(process.env.NODE_PATH,undefined);
assert.equal(process.env.LD_PRELOAD,undefined);
const inputs=JSON.parse(fs.readFileSync('/control/application-inputs.json','utf8'));
assert.equal(inputs.applicationSource,process.env.WORK8_SOURCE_SHA);
const selected=['runtime-membership-controller.hosted.test.cjs','runtime-membership-controller.cjs','runtime-membership-bootstrap.mjs','runtime-generation.cjs','runtime-revision.cjs','fixtures/runtime-membership-writer.mjs','fixtures/runtime-membership-redis.cjs','fixtures/runtime-membership-runner.cjs'];
assert.deepEqual(inputs.files.map(x=>x.path).sort(),selected.map(x=>'deployment/'+x).sort());
const mounts=fs.readFileSync('/proc/self/mountinfo','utf8').trim().split('\n').map(line=>{const [l,r]=line.split(' - ');const f=l.split(' ');return {path:f[4],options:f[5].split(','),type:r.split(' ')[0]};});
for(const name of ['/work8-exam','/tmp']){
 const matches=mounts.filter(m=>m.path===name);assert.equal(matches.length,1);assert.equal(matches[0].type,'tmpfs');
 for(const flag of ['noexec','nosuid','nodev'])assert.ok(matches[0].options.includes(flag));
}
assert.equal(fs.statSync('/work8-exam').uid,0);assert.equal(fs.statSync('/work8-exam').mode&0o777,0o755);
assert.ok(!fs.existsSync('/var/run/docker.sock'));
const destination='/work8-exam/source';
assert.ok(!fs.existsSync(destination));fs.mkdirSync(destination,{mode:0o755});
for(const file of inputs.files){
 const original='/app/'+file.path,stat=fs.lstatSync(original),data=fs.readFileSync(original);
 assert.ok(stat.isFile()&&!stat.isSymbolicLink());assert.equal(data.length,file.bytes);
 assert.equal(crypto.createHash('sha256').update(data).digest('hex'),file.sha256);
 const target=path.join(destination,file.path);fs.mkdirSync(path.dirname(target),{recursive:true,mode:0o755});
 fs.writeFileSync(target,data,{flag:'wx',mode:0o444});assert.equal(fs.statSync(target).uid,0);
}
// Recheck every original input after staging; no application source was modified.
for(const file of inputs.files){
 for(const prefix of ['/app',destination])assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(prefix,file.path))).digest('hex'),file.sha256);
}
fs.writeFileSync('/evidence/q4-input-admission.json',JSON.stringify({source:inputs.applicationSource,node:process.versions.node,operatorUid:process.getuid(),originalFiles:inputs.files,originalAssertionsUnchanged:true,normalApplicationStarted:false,productionMutation:false},null,2)+'\n');

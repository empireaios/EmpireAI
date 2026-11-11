import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(process.versions.node,'22.23.2');assert.equal(process.getuid(),0);assert.equal(process.getgid(),0);
for(const k of ['NODE_OPTIONS','NODE_PATH','LD_PRELOAD','LD_AUDIT'])assert.equal(process.env[k],undefined);
const inputs=JSON.parse(fs.readFileSync('/control/application-inputs.json','utf8'));
assert.equal(inputs.applicationSource,process.env.WORK8_SOURCE_SHA);assert.equal(inputs.originalFiles.length,103);
const mounts=fs.readFileSync('/proc/self/mountinfo','utf8').trim().split('\n').map(line=>{const [l,r]=line.split(' - '),f=l.split(' ');return {path:f[4],options:f[5].split(','),type:r.split(' ')[0]};});
for(const name of ['/work8-exam','/work8-native','/tmp']){
 const selected=mounts.filter(m=>m.path===name);assert.equal(selected.length,1);assert.equal(selected[0].type,'tmpfs');
 for(const flag of ['nosuid','nodev'])assert.ok(selected[0].options.includes(flag));
 assert.equal(selected[0].options.includes('noexec'),name!=='/work8-native');
}
for(const name of ['/work8-exam','/work8-native']){const st=fs.statSync(name);assert.equal(st.uid,0);assert.equal(st.mode&0o777,0o755);}
assert.ok(!fs.existsSync('/var/run/docker.sock'));
const library='/work8-native/writer.so',native=fs.readFileSync('/native/runtime-writer-isolation.so');
assert.equal(sha(native),inputs.nativeArtifactSHA256);fs.writeFileSync(library,native,{flag:'wx',mode:0o444});
assert.equal(sha(fs.readFileSync(library)),inputs.nativeArtifactSHA256);assert.equal(fs.statSync(library).uid,0);assert.equal(fs.statSync(library).nlink,1);
assert.equal(process.env.WORK8_WRITER_ISOLATION_LIBRARY,library);assert.equal(process.env.WORK8_WRITER_ISOLATION_SHA256,inputs.nativeArtifactSHA256);
const destination='/work8-exam/source';assert.ok(!fs.existsSync(destination));fs.mkdirSync(destination,{mode:0o755});
const unique=new Set();
for(const item of inputs.originalFiles){
 assert.ok((item.path.startsWith('deployment/')||item.path==='backend/src/runtime/native-store-capture-lock.cjs')&&!item.path.split('/').includes('..')&&!unique.has(item.path));unique.add(item.path);
 const original='/app/'+item.path,stat=fs.lstatSync(original),bytes=fs.readFileSync(original);assert.ok(stat.isFile()&&!stat.isSymbolicLink());assert.equal(bytes.length,item.bytes);assert.equal(sha(bytes),item.sha256);
 const target=path.join(destination,item.path);fs.mkdirSync(path.dirname(target),{recursive:true,mode:0o755});fs.writeFileSync(target,bytes,{flag:'wx',mode:0o444});
}
assert.deepEqual(inputs.fixtureOnlyOverlays.map(x=>[x.controlName,x.target]),[
 ['runtime-writer-graph.hosted.test.cjs','deployment/runtime-writer-graph.hosted.test.cjs'],
 ['runtime-graph-application.cjs','deployment/fixtures/runtime-graph-application.cjs'],
 ['runtime-graph-lock-stores.cjs','deployment/fixtures/runtime-graph-lock-stores.cjs']]);
for(const item of inputs.fixtureOnlyOverlays){const b=fs.readFileSync('/control/'+item.controlName);assert.equal(b.length,item.bytes);assert.equal(sha(b),item.sha256);fs.writeFileSync(path.join(destination,item.target),b,{mode:0o444});}
for(const item of inputs.originalFiles){assert.equal(sha(fs.readFileSync('/app/'+item.path)),item.sha256);const replacement=inputs.fixtureOnlyOverlays.find(x=>x.target===item.path);assert.equal(sha(fs.readFileSync(path.join(destination,item.path))),replacement?.sha256??item.sha256);}
fs.writeFileSync('/evidence/graph-input-admission.json',JSON.stringify({source:inputs.applicationSource,node:process.versions.node,operatorUid:process.getuid(),originalFiles:inputs.originalFiles,fixtureOnlyOverlays:inputs.fixtureOnlyOverlays,originalApplicationUnchanged:true,nativeArtifactSHA256:inputs.nativeArtifactSHA256,normalApplicationStarted:false,syntheticApplicationEntries:true,productionMutation:false},null,2)+'\n');

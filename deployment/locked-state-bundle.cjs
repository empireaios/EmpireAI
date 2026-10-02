'use strict';
// Offline candidate volume bundle. Copies the entire dedicated application root
// and dedicated Redis persistence root, so enabled stores cannot silently drop.
const fs=require('node:fs'), path=require('node:path'), crypto=require('node:crypto'), assert=require('node:assert/strict');
const ACK='CANDIDATE_AND_REDIS_STOPPED_CLEANLY';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function files(root,prefix=''){
 assert.equal(fs.realpathSync(root),root,'Canonical root required');
 const result=[];
 for(const name of fs.readdirSync(root).sort()){
  const source=path.join(root,name), relative=prefix+name, st=fs.lstatSync(source);
  assert.ok(!st.isSymbolicLink(),'Symlink refused');
  if(st.isDirectory())result.push(...files(source,relative+'/'));
  else {assert.ok(st.isFile()&&st.nlink===1,'Only ordinary files accepted');result.push({path:relative,size:st.size,sha256:sha(fs.readFileSync(source))});}
 }
 return result;
}
function sync(dir){const fd=fs.openSync(dir,'r');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
function copy(source,target,entries){
 fs.mkdirSync(target,{mode:0o700});
 for(const entry of entries){const out=path.join(target,entry.path);fs.mkdirSync(path.dirname(out),{recursive:true,mode:0o700});const fd=fs.openSync(out,'wx',0o600);try{fs.writeFileSync(fd,fs.readFileSync(path.join(source,entry.path)));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
 assert.deepEqual(files(target),entries,'Copied tree integrity mismatch');sync(target);
}
function validate(o){assert.equal(o.acknowledgement,ACK);assert.match(o.buildSha,/^[a-f0-9]{40}$/);assert.ok(path.isAbsolute(o.destination));assert.ok(!fs.existsSync(o.destination),'Never overwrite a recovery target');assert.equal(fs.realpathSync(path.dirname(o.destination)),path.dirname(o.destination));}
function backup(o){
 validate(o);assert.match(o.shutdownReceiptSha256,/^[a-f0-9]{64}$/);
 const roots={application:o.applicationRoot,redis:o.redisRoot};
 const inventory=Object.fromEntries(Object.entries(roots).map(([k,v])=>[k,files(v)]));
 assert.ok(inventory.application.some(f=>f.path==='empireai-brain.db'),'Primary required');
 assert.ok(inventory.redis.some(f=>/\.aof|\.rdb/.test(f.path)),'Redis persistence required');
 for(const root of Object.values(roots))assert.ok(!o.destination.startsWith(root+'/'),'Backup must be outside source roots');
 fs.mkdirSync(o.destination,{mode:0o700});
 for(const [role,root]of Object.entries(roots)){copy(root,path.join(o.destination,role),inventory[role]);assert.deepEqual(files(root),inventory[role],'Source changed during backup');}
 const manifest={schema:'locked-state-bundle-v1',buildSha:o.buildSha,shutdownReceiptSha256:o.shutdownReceiptSha256,inventory,externalRequirements:['same owner/session secrets','matching runtime profile and code','isolated Redis credentials'],quiescenceVerifiedByCaller:true};
 const bytes=JSON.stringify(manifest,null,2)+'\n';fs.writeFileSync(path.join(o.destination,'manifest.json'),bytes,{flag:'wx',mode:0o600});sync(o.destination);return{manifestSha256:sha(bytes),inventory};
}
function restore(o){
 validate(o);const bytes=fs.readFileSync(path.join(o.bundle,'manifest.json'));assert.equal(sha(bytes),o.manifestSha256,'Independent manifest hash required');const m=JSON.parse(bytes);
 assert.equal(m.schema,'locked-state-bundle-v1');assert.equal(m.buildSha,o.buildSha);
 assert.deepEqual(Object.keys(m.inventory).sort(),['application','redis']);
 for(const role of ['application','redis'])assert.deepEqual(files(path.join(o.bundle,role)),m.inventory[role]);
 fs.mkdirSync(o.destination,{mode:0o700});for(const role of ['application','redis'])copy(path.join(o.bundle,role),path.join(o.destination,role),m.inventory[role]);sync(o.destination);
 return{applicationRoot:path.join(o.destination,'application'),redisRoot:path.join(o.destination,'redis'),inventory:m.inventory};
}
module.exports={ACK,backup,restore,files};
if(require.main===module){const [mode,request]=process.argv.slice(2);assert.ok(['backup','restore'].includes(mode));console.log(JSON.stringify(module.exports[mode](JSON.parse(fs.readFileSync(request,'utf8')))));}

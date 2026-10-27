import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
export type RedisProofBinding={source:string;captureDigest:string;sourceRunId:string;targetRunId:string;host:string;port:number;db:number};
export function protectedFile(file:string,immutable=false){
 assert.equal(path.resolve(file),file);assert.equal(fs.realpathSync(file),file);
 for(let p=file;;p=path.dirname(p)){const s=fs.lstatSync(p);assert.equal(s.uid,0);assert.equal(s.mode&0o022,0);assert.ok(!s.isSymbolicLink());if(p==='/')break;}
 const s=fs.lstatSync(file);assert.ok(s.isFile()&&s.nlink===1&&s.size<1048576);if(immutable)assert.equal(s.mode&0o777,0o444);
 return fs.readFileSync(file);
}
export function validateIsolatedRedisBinding(proof:any,binding:RedisProofBinding,now:number){
 assert.equal(proof.schema,'work8-isolated-redis-restore-v1');assert.equal(proof.mode,'inspection-only');
 assert.match(proof.nonce,/^[a-f0-9-]{36}$/);assert.ok(Number.isSafeInteger(proof.expiresAt)&&proof.expiresAt>now&&proof.expiresAt-now<=180000);
 assert.match(binding.source,/^[a-f0-9]{40}$/);assert.match(binding.captureDigest,/^[a-f0-9]{64}$/);
 assert.match(binding.sourceRunId,/^[a-f0-9]{40}$/);assert.match(binding.targetRunId,/^[a-f0-9]{40}$/);assert.notEqual(binding.sourceRunId,binding.targetRunId);
 assert.equal(binding.host,'target-redis');assert.equal(binding.port,6379);assert.equal(binding.db,0);
 for(const [key,value] of Object.entries(binding))assert.equal(proof[key],value);
 assert.match(proof.sourceGeneration,/^[a-f0-9-]{36}$/);assert.match(proof.targetGeneration,/^[a-f0-9-]{36}$/);assert.notEqual(proof.sourceGeneration,proof.targetGeneration);
}
export function consumeIsolatedRedisCapability(file:string,binding:RedisProofBinding){
 assert.equal(process.getuid?.(),0);assert.ok(fs.existsSync('/.dockerenv'));
 for(const key of ['RAILWAY_DEPLOYMENT_ID','RAILWAY_PROJECT_ID','RAILWAY_ENVIRONMENT_ID','RAILWAY_SERVICE_ID','VERCEL'])assert.ok(!process.env[key]);
 const proof=JSON.parse(protectedFile(file,true).toString());validateIsolatedRedisBinding(proof,binding,Date.now());
 const networkBytes=protectedFile(proof.networkProofFile,true);assert.equal(createHash('sha256').update(networkBytes).digest('hex'),proof.networkProofSha256);
 const n=JSON.parse(networkBytes.toString());assert.equal(n.internal,true);assert.match(n.networkId,/^[a-f0-9]{64}$/);assert.match(n.containerId,/^[a-f0-9]{64}$/);assert.deepEqual(n.attachedNetworkIds,[n.networkId]);assert.equal(n.networkNamespace,fs.readlinkSync('/proc/self/ns/net'));assert.equal(fs.readFileSync('/etc/hostname','utf8').trim(),n.containerId.slice(0,12));
 assert.ok(fs.readFileSync('/proc/net/route','utf8').trim().split('\n').slice(1).every(row=>row.trim().split(/\s+/)[1]!=='00000000'));
 assert.ok(fs.readFileSync('/proc/net/ipv6_route','utf8').trim().split('\n').filter(Boolean).every(row=>!/^0{32} 00 /.test(row)||row.trim().endsWith('lo')));
 verifyIsolatedRedisAuthorities(proof,binding);
 reserveIsolatedRedisCapability(file,proof,binding);
 return {expiresAt:proof.expiresAt};
}

export function verifyIsolatedRedisAuthorities(proof:any,binding:RedisProofBinding){
 for(const role of ['source','target']){
  const authority=proof[role+'Authority'];assert.match(authority,/^\/data\/work8-exam\/[a-zA-Z0-9_-]+\/volume\/authority\/generation\.sqlite$/);protectedFile(authority);
  const db=new DatabaseSync(authority,{readOnly:true});try{const row=db.prepare('SELECT generation,sources FROM authority WHERE id=1').get()!;assert.equal(row.generation,proof[role+'Generation']);assert.deepEqual(JSON.parse(String(row.sources)),[binding.source]);}finally{db.close();}
 }
}

export function reserveIsolatedRedisCapability(file:string,proof:any,binding:RedisProofBinding){
 protectedFile(file,true);
 assert.ok(Date.now()<proof.expiresAt);
 const fd=fs.openSync(file+'.consumed','wx',0o600);try{fs.writeFileSync(fd,JSON.stringify({nonce:proof.nonce,...binding}));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
 const dir=fs.openSync(path.dirname(file),'r');try{fs.fsyncSync(dir);}finally{fs.closeSync(dir);}
}

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {enrollFreshSourceBaseline} from '../scripts/work8/v116-test1-business.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
/** Called only after the ORIGINAL startup inference readback, inside the
 * genuinely admitted and demoted startup child with the additional reviewed
 * isolated-empty-commerce-enrollment membership scope. */
export async function enrollIfDeclared(){
 const file=process.env.WORK8_V116_ENROLLMENT_FILE;
 if(!file){assert.equal(process.env.WORK8_V116_ENROLLMENT_SHA256,undefined);return;}
 assert.equal(process.getuid(),65534);assert.equal(process.getgid(),65534);
 assert.equal(process.env.WORK8_MEMBERSHIP_ROLE,'startup-readback');assert.ok(process.connected&&process.send);
 assert.match(process.env.WORK8_MEMBERSHIP_ID??'',/^[a-f0-9-]{36}$/);assert.match(process.env.WORK8_MEMBERSHIP_NONCE??'',/^[a-f0-9-]{36}$/);
 assert.equal(process.argv[1],path.join(import.meta.dirname,'runtime-startup-readback.mjs'));
 assert.ok(process.execArgv.includes('--import'));assert.ok(process.execArgv.includes(path.join(import.meta.dirname,'runtime-membership-bootstrap.mjs')));
 const status=fs.readFileSync('/proc/self/status','utf8');assert.match(status,/^CapEff:\s+0+$/m);assert.match(status,/^NoNewPrivs:\s+1$/m);
 const bytes=fs.readFileSync(file);assert.equal(hash(bytes),process.env.WORK8_V116_ENROLLMENT_SHA256);const m=JSON.parse(bytes);
 assert.equal(m.schema,'v116-isolated-empty-commerce-enrollment-v1');assert.equal(m.scope,'isolated-empty-commerce-enrollment');assert.equal(m.role,'startup-readback');assert.equal(m.uid,65534);assert.equal(m.gid,65534);
 assert.equal(m.source,'6c1e63ba20619ee480742fd87dc810ca93152e22');assert.equal(m.source,process.env.RAILWAY_GIT_COMMIT_SHA);assert.equal(m.generation,process.env.EMPIRE_GENERATION);
 assert.equal(m.volume.root,'/data/work8-exam/source/volume');assert.equal(m.volume.root,process.env.RAILWAY_VOLUME_MOUNT_PATH);assert.equal(fs.realpathSync(m.volume.root),m.volume.root);const volume=fs.statSync(m.volume.root);assert.equal(volume.dev,m.volume.dev);assert.equal(volume.ino,m.volume.ino);
 assert.ok(Number.isSafeInteger(m.expiresAt)&&Date.now()<m.expiresAt);assert.equal(m.entry,process.argv[1]);assert.equal(hash(fs.readFileSync(m.entry)),m.entrySHA256);assert.equal(m.authoritySHA256,'f1170d9351861402fac03c99b9eb829c1d05941546c085bfcae4790b8a26add3');assert.equal(m.originalFreshStoreGuardPassed,true);assert.equal(m.normalApplicationStarted,false);
 assert.equal(file,path.join(process.env.EMPIRE_GENERATION_DIRECTORY,'v116-enrollment-'+m.nonce+'.json'));const st=fs.lstatSync(file);assert.ok(st.isFile()&&!st.isSymbolicLink()&&st.nlink===1);assert.equal(st.uid,0);assert.equal(st.mode&0o777,0o444);
 for(const key of ['RAILWAY_DEPLOYMENT_ID','RAILWAY_PROJECT_ID','RAILWAY_ENVIRONMENT_ID','RAILWAY_SERVICE_ID'])assert.equal(process.env[key],undefined);
 const temporary=path.join(path.dirname(m.volume.root),'tmp');assert.equal(process.env.TMPDIR,temporary);const tmp=fs.lstatSync(temporary);assert.ok(tmp.isDirectory()&&!tmp.isSymbolicLink());assert.equal(tmp.uid,65534);assert.equal(tmp.mode&0o777,0o700);
 const begin=Date.now(),enrollment=await enrollFreshSourceBaseline(m.volume.root,temporary);assert.ok(Date.now()<m.expiresAt&&Date.now()-begin<10000);
 const files=[];for(const name of fs.readdirSync(path.join(m.volume.root,'commerce'))){const f=path.join(m.volume.root,'commerce',name),s=fs.lstatSync(f);assert.ok(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1);assert.equal(s.uid,65534);assert.equal(s.gid,65534);assert.equal(s.mode&0o777,0o600);files.push({name,uid:s.uid,gid:s.gid,mode:s.mode&0o777,sha256:hash(fs.readFileSync(f))});}
 assert.deepEqual(files.map(f=>f.name).sort(),['runtime.sqlite','runtime.sqlite.initialized']);
 const result={schema:'v116-admitted-source-enrollment-result-v1',manifestSHA256:hash(bytes),source:m.source,generation:m.generation,grantNonce:m.nonce,memberId:process.env.WORK8_MEMBERSHIP_ID,role:m.role,scope:m.scope,pid:process.pid,uid:process.getuid(),gid:process.getgid(),entrySHA256:m.entrySHA256,begin,completedAt:Date.now(),closedBeforeNextApplicationRole:true,files,enrollment};
 const out=path.join(temporary,'v116-admitted-source-enrollment.json');const fd=fs.openSync(out,'wx',0o600);try{fs.writeFileSync(fd,JSON.stringify(result,null,2));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
}

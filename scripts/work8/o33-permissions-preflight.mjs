import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir,readableEvidence} from './o33-permissions.mjs';
const root='/work8-exam/permission-preflight',evidence=process.env.WORK8_EVIDENCE_DIR;
const receipt={source:process.env.WORK8_SOURCE_SHA,scope:'O33_PERMISSION_PREFLIGHT_ONLY',status:'FAIL',checks:{}};
const snapshot=f=>{const s=fs.lstatSync(f);return {uid:s.uid,gid:s.gid,mode:s.mode&0o777,sha256:s.isFile()?createHash('sha256').update(fs.readFileSync(f)).digest('hex'):null};};
try{
 assert.equal(process.getuid(),0);assert.equal(process.versions.node,'22.23.2');assert.ok(evidence);
 const caps=BigInt('0x'+fs.readFileSync('/proc/self/status','utf8').match(/^CapEff:\s*([0-9a-f]+)$/m)[1]);
 assert.equal(caps&8n,0n,'CAP_FOWNER_MUST_REMAIN_ABSENT');
 mkdir(root);const runtime=path.join(root,'runtime'),operator=path.join(root,'operator'),sealed=path.join(root,'sealed');
 mkdir(runtime,65534,0o700);mkdir(runtime,65534,0o700);mkdir(operator,0,0o700);mkdir(sealed,0,0o500);
 assert.deepEqual(snapshot(runtime),{uid:65534,gid:65534,mode:0o700,sha256:null});
 assert.throws(()=>fs.chmodSync(runtime,0o700),{code:'EPERM'});
 receipt.checks.actualDirectoryHandoff=true;
 const actualHost=path.join(evidence,'application-image.json'),actualBefore=snapshot(actualHost),uploader=actualBefore.uid;assert.notEqual(uploader,0,'HOST_FIXTURE_MUST_BE_FOREIGN_OWNED');assert.notEqual(uploader,65534);
 const fixture=path.join(root,'evidence');mkdir(fixture,uploader,0o755);
 const host=path.join(fixture,'host.txt'),owned=path.join(fixture,'operator.txt');
 fs.writeFileSync(host,'host-owned-readable',{mode:0o444});fs.chownSync(host,uploader,uploader);
 fs.writeFileSync(owned,'operator-owned',{mode:0o600});
 const hostBefore=snapshot(host),dirBefore=snapshot(fixture);
 readableEvidence(fixture);assert.deepEqual(snapshot(host),hostBefore);assert.deepEqual(snapshot(fixture),dirBefore);assert.equal(snapshot(owned).mode,0o644);
 const unreadable=path.join(fixture,'unreadable.txt');fs.writeFileSync(unreadable,'private',{mode:0o600});fs.chownSync(unreadable,uploader===1002?1003:1002,uploader===1002?1003:1002);
 assert.throws(()=>readableEvidence(fixture),/HOST_EVIDENCE_NOT_READABLE/);fs.unlinkSync(unreadable);
 const privateDir=path.join(fixture,'host-private');mkdir(privateDir,uploader,0o700);const privateFile=path.join(privateDir,'private.txt');fs.writeFileSync(privateFile,'host-private',{mode:0o600});fs.chownSync(privateFile,uploader,uploader);
 const privateBefore=snapshot(privateFile),privateDirBefore=snapshot(privateDir);readableEvidence(fixture);assert.deepEqual(snapshot(privateFile),privateBefore);assert.deepEqual(snapshot(privateDir),privateDirBefore);
 readableEvidence(evidence);assert.deepEqual(snapshot(actualHost),actualBefore);
 receipt.checks.foreignEvidencePreserved=true;receipt.checks.unreadableForeignEvidenceRefused=true;
 process.setgroups([]);
 const reader=spawnSync(process.execPath,['--input-type=module','-e',`import fs from 'node:fs';import assert from 'node:assert/strict';assert.equal(fs.readFileSync(process.argv[1],'utf8'),'host-private');fs.readFileSync(process.argv[2]);`,privateFile,actualHost],{uid:uploader,gid:actualBefore.gid,encoding:'utf8',timeout:10000,env:{PATH:process.env.PATH}});
 assert.equal(reader.status,0,reader.stderr||String(reader.error));receipt.checks.actualUploaderReadability=true;
 const child=spawnSync(process.execPath,['--input-type=module','-e',`
 import fs from 'node:fs';import assert from 'node:assert/strict';
 const [runtime,operator,sealed,host,owned,actualHost,privateFile]=process.argv.slice(1);
 assert.equal(process.getuid(),65534);assert.equal(process.getgid(),65534);assert.deepEqual(process.getgroups(),[65534]);
 assert.match(fs.readFileSync('/proc/self/status','utf8'),/^CapEff:\\s*0+$/m);
 fs.writeFileSync(runtime+'/own','runtime');assert.equal(fs.readFileSync(runtime+'/own','utf8'),'runtime');
 for(const dir of [operator,sealed]){assert.throws(()=>fs.readdirSync(dir),{code:'EACCES'});assert.throws(()=>fs.writeFileSync(dir+'/denied','x'),{code:'EACCES'});}
 assert.equal(fs.readFileSync(host,'utf8'),'host-owned-readable');assert.equal(fs.readFileSync(owned,'utf8'),'operator-owned');assert.throws(()=>fs.readFileSync(privateFile),{code:'EACCES'});
 for(const file of [host,owned,actualHost])assert.throws(()=>fs.accessSync(file,fs.constants.W_OK),{code:'EACCES'});
 console.log('NONROOT_ACCESS_AND_ISOLATION_PASS');
 `,runtime,operator,sealed,host,owned,actualHost,privateFile],{uid:65534,gid:65534,encoding:'utf8',timeout:10000,env:{PATH:process.env.PATH}});
 assert.equal(child.status,0,child.stderr||String(child.error));assert.match(child.stdout,/NONROOT_ACCESS_AND_ISOLATION_PASS/);
 receipt.checks.nonRootAccessAndIsolation=true;receipt.checks.noAddedPrivileges=true;
 receipt.status='PASS';receipt.hostEvidenceBefore=actualBefore;receipt.hostEvidenceAfter=snapshot(actualHost);
}catch(error){receipt.error=String(error);receipt.stack=error.stack;throw error;}
finally{fs.writeFileSync(path.join(evidence,'permission-preflight.json'),JSON.stringify(receipt,null,2),{mode:0o644});if(fs.existsSync(root))fs.rmSync(root,{recursive:true,force:true});}

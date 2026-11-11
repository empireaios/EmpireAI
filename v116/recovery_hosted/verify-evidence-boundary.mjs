// Pre-application actual-UID examination. No application module imports or startup.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=process.env.WORK8_EVIDENCE_DIR;
assert.equal(root,'/evidence');assert.equal(process.getuid(),0);assert.equal(process.versions.node,'22.23.2');
const sha=b=>createHash('sha256').update(b).digest('hex');
const meta=f=>{const s=fs.lstatSync(f);assert.ok(!s.isSymbolicLink());return {uid:s.uid,gid:s.gid,mode:s.mode&0o777,nlink:s.nlink,bytes:s.size,...(s.isFile()?{sha256:sha(fs.readFileSync(f))}:{})};};
const image=path.join(root,'application-image.json'),privateDir=path.join(root,'uid-private-control'),privateFile=path.join(privateDir,'private.txt'),privateTop=path.join(root,'uid-private-file.txt');
const before={root:meta(root),image:meta(image),privateDir:meta(privateDir),privateFile:meta(privateFile),privateTop:meta(privateTop)};
assert.equal(before.root.mode,0o711);assert.equal(before.image.mode,0o444);assert.equal(before.privateDir.mode,0o700);assert.equal(before.privateFile.mode,0o600);assert.equal(before.privateTop.mode,0o600);
const uploader=before.root.uid;assert.ok(![0,65534].includes(uploader));for(const value of Object.values(before))assert.equal(value.uid,uploader);
assert.equal(fs.readFileSync(privateFile,'utf8'),'V116_NONSECRET_PRIVATE_ACCESS_NEGATIVE\n');assert.equal(fs.readFileSync(privateTop,'utf8'),'V116_NONSECRET_PRIVATE_ACCESS_NEGATIVE\n');
process.setgroups([]);
const reader=spawnSync(process.execPath,['--input-type=module','-e',`
import fs from 'node:fs';import assert from 'node:assert/strict';
assert.equal(process.getuid(),Number(process.argv[1]));fs.readdirSync('/evidence');fs.readFileSync('/evidence/application-image.json');assert.equal(fs.readFileSync('/evidence/uid-private-control/private.txt','utf8'),'V116_NONSECRET_PRIVATE_ACCESS_NEGATIVE\\n');assert.equal(fs.readFileSync('/evidence/uid-private-file.txt','utf8'),'V116_NONSECRET_PRIVATE_ACCESS_NEGATIVE\\n');console.log('UPLOADER_ACCESS_PRESERVED');
`,String(uploader)],{uid:uploader,gid:before.root.gid,env:{PATH:'/usr/local/bin:/usr/bin:/bin'},encoding:'utf8',timeout:10000});
assert.equal(reader.status,0,reader.stderr);assert.equal(reader.stdout.trim(),'UPLOADER_ACCESS_PRESERVED');
const child=spawnSync(process.execPath,['--input-type=module','-e',`
import fs from 'node:fs';import assert from 'node:assert/strict';
assert.equal(process.getuid(),65534);assert.equal(process.getgid(),65534);assert.deepEqual(process.getgroups(),[65534]);assert.match(fs.readFileSync('/proc/self/status','utf8'),/^CapEff:\\s*0+$/m);
const image=JSON.parse(fs.readFileSync('/evidence/application-image.json','utf8'));assert.equal(image[0].Id,'sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0');
for(const operation of [()=>fs.readdirSync('/evidence'),()=>fs.writeFileSync('/evidence/forbidden','x',{flag:'wx'}),()=>fs.accessSync('/evidence/application-image.json',fs.constants.W_OK),()=>fs.readdirSync('/evidence/uid-private-control'),()=>fs.readFileSync('/evidence/uid-private-control/private.txt'),()=>fs.readFileSync('/evidence/uid-private-file.txt'),()=>fs.accessSync('/evidence/uid-private-file.txt',fs.constants.W_OK)])assert.throws(operation,{code:'EACCES'});
for(const f of ['/network-proof.json','/technical-authority.json','/work8-native/writer.so','/app/scripts/work8/v116-test1-coordinator.mjs','/app/scripts/work8/v116-test1-business.mjs','/app/scripts/work8/hh4-domain-state.mjs','/app/scripts/work8/canonical-business-records.mjs','/app/scripts/work8/native-commerce-baseline.mjs','/app/docs/governance/digital-soul/executive-decision-records.jsonl']){assert.ok(fs.readFileSync(f).length>0);assert.throws(()=>fs.accessSync(f,fs.constants.W_OK));}
console.log('ACTUAL_RUNTIME_UID_PUBLIC_INPUTS_AND_PRIVATE_DENIALS_PASS');
`],{uid:65534,gid:65534,env:{PATH:'/usr/local/bin:/usr/bin:/bin'},encoding:'utf8',timeout:10000});
assert.equal(child.status,0,child.stderr);assert.equal(child.stdout.trim(),'ACTUAL_RUNTIME_UID_PUBLIC_INPUTS_AND_PRIVATE_DENIALS_PASS');
const after={root:meta(root),image:meta(image),privateDir:meta(privateDir),privateFile:meta(privateFile),privateTop:meta(privateTop)};assert.deepEqual(after,before);
fs.writeFileSync(path.join(root,'uid-evidence-boundary.json'),JSON.stringify({schema:'v116-actual-uid-evidence-boundary-v1',status:'PASS',operator:0,uploader,runtime:65534,rootMode:'0711',publicImageMode:'0444',privateDirectoryMode:'0700',privateFileMode:'0600',privateFixturesContainNoOwnerData:true,applicationStarted:false,applicationImports:false,sourceUnchanged:true,metadataUnchanged:true,checks:['uploader_public_and_private_access','runtime_public_metadata_read','runtime_source_and_authority_inputs_read','runtime_no_evidence_enumeration','runtime_no_evidence_write','runtime_no_metadata_write','runtime_no_private_directory_or_file_read','runtime_no_private_top_level_file_read_or_write'],before,after},null,2)+'\n',{flag:'wx',mode:0o644});

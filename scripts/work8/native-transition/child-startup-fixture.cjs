'use strict';
// Deliberate non-production failure fixture; never imports application writers.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const diagnostic=require('./child-startup-diagnostic.cjs');
const [mode,membershipPath]=process.argv.slice(2);
if(!['protected-entrypoint','system-errno','untrusted-message'].includes(mode))throw Error('FIXTURE_MODE_REFUSED');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'work8-v32-child-fixture-'));
try{
 if(mode==='protected-entrypoint'){
  const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'startup-overlays.json'),'utf8'));
  const bytes=fs.readFileSync(membershipPath);if(crypto.createHash('sha256').update(bytes).digest('hex')!==manifest.originalMembershipControllerSha256)throw Error('FIXTURE_ORIGINAL_SOURCE_CHANGED');
  const {protectedPath}=require(membershipPath);const entry=path.join(temp,'synthetic-entry.cjs');fs.writeFileSync(entry,'// isolated fixture only\n',{mode:0o666});fs.chmodSync(entry,0o666);protectedPath(entry,0);
 }else if(mode==='system-errno')fs.readFileSync(path.join(temp,'missing-private-fixture'));
 else{console.log('private fixture '+('AK'+'IA'+'A'.repeat(16)));throw Error('AK'+'IA'+'A'.repeat(16));}
 throw Error('EXPECTED_FIXTURE_REFUSAL_NOT_OBSERVED');
}catch(error){diagnostic.observe(error,'ADMITTED_CHILD_STARTUP','startup-readback');diagnostic.observe(Error('PRIMARY_EXITED'),'WRITER_CONTROLLER_FAULT','writer-controller');process.exitCode=1;}
finally{fs.rmSync(temp,{recursive:true,force:true});}

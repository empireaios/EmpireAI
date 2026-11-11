'use strict';
// V116 examination overlay only. This is a new, explicitly declared capability,
// not an expansion inferred from the original inference-readback scope.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {loadGrant}=require('./runtime-isolated-application.cjs');
const {protectedPath}=require('./runtime-membership-controller.cjs');
const SOURCE='6c1e63ba20619ee480742fd87dc810ca93152e22';
const AUTHORITY='f1170d9351861402fac03c99b9eb829c1d05941546c085bfcae4790b8a26add3';
const SCOPE='isolated-empty-commerce-enrollment';
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
function prepareEnrollment(spec,env,cwd){
 if(!spec||spec.grant.mode!=='source')return null;
 assert.equal(process.getuid(),0);assert.equal(spec.grant.source,SOURCE);
 assert.equal(env.WORK8_RUNTIME_UID,'65534');assert.equal(env.WORK8_RUNTIME_GID,'65534');
 assert.equal(spec.grant.volume.root,'/data/work8-exam/source/volume');
 // Reapply the ORIGINAL full fresh-store guard immediately before creating the
 // capability; do not add an exception for a pre-existing commerce database.
 const fresh=loadGrant(spec.file,env);assert.deepEqual(fresh,spec);
 assert.equal(fs.existsSync(spec.file+'.consumed'),false);
 const reservation=fs.readFileSync(spec.file+'.reserved');
 assert.deepEqual(JSON.parse(reservation),{schema:'work8-isolated-application-v1',nonce:spec.grant.nonce,source:SOURCE,generation:spec.grant.generation,mode:'source'});
 assert.equal(fs.existsSync(env.WORK8_CONTROLLER_JOURNAL_PATH),false,'SOURCE_MEMBERS_NOT_YET_ADMITTED');
 assert.equal(digest(fs.readFileSync('/technical-authority.json')),AUTHORITY);
 const entry=path.join(cwd,'deployment/runtime-startup-readback.mjs');protectedPath(entry,0);
 const value={schema:'v116-isolated-empty-commerce-enrollment-v1',scope:SCOPE,source:SOURCE,generation:spec.grant.generation,nonce:spec.grant.nonce,volume:spec.grant.volume,expiresAt:spec.grant.expiresAt,role:'startup-readback',uid:65534,gid:65534,entry,entrySHA256:digest(fs.readFileSync(entry)),grantSHA256:digest(fs.readFileSync(spec.file)),reservationSHA256:digest(reservation),authoritySHA256:AUTHORITY,originalFreshStoreGuardPassed:true,normalApplicationStarted:false};
 const file=path.join(env.EMPIRE_GENERATION_DIRECTORY,'v116-enrollment-'+value.nonce+'.json');
 protectedPath(path.dirname(file),0);const fd=fs.openSync(file,'wx',0o444);try{fs.writeFileSync(fd,JSON.stringify(value));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}const dir=fs.openSync(path.dirname(file),'r');try{fs.fsyncSync(dir);}finally{fs.closeSync(dir);}
 return {file,sha256:digest(fs.readFileSync(file)),scope:SCOPE,entrySHA256:value.entrySHA256,expiresAt:value.expiresAt};
}
module.exports={prepareEnrollment,SCOPE,SOURCE,AUTHORITY};

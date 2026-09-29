'use strict';
// Fixed synthetic rehearsal only: accepts no source path and never starts EmpireAI.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const {DatabaseSync}=require('node:sqlite');
const {captureCheckpoint,verifyCheckpoint}=require('./legacy-checkpoint-capture.cjs');
const {captureLegacyShadowDisk,verifyLegacyShadowDisk}=require('./legacy-shadow-state-capture.cjs');
function rehearse(){
 const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'empire-cutover-rehearsal-')));
 try{
  const old=path.join(root,'old'),volume=path.join(root,'volume'),restored=path.join(root,'restored');
  for(const p of [old,volume,restored])fs.mkdirSync(p,{mode:0o700});
  const brain=path.join(old,'brain.db'),shadow=path.join(old,'shadow-ceo.db'),authority=path.join(old,'authority-store.json');
  for(const file of [brain,shadow]){const db=new DatabaseSync(file);db.exec("CREATE TABLE recovery_probe(id INTEGER PRIMARY KEY, value TEXT); INSERT INTO recovery_probe VALUES(41,'preserved business row');");db.close();}
  fs.writeFileSync(path.join(old,'shadow-ceo-request-owners.json'),JSON.stringify({request41:'ws_empire_1'}),{mode:0o600});
  fs.writeFileSync(authority,JSON.stringify({birth:'NOT_BORN',commerce:'LOCKED'}),{mode:0o600});
  const sourceCommit='21384342c401def948926904913840e63c18dff7';
  const b=captureCheckpoint({source:brain,destination:path.join(volume,'brain'),sourceCommit});
  const s=captureLegacyShadowDisk({dataDir:old,authorityFile:authority,destination:path.join(volume,'shadow'),sourceCommit,volumeRoot:volume});
  verifyCheckpoint({directory:b.directory,manifestSha256:b.manifestSha256});verifyLegacyShadowDisk(s.directory,s.manifestSha256);
  for(const [from,to] of [[path.join(b.directory,'checkpoint.db'),'brain.db'],[path.join(s.directory,'shadow-ceo.db'),'shadow.db'],[path.join(s.directory,'authority-store.json'),'authority.json'],[path.join(s.directory,'shadow-ceo-request-owners.json'),'owners.json']])fs.copyFileSync(from,path.join(restored,to),fs.constants.COPYFILE_EXCL);
  // A fresh process opens restored files, not the original handles or source paths.
  const child=spawnSync(process.execPath,['-e',`const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');const {DatabaseSync}=require('node:sqlite');const dir=process.argv[1];for(const f of ['brain.db','shadow.db']){const db=new DatabaseSync(path.join(dir,f),{readOnly:true});assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');assert.equal(db.prepare('SELECT value FROM recovery_probe WHERE id=41').get().value,'preserved business row');db.close();}assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir,'authority.json'))),{birth:'NOT_BORN',commerce:'LOCKED'});assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'owners.json'))).request41,'ws_empire_1');console.log('RESTORE_READBACK_OK');`,restored],{encoding:'utf8',timeout:10000});
  assert.equal(child.status,0,child.stderr);assert.match(child.stdout,/RESTORE_READBACK_OK/);
  const tampered=new DatabaseSync(path.join(b.directory,'checkpoint.db'));tampered.exec('DELETE FROM recovery_probe');tampered.close();
  assert.throws(()=>verifyCheckpoint({directory:b.directory,manifestSha256:b.manifestSha256}));
  // Corrupting a backup did not alter the source; verify with a new independent handle.
  const source=new DatabaseSync(brain,{readOnly:true});assert.equal(source.prepare('SELECT count(*) AS n FROM recovery_probe').get().n,1);source.close();
  return {schemaVersion:1,evidenceMode:'SYNTHETIC_RESTORE_REHEARSAL',brainAndShadowCaptured:true,jsonOwnershipAndAuthorityRestored:true,freshProcessReadback:true,tamperedCaptureRefused:true,originalSourceUnchanged:true,pendingRamCaptured:false,redisRestored:false,nativeStoresRestored:false,oldProcessCaptureBridgeVerified:false,safeToPromote:false,productionTouched:false,businessWrites:0};
 }finally{fs.rmSync(root,{recursive:true,force:true});}
}
module.exports={rehearse};
if(require.main===module){assert.equal(process.argv.length,2,'No source or output paths accepted');console.log(JSON.stringify(rehearse(),null,2));}

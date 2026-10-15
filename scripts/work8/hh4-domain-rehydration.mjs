import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
/** Reopen disposable copies through real domain adapters, never boot the archive.
 * This proves scoped storage compatibility, not operational recovery or custody.
 * HELD_CAPTURE checks the image revision marker; callers must additionally retain
 * the independently verified exact-source build/image association for attribution. */
export async function examineDomainRehydration({repo,directory,digest,source,inventory,mode='HELD_CAPTURE'}) {
 repo=fs.realpathSync(repo);directory=fs.realpathSync(directory);
 const require=createRequire(path.join(repo,'package.json'));
 const recovery=require(path.join(repo,'deployment/work8-recovery-set.cjs'));
 assert.ok(['HELD_CAPTURE','LOCAL_ADAPTER_SMOKE'].includes(mode),'EXPLICIT_EXAMINATION_MODE');
 const compiledRevision=mode==='HELD_CAPTURE'?require(path.join(repo,'deployment/runtime-revision.cjs')).resolveRuntimeRevision(repo,source):null;
 const manifest=recovery.verifyRuntimeRecoverySet({directory,digest});
 assert.equal(manifest.sourceCommit,source);assert.equal(manifest.bootAllowed,false);assert.equal(manifest.completeLiveState,false);
 assert.equal(inventory.classification,'LABELLED_SYNTHETIC_INITIALIZATION');assert.equal(inventory.source,source);
 assert.equal(inventory.workspace,'synthetic:hh4');assert.equal(inventory.paidInference,0);assert.equal(inventory.externalEffects,0);
 const {readCanonicalSqlite}=await import(pathToFileURL(path.join(repo,'scripts/work8/hh4-inspection-restoration.mjs')));
 const api=relative=>import(pathToFileURL(path.join(repo,'backend/dist',relative)));
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'hh4-domain-rehydration-'));fs.chmodSync(temporary,0o700);
 const checked=[];
 const copy=id=>{assert.ok(manifest.stores[id]);const from=path.join(directory,id,'checkpoint.db'),to=path.join(temporary,id+'.sqlite');fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);if(['financialEvidence','commerce'].includes(id)){assert.ok(manifest.lifecycleMarkers?.[id],'LIFECYCLE_MARKER_REQUIRED');fs.copyFileSync(path.join(directory,id+'.initialized'),to+'.initialized',fs.constants.COPYFILE_EXCL);}
 return {from,to,before:readCanonicalSqlite(from)};};
 const oracle=name=>{const row=inventory.domains[name];assert.ok(row);assert.equal(hash(row.publicReadback),row.sha256,'ORACLE_DIGEST_MISMATCH');return row.publicReadback;};
 const verify=(name,files,actual,expected)=>{assert.deepEqual(actual,expected,name+'_PUBLIC_READBACK_CHANGED');assert.deepEqual(readCanonicalSqlite(files.to),files.before,name+'_CANONICAL_RECORDS_CHANGED');assert.deepEqual(readCanonicalSqlite(files.from),files.before,name+'_ARCHIVE_CHANGED');checked.push({domain:name,publicReadbackSha256:hash(actual),canonicalSha256:hash(files.before),canonicalRecordsPreserved:true});};
 try {
  const expectedIntelligence=oracle('intelligence'),intelligence=copy('intelligence');
  const {IntelligenceStore}=await api('intelligence/store.js');
  verify('intelligence',intelligence,new IntelligenceStore(intelligence.to).get(inventory.workspace,'recovery_observations',expectedIntelligence.id),expectedIntelligence);
  const expectedReasoning=oracle('reasoning'),reasoning=copy('pillowReasoning');
  assert.ok(expectedReasoning.length>0);const session=expectedReasoning[0].requestId;assert.ok(session);
  const {ReasoningState}=await api('orchestration/pillow-host/reasoning-state.js');
  verify('reasoning',reasoning,new ReasoningState(reasoning.to).load(inventory.workspace,session),expectedReasoning);
  const expectedFinance=oracle('financialEvidence'),finance=copy('financialEvidence');
  const {FinancialCentre}=await api('finance/financial-centre.js');const financialStore=new FinancialCentre(finance.to);
  let entries;try{entries=financialStore.entries(inventory.workspace);}finally{financialStore.close();}
  verify('financialEvidence',finance,entries,expectedFinance);
  const expectedCommerce=oracle('commerce'),commerce=copy('commerce');assert.ok(expectedCommerce.length>0);
  const {GovernedCommerceStore}=await api('runtime/commerce-runtime/governed/store.js');const commerceStore=new GovernedCommerceStore(commerce.to);
  let history;try{history=commerceStore.history(inventory.workspace,expectedCommerce[0].missionId);}finally{commerceStore.close();}
  verify('commerce',commerce,history,expectedCommerce);
  recovery.verifyRuntimeRecoverySet({directory,digest});
  return {schema:'HH4_DOMAIN_ADAPTER_REHYDRATION_V1',status:mode==='HELD_CAPTURE'?'PASS_SCOPED_DOMAIN_REHYDRATION_ONLY':'PASS_UNBOUND_LOCAL_ADAPTER_SMOKE_ONLY',mode,compiledRevision,revisionMarkerMatched:mode==='HELD_CAPTURE',compiledBuildAttestation:'CALLER_MUST_VERIFY_EXACT_SOURCE_IMAGE_ASSOCIATION',source,digest,checked,bootAllowed:false,operationalRestoration:false,replay:false,protectedCustody:false,externalEffects:0,paidInference:0,originalRequirementsAccepted:[]};
 }finally{fs.rmSync(temporary,{recursive:true,force:true});}
}

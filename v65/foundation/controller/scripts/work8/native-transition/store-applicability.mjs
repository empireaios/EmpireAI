import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import source from './store-applicability.json' with {type:'json'};
import startupOverlays from './startup-overlays.json' with {type:'json'};
import brainOverlay from './live-brain-overlay.json' with {type:'json'};
const sha = x => createHash('sha256').update(x).digest('hex');
const names = x => Object.keys(x).sort();
const markerStores = new Set(['liveCostCentre','financialEvidence','commerce']);
function regular(file, maxBytes) {
 const s=fs.lstatSync(file);
 assert.ok(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&s.size<=maxBytes,'APPLICABILITY_SOURCE_FILE_REFUSED');
 assert.equal(fs.realpathSync(file),file,'APPLICABILITY_SOURCE_PATH_REFUSED');
 return s;
}
// This read-only gate never materializes a missing domain or manufactures rows.
// The complete logical reader remains responsible for every present row/schema.
export function verifyStoreApplicability({stores,declaredPaths,stage,sourceRoot='/app',volumeRoot='/data/work8-exam/native-transition/volume',manifest=source}) {
 assert.ok(['preflight','full'].includes(stage),'APPLICABILITY_STAGE_REQUIRED');
 assert.equal(manifest.schema,'work8-v62-store-applicability-source-review-v1');
 assert.equal(manifest.backendSource,'6c1e63ba20619ee480742fd87dc810ca93152e22');
 assert.equal(manifest.mandatoryInventoryCount,13);
 assert.equal(manifest.stores.length,13);
 const declared=Object.fromEntries(manifest.stores.map(s=>[s.id,s.relativePath]));
 assert.deepEqual(declaredPaths,declared,'DECLARED_STORE_TOPOLOGY_CHANGED');
 assert.deepEqual(names(stores),names(declared),'INCOMPLETE_STORE_INVENTORY');
 const checked={};
 for(const evidence of Object.values(manifest.sourceEvidence)) {
  assert.ok(evidence.imagePath.startsWith('/app/')&&!evidence.imagePath.includes('/../'),'APPLICABILITY_SOURCE_PATH_REFUSED');
  const relative=evidence.imagePath.slice(5);
  const overlay=startupOverlays.files.find(x=>x.target===evidence.imagePath)??(brainOverlay.originalPath===evidence.imagePath?brainOverlay:null);
  if(overlay)assert.equal(overlay.originalSha256,evidence.sha256,'APPLICABILITY_OVERLAY_ORIGINAL_CHANGED');
  const expected=overlay?overlay.overlaySha256:evidence.sha256;
  if(checked[relative]){assert.equal(checked[relative],expected);continue;}
  const file=path.join(sourceRoot,relative);regular(file,4*1024*1024);
  assert.equal(sha(fs.readFileSync(file)),expected,'APPLICABILITY_SOURCE_CHANGED');checked[relative]=expected;
 }
 const rows={};
 for(const rule of manifest.stores) {
  assert.ok(rule.sourceEvidence.length>0&&rule.sourceEvidence.every(x=>manifest.sourceEvidence[x]),'STORE_SOURCE_ATTRIBUTION_REQUIRED');
  assert.ok(typeof rule.reason==='string'&&rule.reason.length>20,'STORE_APPLICABILITY_REASON_REQUIRED');
  const observed=stores[rule.id],required=rule.requiredPresent[stage==='preflight'?'nativePreflight':'fullExamination'];
  assert.equal(typeof observed.present,'boolean','STORE_PRESENCE_UNPROVEN');
  if(required)assert.equal(observed.present,true,'REQUIRED_DECLARED_STORE_MISSING_'+rule.id);
  else assert.equal(rule.absencePermissionIsConditional,true,'INACTIVE_STORE_PERMISSION_UNPROVEN');
  if(observed.present) {
   assert.ok(observed.tables&&names(observed.tables).length>0,'PRESENT_STORE_SCHEMA_EMPTY_'+rule.id);
   for(const table of rule.ifPresentRequiredTables)assert.ok(Object.hasOwn(observed.tables,table),'MANDATORY_STORE_TABLE_MISSING_'+rule.id+'_'+table);
   if(rule.ifPresentIdentity)for(const key of ['applicationId','userVersion'])assert.equal(observed[key],rule.ifPresentIdentity[key],'STORE_SCHEMA_IDENTITY_CHANGED_'+rule.id);
  }
  let marker=null;
  if(markerStores.has(rule.id)) {
   const file=path.join(volumeRoot,rule.relativePath+'.initialized'),present=fs.existsSync(file);
   assert.equal(present,observed.present,'STORE_INITIALIZATION_MARKER_MISMATCH_'+rule.id);
   if(present){const s=regular(file,4096);marker={bytes:s.size,sha256:sha(fs.readFileSync(file))};}
  }
  rows[rule.id]={relativePath:rule.relativePath,present:observed.present,requiredPresent:required,
   classification:observed.present?'ACTUAL_INITIALIZED_STORE':rule.absenceClassification,
   reasonSHA256:sha(rule.reason),sourceEvidence:rule.sourceEvidence,initializationMarker:marker};
 }
 return {schema:'work8-v62-store-applicability-readback-v1',stage,declaredCount:13,
  requiredPresentCount:manifest.stores.filter(s=>s.requiredPresent[stage==='preflight'?'nativePreflight':'fullExamination']).length,
  checkedSourceFiles:checked,stores:rows,missingStateCreated:false};
}

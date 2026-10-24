'use strict';
// Capture-only preservation of actual repository initialization history.
// Does not create source markers, stage bootable state or grant authority.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const MARKERS=Object.freeze({liveCostCentre:'commissioning/openai-october-2026.sqlite.initialized',financialEvidence:'finance/evidence.sqlite.initialized',commerce:'commerce/runtime.sqlite.initialized'});
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function readMarker(file){
 assert.equal(fs.realpathSync(file),file,'LIFECYCLE_MARKER_ALIAS');
 const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
 try{const stat=fs.fstatSync(fd);assert.ok(stat.isFile()&&stat.nlink===1&&stat.size>0&&stat.size<=65536,'LIFECYCLE_MARKER_UNSAFE');const bytes=fs.readFileSync(fd);assert.equal(bytes.length,stat.size,'LIFECYCLE_MARKER_CHANGED');return bytes;}finally{fs.closeSync(fd);}
}
function captureLifecycleMarkers(root,destination){
 const digests={};for(const [id,relative]of Object.entries(MARKERS)){
  const bytes=readMarker(path.join(root,relative));fs.writeFileSync(path.join(destination,id+'.initialized'),bytes,{flag:'wx',mode:0o600});digests[id]=sha(bytes);
 }
 return digests;
}
function verifyLifecycleMarkers(directory,digests,source=false){
 assert.ok(digests&&typeof digests==='object'&&!Array.isArray(digests),'LIFECYCLE_MANIFEST_REQUIRED');assert.deepEqual(Object.keys(digests).sort(),Object.keys(MARKERS).sort(),'LIFECYCLE_COVERAGE_REQUIRED');
 for(const [id,relative]of Object.entries(MARKERS)){assert.match(digests[id],/^[a-f0-9]{64}$/);assert.equal(sha(readMarker(path.join(directory,source?relative:id+'.initialized'))),digests[id],'LIFECYCLE_MARKER_DIGEST');}
}
module.exports={MARKERS,captureLifecycleMarkers,verifyLifecycleMarkers};

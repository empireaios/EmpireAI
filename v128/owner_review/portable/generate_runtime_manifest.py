#!/usr/bin/env python3
"""Pin actual assembled executable bytes and build provenance; never private inputs.

Local and provider Next outputs need not be byte-identical. The exact deployed
manifest is admitted separately through source/deployment/key custody readback.
"""
import argparse,hashlib,json,os,pathlib,re,stat,subprocess
APPLICATION='6c1e63ba20619ee480742fd87dc810ca93152e22'
NODE='3517c2df0b2f8cd7f422b4b8450ef81c6889f08eb03e281d6de9079b15e6a327'
BASE='sha256:e8c69d86735f6df3efa06b324694fe51f0422785f83a3bd463052636c2421944'
ROOTS=('/control/','/app/','/frontend/','/opt/redis/','/usr/local/lib/','/usr/lib/','/lib/')
EXACT={'/usr/local/bin/node','/usr/bin/redis-server','/usr/bin/python3','/usr/local/bin/python3','/usr/local/bin/python3.11','/usr/bin/timeout','/usr/bin/setpriv','/lib64/ld-linux-x86-64.so.2','/bin/sh','/usr/bin/sh','/usr/bin/dash','/usr/bin/env','/etc/passwd','/etc/group','/etc/ld.so.cache','/etc/ld.so.conf'}
def sha(path):
 with pathlib.Path(path).open('rb')as f:return hashlib.file_digest(f,'sha256').hexdigest()
def digest(value):return hashlib.sha256(json.dumps(value,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def descriptor(path,logical=None):return {'path':logical or str(path),'bytes':path.stat().st_size,'sha256':sha(path)}
def write_new(path,value):
 raw=(json.dumps(value,sort_keys=True,separators=(',',':'))+'\n').encode()
 with path.open('xb')as f:f.write(raw)
 path.chmod(0o444);assert path.read_bytes()==raw;return raw

def main():
 p=argparse.ArgumentParser();p.add_argument('--runtime-root',required=True);p.add_argument('--repository',required=True);p.add_argument('--metadata-directory',required=True);p.add_argument('--publication-commit',required=True);a=p.parse_args()
 root=pathlib.Path(a.runtime_root).resolve();repo=pathlib.Path(a.repository).resolve();meta=pathlib.Path(a.metadata_directory).resolve();commit=a.publication_commit
 assert re.fullmatch('[a-f0-9]{40}',commit),'ACTUAL_PUBLICATION_COMMIT_REQUIRED'
 control=root/'control/owner_review';source=control/'source-manifest.json';assert source.is_file()and not source.is_symlink(),'FROZEN_SOURCE_MANIFEST_REQUIRED'
 authority=json.loads((control/'authority.json').read_bytes());reservation=json.loads((control/'reservation.json').read_bytes());assert authority['operationIdentity']==reservation['operationIdentity']=='V128-CONNECTOR-MEDIA-OWNER-REVIEW-A09-20261113'
 assert reservation['status']=='RESERVED_IN_CANONICAL_LEDGER'and reservation['savedLedgerVersion']==76 and re.fullmatch('[a-f0-9]{64}',reservation['savedLedgerSHA256']),'ACTUAL_SAVED_FINANCIAL_BINDING_REQUIRED'
 assert source.read_bytes()==(repo/'v128/owner_review/source-manifest.json').read_bytes(),'SOURCE_MANIFEST_COPY_IDENTITY'
 source_identity=json.loads(source.read_bytes());assert source_identity['schema']=='A09_REVIEW_SOURCE_MANIFEST_V1'and source_identity['retainedApplicationCommit']==APPLICATION
 assert sha(root/'usr/local/bin/node')==NODE
 frontend=json.loads((meta/'frontend-build-receipt.json').read_bytes());inputs=json.loads((meta/'frontend-build-inputs.json').read_bytes());retained=json.loads((meta/'extracted/extraction-receipt.json').read_bytes());overlay=json.loads((control/'backend-overlays.json').read_bytes())
 assert frontend['status']=='PASS'and frontend['sourceFiles']==inputs['changedSourceFileCount']==962 and frontend['sourceTreeSHA256']==inputs['changedSourceTreeSHA256']
 assert frontend['packageLockSHA256']==inputs['packageLockSHA256']and frontend['nodeSHA256']==NODE
 assert frontend['sourceFiles']==source_identity['completeFrontendFileCount']and frontend['sourceTreeSHA256']==source_identity['completeFrontendSourceSHA256'],'FROZEN_COMPLETE_FRONTEND_SOURCE_IDENTITY'
 assert retained['status']=='PASS'and retained['applicationCommit']==APPLICATION and retained['archiveSHA256']=='b99d11a65d40d6a6a197da6ba805e72a72ac55d4551ad13f31930ec5eeadbcb6'
 # Verify every compiled overlay against the actual bytes that will execute.
 for row in overlay['files']:
  target=root/row['destination'].lstrip('/');assert target.stat().st_size==row['bytes']and sha(target)==row['sha256']
 for row in frontend['frontendFiles']:
  target=root/'frontend/app'/row['path'];assert row['type']=='file'and target.stat().st_size==row['bytes']and sha(target)==row['sha256']
 provenance={'schema':'A09_ACTUAL_RUNTIME_BUILD_PROVENANCE_V1','publicationCommit':commit,'applicationCommit':APPLICATION,'sourceManifestSHA256':sha(source),'sourceManifestBytes':source.stat().st_size,'officialPythonBaseLinuxAMD64ManifestDigest':BASE,'retainedImageArchiveSHA256':retained['archiveSHA256'],'retainedImageConfigSHA256':retained['imageConfigSHA256'],'retainedImageLayers':retained['layers'],'nodeVersion':'v22.23.2','nodeSHA256':NODE,'npmVersion':inputs['npmVersion'],'npmTreeSHA256':inputs['npmTreeSHA256'],'completeFrontendSourceFileCount':962,'completeFrontendSourceTreeSHA256':frontend['sourceTreeSHA256'],'completeFrontendSourceDescriptor':descriptor(meta/'frontend-source-descriptor.json','frontend-source-descriptor.json'),'packageLockSHA256':frontend['packageLockSHA256'],'dependencyLifecycleScriptsEnabled':False,'nextBuildNetwork':'IPv4/IPv6 socket creation denied by inherited seccomp; dependency installation separately credentialless','actualFrontendBuildID':frontend['buildID'],'actualFrontendFileCount':frontend['frontendFileCount'],'actualFrontendTreeSHA256':frontend['frontendTreeSHA256'],'backendOverlayManifestSHA256':sha(control/'backend-overlays.json'),'backendOverlayCount':len(overlay['files']),'savedFinancialLedgerVersion':76,'savedFinancialLedgerSHA256':reservation['savedLedgerSHA256'],'privateInputsInImage':False,'nativeReviewPerformedAtBuild':False,'localAndProviderBuildByteIdentityClaimed':False,'exactDeployedFingerprintRequiresIndependentAdmission':True}
 assert not(control/'runtime-manifest.json').exists()and not(control/'build-provenance.json').exists()
 write_new(control/'build-provenance.json',provenance)
 # The actual route constant is exported by reviewed host code; no parallel route list.
 route_source=(control/'host/bounded-ingress.mjs').read_text();block=route_source.split('export const NATIVE_ROUTES = Object.freeze(',1)[1].split(');',1)[0]
 routes=json.loads(subprocess.check_output([str(root/'usr/local/bin/node'),'--input-type=module','-e','console.log(JSON.stringify('+block+'))'],env={'PATH':'/usr/bin:/bin'}))
 assert len(routes)==8
 static=['/_next/static/'+p.relative_to(root/'frontend/app/.next/static').as_posix()for p in sorted((root/'frontend/app/.next/static').rglob('*'))if p.is_file()]
 assert static and len(static)<=4096
 rows=[]
 for f in sorted(root.rglob('*')):
  mode=f.lstat().st_mode
  assert not stat.S_ISLNK(mode),'SYMLINK_IN_EXECUTABLE_RUNTIME'
  if stat.S_ISDIR(mode):continue
  assert stat.S_ISREG(mode)and not(mode&0o022),'UNSAFE_EXECUTABLE_RUNTIME_FILE'
  path='/'+f.relative_to(root).as_posix();assert path.startswith(ROOTS)or path in EXACT,('UNREVIEWED_RUNTIME_FILE_PATH',path)
  assert not path.startswith(('/private/','/state/','/inputs/','/evidence/'))and not path.endswith(('.sqlite','.sqlite3','.db')),'PRIVATE_STATE_IN_IMAGE'
  rows.append(descriptor(f,path))
 assert 1<=len(rows)<=100000 and sum(x['bytes']for x in rows)<=1073741824
 manifest={'schema':'A09_HOST_RUNTIME_MANIFEST_V1','applicationCommit':APPLICATION,'publicationCommit':commit,'sourceManifestSHA256':sha(source),'nodeVersion':'v22.23.2','nodeSHA256':NODE,'ingressRoutes':routes,'staticAssetPaths':static,'files':rows}
 raw=write_new(control/'runtime-manifest.json',manifest);assert len(raw)<=33554432
 receipt={'schema':'A09_ACTUAL_ASSEMBLED_RUNTIME_PIN_RECEIPT_V1','status':'PASS_ACTUAL_BYTES_PINNED_NOT_YET_PROVIDER_ADMITTED','runtimeManifest':descriptor(control/'runtime-manifest.json','/control/owner_review/runtime-manifest.json'),'buildProvenance':descriptor(control/'build-provenance.json','/control/owner_review/build-provenance.json'),'sourceManifest':descriptor(source,'/control/owner_review/source-manifest.json'),'fileCount':len(rows),'aggregateBytes':sum(x['bytes']for x in rows),'filesSHA256':digest(rows),'staticAssetPathCount':len(static),'ingressRouteCount':8,'providerAdmissionRequired':True,'ownerDecisionGranted':False}
 write_new(meta/'runtime-manifest-receipt.json',receipt);print(json.dumps(receipt))
if __name__=='__main__':main()

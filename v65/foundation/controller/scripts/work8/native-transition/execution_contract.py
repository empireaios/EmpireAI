"""V62 isolated execution authority, inventory and source gates.

This module validates externally supplied observations. It never creates a
provider, approval, delivery PASS, or application acceptance receipt.
"""
import hashlib
import datetime
import json
import math
import os
import pathlib
import re
import stat
import time
from current_packages import BACKEND, FRONTENDS, require

SCHEMA = 'work8-v62-isolated-execution-contract-v1'
MANIFEST_SCHEMA = 'work8-v62-execution-controller-manifest-v1'
SOURCE_REVIEW_STATUS = 'PASS_INDEPENDENT_V62_EXECUTION_SOURCE_REVIEW'
CAPABILITIES = ['SETUID', 'SETGID', 'CHOWN', 'DAC_OVERRIDE', 'KILL', 'SYS_PTRACE']
OWNER_DIRECTIVE = 'EMPIREAI_V62_A5_EXECUTION_ARCHITECTURE_CORRECTION_COMPLETE_ROW_ACCEPTANCE'
DEPENDENCY_IMAGES = {
 'node': 'node:22.23.2-bookworm-slim@sha256:48e4b67d85f87bd551df43704e24d252f56cc5f8e9718841aace50f19948f0f9',
 'redis': 'redis:7.4.2-alpine@sha256:02419de7eddf55aa5bcf49efb74e88fa8d931b4d77c07eff8a6b2144472b6952',
 'browser': 'mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e',
}
PACKAGE_PINS = {'backend': BACKEND['sha256'], **{k:v['sha256'] for k,v in FRONTENDS.items()}}
SOURCES = {'backend': {'commit':BACKEND['commit'],'tree':BACKEND['tree']},
           **{k:{f:v[f] for f in ('commit','tree')} for k,v in FRONTENDS.items()}}
SOURCE_BLOBS = {'backend':'05e726fc9a562e591384e94a54c80f76f0294c08',
                'normal':'1d9a398ad3d3951207c90f0b8125034bef361e27',
                'recovery':'1d9a398ad3d3951207c90f0b8125034bef361e27'}

def sha(path):
 with pathlib.Path(path).open('rb') as stream:
  return hashlib.file_digest(stream,'sha256').hexdigest()

def regular(path, *, max_bytes=None):
 path=pathlib.Path(path)
 require(path.is_absolute() and path.resolve()==path, 'NONCANONICAL_FILE_PATH')
 s=path.lstat()
 require(stat.S_ISREG(s.st_mode) and not path.is_symlink() and s.st_nlink==1,'REGULAR_SINGLE_LINK_FILE_REQUIRED')
 if max_bytes is not None: require(s.st_size<=max_bytes,'RECEIPT_SIZE_BOUND')
 return s

def pinned_json(path, expected):
 require(re.fullmatch('[a-f0-9]{64}',expected or '') is not None,'EXTERNAL_RECEIPT_DIGEST_REQUIRED')
 regular(path,max_bytes=4*1024*1024)
 require(sha(path)==expected,'RECEIPT_DIGEST_MISMATCH')
 return json.loads(pathlib.Path(path).read_text())

def relative_name(name):
 require(isinstance(name,str),'MANIFEST_PATH_TYPE')
 parts=pathlib.PurePosixPath(name).parts
 require(bool(parts) and '..' not in parts and not name.startswith('/') and '\\' not in name and str(pathlib.PurePosixPath(name))==name,'MANIFEST_PATH_REFUSED')
 return name

def verify_manifest(controller,manifest_path,expected, *, max_files=256):
 controller=pathlib.Path(controller)
 require(controller.is_absolute() and controller.resolve()==controller,'CANONICAL_CONTROLLER_DIRECTORY_REQUIRED')
 manifest=pinned_json(manifest_path,expected)
 require(manifest.get('schema')==MANIFEST_SCHEMA,'CONTROLLER_MANIFEST_SCHEMA')
 entries=manifest['files'];require(0<len(entries)<=max_files,'CONTROLLER_MANIFEST_BOUND')
 seen=set()
 for item in entries:
  name=relative_name(item['path']);require(name not in seen,'DUPLICATE_CONTROLLER_FILE');seen.add(name)
  p=controller/name;s=regular(p)
  require(s.st_size==item['bytes'] and sha(p)==item['sha256'],'CONTROLLER_SOURCE_CHANGED')
 paths=list(controller.rglob('*'))
 require(not any(p.is_symlink() for p in paths),'SYMLINK_CONTROLLER_ENTRY')
 actual={str(p.relative_to(controller)) for p in paths if p.is_file() and p!=pathlib.Path(manifest_path)}
 require(actual==seen,'UNINDEXED_OR_MISSING_CONTROLLER_FILE')
 return manifest

def validate_contract(contract, now):
 require(contract.get('schema')==SCHEMA,'RUN_CONTRACT_SCHEMA')
 require(re.fullmatch('work8-v62-a5-[a-z0-9-]{1,48}',contract.get('campaignId','')) is not None,'CAMPAIGN_ID')
 ex=contract['executor']
 require(ex['provider']=='vercel-sandbox' and ex['architecture']=='amd64','ISOLATED_EXECUTOR_REQUIRED')
 require(re.fullmatch('sbx_[A-Za-z0-9]{8,80}',ex['sessionId']) is not None,'SESSION_ID_REQUIRED')
 require(ex['teamId']=='team_gdcskAnaJteKW7BYtw8zlSWy' and ex['projectId']=='prj_F4UZtqA8mIpIrRaIu2V6LOM664Kr','EXECUTOR_ACCOUNT_BINDING')
 require(ex['resources']=={'vcpus':8,'memory':16384},'EXECUTOR_RESOURCE_ENVELOPE')
 require(ex['ports']==[] and ex['mounts']=={} and ex['persistent'] is False,'EPHEMERAL_PRIVATE_EXECUTOR_REQUIRED')
 require(type(ex['timeoutSeconds']) is int and 0<ex['timeoutSeconds']<=86400 and ex['expiresAtEpoch']==ex['createdAtEpoch']+ex['timeoutSeconds'],'EXECUTOR_HARD_TIMEOUT')
 require(ex['createdAtEpoch']<=now<ex['expiresAtEpoch'],'EXECUTOR_EXPIRED')
 require(ex['hostUid']==1001 and ex['hostGid']==1001,'ACCEPTED_HOST_PRINCIPAL')
 require(ex['providerNetworkPolicy']=='deny-all' and ex['providerObservedStatus']=='running','OBSERVED_ISOLATED_RUNNING_SESSION_REQUIRED')
 auth=contract['authority']
 require(auth['ownerDirective']==OWNER_DIRECTIVE,'OWNER_AUTHORITY_BINDING')
 require(auth['overallPlanningUSD']==100 and auth['additionalA5CeilingUSD']==10,'OWNER_FINANCIAL_CEILING')
 require(auth['priorWork8HeldUSD']==11.97 and auth['priorV61HeldUSD']==2.02,'PRIOR_HOLDS_PRESERVED')
 require(all(type(auth[k]) in [int,float] and math.isfinite(auth[k]) and auth[k]>0 for k in ['newReservationUSD','maximumProspectiveUSD']),'POSITIVE_FINITE_EXPOSURE_REQUIRED')
 require(0<auth['newReservationUSD']<=7.98 and auth['maximumProspectiveUSD']<=auth['newReservationUSD'],'REMAINING_A5_EXPOSURE_BOUND')
 require(auth['priorV61HeldUSD']+auth['newReservationUSD']<=10.00000001 and auth['priorWork8HeldUSD']+auth['newReservationUSD']<=100,'CUMULATIVE_EXPOSURE_BOUND')
 require(all(auth[k] is False for k in ['productionOperations','protectedDataTransfer','commerceActivation','subscriptions','automaticRecreate','automaticRerun']),'OPERATING_LOCKS_REQUIRED')
 require(contract['artifacts']==PACKAGE_PINS,'CURRENT_PACKAGE_PINS')
 require(contract['dependencyImages']==DEPENDENCY_IMAGES,'EXACT_DEPENDENCY_IMAGE_PINS')
 plan=contract['durationPlan'];keys={'setupSeconds','deliverySeconds','preflightSeconds','examinationSeconds','cleanupSeconds','evidenceExportSeconds'}
 require(set(plan)==keys and all(type(v) is int and v>0 for v in plan.values()),'COMPLETE_DURATION_PLAN_REQUIRED')
 require(plan['preflightSeconds']<=900 and plan['examinationSeconds']<=1500 and plan['cleanupSeconds']>=120 and plan['evidenceExportSeconds']>=180,'REVIEWED_STAGE_BOUNDS')
 require(sum(plan.values())<=ex['timeoutSeconds'],'DURATION_PLAN_EXCEEDS_EXECUTOR_LIFETIME')
 return contract

def verify_delivery(root, receipt, session_id):
 """Rehash complete application archive inventory, even after transport PASS."""
 root=pathlib.Path(root)
 require(receipt.get('schema')=='work8-v62-package-delivery-v1' and receipt.get('status')=='PASS_COMPLETE_DESTINATION_SHA256','COMPLETE_DELIVERY_REQUIRED')
 require(receipt['sessionId']==session_id and receipt.get('partialTransfersPresent') is False,'DELIVERY_SESSION_OR_PARTIAL_REFUSED')
 expected={pin['file']:pin for pin in [BACKEND,*FRONTENDS.values()]}
 rows=receipt['files'];require(isinstance(rows,list) and len(rows)>=3,'DELIVERY_INVENTORY_REQUIRED')
 names=set();seen_packages=set()
 for row in rows:
  name=relative_name(row.get('relativePath',row.get('path')))
  require(name not in names,'DUPLICATE_DELIVERY_FILE');names.add(name)
  p=root/name;st=regular(p)
  require(st.st_size==row['bytes'] and sha(p)==row['sha256'],'DELIVERY_BYTES_CHANGED')
  base=p.name
  if base in expected:
   require(base not in seen_packages,'DUPLICATE_APPLICATION_ARCHIVE');seen_packages.add(base)
   pin=expected[base];require(st.st_size==pin['bytes'] and row['sha256']==pin['sha256'],'APPLICATION_ARCHIVE_INCOMPATIBLE')
   require(name=='artifacts/'+base,'APPLICATION_ARCHIVE_PATH')
 require(seen_packages==set(expected),'MISSING_APPLICATION_ARCHIVE')
 artifacts=root/'artifacts'
 actual={str(p.relative_to(root)) for p in artifacts.rglob('*') if p.is_file() or p.is_symlink()}
 require(actual=={n for n in names if n.startswith('artifacts/')},'UNINDEXED_OR_PARTIAL_ARTIFACT')
 return receipt

def verify_source_identity(root,contract):
 source=pinned_json(root/'source-identities.json',contract['sourceIdentitiesSHA256'])
 require(source.get('schema')=='work8-v62-source-identities-v1','SOURCE_IDENTITIES_SCHEMA')
 require(source['components']==SOURCES and source['acceptedComponentBlobs']==SOURCE_BLOBS,'CURRENT_SOURCE_AND_ACCEPTED_BLOB_BINDING')
 require(isinstance(source['packagedAndIndependentlyReadBackBeforeUTC'],str) and datetime.datetime.fromisoformat(source['packagedAndIndependentlyReadBackBeforeUTC'].replace('Z','+00:00')).tzinfo is not None,'ATTRIBUTABLE_PACKAGE_AVAILABILITY_BOUND_REQUIRED')
 require(re.fullmatch('[a-f0-9]{64}',source['packageReadbackEvidenceSHA256']) is not None,'PACKAGE_READBACK_EVIDENCE_PIN_REQUIRED')
 require(isinstance(source['evidenceReferences'],list) and len(source['evidenceReferences'])>0,'SOURCE_PROVENANCE_REQUIRED')
 for evidence in source['evidenceReferences']:
  require(re.fullmatch('[a-f0-9]{64}',evidence['sha256']) is not None,'SOURCE_PROVENANCE_PIN_REQUIRED')
  name=relative_name(evidence['reference']);require(name.startswith('source-evidence/'),'SOURCE_PROVENANCE_LOCATION')
  pinned_json(root/name,evidence['sha256'])
 require(source['packageReadbackEvidenceSHA256'] in {e['sha256'] for e in source['evidenceReferences']},'PACKAGE_READBACK_PROVENANCE_REQUIRED')
 return source

def verify_docker_binding(root,qualification):
 root=pathlib.Path(root)
 expected='unix://'+str(root/'docker.sock')
 require(os.environ.get('DOCKER_HOST')==expected and qualification['dockerHost']==expected,'QUALIFIED_DOCKER_HOST_REQUIRED')
 require(not any(os.environ.get(key) for key in ['DOCKER_CONTEXT','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH','DOCKER_API_VERSION']),'AMBIENT_DOCKER_OVERRIDE_REFUSED')
 path=root/'docker.sock';st=path.lstat()
 require(path.resolve()==path and stat.S_ISSOCK(st.st_mode) and not path.is_symlink(),'QUALIFIED_DOCKER_SOCKET_REQUIRED')
 actual={'uid':st.st_uid,'gid':st.st_gid,'mode':stat.S_IMODE(st.st_mode),'dev':st.st_dev,'ino':st.st_ino}
 require(actual==qualification['dockerSocket'] and st.st_uid==0 and st.st_gid==1001 and stat.S_IMODE(st.st_mode)==0o660,'QUALIFIED_DOCKER_SOCKET_IDENTITY_CHANGED')
 require(isinstance(qualification['dockerEngineId'],str) and 1<=len(qualification['dockerEngineId'])<=128,'QUALIFIED_DOCKER_ENGINE_ID_REQUIRED')
 return actual

def require_remaining_lifetime(contract,stage,now):
 require(stage in ['preflight','full'],'STAGE_REQUIRED')
 plan=contract['durationPlan'];reserved=plan['cleanupSeconds']+plan['evidenceExportSeconds']
 needed=(plan['preflightSeconds']+plan['examinationSeconds'] if stage=='preflight' else plan['examinationSeconds'])+reserved
 require(contract['executor']['expiresAtEpoch']-now>needed,'INSUFFICIENT_EXECUTOR_LIFETIME')
 return needed

def verify_launch_contract(root,contract):
 launch=pinned_json(root/'launch-contract.json',contract['launchContractSHA256'])
 require(launch.get('schema')=='work8-v62-durable-launch-contract-v1','DURABLE_LAUNCH_CONTRACT_REQUIRED')
 fields=['authority','artifacts','dependencyImages','durationPlan','sourceIdentitiesSHA256','driverManifestSHA256','controllerManifestSHA256']
 require(set(launch['immutableInputs'])==set(fields),'COMPLETE_IMMUTABLE_LAUNCH_INPUTS')
 require(all(contract[k]==launch['immutableInputs'][k] for k in fields),'IMMUTABLE_LAUNCH_INPUT_CHANGED')
 constraints=launch['executorConstraints']
 require(set(constraints)=={'provider','architecture','teamId','projectId','resources','ports','mounts','persistent','timeoutSeconds','hostUid','hostGid'},'COMPLETE_EXECUTOR_CONSTRAINTS')
 require(all(contract['executor'][k]==v for k,v in constraints.items()),'UNREVIEWED_EXECUTOR_CONFIGURATION')
 return launch

def gate(root,controller,stage):
 require(stage in ['preflight','full'],'STAGE_REQUIRED')
 root=pathlib.Path(root).resolve();controller=pathlib.Path(controller).resolve()
 contract=pinned_json(root/'run-contract.json',os.environ.get('WORK8_RUN_CONTRACT_SHA256'))
 validate_contract(contract,time.time())
 require(os.getuid()==os.geteuid()==1001 and os.getgid()==os.getegid()==1001,'ACCEPTED_HOST_IDENTITY_REQUIRED')
 require(os.environ.get('WORK8_SANDBOX_ID')==contract['executor']['sessionId'],'EXACT_CREATED_SESSION_REQUIRED')
 manifest_sha=contract['controllerManifestSHA256']
 verify_manifest(controller,controller/'controller-manifest.json',manifest_sha)
 review=pinned_json(root/'source-review.json',os.environ.get('WORK8_SOURCE_REVIEW_SHA256'))
 require(review.get('status')==SOURCE_REVIEW_STATUS and review['controllerManifestSHA256']==manifest_sha and review['launchContractSHA256']==contract['launchContractSHA256'],'INDEPENDENT_CURRENT_SOURCE_REVIEW_REQUIRED')
 verify_launch_contract(root,contract)
 require(review['packagePins']==PACKAGE_PINS and review['sourceIdentitiesSHA256']==contract['sourceIdentitiesSHA256'],'INDEPENDENT_SOURCE_PACKAGE_BINDING_REQUIRED')
 verify_source_identity(root,contract)
 delivery=pinned_json(root/'package-delivery.json',contract['packageDeliverySHA256'])
 verify_delivery(root,delivery,contract['executor']['sessionId'])
 q=pinned_json(root/'native-qualification.json',contract['nativeQualificationSHA256'])
 require(q.get('status')=='PASS_CURRENT_EXECUTOR_NATIVE_PREREQUISITES' and q['sessionId']==contract['executor']['sessionId'] and q['dockerAvailable'] is True,'CURRENT_EXECUTOR_QUALIFICATION_REQUIRED')
 require(q['requiredCapabilities']==CAPABILITIES and q['seccompTSYNC'] is True and q['crossPrincipalProcReadback'] is True and q['readonlyRootVerified'] is True and q['privateFileExchangeVerified'] is True,'NATIVE_BOUNDARIES_REQUIRED')
 require(q['dependencyImages']==DEPENDENCY_IMAGES and q['hostNodeVersion']=='v22.23.2' and q['driverManifestSHA256']==contract['driverManifestSHA256'],'EXACT_NATIVE_RUNTIME_DEPENDENCIES_REQUIRED')
 require(q['providerNetworkPolicy']=='deny-all','EXTERNAL_EGRESS_REFUSED')
 verify_docker_binding(root,q)
 verify_manifest(root/'native-transition-driver',root/'native-transition-driver/controller-manifest.json',contract['driverManifestSHA256'],max_files=20000)
 require_remaining_lifetime(contract,stage,time.time())
 executor_review=pinned_json(root/'executor-review.json',os.environ.get('WORK8_EXECUTOR_REVIEW_SHA256'))
 require(executor_review.get('status')=='PASS_INDEPENDENT_EXECUTOR_DELIVERY_QUALIFICATION' and executor_review['runContractSHA256']==os.environ['WORK8_RUN_CONTRACT_SHA256'] and executor_review['packageDeliverySHA256']==contract['packageDeliverySHA256'] and executor_review['nativeQualificationSHA256']==contract['nativeQualificationSHA256'],'INDEPENDENT_EXECUTOR_BINDING_REQUIRED')
 if stage=='full':
  preflight=root/'evidence/preflight'
  review=pinned_json(root/'preflight-review.json',os.environ.get('WORK8_PREFLIGHT_REVIEW_SHA256'))
  require(review.get('status')=='PASS_INDEPENDENT_NATIVE_PREFLIGHT' and review['runContractSHA256']==os.environ['WORK8_RUN_CONTRACT_SHA256'] and review['controllerManifestSHA256']==manifest_sha,'INDEPENDENT_PREFLIGHT_REVIEW_REQUIRED')
  result=pinned_json(preflight/'runner-result.json',review['runnerResultSHA256'])
  pinned_json(preflight/'artifact-index.json',review['artifactIndexSHA256'])
  require(result.get('status')=='PASS_ACTUAL_NATIVE_LIVE_BRAIN_PREFLIGHT_AWAITING_INDEPENDENT_REVIEW' and result.get('temporaryContainersAndNetworkRemoved') is True and result.get('privateTemporaryDataRemoved') is True,'NATIVE_PREFLIGHT_PASS_REQUIRED')
 return contract

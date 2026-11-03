"""V65 truthful GitHub provider gates; no execution or network action on import.

The original application assertions remain in the V62 controller. This module
admits independently reviewed current package/runner observations, never PASSes
an application and never substitutes Vercel session fields for a GitHub run.
"""
import datetime
import hashlib
import json
import math
import os
import pathlib
import re
import stat
import time

SCHEMA='work8-v65-github-execution-contract-v1'
OWNER_DIRECTIVE='EMPIREAI_V70_A5_EXECUTION_APPROVAL'
REPOSITORY='empireaios/EmpireAI'
REPOSITORY_ID='1275922460'
CAPABILITIES=['SETUID','SETGID','CHOWN','DAC_OVERRIDE','KILL','SYS_PTRACE']
DEPENDENCY_IMAGES={
 'node':'node:22.23.2-bookworm-slim@sha256:48e4b67d85f87bd551df43704e24d252f56cc5f8e9718841aace50f19948f0f9',
 'redis':'redis:7.4.2-alpine@sha256:02419de7eddf55aa5bcf49efb74e88fa8d931b4d77c07eff8a6b2144472b6952',
 'browser':'mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e'}
SOURCES={
 'backend':{'commit':'6c1e63ba20619ee480742fd87dc810ca93152e22','tree':'a78aa0e0a91c1e765afb23e70fe05c75cddc836e'},
 'normal':{'commit':'750483b3152f2c9c65a65b6381c8c94f081b9eb1','tree':'f589a8f0f94fbcdf113f162abac11d03c19acc25'},
 'recovery':{'commit':'94d34cab7b0739849839ea3c66e50c8fdd3a2b27','tree':'5da61811a035b9504d74f699df8b164cc7f9f0ac'}}

class Refusal(ValueError): pass
def require(ok,code):
 if not ok:raise Refusal(code)
def digest_string(value):return isinstance(value,str) and re.fullmatch('[a-f0-9]{64}',value) is not None
def sha(path):
 with pathlib.Path(path).open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def regular(path,max_bytes=None):
 p=pathlib.Path(path);s=p.lstat()
 require(p.is_absolute() and p.resolve()==p and stat.S_ISREG(s.st_mode) and s.st_nlink==1,'CANONICAL_REGULAR_FILE_REQUIRED')
 if max_bytes is not None:require(s.st_size<=max_bytes,'RECEIPT_SIZE_BOUND')
 return s
def pinned_json(path,digest):
 require(digest_string(digest),'EXTERNAL_DIGEST_REQUIRED');regular(path,4*1024*1024)
 require(sha(path)==digest,'PINNED_RECEIPT_CHANGED');return json.loads(pathlib.Path(path).read_text())
def relative_name(name):
 require(isinstance(name,str),'MANIFEST_PATH_TYPE')
 p=pathlib.PurePosixPath(name)
 require(str(p)==name and not p.is_absolute() and '..' not in p.parts and '\\' not in name and bool(p.parts),'MANIFEST_PATH_REFUSED')
 return name
def verify_manifest(directory,path,digest,max_files=20000):
 directory=pathlib.Path(directory);manifest=pinned_json(path,digest);entries=manifest['files']
 require(0<len(entries)<=max_files,'MANIFEST_SIZE_BOUND');seen=set()
 for row in entries:
  name=relative_name(row['path']);require(name not in seen,'DUPLICATE_MANIFEST_PATH');seen.add(name)
  p=directory/name;s=regular(p);require(s.st_size==row['bytes'] and sha(p)==row['sha256'],'INDEXED_SOURCE_CHANGED')
 paths=list(directory.rglob('*'));require(not any(p.is_symlink() for p in paths),'MANIFEST_SYMLINK_REFUSED')
 require({str(p.relative_to(directory)) for p in paths if p.is_file() and p!=pathlib.Path(path)}==seen,'UNINDEXED_OR_MISSING_FILE')
 return manifest

def validate_authority(a):
 require(a['ownerDirective']==OWNER_DIRECTIVE,'CURRENT_OWNER_AUTHORITY_REQUIRED')
 require(a['work8CeilingUSD']==100 and a['existingAdditionalA5USD']==10 and a['priorOverallHoldsUSD']==12.08 and a['priorA5HoldsUSD']==2.13 and a['availableBeforeReservationUSD']==7.87,'CURRENT_FINANCIAL_AUTHORITY_REQUIRED')
 require(a.get('reservationCommitted') is True,'CURRENT_COMMITTED_RESERVATION_REQUIRED')
 for key in ('reservationUSD','maximumProspectiveUSD'):
  require(type(a[key]) in (int,float) and math.isfinite(a[key]) and 0<=a[key]<=7.87,'FINITE_CURRENT_EXPOSURE_REQUIRED')
 require(a['maximumProspectiveUSD']<=a['reservationUSD'],'EXPOSURE_EXCEEDS_RESERVATION')
 require(round(a['priorOverallHoldsUSD']+a['reservationUSD'],2)==a['currentOverallHoldsUSD'] and round(a['priorA5HoldsUSD']+a['reservationUSD'],2)==a['currentA5HoldsUSD'] and round(7.87-a['reservationUSD'],2)==a['remainingUnreservedUSD'] and a['reservationCommitted'] is True,'CURRENT_COMMITTED_RESERVATION_REQUIRED')
 require(all(a[k] is False for k in ('renewed','productionOperations','protectedDataTransfer','commerceActivation','subscriptions','automaticRecreate','automaticRerun')),'ORIGINAL_OPERATING_LOCKS_REQUIRED')
 return a

def validate_contract(c,now,env=None):
 env=os.environ if env is None else env
 require(c.get('schema')==SCHEMA,'RUN_CONTRACT_SCHEMA')
 e=c['executor'];require(e['provider']=='github-actions','TRUTHFUL_GITHUB_PROVIDER_REQUIRED')
 require(e['repository']==REPOSITORY and str(e['repositoryId'])==REPOSITORY_ID,'GITHUB_REPOSITORY_BINDING')
 require(str(e['runId']).isdigit() and str(e['jobId']).isdigit() and e['runAttempt']==1,'ONE_ACTUAL_RUN_ATTEMPT_REQUIRED')
 require(re.fullmatch('[a-f0-9]{40}',e['workflowCommit']) is not None,'WORKFLOW_COMMIT_REQUIRED')
 expected='github-actions:'+str(e['runId'])+':1:'+str(e['jobId'])
 require(e['sessionId']==expected and c['campaignId']=='work8-v65-a5-'+str(e['runId']),'ACTUAL_EXECUTOR_IDENTITY_REQUIRED')
 for key,value in {'GITHUB_ACTIONS':'true','GITHUB_REPOSITORY':REPOSITORY,'GITHUB_REPOSITORY_ID':REPOSITORY_ID,'GITHUB_RUN_ID':str(e['runId']),'GITHUB_RUN_ATTEMPT':'1','GITHUB_SHA':e['workflowCommit'],'GITHUB_JOB':e['jobKey'],'RUNNER_OS':'Linux','RUNNER_ARCH':'X64'}.items():
  require(env.get(key)==value,'CURRENT_GITHUB_ENVIRONMENT_BINDING')
 require(e['hostUid']==1001 and e['hostGid']==1001 and e['architecture']=='amd64','ORIGINAL_HOST_PRINCIPAL_REQUIRED')
 require(e['hostArtifactEgress']=='github-provider-endpoints' and e['nativeNetworkPolicy']=='docker-internal-no-published-ports','TRUTHFUL_NETWORK_PHASE_BINDING_REQUIRED')
 require(e['ports']==[] and e['productionMounts']==[] and e['runnerImageVersion'],'PRIVATE_NONPRODUCTION_RUNNER_REQUIRED')
 require(type(e['timeoutSeconds']) is int and 0<e['timeoutSeconds']<=21600,'FINITE_JOB_TIMEOUT_REQUIRED')
 require(e['expiresAtEpoch']==e['jobStartedAtEpoch']+e['timeoutSeconds'] and e['jobStartedAtEpoch']<=now<e['expiresAtEpoch'],'ACTUAL_JOB_DEADLINE_REQUIRED')
 validate_authority(c['authority'])
 require(c['dependencyImages']==DEPENDENCY_IMAGES,'EXACT_DEPENDENCY_PINS_REQUIRED')
 p=c['durationPlan'];require(set(p)=={'setupSeconds','deliverySeconds','preflightSeconds','examinationSeconds','cleanupSeconds','evidenceExportSeconds','reviewSeconds'},'COMPLETE_DURATION_PLAN_REQUIRED')
 require(all(type(v) is int and v>0 for v in p.values()),'POSITIVE_DURATION_BOUNDS_REQUIRED')
 require(p['preflightSeconds']<=900 and p['examinationSeconds']<=1500 and p['cleanupSeconds']>=600 and p['evidenceExportSeconds']>=1800,'NATIVE_AND_CLEANUP_BOUNDS_REQUIRED')
 require(sum(p.values())<=e['timeoutSeconds'],'DURATION_PLAN_EXCEEDS_JOB_TIMEOUT')
 require(c['sources']==SOURCES,'EXACT_SOURCE_COMMIT_TREE_REQUIRED')
 return c

def validate_image_provenance(p,e):
 require(p.get('schema')=='work8-runtime-image-provenance-v1' and p.get('status')=='PASS_CURRENT_RUNTIME_METADATA_AGREEMENT_ONLY','CURRENT_RUNTIME_IMAGE_PROVENANCE_REQUIRED')
 require(p.get('runId')==str(e['runId']) and p.get('jobId')==e['jobId'] and p.get('runAttempt')==1 and p.get('workflowCommit')==e['workflowCommit'] and p.get('sessionId')==e['sessionId'],'IMAGE_PROVENANCE_RUN_BINDING')
 o=p.get('observations',{});require(o.get('ImageOS')=='ubuntu24' and o.get('ImageVersion')==e['runnerImageVersion'] and o.get('setupInfo')==o.get('imageData') and o.get('setupInfo',{}).get('Version')==e['runnerImageVersion'],'CURRENT_RUNTIME_IMAGE_METADATA_AGREEMENT_REQUIRED')
 require(p.get('providerSetupLogObserved') is False and p.get('nativeAdmissionGranted') is False and p.get('applicationAcceptance') is False,'PROVENANCE_SCOPE_MUST_BE_TRUTHFUL')
 require(p.get('independentArtifactReviewRequiredBeforeNative') is True and p.get('terminalProviderSetupLogComparisonRequiredBeforeAcceptance') is True,'INDEPENDENT_PROVENANCE_REVIEW_REQUIRED')
 return p

def verify_ack(ack,c,stage,expected,now):
 require(stage in ('packages-and-executor','preflight'),'REVIEW_STAGE_REFUSED')
 require(ack.get('schema')=='work8-v65-independent-ack-v1' and ack.get('decision')=='PASS','EXTERNAL_REVIEW_PASS_REQUIRED')
 e=c['executor'];require(ack['repository']==REPOSITORY and str(ack['runId'])==str(e['runId']) and ack['runAttempt']==1 and ack['workflowCommit']==e['workflowCommit'] and ack['stage']==stage,'EXTERNAL_REVIEW_RUN_STAGE_BINDING')
 require(ack['reviewerRole']=='independent-external-reviewer' and ack['applicationAcceptance'] is False,'INDEPENDENT_REVIEW_NOT_APPLICATION_PASS')
 require(set(ack['bindings'])==set(expected) and ack['bindings']==expected,'EXTERNAL_REVIEW_EVIDENCE_BINDING')
 require(all(digest_string(v) for v in ack['bindings'].values()),'EXTERNAL_REVIEW_DIGEST_REQUIRED')
 require(type(ack['artifactId']) is int and ack['artifactId']>0 and digest_string(ack['artifactSHA256']),'INDEPENDENT_ARTIFACT_READBACK_REQUIRED')
 require(ack['independentlyDownloadedAndHashed'] is True and ack['rawPrivateDataIncluded'] is False,'INDEPENDENT_SAFE_READBACK_REQUIRED')
 reviewed=datetime.datetime.fromisoformat(ack['reviewedAtUTC'].replace('Z','+00:00')).timestamp()
 require(e['jobStartedAtEpoch']<=reviewed<=now and now-reviewed<7200,'CURRENT_INDEPENDENT_REVIEW_REQUIRED')
 if stage=='packages-and-executor':
  require(ack.get('runtimeImageProvenanceAccepted') is True and ack.get('terminalProviderSetupLogComparisonRequiredBeforeAcceptance') is True,'INDEPENDENT_CURRENT_IMAGE_PROVENANCE_REQUIRED')
  require(ack['sourceEquivalentPackagesQualified'] is True and ack['eightSatisfiedGroupsRemainApplicable'] is True and ack['nativePrerequisitesAccepted'] is True,'PACKAGE_AND_EXECUTOR_ADMISSION_REQUIRED')
 else:require(ack['actualInitializedBrainPreflightAccepted'] is True,'ACTUAL_PREFLIGHT_REVIEW_REQUIRED')
 return ack

def package_bindings(c):
 return {k:c[k] for k in ('packageManifestSHA256','controllerManifestSHA256','driverManifestSHA256','sourceIdentitiesSHA256','nativeQualificationSHA256','launchContractSHA256','runnerIdentitySHA256','runtimeImageProvenanceSHA256')}

def verify_source_identity(root,c):
 s=pinned_json(pathlib.Path(root)/'source-identities.json',c['sourceIdentitiesSHA256'])
 require(s['schema']=='work8-v65-reconstructed-source-identities-v1' and s['components']==SOURCES,'CURRENT_SOURCE_PROVENANCE_REQUIRED')
 ack=pinned_json(pathlib.Path(root)/'source-review.json',os.environ.get('WORK8_SOURCE_REVIEW_SHA256'))
 verify_ack(ack,c,'packages-and-executor',package_bindings(c),time.time())
 return {**s,'packagedAndIndependentlyReadBackBeforeUTC':ack['reviewedAtUTC'],'packageReadbackEvidenceSHA256':os.environ['WORK8_SOURCE_REVIEW_SHA256']}

def require_remaining_lifetime(c,stage,now):
 require(stage in ('preflight','full'),'STAGE_REQUIRED');p=c['durationPlan']
 needed=p['cleanupSeconds']+p['evidenceExportSeconds']+60+p['examinationSeconds']
 if stage=='preflight':needed+=p['preflightSeconds']+p['reviewSeconds']
 require(c['executor']['expiresAtEpoch']-now>needed,'INSUFFICIENT_REMAINING_JOB_LIFETIME')
 return needed

def gate(root,controller,stage):
 from current_packages import BACKEND,FRONTENDS,archive_identity
 root=pathlib.Path(root);controller=pathlib.Path(controller)
 c=pinned_json(root/'run-contract.json',os.environ.get('WORK8_RUN_CONTRACT_SHA256'));validate_contract(c,time.time())
 require(os.getuid()==os.geteuid()==os.getgid()==os.getegid()==1001,'ORIGINAL_HOST_IDENTITY_REQUIRED')
 require(os.environ.get('WORK8_EXECUTOR_ID')==c['executor']['sessionId'],'ACTUAL_EXECUTOR_ENVIRONMENT_REQUIRED')
 require(root.resolve()==root and root.stat().st_uid==1001 and stat.S_IMODE(root.stat().st_mode)==0o700,'PRIVATE_EXECUTION_ROOT_REQUIRED')
 verify_manifest(controller,controller/'controller-manifest.json',c['controllerManifestSHA256'])
 verify_manifest(root/'native-transition-driver',root/'native-transition-driver/controller-manifest.json',c['driverManifestSHA256'])
 package=pinned_json(root/'v65-packages.json',c['packageManifestSHA256'])
 require(package['backend']==BACKEND and package['frontends']==FRONTENDS,'CURRENT_PACKAGE_IDENTITY_CHANGED')
 for pin in [BACKEND,*FRONTENDS.values()]:archive_identity(root/'artifacts'/pin['file'],pin)
 actual={p.name for p in (root/'artifacts').iterdir()};require(actual=={x['file'] for x in [BACKEND,*FRONTENDS.values()]},'UNINDEXED_PACKAGE_OR_PARTIAL_REFUSED')
 q=pinned_json(root/'native-qualification.json',c['nativeQualificationSHA256'])
 require(q['status']=='PASS_CURRENT_EXECUTOR_NATIVE_PREREQUISITES' and q['sessionId']==c['executor']['sessionId'],'ACTUAL_NATIVE_QUALIFICATION_REQUIRED')
 require(q['requiredCapabilities']==CAPABILITIES and all(q[k] is True for k in ('seccompTSYNC','crossPrincipalProcReadback','readonlyRootVerified','privateFileExchangeVerified','internalNetworkVerified','noPublishedPortsVerified','providerCredentialsExcluded')),'ORIGINAL_NATIVE_BOUNDARIES_REQUIRED')
 require(q['dependencyImages']==DEPENDENCY_IMAGES and q['hostNodeVersion']=='v22.23.2','EXACT_RUNTIME_DEPENDENCIES_REQUIRED')
 socket=pathlib.Path(q['dockerSocketPath']);st=socket.lstat();require(socket.resolve()==socket and stat.S_ISSOCK(st.st_mode) and st.st_uid==0,'ROOT_OWNED_DOCKER_SOCKET_REQUIRED')
 require({'uid':st.st_uid,'gid':st.st_gid,'mode':stat.S_IMODE(st.st_mode),'dev':st.st_dev,'ino':st.st_ino}==q['dockerSocket'],'CURRENT_DOCKER_SOCKET_CHANGED')
 require(os.environ.get('DOCKER_HOST')=='unix://'+str(socket),'QUALIFIED_DAEMON_BINDING_REQUIRED')
 require(not any(os.environ.get(k) for k in ('DOCKER_CONTEXT','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH','DOCKER_API_VERSION')),'AMBIENT_DOCKER_OVERRIDE_REFUSED')
 launch=pinned_json(root/'launch-contract.json',c['launchContractSHA256']);require(launch['authority']==c['authority'] and launch['durationPlan']==c['durationPlan'] and launch['workflowCommit']==c['executor']['workflowCommit'],'REVIEWED_LAUNCH_BINDING_REQUIRED')
 verify_source_identity(root,c);require_remaining_lifetime(c,stage,time.time())
 if stage=='full':
  ack=pinned_json(root/'preflight-review.json',os.environ.get('WORK8_PREFLIGHT_REVIEW_SHA256'))
  expected={**package_bindings(c),'runContractSHA256':os.environ['WORK8_RUN_CONTRACT_SHA256'],'runnerResultSHA256':sha(root/'evidence/preflight/runner-result.json'),'artifactIndexSHA256':sha(root/'evidence/preflight/artifact-index.json')}
  verify_ack(ack,c,'preflight',expected,time.time())
  result=json.loads((root/'evidence/preflight/runner-result.json').read_text())
  require(result['status']=='PASS_ACTUAL_NATIVE_LIVE_BRAIN_PREFLIGHT_AWAITING_INDEPENDENT_REVIEW' and result['temporaryContainersAndNetworkRemoved'] is True and result['privateTemporaryDataRemoved'] is True,'ACTUAL_CLEAN_PREFLIGHT_REQUIRED')
 return c

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
import platform
import re
import stat
import subprocess
import time

SCHEMA='work8-v65-github-execution-contract-v1'
OWNER_DIRECTIVE='EMPIREAI_V101_SEPARATE_NATIVE_EXECUTION_APPROVAL'
NATIVE_RESERVATION_ID='V101-A5-NATIVE-ONCE-20261109'
ARTIFACT_LIMITS={'maximumObjects':3,'maximumCumulativeServiceZipBytes':128*1024**2,'retentionDays':7,'maximumObservedRetentionSeconds':169*3600,'maximumUploadPayloadBytes':64*1024**2,'zipEnvelopeReserveBytes':16*1024**2}
V94_DIAGNOSTIC_EVIDENCE={'runId':42478186509,'jobId':128724128654,'artifactId':13616930561,'artifactSHA256':'6450dca99a0e50c04ce41d874eabd9adc4ca0fdc337f8bbe9c82b0d2c69d2915','workflowCommit':'f5b1ab0da64f38f1a0503f5eb7ebf516bfd77ba8','diagnosticControlsSHA256':'2aeaecbf74d66b1368a9b55a2e01500dbdc54bd2d8e54bd98b882e95cc8e5dbf'}
FRESH_ADMISSION_MODE='V99_FRESH_EXECUTOR_ADMISSION_REUSING_V94_V98_EVIDENCE'
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
 require(a['work8CeilingUSD']==100 and a['existingAdditionalA5USD']==10 and a['priorOverallHoldsUSD']==14.57 and a['priorA5HoldsUSD']==4.62 and a['availableBeforeReservationUSD']==5.38,'CURRENT_FINANCIAL_AUTHORITY_REQUIRED')
 require(a.get('ownerDecisionRecorded') is True and digest_string(a.get('ownerApprovalReceiptSHA256')) and a.get('approvalScope')=='one-native-a5-08-09-attempt' and type(a.get('maximumAttempts')) is int and a['maximumAttempts']==1,'SEPARATE_EXPLICIT_OWNER_DECISION_REQUIRED')
 require(a.get('independentAckAuthority')=={'maximumOwnerEndorsements':2,'issueNumber':113,'stages':['packages-and-executor','preflight'],'scope':'safe-artifact-acknowledgment-only','otherMessagesAuthorized':False},'EXPLICIT_TWO_SAFE_ACK_ENDORSEMENTS_REQUIRED')
 require(a.get('reservationCommitted') is True,'CURRENT_COMMITTED_RESERVATION_REQUIRED')
 require(a.get('reservationId')==NATIVE_RESERVATION_ID and digest_string(a.get('reservationReceiptSHA256')),'DISTINCT_FULL_NATIVE_RESERVATION_REQUIRED')
 for key in ('reservationUSD','maximumProspectiveUSD'):
  require(type(a[key]) in (int,float) and math.isfinite(a[key]) and 0<=a[key]<=5.38,'FINITE_CURRENT_EXPOSURE_REQUIRED')
 require(a['maximumProspectiveUSD']==2.11 and a['reservationUSD']==2.11,'REVIEWED_SINGLE_ATTEMPT_FINANCIAL_CAP_REQUIRED')
 require(a['maximumProspectiveUSD']<=a['reservationUSD'],'EXPOSURE_EXCEEDS_RESERVATION')
 require(round(a['priorOverallHoldsUSD']+a['reservationUSD'],2)==a['currentOverallHoldsUSD'] and round(a['priorA5HoldsUSD']+a['reservationUSD'],2)==a['currentA5HoldsUSD'] and round(a['availableBeforeReservationUSD']-a['reservationUSD'],2)==a['remainingUnreservedUSD'] and a['reservationCommitted'] is True,'CURRENT_COMMITTED_RESERVATION_REQUIRED')
 require(all(a[k] is False for k in ('renewed','productionOperations','protectedDataTransfer','commerceActivation','subscriptions','automaticRecreate','automaticRerun')),'ORIGINAL_OPERATING_LOCKS_REQUIRED')
 return a

def frontend_reuse_receipt(proof,backend,frontends):
 """Admit retained exact-source startup proof, never a new native observation."""
 require(proof.get('schema')=='work8-v99-retained-evidence-reuse-v1' and proof.get('status')=='VERIFIED_HISTORICAL_EVIDENCE_ONLY','REVIEWED_RETAINED_EVIDENCE_REQUIRED')
 require(all(proof.get(k) is False for k in ('qualificationRepeated','frontendDiagnosticRepeated','currentNativeLifecycleAccepted','currentExecutionAuthority')),'HISTORICAL_EVIDENCE_SCOPE_REQUIRED')
 startup=proof.get('frontendStartup',{})
 require(all(startup.get(k)==v for k,v in {'runId':42539444860,'jobId':128910880107,'artifactId':13640304481,'artifactSHA256':'22e9f1b1bd9ba1de469c4249b9fb933a91872b3530db78293f7648345e044238','sourceCommit':'fbf326f14df64c1cc3717942a490f19af4a87a89','sourceTree':'dfac35790ff7af1ad6dceaa0cdf6ee1a37796aa5','normal':'PASS_NATIVE_STARTUP_AND_READINESS','recovery':'PASS_NATIVE_STARTUP_AND_READINESS','security':'PASS','firstErrorPreservation':'PASS','cleanupAndIndependentReadback':'PASS','originalA5Acceptance':False}.items()),'EXACT_V98_FRONTEND_STARTUP_EVIDENCE_REQUIRED')
 packages=proof.get('packageIdentities',{})
 require(packages.get('carrier')==backend and packages.get('normal')==frontends['normal'] and packages.get('recovery')==frontends['recovery'],'RETAINED_FRONTEND_PACKAGE_IDENTITY_CHANGED')
 require(proof.get('compatibleSourceSHA256',{}).get('currentPackages')=='e45e24497297805ad086dfff2048d9e5dc24b2c8918b55195affad217b773024','RETAINED_FRONTEND_LAUNCH_SOURCE_CHANGED')
 return {'schema':'work8-v99-frontend-startup-evidence-reuse-v1','status':'PASS_RETAINED_V98_STARTUP_EVIDENCE_ONLY','historicalEvidence':startup,'normalArchiveSHA256':frontends['normal']['sha256'],'recoveryArchiveSHA256':frontends['recovery']['sha256'],'carrierImage':backend['image'],'frontendStartedThisPreflight':False,'qualificationRepeated':False,'currentNativeLifecycleAccepted':False,'businessEventsCreated':False}

def validate_current_artifact_listing(listing,executor):
 """Validate complete current-job service metadata without creating an object."""
 rows=listing.get('artifacts',[])
 require(type(listing.get('total_count')) is int and isinstance(rows,list) and listing['total_count']==len(rows)<=ARTIFACT_LIMITS['maximumObjects'],'CUMULATIVE_ARTIFACT_OBJECT_BOUND')
 ids=set();total=0
 for row in rows:
  require(type(row.get('id')) is int and row['id']>0 and row['id'] not in ids,'CURRENT_ARTIFACT_ID_REQUIRED');ids.add(row['id'])
  run=row.get('workflow_run',{})
  require(str(run.get('id'))==str(executor['runId']) and run.get('head_sha')==executor['workflowCommit'] and row.get('expired') is False,'CURRENT_ARTIFACT_BINDING')
  require(type(row.get('size_in_bytes')) is int and row['size_in_bytes']>=0 and isinstance(row.get('digest'),str) and row['digest'].startswith('sha256:') and digest_string(row['digest'][7:]),'CURRENT_ARTIFACT_MEASUREMENT_REQUIRED')
  try:
   created=datetime.datetime.fromisoformat(row['created_at'].replace('Z','+00:00'));expires=datetime.datetime.fromisoformat(row['expires_at'].replace('Z','+00:00'))
   retention=(expires-created).total_seconds()
  except (KeyError,TypeError,ValueError):raise Refusal('ARTIFACT_RETENTION_BOUND') from None
  require(created.tzinfo is not None and expires.tzinfo is not None and 0<retention<=ARTIFACT_LIMITS['maximumObservedRetentionSeconds'],'ARTIFACT_RETENTION_BOUND')
  total+=row['size_in_bytes']
 require(total<=ARTIFACT_LIMITS['maximumCumulativeServiceZipBytes'],'CUMULATIVE_ARTIFACT_EXPOSURE_BOUND')
 return {'cumulativeObjects':len(rows),'cumulativeServiceZipBytes':total}

def validate_preupload_size(payload_bytes,listing,executor):
 """Reserve a conservative ZIP envelope before a single bounded upload."""
 current=validate_current_artifact_listing(listing,executor)
 require(type(payload_bytes) is int and 0<payload_bytes<=ARTIFACT_LIMITS['maximumUploadPayloadBytes'],'ARTIFACT_UPLOAD_PAYLOAD_BOUND')
 require(current['cumulativeObjects']<ARTIFACT_LIMITS['maximumObjects'],'CUMULATIVE_ARTIFACT_OBJECT_BOUND')
 prospective=current['cumulativeServiceZipBytes']+payload_bytes+ARTIFACT_LIMITS['zipEnvelopeReserveBytes']
 require(prospective<=ARTIFACT_LIMITS['maximumCumulativeServiceZipBytes'],'PREUPLOAD_ARTIFACT_EXPOSURE_BOUND')
 return {**current,'payloadBytes':payload_bytes,'maximumProspectiveServiceZipBytes':prospective,'retentionDays':ARTIFACT_LIMITS['retentionDays']}

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
 require(type(e.get('runnerId')) is int and e['runnerId']>0 and isinstance(e.get('runnerName'),str) and 0<len(e['runnerName'])<=256 and all(digest_string(e.get(k)) for k in ('serviceRunSHA256','serviceJobSHA256')),'ATTRIBUTABLE_PROVIDER_RUNNER_REQUIRED')
 require(e['ports']==[] and e['productionMounts']==[] and e['runnerImageVersion'],'PRIVATE_NONPRODUCTION_RUNNER_REQUIRED')
 require(type(e['timeoutSeconds']) is int and e['timeoutSeconds']==18000,'FINITE_JOB_TIMEOUT_REQUIRED')
 require(e['expiresAtEpoch']==e['jobStartedAtEpoch']+e['timeoutSeconds'] and e['jobStartedAtEpoch']<=now<e['expiresAtEpoch'],'ACTUAL_JOB_DEADLINE_REQUIRED')
 validate_authority(c['authority'])
 require(c['dependencyImages']==DEPENDENCY_IMAGES,'EXACT_DEPENDENCY_PINS_REQUIRED')
 p=c['durationPlan'];require(set(p)=={'setupSeconds','deliverySeconds','preflightSeconds','examinationSeconds','cleanupSeconds','evidenceExportSeconds','reviewSeconds'},'COMPLETE_DURATION_PLAN_REQUIRED')
 require(all(type(v) is int and v>0 for v in p.values()),'POSITIVE_DURATION_BOUNDS_REQUIRED')
 require(p['preflightSeconds']<=900 and p['examinationSeconds']<=1500 and p['cleanupSeconds']>=600 and p['evidenceExportSeconds']>=1800,'NATIVE_AND_CLEANUP_BOUNDS_REQUIRED')
 require(sum(p.values())<=e['timeoutSeconds'],'DURATION_PLAN_EXCEEDS_JOB_TIMEOUT')
 require(c['sources']==SOURCES,'EXACT_SOURCE_COMMIT_TREE_REQUIRED')
 require(digest_string(c.get('retainedEvidenceSHA256')),'SOURCE_BOUND_RETAINED_EVIDENCE_REQUIRED')
 return c

def validate_image_provenance(p,e):
 """Validate collected observations only; NEVER grant native admission here."""
 require(p.get('schema')=='work8-v75-executor-observations-v1' and p.get('status')=='OBSERVED_CURRENT_EXECUTOR_METADATA','CURRENT_EXECUTOR_OBSERVATIONS_REQUIRED')
 require(p.get('runId')==str(e['runId']) and p.get('jobId')==e['jobId'] and p.get('runAttempt')==1 and p.get('workflowCommit')==e['workflowCommit'] and p.get('sessionId')==e['sessionId'],'IMAGE_PROVENANCE_RUN_BINDING')
 o=p.get('observations',{})
 require(o.get('ImageOS')=='ubuntu24' and o.get('ImageVersion')==e['runnerImageVersion'] and re.fullmatch(r'\d{8}\.\d+\.\d+',o.get('ImageVersion','')),'CURRENT_IMAGE_OBSERVATION_BINDING_REQUIRED')
 for key in ('setupInfo','imageData'):
  group=o.get(key,{})
  require(set(group)=={'Image','Version','Included Software','Image Release'} and group.get('Image')=='ubuntu-24.04' and re.fullmatch(r'\d{8}\.\d+\.\d+',group.get('Version','')),'COMPLETE_IMAGE_OBSERVATIONS_REQUIRED')
 actual_agreement=o['setupInfo']==o['imageData'] and o['setupInfo']['Version']==o['ImageVersion']
 require(p.get('metadataAgreement') is actual_agreement and p.get('diagnosticCode')==(None if actual_agreement else 'CURRENT_RUNTIME_IMAGE_METADATA_DISAGREEMENT') and p.get('discrepancyCause')==('NOT_OBSERVED' if actual_agreement else 'UNRESOLVED'),'METADATA_DISAGREEMENT_MUST_REMAIN_VISIBLE')
 require(p.get('metadataDisagreementProvenHarmless') is False and p.get('imageBuildIdentityEstablished') is False and p.get('metadataEqualityIsAdmissionRequirement') is False and p.get('oldV65DiscrepancyResolved') is False,'UNSUPPORTED_IMAGE_BUILD_INFERENCE_REFUSED')
 require(p.get('providerSetupLogObserved') is False and p.get('nativeAdmissionGranted') is False and p.get('applicationAcceptance') is False,'PROVENANCE_SCOPE_MUST_BE_TRUTHFUL')
 require(p.get('independentArtifactReviewRequiredBeforeNative') is True and p.get('terminalProviderSetupLogComparisonRequiredBeforeAcceptance') is True,'INDEPENDENT_PROVENANCE_REVIEW_REQUIRED')
 worker=p.get('workerDiscovery',{})
 require(worker.get('discoveredThrough')=='actual-ancestor-proc-exe' and worker.get('executableBasename')=='Runner.Worker' and type(worker.get('pid')) is int and worker['pid']>1 and type(worker.get('startTicks')) is int and worker['startTicks']>0 and 0<worker.get('ancestorDepth',0)<=16,'ACTUAL_RUNNER_WORKER_ANCESTRY_REQUIRED')
 actual=p.get('actualEnvironment',{})
 require(actual.get('system')=='Linux' and actual.get('machine')=='x86_64' and isinstance(actual.get('kernelRelease'),str) and 0<len(actual['kernelRelease'])<=256 and digest_string(actual.get('bootIdSHA256')),'ACTUAL_KERNEL_CONTEXT_REQUIRED')
 require(set(actual.get('hostNamespaces',{}))=={'pid','mnt','net','user'} and all(re.fullmatch(r'[a-z]+:\[[0-9]+\]',v) for v in actual['hostNamespaces'].values()),'ACTUAL_HOST_NAMESPACES_REQUIRED')
 for record in [p.get('runtimeIdentityReceipt',{}),*p.get('files',{}).values()]:
  require(digest_string(record.get('sha256')) and type(record.get('bytes')) is int and 0<record['bytes']<=262144 and record.get('rawContentsExported') is False,'BOUNDED_METADATA_EVIDENCE_REQUIRED')
 require(set(p.get('files',{}))=={'runnerSetupInfo','imageData'},'COMPLETE_METADATA_EVIDENCE_REQUIRED')
 return p

def validate_current_executor_continuity(p,e):
 """Same actual kernel/worker context; no image-label equality assumption."""
 validate_image_provenance(p,e)
 actual=p['actualEnvironment'];worker=p['workerDiscovery']
 boot=pathlib.Path('/proc/sys/kernel/random/boot_id').read_text().strip()
 require(hashlib.sha256(boot.encode()).hexdigest()==actual['bootIdSHA256'] and platform.system()==actual['system'] and platform.machine()==actual['machine'] and platform.release()==actual['kernelRelease'],'CURRENT_EXECUTOR_KERNEL_CHANGED')
 require({name:os.readlink('/proc/self/ns/'+name) for name in actual['hostNamespaces']}==actual['hostNamespaces'],'CURRENT_EXECUTOR_NAMESPACE_CHANGED')
 pid=os.getppid();seen=set();found=False
 for _ in range(16):
  require(pid>1 and pid not in seen,'CURRENT_RUNNER_WORKER_ANCESTRY_LOST');seen.add(pid)
  proc=pathlib.Path('/proc')/str(pid);raw=(proc/'stat').read_bytes()
  require(len(raw)<=8192 and b') ' in raw,'CURRENT_RUNNER_PROCESS_STAT_BOUND')
  fields=raw.rsplit(b') ',1)[1].split();require(len(fields)>=20,'CURRENT_RUNNER_PROCESS_START_REQUIRED')
  if pid==worker['pid']:
   executable=pathlib.Path(os.readlink(proc/'exe'));st=executable.stat()
   require(executable.name=='Runner.Worker' and int(fields[19])==worker['startTicks'] and st.st_dev==worker['executableDevice'] and st.st_ino==worker['executableInode'] and st.st_uid==worker['executableOwnerUid'] and not st.st_mode&0o022,'CURRENT_RUNNER_WORKER_CHANGED')
   found=True;break
  pid=int(fields[1])
 require(found,'CURRENT_RUNNER_WORKER_ANCESTRY_LOST')
 return {'sameKernelContext':True,'sameRunnerWorker':True,'metadataBuildIdentityClaimed':False}

PROTECTED_ENTRYPOINTS={
 '/app/backend/dist/index.js':'62cda9b7f8829056e877481f95e264a88d246336d1ef3f60aeaac7d66a0393f3',
 '/app/deployment/runtime-membership-controller.cjs':'59e7ea679ad41cd8663d80c1e98364242fcec00c98744e77f682814a8d124f1b',
 '/app/deployment/runtime-membership-bootstrap.mjs':'84bd06b3cd85727cf8f48ee2668065361349323e5285429f63b90978b7856ea5',
 '/app/deployment/runtime-writer-isolation.cjs':'dff08c2dd38678875da9c53322a591f147a66c1afeb4a002c85a526662d6a2d2'}
NATIVE_ISOLATION_SHA256='5048f19ec38c708dd1b139f7a3f60cb8eb5e9146cd4fdb6e978caffbcac87a1b'
DUMPABILITY_OBSERVER_SOURCE_SHA256='5792bad3d38b43de5a53308a382796c5fd05fd7defd736c178178cdd358774bd'
SECURITY_EVIDENCE_KEYS={'runnerIdentitySHA256','runtimeImageProvenanceSHA256','nativeObservationSHA256','criticalImageReadbackSHA256','diagnosticControlsSHA256'}

def validate_current_docker_daemon(q):
 """Observe the current root-owned local daemon, not only its socket inode."""
 try:
  result=subprocess.run(['/usr/bin/docker','info','--format','{{.ID}}'],env={'PATH':'/usr/bin:/bin','DOCKER_HOST':'unix://'+q['dockerSocketPath'],'DOCKER_CONFIG':'/nonexistent-v75-docker-config'},capture_output=True,timeout=10,check=False)
 except (OSError,subprocess.TimeoutExpired):
  raise Refusal('CURRENT_DOCKER_DAEMON_READBACK_FAILED') from None
 require(result.returncode==0 and len(result.stdout)<=256 and len(result.stderr)<=4096,'CURRENT_DOCKER_DAEMON_READBACK_FAILED')
 require(result.stdout.decode('ascii',errors='replace').strip()==q['dockerEngineId'],'CURRENT_DOCKER_DAEMON_CHANGED')
 return True

def zero_caps(value):return isinstance(value,str) and re.fullmatch('0{1,16}',value) is not None

def validate_executor_security(q,e,p):
 """Check measured qualification operands; an external ACK is STILL mandatory.

 This function can test fixture rejection, but cannot turn a fixture into an
 actual runner. Caller verifies the pinned files and service/external review
 transport. Qualification probe is startup-free, not A5-08/09 or live writers.
 """
 validate_image_provenance(p,e)
 require(q.get('schema')=='work8-v65-native-qualification-v1' and q.get('status')=='PASS_CURRENT_EXECUTOR_NATIVE_PREREQUISITES' and q.get('sessionId')==e['sessionId'],'ACTUAL_NATIVE_QUALIFICATION_REQUIRED')
 require(q.get('executionMode')=='actual-github-runner' and q.get('applicationStarted') is False and q.get('wholeRowsAccepted')==[],'QUALIFICATION_SCOPE_REQUIRED')
 require(type(e.get('runnerId')) is int and e['runnerId']>0 and isinstance(e.get('runnerName'),str) and bool(e['runnerName']) and all(digest_string(e.get(k)) for k in ('serviceRunSHA256','serviceJobSHA256')),'ATTRIBUTABLE_PROVIDER_RUNNER_REQUIRED')
 require(type(q.get('observedAtEpoch')) in (int,float) and e['jobStartedAtEpoch']<=q['observedAtEpoch']<e['expiresAtEpoch'],'CURRENT_NATIVE_OBSERVATION_REQUIRED')
 bindings=q.get('evidenceBindings',{})
 require(set(bindings)==SECURITY_EVIDENCE_KEYS and all(digest_string(v) for v in bindings.values()) and bindings['runnerIdentitySHA256']==p['runtimeIdentityReceipt']['sha256'],'COMPLETE_NATIVE_EVIDENCE_BINDINGS_REQUIRED')
 require(digest_string(q.get('guardControlsSHA256')) and digest_string(q.get('observerBuildSHA256')),'COMPLETE_GUARD_AND_OBSERVER_EVIDENCE_REQUIRED')
 require(bindings['criticalImageReadbackSHA256']==q.get('criticalImageReadbackSHA256') and bindings['diagnosticControlsSHA256']==q.get('diagnosticControlsSHA256'),'NATIVE_EVIDENCE_BINDING_DISAGREEMENT')
 diagnostic=q.get('diagnosticControls',{})
 require(diagnostic.get('status')=='PASS' and diagnostic.get('testsRun')==7 and diagnostic.get('testsPassed')==7,'SEVEN_FIRST_ERROR_CONTROLS_REQUIRED')
 if q.get('evidenceMode')==FRESH_ADMISSION_MODE:
  require(q.get('historicalDiagnosticEvidence')==V94_DIAGNOSTIC_EVIDENCE and q.get('diagnosticControlsSHA256')==V94_DIAGNOSTIC_EVIDENCE['diagnosticControlsSHA256'],'EXACT_PRESERVED_V94_DIAGNOSTICS_REQUIRED')
  require(str(e['runId'])!=str(V94_DIAGNOSTIC_EVIDENCE['runId']) and e['jobId']!=V94_DIAGNOSTIC_EVIDENCE['jobId'],'FRESH_EXECUTOR_DISTINCT_FROM_CONSUMED_QUALIFICATION')
 elif q.get('evidenceMode') is not None:
  raise Refusal('NATIVE_EVIDENCE_MODE_REFUSED')
 require(q.get('requiredCapabilities')==CAPABILITIES and all(q.get(k) is True for k in ('seccompTSYNC','crossPrincipalProcReadback','readonlyRootVerified','privateFileExchangeVerified','internalNetworkVerified','noPublishedPortsVerified','providerCredentialsExcluded')),'ORIGINAL_NATIVE_BOUNDARIES_REQUIRED')
 require(q.get('dependencyImages')==DEPENDENCY_IMAGES and q.get('hostNodeVersion')=='v22.23.2' and q.get('dockerInfo',{}).get('CgroupVersion')=='2' and 'seccomp' in str(q.get('dockerInfo',{}).get('SecurityOptions')) and isinstance(q.get('dockerEngineId'),str) and bool(q['dockerEngineId']),'COMPATIBLE_NATIVE_RUNTIME_REQUIRED')
 row=q.get('nativeObservation',{})
 require(row.get('schema')=='work8-v75-native-capability-observation-v2' and row.get('status')=='PASS_NATIVE_CAPABILITY_ONLY' and row.get('applicationStarted') is False,'ACTUAL_NATIVE_OBSERVATION_REQUIRED')
 require(row.get('nonDumpabilityScope')=='CURRENT_QUALIFICATION_WRITER_ONLY' and row.get('requiredCapabilities')==CAPABILITIES and all(row.get(k) is True for k in ('crossPrincipalProcReadback','readonlyRootVerified','privateFileExchangeResponseWritten')),'RAW_NATIVE_OBSERVATION_SCOPE_REQUIRED')
 termination=row.get('childTermination',{});stderr=row.get('childStderr',{})
 require(termination.get('closed') is True and termination.get('forcedKill') is False and termination.get('requestedSignal')=='SIGTERM' and termination.get('exitCode') is None and termination.get('signal')=='SIGTERM' and termination.get('outputViolation') is None,'COMPLETE_ORDERLY_PROBE_TERMINATION_REQUIRED')
 require(stderr.get('bytes')==0 and type(stderr.get('bytes')) is int and stderr.get('sha256')==hashlib.sha256(b'').hexdigest() and stderr.get('streamComplete') is True and stderr.get('rawOutputRetained') is False,'COMPLETE_SANITIZED_PROBE_DIAGNOSTICS_REQUIRED')
 op=row.get('operator',{})
 require(all(op.get(k)==0 for k in ('uid','gid','euid','egid')) and op.get('noNewPrivs')==1,'ORIGINAL_OPERATOR_PRINCIPAL_REQUIRED')
 require(all(isinstance(op.get(k),str) and re.fullmatch('[a-fA-F0-9]{1,16}',op[k]) and int(op[k],16)==0x800e3 for k in ('capEff','capPrm')),'EXACT_OPERATOR_CAPABILITIES_REQUIRED')
 writer=row.get('writer',{})
 require(all(writer.get(k)==65534 for k in ('uid','gid','euid','egid')) and zero_caps(writer.get('caps')) and zero_caps(writer.get('prm')) and writer.get('nnp')=='1' and writer.get('seccomp')=='2','UNPRIVILEGED_SEPARATE_WRITER_REQUIRED')
 require(isinstance(writer.get('groups'),list) and all(type(x) is int and x==65534 for x in writer['groups']) and type(writer.get('pid')) is int and writer['pid']>0 and isinstance(writer.get('startTicks'),str) and re.fullmatch('[1-9][0-9]*',writer['startTicks']),'WRITER_IDENTITY_CENSUS_REQUIRED')
 require(writer.get('dumpable')==0 and type(writer.get('dumpable')) is int and writer.get('dumpabilityMethod')=='PR_GET_DUMPABLE_SAME_PROCESS','CURRENT_WRITER_NON_DUMPABILITY_REQUIRED')
 require(all(writer.get(k) is True for k in ('spawnDenied','privateDenied','privateWriteDenied')),'ACTUAL_WRITER_PERMISSION_DENIALS_REQUIRED')
 observer=row.get('observer',{})
 require(observer.get('sourceSHA256')==DUMPABILITY_OBSERVER_SOURCE_SHA256 and digest_string(observer.get('binarySHA256')) and observer['binarySHA256']==writer.get('observerSHA256') and observer.get('uid')==0 and observer.get('gid')==0 and observer.get('mode')==0o444 and observer.get('readOnly') is True,'PROTECTED_DUMPABILITY_OBSERVER_REQUIRED')
 att=row.get('nativeAttestation',{})
 require(att.get('nativeSha256')==NATIVE_ISOLATION_SHA256 and att.get('noNewPrivileges') is True and att.get('processCreation')=='DENIED_EXCEPT_SAME_TGID_THREADS' and att.get('processGroupEscape')=='DENIED' and type(att.get('seccompFilters')) is int and att['seccompFilters']>0,'PINNED_NATIVE_FILTER_ATTESTATION_REQUIRED')
 threads=row.get('threadObservations',[])
 require(isinstance(threads,list) and 0<len(threads)<=32 and row.get('threadCount')==len(threads),'COMPLETE_WRITER_THREAD_CENSUS_REQUIRED')
 require(all(type(t.get('tid')) is int and t['tid']>0 and t.get('seccomp')==2 and t.get('seccompFilters')==att['seccompFilters'] and t.get('NoNewPrivs')==1 and zero_caps(t.get('capEff')) for t in threads) and len({t['tid'] for t in threads})==len(threads) and writer['pid'] in {t['tid'] for t in threads} and row.get('seccompTSYNC') is True,'ALL_WRITER_THREAD_FILTERS_REQUIRED')
 ns=row.get('namespaceIds',{});writer_ns=row.get('writerNs',{});host=q.get('hostNamespaces',{})
 require(set(ns)=={'pid','mnt','net','ipc','uts','user','cgroup'} and writer_ns==ns and writer.get('namespaceIds')==writer_ns and all(re.fullmatch(r'[a-z]+:\[[0-9]+\]',v) for v in ns.values()) and host==p['actualEnvironment']['hostNamespaces'],'COMPLETE_NAMESPACE_OBSERVATIONS_REQUIRED')
 require(all(ns[k]!=host[k] for k in ('pid','mnt','net')),'HOST_NAMESPACE_ISOLATION_REQUIRED')
 entrypoints=row.get('protectedEntrypoints',[])
 require(isinstance(entrypoints,list) and len(entrypoints)==len(PROTECTED_ENTRYPOINTS) and {x.get('path') for x in entrypoints}==set(PROTECTED_ENTRYPOINTS),'COMPLETE_PROTECTED_ENTRYPOINTS_REQUIRED')
 require(all(x.get('uid')==0 and type(x.get('mode')) is int and not x['mode']&0o022 and x.get('sha256')==PROTECTED_ENTRYPOINTS[x['path']] and x.get('writerWriteDenied') is True for x in entrypoints),'PROTECTED_APPLICATION_ENTRYPOINTS_REQUIRED')
 container=q.get('containerObservation',{})
 require(digest_string(q.get('backendImageSHA256')) and container.get('image')=='sha256:'+q['backendImageSHA256'] and container.get('user')=='0:0' and container.get('privileged') is False and container.get('readonlyRootfs') is True,'QUALIFIED_CONTAINER_IDENTITY_REQUIRED')
 require(container.get('capAdd')==CAPABILITIES and container.get('capDrop')==['ALL'] and container.get('networkMode')=='none' and container.get('publishedPorts')=={} and container.get('providerCredentialsExcluded') is True,'QUALIFIED_CONTAINER_BOUNDARIES_REQUIRED')
 require(container.get('pidMode')=='' and container.get('ipcMode')=='private' and container.get('utsMode')=='' and container.get('usernsMode')=='' and container.get('cgroupnsMode')=='private','ISOLATED_CONTAINER_NAMESPACES_REQUIRED')
 root=q.get('executionRoot');require(isinstance(root,str) and pathlib.Path(root).is_absolute() and str(pathlib.PurePosixPath(root))==root and '..' not in pathlib.PurePosixPath(root).parts,'QUALIFIED_EXECUTION_ROOT_REQUIRED')
 mounts=container.get('mounts',[])
 expected={'/qualification':(root+'/runtime',False),'/control':(root+'/qualification-private/control',True)}
 require(isinstance(mounts,list) and len(mounts)==2 and {m.get('destination') for m in mounts}==set(expected),'NO_EXTRA_OR_PRODUCTION_MOUNTS_REQUIRED')
 require(all(m.get('type')=='bind' and (m.get('source'),m.get('rw'))==expected[m['destination']] and m.get('propagation')=='rprivate' for m in mounts),'PRIVATE_READONLY_MOUNT_BOUNDARIES_REQUIRED')
 return {'status':'QUALIFICATION_OPERANDS_VALID_EXTERNAL_REVIEW_STILL_REQUIRED','applicationAcceptance':False,'imageBuildIdentityClaimed':False}


def validate_qualification_evidence(q,e,controls,build,guard_source_sha):
 """Pin the full negative-control and compiler receipts, not just PASS words."""
 require(controls.get('schema')=='work8-v75-guard-controls-v1' and controls.get('status')=='PASS_SOURCE_BOUND_REJECTION_CONTROLS' and type(controls.get('testsRun')) is int and controls['testsRun']>0 and all(controls.get(k)==[] for k in ('failures','errors','skipped')),'COMPLETE_SOURCE_REJECTION_CONTROLS_REQUIRED')
 require(all(controls.get(k)==e[k] for k in ('runId','runAttempt','jobId','workflowCommit','sessionId')),'GUARD_CONTROLS_ACTUAL_JOB_BINDING')
 require(controls.get('actualRunnerQualified') is False and controls.get('applicationStarted') is False and controls.get('rawOutputRetained') is False,'GUARD_CONTROLS_SCOPE_REQUIRED')
 sources=controls.get('sourceSHA256',{})
 required={'adapter/github_contract.py','adapter/collect_runtime_image_provenance.py','adapter/compare_executor_provenance.py','tests/run_guard_controls.py','tests/test_executor_guard.py','tests/test_metadata_guard.py','tests/test_terminal_guard.py'}
 require(set(sources)==required and all(digest_string(value) for value in sources.values()) and sources.get('adapter/github_contract.py')==guard_source_sha,'GUARD_CONTROLS_CURRENT_SOURCE_REQUIRED')
 require(build.get('schema')=='work8-v75-native-observer-build-v1' and build.get('status')=='COMPILED_AWAITING_ACTUAL_PROTECTED_NODE_LOAD' and build.get('sourceSHA256')==DUMPABILITY_OBSERVER_SOURCE_SHA256 and build.get('binarySHA256')==q['nativeObservation']['observer']['binarySHA256'],'OBSERVER_BUILD_IDENTITY_REQUIRED')
 require(build.get('applicationModified') is False and build.get('hostedExecutorQualified') is False and build.get('rawCompilerOutputRetained') is False and build.get('streamComplete') is True and build.get('exitCode')==0 and build.get('maximumSeconds')==60 and build.get('maximumOutputBytes')==131072 and type(build.get('outputBytes')) is int and 0<=build['outputBytes']<=131072 and digest_string(build.get('outputSHA256')) and digest_string(build.get('compilerSHA256')) and digest_string(build.get('runtimeHelperSHA256')),'COMPLETE_OBSERVER_BUILD_DIAGNOSTICS_REQUIRED')
 return True

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
  require(ack.get('executorObservationsReviewed') is True and ack.get('metadataDisagreementPreserved') is True and ack.get('imageBuildIdentityClaimed') is False and ack.get('actualExecutorSecurityAccepted') is True and ack.get('providerJobIndependentlyReadBack') is True and ack.get('terminalProviderSetupLogComparisonRequiredBeforeAcceptance') is True,'INDEPENDENT_ACTUAL_EXECUTOR_SECURITY_REQUIRED')
  require(ack['sourceEquivalentPackagesQualified'] is True and ack['eightSatisfiedGroupsRemainApplicable'] is True and ack['nativePrerequisitesAccepted'] is True,'PACKAGE_AND_EXECUTOR_ADMISSION_REQUIRED')
 else:require(ack['actualInitializedBrainPreflightAccepted'] is True,'ACTUAL_PREFLIGHT_REVIEW_REQUIRED')
 return ack

def package_bindings(c):
 return {k:c[k] for k in ('packageManifestSHA256','controllerManifestSHA256','driverManifestSHA256','sourceIdentitiesSHA256','nativeQualificationSHA256','launchContractSHA256','runnerIdentitySHA256','runtimeImageProvenanceSHA256','retainedEvidenceSHA256')}

def verify_source_identity(root,c):
 s=pinned_json(pathlib.Path(root)/'source-identities.json',c['sourceIdentitiesSHA256'])
 require(s['schema']=='work8-v65-reconstructed-source-identities-v1' and s['components']==SOURCES,'CURRENT_SOURCE_PROVENANCE_REQUIRED')
 ack=pinned_json(pathlib.Path(root)/'source-review.json',os.environ.get('WORK8_SOURCE_REVIEW_SHA256'))
 verify_ack(ack,c,'packages-and-executor',package_bindings(c),time.time())
 reference='source-evidence/a5-reuse-adjudication.json';expected='54291e5ac344910a46568d220be52b1d6efffda7c3329fb14d4e85125e6b7045'
 proof=pathlib.Path(root)/'controller/scripts/work8/native-transition'/reference
 require(regular(proof,105412).st_size==105412,'EXACT_HISTORICAL_REUSE_PROOF_SIZE_REQUIRED');pinned_json(proof,expected)
 return {**s,'packagedAndIndependentlyReadBackBeforeUTC':ack['reviewedAtUTC'],'packageReadbackEvidenceSHA256':os.environ['WORK8_SOURCE_REVIEW_SHA256'],'evidenceReferences':[{'reference':reference,'bytes':105412,'sha256':expected,'readBackThisExecution':True,'scope':'PRESERVED_EIGHT_SATISFIED_GROUPS_NOT_CURRENT_A5_08_09_ACCEPTANCE'}]}

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
 retained=pinned_json(root/'provider/retained-evidence.json',c['retainedEvidenceSHA256'])
 frontend_reuse_receipt(retained,BACKEND,FRONTENDS)
 require(package['backend']==BACKEND and package['frontends']==FRONTENDS,'CURRENT_PACKAGE_IDENTITY_CHANGED')
 for pin in [BACKEND,*FRONTENDS.values()]:archive_identity(root/'artifacts'/pin['file'],pin)
 actual={p.name for p in (root/'artifacts').iterdir()};require(actual=={x['file'] for x in [BACKEND,*FRONTENDS.values()]},'UNINDEXED_PACKAGE_OR_PARTIAL_REFUSED')
 p=pinned_json(root/'runtime-image-provenance.json',c['runtimeImageProvenanceSHA256'])
 require(sha(root/'runner-identity.json')==c['runnerIdentitySHA256'],'CURRENT_RUNNER_IDENTITY_RECEIPT_CHANGED')
 validate_current_executor_continuity(p,c['executor'])
 q=pinned_json(root/'native-qualification.json',c['nativeQualificationSHA256'])
 require(q.get('evidenceMode')==FRESH_ADMISSION_MODE,'V99_FRESH_EXECUTOR_ADMISSION_REQUIRED')
 validate_executor_security(q,c['executor'],p)
 require('sha256:'+q['backendImageSHA256']==BACKEND['image'],'QUALIFIED_BACKEND_PACKAGE_CHANGED')
 require(q['executionRoot']==str(root),'QUALIFIED_EXECUTION_ROOT_CHANGED')
 controls=pinned_json(root/'runtime-evidence/guard-controls.json',q['guardControlsSHA256'])
 build=pinned_json(root/'runtime-evidence/dumpability-observer-build.json',q['observerBuildSHA256'])
 validate_qualification_evidence(q,c['executor'],controls,build,sha(pathlib.Path(__file__)))
 for key,path in {'runnerIdentitySHA256':'runner-identity.json','runtimeImageProvenanceSHA256':'runtime-image-provenance.json','nativeObservationSHA256':'runtime-evidence/native-capability-observation.json','criticalImageReadbackSHA256':'critical-image-readback.json','diagnosticControlsSHA256':'diagnostic-controls/negative-control-result.json'}.items():
  value=pinned_json(root/path,q['evidenceBindings'][key])
  if key=='nativeObservationSHA256':require(value==q['nativeObservation'],'NATIVE_OBSERVATION_CHANGED')
  if key=='diagnosticControlsSHA256':require(value==q['diagnosticControls'],'DIAGNOSTIC_CONTROLS_CHANGED')
 require(q['status']=='PASS_CURRENT_EXECUTOR_NATIVE_PREREQUISITES' and q['sessionId']==c['executor']['sessionId'],'ACTUAL_NATIVE_QUALIFICATION_REQUIRED')
 require(q['requiredCapabilities']==CAPABILITIES and all(q[k] is True for k in ('seccompTSYNC','crossPrincipalProcReadback','readonlyRootVerified','privateFileExchangeVerified','internalNetworkVerified','noPublishedPortsVerified','providerCredentialsExcluded')),'ORIGINAL_NATIVE_BOUNDARIES_REQUIRED')
 require(q['dependencyImages']==DEPENDENCY_IMAGES and q['hostNodeVersion']=='v22.23.2','EXACT_RUNTIME_DEPENDENCIES_REQUIRED')
 socket=pathlib.Path(q['dockerSocketPath']);st=socket.lstat();require(socket.resolve()==socket and stat.S_ISSOCK(st.st_mode) and st.st_uid==0,'ROOT_OWNED_DOCKER_SOCKET_REQUIRED')
 require({'uid':st.st_uid,'gid':st.st_gid,'mode':stat.S_IMODE(st.st_mode),'dev':st.st_dev,'ino':st.st_ino}==q['dockerSocket'],'CURRENT_DOCKER_SOCKET_CHANGED')
 require(os.environ.get('DOCKER_HOST')=='unix://'+str(socket),'QUALIFIED_DAEMON_BINDING_REQUIRED')
 require(not any(os.environ.get(k) for k in ('DOCKER_CONTEXT','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH','DOCKER_API_VERSION')),'AMBIENT_DOCKER_OVERRIDE_REFUSED')
 validate_current_docker_daemon(q)
 launch=pinned_json(root/'launch-contract.json',c['launchContractSHA256']);require(launch['authority']==c['authority'] and launch['durationPlan']==c['durationPlan'] and launch['workflowCommit']==c['executor']['workflowCommit'],'REVIEWED_LAUNCH_BINDING_REQUIRED')
 verify_source_identity(root,c);require_remaining_lifetime(c,stage,time.time())
 if stage=='full':
  ack=pinned_json(root/'preflight-review.json',os.environ.get('WORK8_PREFLIGHT_REVIEW_SHA256'))
  expected={**package_bindings(c),'runContractSHA256':os.environ['WORK8_RUN_CONTRACT_SHA256'],'runnerResultSHA256':sha(root/'evidence/preflight/runner-result.json'),'artifactIndexSHA256':sha(root/'evidence/preflight/artifact-index.json')}
  verify_ack(ack,c,'preflight',expected,time.time())
  result=json.loads((root/'evidence/preflight/runner-result.json').read_text())
  require(result['status']=='PASS_ACTUAL_NATIVE_LIVE_BRAIN_PREFLIGHT_AWAITING_INDEPENDENT_REVIEW' and result['temporaryContainersAndNetworkRemoved'] is True and result['privateTemporaryDataRemoved'] is True,'ACTUAL_CLEAN_PREFLIGHT_REQUIRED')
 return {**c,'retainedEvidence':retained}

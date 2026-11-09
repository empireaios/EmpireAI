"""V75 local mutation controls, NEVER actual-executor qualification.

Positive operands below are synthetic fixtures. Passing this suite proves guard
semantics/rejections only; native admission additionally requires same-instance
measurements, pinned files, independent provider/artifact readback and owner ACK.
"""
import copy
import hashlib
import json
import pathlib
import sys
import unittest
from unittest import mock
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'adapter'))
import github_contract as g
import collect_runtime_image_provenance as collect

H='a'*64
W='b'*40


def metadata(version):
 release=version.rsplit('.',1)[0]
 return {'Image':'ubuntu-24.04','Version':version,'Included Software':f'https://github.com/actions/runner-images/blob/ubuntu24/{release}/images/ubuntu/Ubuntu2404-Readme.md','Image Release':f'https://github.com/actions/runner-images/releases/tag/ubuntu24/{release}'}


def fixture():
 e={'runId':'123','runAttempt':1,'jobId':456,'workflowCommit':W,'sessionId':'github-actions:123:1:456','runnerImageVersion':'20261026.354.1','runnerId':789,'runnerName':'synthetic-fixture-not-actual-runner','serviceRunSHA256':H,'serviceJobSHA256':H,'jobStartedAtEpoch':100,'expiresAtEpoch':19000}
 m={'bytes':100,'sha256':H,'rawContentsExported':False}
 host={'pid':'pid:[1]','mnt':'mnt:[2]','net':'net:[3]','user':'user:[4]'}
 p={'schema':'work8-v75-executor-observations-v1','status':'OBSERVED_CURRENT_EXECUTOR_METADATA',**{k:e[k] for k in ('runId','runAttempt','jobId','workflowCommit','sessionId')},'observations':{'ImageOS':'ubuntu24','ImageVersion':e['runnerImageVersion'],'setupInfo':metadata('20261025.353.1'),'imageData':metadata('20261025.353.1')},'metadataAgreement':False,'diagnosticCode':'CURRENT_RUNTIME_IMAGE_METADATA_DISAGREEMENT','discrepancyCause':'UNRESOLVED','metadataDisagreementProvenHarmless':False,'imageBuildIdentityEstablished':False,'metadataEqualityIsAdmissionRequirement':False,'oldV65DiscrepancyResolved':False,'providerSetupLogObserved':False,'nativeAdmissionGranted':False,'applicationAcceptance':False,'independentArtifactReviewRequiredBeforeNative':True,'terminalProviderSetupLogComparisonRequiredBeforeAcceptance':True,'workerDiscovery':{'discoveredThrough':'actual-ancestor-proc-exe','executableBasename':'Runner.Worker','pid':10,'startTicks':20,'ancestorDepth':2,'executableDevice':1,'executableInode':2,'executableOwnerUid':1001},'actualEnvironment':{'system':'Linux','machine':'x86_64','kernelRelease':'fixture-kernel','bootIdSHA256':H,'hostNamespaces':host},'runtimeIdentityReceipt':m,'files':{'runnerSetupInfo':m,'imageData':m}}
 ns={'pid':'pid:[11]','mnt':'mnt:[12]','net':'net:[13]','user':'user:[4]','ipc':'ipc:[15]','uts':'uts:[16]','cgroup':'cgroup:[17]'}
 row={'schema':'work8-v75-native-capability-observation-v2','status':'PASS_NATIVE_CAPABILITY_ONLY','applicationStarted':False,'nonDumpabilityScope':'CURRENT_QUALIFICATION_WRITER_ONLY','requiredCapabilities':g.CAPABILITIES,'crossPrincipalProcReadback':True,'readonlyRootVerified':True,'privateFileExchangeResponseWritten':True,'childTermination':{'closed':True,'forcedKill':False,'requestedSignal':'SIGTERM','exitCode':None,'signal':'SIGTERM','outputViolation':None},'childStderr':{'bytes':0,'sha256':hashlib.sha256(b'').hexdigest(),'streamComplete':True,'rawOutputRetained':False},'operator':{'uid':0,'gid':0,'euid':0,'egid':0,'capEff':'00000000000800e3','capPrm':'00000000000800e3','noNewPrivs':1},'writer':{'uid':65534,'gid':65534,'euid':65534,'egid':65534,'caps':'0000000000000000','prm':'0000000000000000','nnp':'1','seccomp':'2','dumpable':0,'dumpabilityMethod':'PR_GET_DUMPABLE_SAME_PROCESS','spawnDenied':True,'privateDenied':True,'privateWriteDenied':True,'observerSHA256':H,'groups':[65534],'pid':99,'startTicks':'1','namespaceIds':ns},'observer':{'sourceSHA256':g.DUMPABILITY_OBSERVER_SOURCE_SHA256,'binarySHA256':H,'uid':0,'gid':0,'mode':0o444,'readOnly':True},'nativeAttestation':{'nativeSha256':g.NATIVE_ISOLATION_SHA256,'noNewPrivileges':True,'processCreation':'DENIED_EXCEPT_SAME_TGID_THREADS','processGroupEscape':'DENIED','seccompFilters':2},'threadObservations':[{'tid':99,'seccomp':2,'seccompFilters':2,'NoNewPrivs':1,'capEff':'0000000000000000'}],'threadCount':1,'seccompTSYNC':True,'namespaceIds':ns,'writerNs':copy.deepcopy(ns),'protectedEntrypoints':[{'path':path,'uid':0,'mode':0o444,'sha256':sha,'writerWriteDenied':True} for path,sha in g.PROTECTED_ENTRYPOINTS.items()]}
 root='/fixture/not-a-run'
 container={'image':'sha256:'+H,'user':'0:0','privileged':False,'readonlyRootfs':True,'capAdd':g.CAPABILITIES,'capDrop':['ALL'],'networkMode':'none','publishedPorts':{},'providerCredentialsExcluded':True,'pidMode':'','ipcMode':'private','utsMode':'','usernsMode':'','cgroupnsMode':'private','mounts':[{'type':'bind','source':root+'/runtime','destination':'/qualification','rw':False,'propagation':'rprivate'},{'type':'bind','source':root+'/qualification-private/control','destination':'/control','rw':True,'propagation':'rprivate'}]}
 q={'schema':'work8-v65-native-qualification-v1','status':'PASS_CURRENT_EXECUTOR_NATIVE_PREREQUISITES','sessionId':e['sessionId'],'executionMode':'actual-github-runner','applicationStarted':False,'wholeRowsAccepted':[],'observedAtEpoch':200,'evidenceBindings':{k:H for k in g.SECURITY_EVIDENCE_KEYS},'guardControlsSHA256':H,'observerBuildSHA256':H,'criticalImageReadbackSHA256':H,'diagnosticControlsSHA256':H,'diagnosticControls':{'status':'PASS','testsRun':7,'testsPassed':7},'requiredCapabilities':g.CAPABILITIES,'dependencyImages':g.DEPENDENCY_IMAGES,'hostNodeVersion':'v22.23.2','dockerInfo':{'CgroupVersion':'2','SecurityOptions':['name=seccomp,profile=builtin']},'dockerEngineId':'fixture','nativeObservation':row,'hostNamespaces':host,'backendImageSHA256':H,'executionRoot':root,'containerObservation':container}
 q.update({k:True for k in ('seccompTSYNC','crossPrincipalProcReadback','readonlyRootVerified','privateFileExchangeVerified','internalNetworkVerified','noPublishedPortsVerified','providerCredentialsExcluded')})
 return q,e,p

def authority_fixture():
 a={'ownerDirective':g.OWNER_DIRECTIVE,'work8CeilingUSD':100,'existingAdditionalA5USD':10,'priorOverallHoldsUSD':16.68,'priorA5HoldsUSD':6.73,'availableBeforeReservationUSD':3.27,'ownerDecisionRecorded':True,'ownerApprovalReceiptSHA256':H,'approvalScope':'one-native-a5-08-09-attempt','maximumAttempts':1,'reservationCommitted':True,'reservationUSD':2.11,'maximumProspectiveUSD':2.11,'reservationId':g.NATIVE_RESERVATION_ID,'reservationReceiptSHA256':H,'currentOverallHoldsUSD':18.79,'currentA5HoldsUSD':8.84,'remainingUnreservedUSD':1.16}
 a['independentAckAuthority']={'maximumOwnerEndorsements':2,'issueNumber':113,'stages':['packages-and-executor','preflight'],'scope':'safe-artifact-acknowledgment-only','otherMessagesAuthorized':False}
 a.update({k:False for k in ('renewed','productionOperations','protectedDataTransfer','commerceActivation','subscriptions','automaticRecreate','automaticRerun')})
 return a

def contract_fixture():
 q,e,p=fixture();e.update(provider='github-actions',repository=g.REPOSITORY,repositoryId=g.REPOSITORY_ID,jobKey='a5',hostUid=1001,hostGid=1001,architecture='amd64',hostArtifactEgress='github-provider-endpoints',nativeNetworkPolicy='docker-internal-no-published-ports',ports=[],productionMounts=[],timeoutSeconds=18000,jobStartedAtEpoch=100,expiresAtEpoch=18100)
 c={'schema':g.SCHEMA,'retainedEvidenceSHA256':H,'executor':e,'campaignId':'work8-v65-a5-123','authority':authority_fixture(),'dependencyImages':g.DEPENDENCY_IMAGES,'sources':copy.deepcopy(g.SOURCES),'durationPlan':{'setupSeconds':7800,'deliverySeconds':2700,'preflightSeconds':900,'examinationSeconds':1500,'cleanupSeconds':600,'evidenceExportSeconds':1800,'reviewSeconds':1800}}
 env={'GITHUB_ACTIONS':'true','GITHUB_REPOSITORY':g.REPOSITORY,'GITHUB_REPOSITORY_ID':g.REPOSITORY_ID,'GITHUB_RUN_ID':'123','GITHUB_RUN_ATTEMPT':'1','GITHUB_SHA':W,'GITHUB_JOB':'a5','RUNNER_OS':'Linux','RUNNER_ARCH':'X64'}
 return c,env


class AuthorityAndSourceControls(unittest.TestCase):
 def test_reviewed_fixture_contract_remains_unaccepted(self):
  c,env=contract_fixture();self.assertEqual(g.validate_contract(c,200,env),c)
 def test_wrong_immutable_source(self):
  c,env=contract_fixture();c['sources']['backend']['commit']='c'*40
  with self.assertRaisesRegex(g.Refusal,'EXACT_SOURCE_COMMIT_TREE_REQUIRED'):g.validate_contract(c,200,env)
 def test_wrong_tree(self):
  c,env=contract_fixture();c['sources']['normal']['tree']='c'*40
  with self.assertRaisesRegex(g.Refusal,'EXACT_SOURCE_COMMIT_TREE_REQUIRED'):g.validate_contract(c,200,env)
 def test_source_environment_mismatch(self):
  c,env=contract_fixture();env['GITHUB_SHA']='c'*40
  with self.assertRaisesRegex(g.Refusal,'CURRENT_GITHUB_ENVIRONMENT_BINDING'):g.validate_contract(c,200,env)
 def test_automatic_second_attempt(self):
  c,env=contract_fixture();c['executor']['runAttempt']=2
  with self.assertRaisesRegex(g.Refusal,'ONE_ACTUAL_RUN_ATTEMPT_REQUIRED'):g.validate_contract(c,200,env)
 def test_expired_job(self):
  c,env=contract_fixture()
  with self.assertRaisesRegex(g.Refusal,'ACTUAL_JOB_DEADLINE_REQUIRED'):g.validate_contract(c,19000,env)
 def test_missing_owner_approval_receipt(self):
  a=authority_fixture();a['ownerApprovalReceiptSHA256']=None
  with self.assertRaisesRegex(g.Refusal,'SEPARATE_EXPLICIT_OWNER_DECISION_REQUIRED'):g.validate_authority(a)
 def test_uncommitted_reservation(self):
  a=authority_fixture();a['reservationCommitted']=False
  with self.assertRaisesRegex(g.Refusal,'CURRENT_COMMITTED_RESERVATION_REQUIRED'):g.validate_authority(a)
 def test_exposure_exceeds_specific_decision(self):
  a=authority_fixture();a['maximumProspectiveUSD']=0.128
  with self.assertRaisesRegex(g.Refusal,'REVIEWED_SINGLE_ATTEMPT_FINANCIAL_CAP_REQUIRED'):g.validate_authority(a)
 def test_reservation_exceeds_specific_decision(self):
  a=authority_fixture();a['reservationUSD']=1.01
  with self.assertRaisesRegex(g.Refusal,'REVIEWED_SINGLE_ATTEMPT_FINANCIAL_CAP_REQUIRED'):g.validate_authority(a)
 def test_reused_authority(self):
  a=authority_fixture();a['renewed']=True
  with self.assertRaisesRegex(g.Refusal,'ORIGINAL_OPERATING_LOCKS_REQUIRED'):g.validate_authority(a)
 def test_unbounded_duration(self):
  c,env=contract_fixture();c['durationPlan']['examinationSeconds']=99999
  with self.assertRaisesRegex(g.Refusal,'NATIVE_AND_CLEANUP_BOUNDS_REQUIRED'):g.validate_contract(c,200,env)
 def test_production_mount_contract(self):
  c,env=contract_fixture();c['executor']['productionMounts']=['/prod']
  with self.assertRaisesRegex(g.Refusal,'PRIVATE_NONPRODUCTION_RUNNER_REQUIRED'):g.validate_contract(c,200,env)
 def test_independent_ack_requires_provider_evidence(self):
  c,env=contract_fixture();e=c['executor'];ack={'schema':'work8-v65-independent-ack-v1','decision':'PASS','repository':g.REPOSITORY,'runId':e['runId'],'runAttempt':1,'workflowCommit':W,'stage':'packages-and-executor','reviewerRole':'independent-external-reviewer','applicationAcceptance':False,'bindings':{'one':H},'artifactId':1,'artifactSHA256':H,'independentlyDownloadedAndHashed':True,'rawPrivateDataIncluded':False,'reviewedAtUTC':'1970-01-01T00:03:00+00:00','executorObservationsReviewed':True,'metadataDisagreementPreserved':True,'imageBuildIdentityClaimed':False,'actualExecutorSecurityAccepted':True,'providerJobIndependentlyReadBack':False,'terminalProviderSetupLogComparisonRequiredBeforeAcceptance':True}
  with self.assertRaisesRegex(g.Refusal,'INDEPENDENT_ACTUAL_EXECUTOR_SECURITY_REQUIRED'):g.verify_ack(ack,c,'packages-and-executor',{'one':H},200)


class QualificationEvidenceControls(unittest.TestCase):
 def receipts(self):
  q,e,p=fixture()
  keys={'adapter/github_contract.py','adapter/collect_runtime_image_provenance.py','adapter/compare_executor_provenance.py','tests/run_guard_controls.py','tests/test_executor_guard.py','tests/test_metadata_guard.py','tests/test_terminal_guard.py'}
  controls={'schema':'work8-v75-guard-controls-v1','status':'PASS_SOURCE_BOUND_REJECTION_CONTROLS','testsRun':1,'failures':[],'errors':[],'skipped':[],'sourceSHA256':{k:H for k in keys},'actualRunnerQualified':False,'applicationStarted':False,'rawOutputRetained':False,**{k:e[k] for k in ('runId','runAttempt','jobId','workflowCommit','sessionId')}}
  build={'schema':'work8-v75-native-observer-build-v1','status':'COMPILED_AWAITING_ACTUAL_PROTECTED_NODE_LOAD','sourceSHA256':g.DUMPABILITY_OBSERVER_SOURCE_SHA256,'binarySHA256':H,'applicationModified':False,'hostedExecutorQualified':False,'rawCompilerOutputRetained':False,'streamComplete':True,'exitCode':0,'maximumSeconds':60,'maximumOutputBytes':131072,'outputBytes':0,'outputSHA256':hashlib.sha256(b'').hexdigest(),'compilerSHA256':H,'runtimeHelperSHA256':H}
  return q,e,controls,build
 def test_fixture_evidence_scope_remains_limited(self):
  q,e,controls,build=self.receipts();self.assertTrue(g.validate_qualification_evidence(q,e,controls,build,H));self.assertFalse(controls['actualRunnerQualified']);self.assertFalse(build['hostedExecutorQualified'])
 def reject(self,mutate,code):
  q,e,controls,build=self.receipts();mutate(controls,build)
  with self.assertRaisesRegex(g.Refusal,code):g.validate_qualification_evidence(q,e,controls,build,H)
 def test_skipped_control(self):self.reject(lambda c,b:c.update(skipped=['test_missing']),'COMPLETE_SOURCE_REJECTION_CONTROLS_REQUIRED')
 def test_failed_control(self):self.reject(lambda c,b:c.update(failures=['test_missing']),'COMPLETE_SOURCE_REJECTION_CONTROLS_REQUIRED')
 def test_wrong_control_job(self):self.reject(lambda c,b:c.update(jobId=999),'GUARD_CONTROLS_ACTUAL_JOB_BINDING')
 def test_wrong_guard_source(self):self.reject(lambda c,b:c['sourceSHA256'].update({'adapter/github_contract.py':'b'*64}),'GUARD_CONTROLS_CURRENT_SOURCE_REQUIRED')
 def test_missing_terminal_guard_source(self):self.reject(lambda c,b:c['sourceSHA256'].pop('adapter/compare_executor_provenance.py'),'GUARD_CONTROLS_CURRENT_SOURCE_REQUIRED')
 def test_fixture_claims_actual_qualification(self):self.reject(lambda c,b:c.update(actualRunnerQualified=True),'GUARD_CONTROLS_SCOPE_REQUIRED')
 def test_observer_wrong_binary(self):self.reject(lambda c,b:b.update(binarySHA256='b'*64),'OBSERVER_BUILD_IDENTITY_REQUIRED')
 def test_incomplete_compiler_diagnostics(self):self.reject(lambda c,b:b.update(streamComplete=False),'COMPLETE_OBSERVER_BUILD_DIAGNOSTICS_REQUIRED')
 def test_failed_compiler(self):self.reject(lambda c,b:b.update(exitCode=1),'COMPLETE_OBSERVER_BUILD_DIAGNOSTICS_REQUIRED')


class AdmissionControls(unittest.TestCase):
 def refusal(self,mutator,code):
  q,e,p=fixture();mutator(q,e,p)
  with self.assertRaisesRegex(g.Refusal,code):g.validate_executor_security(q,e,p)
 def test_fixture_is_only_operand_validation_not_native_admission(self):
  q,e,p=fixture();result=g.validate_executor_security(q,e,p)
  self.assertEqual(result['status'],'QUALIFICATION_OPERANDS_VALID_EXTERNAL_REVIEW_STILL_REQUIRED');self.assertFalse(result['applicationAcceptance']);self.assertFalse(p['nativeAdmissionGranted'])
 def test_mismatch_is_preserved_not_ignored(self):
  q,e,p=fixture();g.validate_image_provenance(p,e)
  self.assertEqual(p['observations']['setupInfo']['Version'],'20261025.353.1');self.assertEqual(p['observations']['ImageVersion'],'20261026.354.1');self.assertEqual(p['discrepancyCause'],'UNRESOLVED')
 def test_matching_metadata_cannot_replace_native_proof(self):
  q,e,p=fixture();p['observations']['setupInfo']=metadata(e['runnerImageVersion']);p['observations']['imageData']=metadata(e['runnerImageVersion']);p.update(metadataAgreement=True,diagnosticCode=None,discrepancyCause='NOT_OBSERVED');q.pop('nativeObservation')
  with self.assertRaisesRegex(g.Refusal,'ACTUAL_NATIVE_OBSERVATION_REQUIRED'):g.validate_executor_security(q,e,p)
 def test_unattributable_runner(self):self.refusal(lambda q,e,p:e.update(runnerId=0),'ATTRIBUTABLE_PROVIDER_RUNNER_REQUIRED')
 def test_wrong_job(self):self.refusal(lambda q,e,p:p.update(jobId=123),'IMAGE_PROVENANCE_RUN_BINDING')
 def test_wrong_workflow(self):self.refusal(lambda q,e,p:p.update(workflowCommit='c'*40),'IMAGE_PROVENANCE_RUN_BINDING')
 def test_old_worker_identity(self):self.refusal(lambda q,e,p:p['workerDiscovery'].update(startTicks=0),'ACTUAL_RUNNER_WORKER_ANCESTRY_REQUIRED')
 def test_wrong_kernel_architecture(self):self.refusal(lambda q,e,p:p['actualEnvironment'].update(machine='aarch64'),'ACTUAL_KERNEL_CONTEXT_REQUIRED')
 def test_stale_native_observation(self):self.refusal(lambda q,e,p:q.update(observedAtEpoch=99),'CURRENT_NATIVE_OBSERVATION_REQUIRED')
 def test_mismatch_omission(self):self.refusal(lambda q,e,p:p.update(diagnosticCode=None),'METADATA_DISAGREEMENT_MUST_REMAIN_VISIBLE')
 def test_unproved_harmless_claim(self):self.refusal(lambda q,e,p:p.update(metadataDisagreementProvenHarmless=True),'UNSUPPORTED_IMAGE_BUILD_INFERENCE_REFUSED')
 def test_unproved_build_identity_claim(self):self.refusal(lambda q,e,p:p.update(imageBuildIdentityEstablished=True),'UNSUPPORTED_IMAGE_BUILD_INFERENCE_REFUSED')
 def test_malformed_metadata_retention(self):self.refusal(lambda q,e,p:p['files'].pop('imageData'),'COMPLETE_METADATA_EVIDENCE_REQUIRED')
 def test_missing_diagnostic_evidence(self):self.refusal(lambda q,e,p:q['evidenceBindings'].pop('diagnosticControlsSHA256'),'COMPLETE_NATIVE_EVIDENCE_BINDINGS_REQUIRED')
 def test_missing_native_evidence(self):self.refusal(lambda q,e,p:q['evidenceBindings'].pop('nativeObservationSHA256'),'COMPLETE_NATIVE_EVIDENCE_BINDINGS_REQUIRED')
 def test_qualification_claims_app_dumpability(self):self.refusal(lambda q,e,p:q['nativeObservation'].update(nonDumpabilityScope='ALL_APPLICATION_WRITERS'),'RAW_NATIVE_OBSERVATION_SCOPE_REQUIRED')
 def test_native_summary_contradicts_raw_observation(self):self.refusal(lambda q,e,p:q['nativeObservation'].update(privateFileExchangeResponseWritten=False),'RAW_NATIVE_OBSERVATION_SCOPE_REQUIRED')
 def test_missing_guard_execution_receipt(self):self.refusal(lambda q,e,p:q.pop('guardControlsSHA256'),'COMPLETE_GUARD_AND_OBSERVER_EVIDENCE_REQUIRED')
 def test_missing_observer_build_receipt(self):self.refusal(lambda q,e,p:q.pop('observerBuildSHA256'),'COMPLETE_GUARD_AND_OBSERVER_EVIDENCE_REQUIRED')
 def test_incomplete_child_drain(self):self.refusal(lambda q,e,p:q['nativeObservation']['childTermination'].update(closed=False),'COMPLETE_ORDERLY_PROBE_TERMINATION_REQUIRED')
 def test_forced_child_kill(self):self.refusal(lambda q,e,p:q['nativeObservation']['childTermination'].update(forcedKill=True),'COMPLETE_ORDERLY_PROBE_TERMINATION_REQUIRED')
 def test_unexpected_child_exit(self):self.refusal(lambda q,e,p:q['nativeObservation']['childTermination'].update(exitCode=7,signal=None),'COMPLETE_ORDERLY_PROBE_TERMINATION_REQUIRED')
 def test_unexpected_child_signal(self):self.refusal(lambda q,e,p:q['nativeObservation']['childTermination'].update(signal='SIGKILL'),'COMPLETE_ORDERLY_PROBE_TERMINATION_REQUIRED')
 def test_incomplete_stderr_drain(self):self.refusal(lambda q,e,p:q['nativeObservation']['childStderr'].update(streamComplete=False),'COMPLETE_SANITIZED_PROBE_DIAGNOSTICS_REQUIRED')
 def test_late_child_stderr(self):self.refusal(lambda q,e,p:q['nativeObservation']['childStderr'].update(bytes=1),'COMPLETE_SANITIZED_PROBE_DIAGNOSTICS_REQUIRED')
 def test_stderr_digest_disagreement(self):self.refusal(lambda q,e,p:q['nativeObservation']['childStderr'].update(sha256=H),'COMPLETE_SANITIZED_PROBE_DIAGNOSTICS_REQUIRED')
 def test_incomplete_first_error_controls(self):self.refusal(lambda q,e,p:q['diagnosticControls'].update(testsPassed=6),'SEVEN_FIRST_ERROR_CONTROLS_REQUIRED')
 def test_wrong_native_runtime(self):self.refusal(lambda q,e,p:q.update(hostNodeVersion='v20.0.0'),'COMPATIBLE_NATIVE_RUNTIME_REQUIRED')
 def test_wrong_dependency_package(self):self.refusal(lambda q,e,p:q.update(dependencyImages={}),'COMPATIBLE_NATIVE_RUNTIME_REQUIRED')
 def test_wrong_native_binary(self):self.refusal(lambda q,e,p:q['nativeObservation']['nativeAttestation'].update(nativeSha256=H),'PINNED_NATIVE_FILTER_ATTESTATION_REQUIRED')
 def test_wrong_backend_image(self):self.refusal(lambda q,e,p:q['containerObservation'].update(image='sha256:'+'b'*64),'QUALIFIED_CONTAINER_IDENTITY_REQUIRED')
 def test_unprotected_entrypoint(self):self.refusal(lambda q,e,p:q['nativeObservation']['protectedEntrypoints'][0].update(mode=0o666),'PROTECTED_APPLICATION_ENTRYPOINTS_REQUIRED')
 def test_wrong_entrypoint_source(self):self.refusal(lambda q,e,p:q['nativeObservation']['protectedEntrypoints'][0].update(sha256=H),'PROTECTED_APPLICATION_ENTRYPOINTS_REQUIRED')
 def test_missing_entrypoint(self):self.refusal(lambda q,e,p:q['nativeObservation']['protectedEntrypoints'].pop(),'COMPLETE_PROTECTED_ENTRYPOINTS_REQUIRED')
 def test_writer_wrong_uid(self):self.refusal(lambda q,e,p:q['nativeObservation']['writer'].update(uid=0),'UNPRIVILEGED_SEPARATE_WRITER_REQUIRED')
 def test_writer_wrong_gid(self):self.refusal(lambda q,e,p:q['nativeObservation']['writer'].update(gid=0),'UNPRIVILEGED_SEPARATE_WRITER_REQUIRED')
 def test_writer_privilege(self):self.refusal(lambda q,e,p:q['nativeObservation']['writer'].update(caps='0000000000000001'),'UNPRIVILEGED_SEPARATE_WRITER_REQUIRED')
 def test_root_supplementary_group(self):self.refusal(lambda q,e,p:q['nativeObservation']['writer'].update(groups=[0]),'WRITER_IDENTITY_CENSUS_REQUIRED')
 def test_wrong_supplementary_group(self):self.refusal(lambda q,e,p:q['nativeObservation']['writer'].update(groups=[1001]),'WRITER_IDENTITY_CENSUS_REQUIRED')
 def test_missing_no_new_privileges(self):self.refusal(lambda q,e,p:q['nativeObservation']['writer'].update(nnp='0'),'UNPRIVILEGED_SEPARATE_WRITER_REQUIRED')
 def test_wrong_operator_caps(self):self.refusal(lambda q,e,p:q['nativeObservation']['operator'].update(capEff='ffffffffffffffff'),'EXACT_OPERATOR_CAPABILITIES_REQUIRED')
 def test_missing_non_dumpability(self):self.refusal(lambda q,e,p:q['nativeObservation']['writer'].pop('dumpable'),'CURRENT_WRITER_NON_DUMPABILITY_REQUIRED')
 def test_dumpable_writer(self):self.refusal(lambda q,e,p:q['nativeObservation']['writer'].update(dumpable=1),'CURRENT_WRITER_NON_DUMPABILITY_REQUIRED')
 def test_constructor_only_non_dumpability_claim(self):self.refusal(lambda q,e,p:q['nativeObservation']['writer'].update(dumpabilityMethod='CONSTRUCTOR_INTENT'),'CURRENT_WRITER_NON_DUMPABILITY_REQUIRED')
 def test_substituted_observer_source(self):self.refusal(lambda q,e,p:q['nativeObservation']['observer'].update(sourceSHA256=H),'PROTECTED_DUMPABILITY_OBSERVER_REQUIRED')
 def test_writable_observer(self):self.refusal(lambda q,e,p:q['nativeObservation']['observer'].update(mode=0o666),'PROTECTED_DUMPABILITY_OBSERVER_REQUIRED')
 def test_missing_namespace_isolation(self):self.refusal(lambda q,e,p:(q['nativeObservation']['namespaceIds'].update(pid=p['actualEnvironment']['hostNamespaces']['pid']),q['nativeObservation']['writerNs'].update(pid=p['actualEnvironment']['hostNamespaces']['pid']),q['nativeObservation']['writer']['namespaceIds'].update(pid=p['actualEnvironment']['hostNamespaces']['pid'])),'HOST_NAMESPACE_ISOLATION_REQUIRED')
 def test_writer_wrong_namespace(self):self.refusal(lambda q,e,p:q['nativeObservation']['writerNs'].update(net='net:[999]'),'COMPLETE_NAMESPACE_OBSERVATIONS_REQUIRED')
 def test_missing_thread_filter(self):self.refusal(lambda q,e,p:q['nativeObservation']['threadObservations'][0].update(seccomp=0),'ALL_WRITER_THREAD_FILTERS_REQUIRED')
 def test_duplicate_thread_census(self):
  def mutate(q,e,p):q['nativeObservation']['threadObservations']*=2;q['nativeObservation']['threadCount']=2
  self.refusal(mutate,'ALL_WRITER_THREAD_FILTERS_REQUIRED')
 def test_private_read_allowed(self):self.refusal(lambda q,e,p:q['nativeObservation']['writer'].update(privateDenied=False),'ACTUAL_WRITER_PERMISSION_DENIALS_REQUIRED')
 def test_private_write_allowed(self):self.refusal(lambda q,e,p:q['nativeObservation']['writer'].update(privateWriteDenied=False),'ACTUAL_WRITER_PERMISSION_DENIALS_REQUIRED')
 def test_writer_spawn_allowed(self):self.refusal(lambda q,e,p:q['nativeObservation']['writer'].update(spawnDenied=False),'ACTUAL_WRITER_PERMISSION_DENIALS_REQUIRED')
 def test_writer_entrypoint_write_allowed(self):self.refusal(lambda q,e,p:q['nativeObservation']['protectedEntrypoints'][0].update(writerWriteDenied=False),'PROTECTED_APPLICATION_ENTRYPOINTS_REQUIRED')
 def test_privileged_container(self):self.refusal(lambda q,e,p:q['containerObservation'].update(privileged=True),'QUALIFIED_CONTAINER_IDENTITY_REQUIRED')
 def test_host_pid_container(self):self.refusal(lambda q,e,p:q['containerObservation'].update(pidMode='host'),'ISOLATED_CONTAINER_NAMESPACES_REQUIRED')
 def test_network_egress(self):self.refusal(lambda q,e,p:q['containerObservation'].update(networkMode='bridge'),'QUALIFIED_CONTAINER_BOUNDARIES_REQUIRED')
 def test_published_port(self):self.refusal(lambda q,e,p:q['containerObservation'].update(publishedPorts={'80/tcp':[]}), 'QUALIFIED_CONTAINER_BOUNDARIES_REQUIRED')
 def test_provider_credential(self):self.refusal(lambda q,e,p:q['containerObservation'].update(providerCredentialsExcluded=False),'QUALIFIED_CONTAINER_BOUNDARIES_REQUIRED')
 def test_production_mount(self):self.refusal(lambda q,e,p:q['containerObservation']['mounts'].append({'source':'/prod','destination':'/prod'}),'NO_EXTRA_OR_PRODUCTION_MOUNTS_REQUIRED')
 def test_substituted_private_path(self):self.refusal(lambda q,e,p:q['containerObservation']['mounts'][1].update(source='/wrong'),'PRIVATE_READONLY_MOUNT_BOUNDARIES_REQUIRED')
 def test_readwrite_runtime_mount(self):self.refusal(lambda q,e,p:q['containerObservation']['mounts'][0].update(rw=True),'PRIVATE_READONLY_MOUNT_BOUNDARIES_REQUIRED')
 def test_metadata_only_status_rejected(self):self.refusal(lambda q,e,p:q.update(status='PASS_CURRENT_RUNTIME_METADATA_AGREEMENT_ONLY'),'ACTUAL_NATIVE_QUALIFICATION_REQUIRED')
 def test_mock_scope_cannot_claim_runner(self):self.refusal(lambda q,e,p:q.update(executionMode='local-fixture'),'QUALIFICATION_SCOPE_REQUIRED')
 def test_preexisting_app_started(self):self.refusal(lambda q,e,p:q.update(applicationStarted=True),'QUALIFICATION_SCOPE_REQUIRED')
 def test_empty_ack_refused(self):
  q,e,p=fixture()
  with self.assertRaisesRegex(g.Refusal,'EXTERNAL_REVIEW_PASS_REQUIRED'):g.verify_ack({}, {'executor':e},'packages-and-executor',{},200)
 def test_changed_docker_daemon(self):
  with mock.patch.object(g.subprocess,'run',return_value=mock.Mock(returncode=0,stdout=b'changed\n',stderr=b'')):
   with self.assertRaisesRegex(g.Refusal,'CURRENT_DOCKER_DAEMON_CHANGED'):g.validate_current_docker_daemon({'dockerSocketPath':'/run/docker.sock','dockerEngineId':'original'})
 def test_current_kernel_changed(self):
  q,e,p=fixture()
  with mock.patch.object(g.pathlib.Path,'read_text',return_value='different-boot'):
   with self.assertRaisesRegex(g.Refusal,'CURRENT_EXECUTOR_KERNEL_CHANGED'):g.validate_current_executor_continuity(p,e)
 def test_consumed_v70_approval_refused(self):
  with self.assertRaisesRegex(g.Refusal,'CURRENT_OWNER_AUTHORITY_REQUIRED'):g.validate_authority({'ownerDirective':'EMPIREAI_V70_A5_EXECUTION_APPROVAL'})
 def test_candidate_unapproved_plan_refused(self):
  a={'ownerDirective':g.OWNER_DIRECTIVE,'work8CeilingUSD':100,'existingAdditionalA5USD':10,'priorOverallHoldsUSD':16.68,'priorA5HoldsUSD':6.73,'availableBeforeReservationUSD':3.27,'ownerDecisionRecorded':False}
  with self.assertRaisesRegex(g.Refusal,'SEPARATE_EXPLICIT_OWNER_DECISION_REQUIRED'):g.validate_authority(a)

if __name__=='__main__':unittest.main(verbosity=2)

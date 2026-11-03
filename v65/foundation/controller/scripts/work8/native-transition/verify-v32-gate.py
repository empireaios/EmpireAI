#!/usr/bin/env python3
"""Fail-closed review and authority gate; this script never starts application work."""
import hashlib, json, os, pathlib, re, subprocess, sys, time, urllib.request
from source_identity import file_sha256,verify_bound_file

STAGES = {
 'preflight': {'branch':'work8/v32-20261101-native-brain-preflight','workflow':'.github/workflows/work8-v32-native-brain-preflight-20261101.yml','minutes':10,'seconds':540,'reserve':60,'artifactMaxBytes':128*1024**2,'status':'PASS_INDEPENDENT_SOURCE_AND_LOCAL_LIVE_BRAIN_PREFLIGHT'},
 'full': {'branch':'work8/v32-20261101-native-brain','workflow':'.github/workflows/work8-v32-native-brain-20261101.yml','minutes':30,'seconds':1650,'reserve':120,'artifactMaxBytes':1920*1024**2,'status':'PASS_INDEPENDENT_SOURCE_AND_HOSTED_LIVE_BRAIN_PREFLIGHT'},
}
REPOSITORY='empireaios/EmpireAI'
PARENT='cb17ff0063a58e7b80d9e2221dab29ae41660264'
PINS_SHA='1511f21cb02fe26e2b7a6322dc3f0a90ab8d56ff4de5e9d04aebe945e07b52c7'
PRIVATE_FILES={
 'scripts/work8/native-transition/private_contract.py':'dbe1ab78fdd4702e04ccc06658ecebfca5caff6f53a39e5a406a0eb878d21eae',
 'scripts/work8/native-transition/private-handoff.mjs':'7f45fb8350647a49063d70c6249e69e44e920b557884940c89aef7bb8f722aff',
}
REQUIRED_LIVE_CHECKS=[
 'initializedSameCachedBrain','actualWriterIdentity','originalDelayedPersistence',
 'guardedCriticalPersistenceAwaited','preSaveLiveAndPersistedLogicalEquality',
 'canonicalMutationRejected','missingExportRejected','truncatedExportRejected',
 'corruptExportRejected','failureFenceReleased','applicationAdmissionReleased',
 'noAuthorityExpansion','noAbsentStoreInitialization','nativeProcessDrain',
 'operatorOwnedMountedEntrypoint','originalProtectedPathPredicatePassed',
 'entrypointBytesMatched','unprivilegedEntrypointWriteRefused','unprivilegedEntrypointReplaceRefused','childDiagnosticPathProven',
]

def digest(path): return file_sha256(path)
def sha(value): return isinstance(value,str) and re.fullmatch('[a-f0-9]{64}',value) is not None
def commit(value): return isinstance(value,str) and re.fullmatch('[a-f0-9]{40}',value) is not None
def api(relative,token):
 assert relative.startswith('/repos/'+REPOSITORY+'/actions/')
 request=urllib.request.Request('https://api.github.com'+relative,headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'})
 with urllib.request.urlopen(request,timeout=30) as response:
  data=response.read(1048577);assert len(data)<=1048576,'HOSTED_METADATA_BOUND'
  return json.loads(data)

def verify_hosted_preflight(script,gate):
 receipt_file=script/'v32-hosted-preflight-acceptance.json'
 receipt=json.loads(receipt_file.read_text())
 assert receipt['status']=='PASS_INDEPENDENT_ACTUAL_LIVE_BRAIN_PREFLIGHT' and receipt['approved'] is True
 assert receipt['reviewer']=='independent_v31' and receipt['actualHostedExecution'] is True
 assert receipt['stage']=='preflight' and receipt['method']=='METHOD_B_GUARDED_CRITICAL_PERSISTENCE'
 assert receipt['wholeRowsAccepted']==[] and receipt['businessTransitionExecuted'] is False
 assert receipt['applicationBuilds']==0 and receipt['candidateReuploads']==0
 assert receipt['node']=='22.23.2' and receipt['writerUid']==65534 and receipt['writerGid']==65534
 assert receipt['writerCapEff']=='0000000000000000' and receipt['writerNoNewPrivileges'] is True
 assert all(receipt['checks'].get(key) is True for key in REQUIRED_LIVE_CHECKS),'ACTUAL_LIVE_BOUNDARY_INCOMPLETE'
 assert receipt['instrumentation']==gate['instrumentation'],'EXAMINATION_INSTRUMENTATION_DIFFERS_FROM_PREFLIGHT'
 assert sha(receipt['preflightSourceGateSha256']) and sha(receipt['evidenceArchiveSha256'])
 assert commit(receipt['controllerCommit']) and commit(receipt['controllerTree'])
 assert isinstance(receipt['runId'],int) and receipt['runId']>0 and isinstance(receipt['artifactId'],int) and receipt['artifactId']>0
 assert isinstance(receipt['artifactBytes'],int) and 0<receipt['artifactBytes']<=STAGES['preflight']['artifactMaxBytes']
 assert gate['hostedPreflightAcceptanceSha256']==digest(receipt_file),'HOSTED_ACCEPTANCE_RECEIPT_CHANGED'
 token=os.environ.pop('GH_PREFLIGHT_READ_TOKEN')
 run=api('/repos/'+REPOSITORY+'/actions/runs/'+str(receipt['runId']),token)
 artifact=api('/repos/'+REPOSITORY+'/actions/artifacts/'+str(receipt['artifactId']),token)
 del token
 assert run['id']==receipt['runId'] and run['head_sha']==receipt['controllerCommit']
 assert run['head_branch']==STAGES['preflight']['branch'] and run['event']=='create'
 assert run['status']=='completed' and run['conclusion']=='success' and run['run_attempt']==1 and run['run_number']==1
 assert artifact['id']==receipt['artifactId'] and artifact['expired'] is False
 assert artifact['size_in_bytes']==receipt['artifactBytes'] and artifact['digest']=='sha256:'+receipt['evidenceArchiveSha256']
 assert artifact['workflow_run']['id']==receipt['runId'] and artifact['workflow_run']['head_sha']==receipt['controllerCommit']
 return {'status':receipt['status'],'reviewer':receipt['reviewer'],'receiptSha256':digest(receipt_file),'runId':receipt['runId'],'controllerCommit':receipt['controllerCommit'],'controllerTree':receipt['controllerTree'],'artifactId':receipt['artifactId'],'artifactBytes':receipt['artifactBytes'],'evidenceArchiveSha256':receipt['evidenceArchiveSha256'],'providerMetadataVerified':True,'checks':receipt['checks']}

def verify_evidence_contract(controller,script,gate,entries):
 # Preserve accepted unchanged controls. Current authority/diagnostic changes
 # require only their targeted executable proof and an exact independent review.
 prior_test_file=script/'v31-upload-contract-selftest.json'
 module_file=script/'v32-reused-module-preflight.json'
 review_file=script/'v32-independent-local-preflight-review.json'
 assert digest(prior_test_file)=='13ddd6b4e66579e4913388f6fcb3b831610e940bf4a98ed764e90a1b6467432f','ACCEPTED_UPLOAD_RECEIPT_CHANGED'
 assert digest(module_file)=='4fc9081deb52cc8df4ab4f85b3d17ab93b2a60ae3e43aa48c6b4a0ba26ba6f7d','ACCEPTED_MODULE_RECEIPT_CHANGED'
 assert gate['independentLocalReviewSha256']==digest(review_file),'LOCAL_REVIEW_RECEIPT_CHANGED'
 prior=json.loads(prior_test_file.read_text());module=json.loads(module_file.read_text());review=json.loads(review_file.read_text())
 assert prior['status']=='PASS_ACTUAL_SCAN_AND_CANONICAL_UPLOAD_GATES' and prior['allPassed'] is True and prior['passed']==29
 assert module['status']=='PASS_ACTUAL_SQLJS_MODULE_LIFECYCLE' and module['node']=='v22.23.2'
 assert module['source']=='94aa919c7c39c4c9bf2c14b636232da028dba72d' and module['exactHostedWriterIdentityProven'] is True
 assert module['identities']['uid']==65534 and module['identities']['gid']==65534 and module['identities']['capEff']=='0000000000000000'
 assert len(module['checks'])==10 and all(check['status']=='PASS' for check in module['checks'])
 prior_bindings={bound['path']:bound['sha256'] for bound in prior['sourceBindings']}
 for name in ['candidate_packages.py','upload-preflight.py','upload-contract-selftest.py']:
  path='scripts/work8/native-transition/'+name
  assert digest(controller/path)==prior_bindings[path],'ACCEPTED_UPLOAD_IMPLEMENTATION_CHANGED'
 wrapper=script/'retained-upload-preflight.py';wrapper_text=wrapper.read_text()
 assert wrapper_text.count("budget['reservationId']=='work8-v32-native-brain-20261101'")==1,'V32_UPLOAD_AUTHORITY_REFERENCE_REQUIRED'
 normalized=wrapper_text.replace("budget['reservationId']=='work8-v32-native-brain-20261101'","budget['reservationId']=='work8-v31-native-brain-20261101'")
 assert hashlib.sha256(normalized.encode()).hexdigest()==prior_bindings['scripts/work8/native-transition/retained-upload-preflight.py'],'UPLOAD_SCANNER_ALGORITHM_CHANGED'
 assert review['status']=='PASS_INDEPENDENT_V32_NATIVE_ENTRYPOINT_OVERLAY_AND_DIAGNOSTICS'
 assert review['reviewer']=='independent_v31' and review['approved'] is True
 assert review['priorUploadReceiptSha256']==digest(prior_test_file) and review['priorModuleReceiptSha256']==digest(module_file)
 assert review['localProofScope']=='ORIGINAL_FUNCTION_RETAINED_NODE_ONLY' and review['hostedMountedContractRequiredBeforeApplicationStart'] is True
 required=['originalProtectedPathExportExecuted','operatorOwnedReadOnlyOverlayContract','childCausalDiagnosticCaptured','changedDiagnosticUploadPathPassed','securityPolicyUnchanged','prior29And10ReusedWithinScope']
 assert all(review['checks'].get(key) is True for key in required),'V32_TARGETED_BOUNDARY_REVIEW_INCOMPLETE'
 assert review['sourceBindings'] and review['targetedReceiptBindings'],'MISSING_REVIEWED_SOURCE_OR_TARGETED_RECEIPT_BINDINGS'
 for bound in review['sourceBindings']+review['targetedReceiptBindings']:
  path=bound['path'];assert path in entries and sha(bound['sha256'])
  assert entries[path]['sha256']==bound['sha256'] and digest(controller/path)==bound['sha256'],'REVIEWED_BOUNDARY_CHANGED'
 assert gate['targetedReceiptBindings']==review['targetedReceiptBindings'],'TARGETED_RECEIPT_SELECTION_CHANGED'
 for bound in review['targetedReceiptBindings']:
  receipt=json.loads((controller/bound['path']).read_text())
  assert isinstance(receipt['status'],str) and receipt['status'].startswith('PASS') and receipt.get('allPassed') is True,'TARGETED_EXECUTABLE_BOUNDARY_NOT_PASSED'
 for name in ['v31-upload-contract-selftest.json','v32-reused-module-preflight.json','v32-independent-local-preflight-review.json']:
  assert 'scripts/work8/native-transition/'+name in entries,'EVIDENCE_RECEIPT_NOT_SOURCE_GATED'
 return {'status':'PASS_REUSED_ACCEPTED_CONTROLS_AND_TARGETED_CHANGED_BOUNDARY','priorUploadReceiptSha256':digest(prior_test_file),'priorModuleReceiptSha256':digest(module_file),'independentReviewSha256':digest(review_file),'acceptedUploadControlsReused':29,'acceptedRestrictedModuleControlsReused':10,'targetedReceiptBindings':review['targetedReceiptBindings'],'unrelatedAcceptedTestsRepeated':False}

def verify_narrow_authority(controller,script,gate,entries):
 path=script/'v32-authority.json'
 assert gate['authorityManifestSha256']==digest(path),'V32_AUTHORITY_MANIFEST_CHANGED'
 authority=json.loads(path.read_text())
 assert authority['schema']=='work8-v32-narrow-owner-authority-v1' and authority['parentCommit']==PARENT
 assert authority['parentTree']=='2e8c0e35cec9371a3ac2cdbb2d4eec626b449d6c'
 assert authority['reservationId']=='work8-v32-native-brain-20261101'
 assert authority['priorReservedUSD']==5.35 and authority['additionalSharedReservedUSD']==0.5 and authority['maximumAggregateReservedUSD']==5.85
 assert authority['unreservedUSD']==4.15 and authority['aggregateAllowanceUSD']==10
 assert authority['stageAMaxMinutes']==10 and authority['stageBMaxMinutes']==30 and authority['retentionDays']==7
 assert authority['stageAArtifactAllocationBytes']==128*1024**2 and authority['stageBArtifactAllocationBytes']==1920*1024**2
 assert authority['combinedArtifactLimitBytes']==2*1024**3 and authority['automaticRetry'] is False
 assert authority['applicationSourceChanges'] is False and authority['applicationImageBuilds']==0 and authority['candidateReuploads']==0
 assert authority['acceptedUploadControlsReused']==29 and authority['acceptedRestrictedModuleControlsReused']==10
 assert authority['fullRequiresIndependentNativePreflightArtifact'] is True
 assert authority['productionData'] is False and authority['providerCredentialsInApplication'] is False and authority['externalMessages'] is False and authority['commerceActivation'] is False
 assert authority['locks']=={'PR113':'DRAFT_UNMERGED','Pillow':'NOT_BORN','Commerce':'LOCKED','Work9':'INACTIVE'}
 assert gate['changedPaths'] and len(gate['changedPaths'])==len(set(gate['changedPaths']))
 assert set(gate['changedPaths']).issubset(set(authority['allowedChangedPaths'])|set(authority['allowedDeletedPaths'])),'V32_CHANGE_OUTSIDE_AUTHORISED_BOUNDARY'
 assert 'scripts/work8/native-transition/v32-authority.json' in entries
 return {'status':'PASS_EXACT_NARROW_V32_AUTHORITY','manifestSha256':digest(path),'changedPaths':gate['changedPaths'],'sharedAdditionalReservationUSD':0.5,'aggregateReservedUSD':5.85}

def main():
 assert len(sys.argv)==2 and sys.argv[1] in {'--preflight','--full'},'EXPLICIT_REVIEWED_STAGE_REQUIRED'
 stage=sys.argv[1][2:];limits=STAGES[stage]
 root=pathlib.Path(os.environ['GITHUB_WORKSPACE']).resolve();controller=root/'controller';script=controller/'scripts/work8/native-transition'
 out=root/'native-transition-output';out.mkdir(exist_ok=True)
 # One shared reservation for the two-stage directive. Running the full stage
 # does not create a second allowance or another $0.50 reservation.
 budget={'schema':'work8-v32-shared-authorised-exposure-v1','reservationId':'work8-v32-native-brain-20261101','reservationScope':'ONE_BOUNDED_PREFLIGHT_AND_ONE_CONDITIONAL_FULL_EXAMINATION','stage':stage,'startedAtEpoch':time.time(),'maximumSeconds':limits['seconds'],'cleanupAndUploadReserveSeconds':limits['reserve'],'jobTimeoutMinutes':limits['minutes'],'aggregateAllowanceUSD':10,'priorReservedUSD':5.35,'additionalReservedUSD':0.50,'aggregateReservedUSD':5.85,'unreservedUSD':4.15,'reservationIsConfirmedSpending':False,'actualChargesUSD':None,'reservationReusedAcrossStages':True,'maximumAdditionalArtifactBytes':2*1024**3,'stageMaximumArtifactBytes':limits['artifactMaxBytes'],'priorStageRetainedArtifactBytes':0 if stage=='preflight' else None,'retentionDays':7,'attempts':1,'automaticRetry':False,'applicationBuilds':0,'candidateReuploads':0}
 (out/'workflow-budget.json').write_text(json.dumps(budget,indent=2)+'\n')
 result={'status':'FAIL','stage':stage,'applicationBuilds':0,'newCandidateUploads':0,'wholeRowsAccepted':[]}
 try:
  assert os.environ['GITHUB_EVENT_NAME']=='create' and os.environ['GITHUB_REF']=='refs/heads/'+limits['branch']
  event=json.load(open(os.environ['GITHUB_EVENT_PATH']));assert event['ref_type']=='branch' and event['ref']==limits['branch']
  assert os.environ['GITHUB_RUN_ATTEMPT']=='1' and os.environ['GITHUB_RUN_NUMBER']=='1'
  gate_file=script/('v32-'+stage+'-source-gate.json');gate=json.loads(gate_file.read_text())
  # Keep the cumulative retention bound usable for a later failed gate too.
  # This records the pinned review receipt's byte allocation; it is
  # not permission to start work, which still requires all checks below.
  if stage=='full':
   prior_file=script/'v32-hosted-preflight-acceptance.json'
   assert gate['hostedPreflightAcceptanceSha256']==digest(prior_file),'HOSTED_ACCEPTANCE_RECEIPT_CHANGED'
   prior_receipt=json.loads(prior_file.read_text());prior_bytes=prior_receipt['artifactBytes']
   assert isinstance(prior_bytes,int) and 0<prior_bytes<=STAGES['preflight']['artifactMaxBytes']
   budget['priorStageRetainedArtifactBytes']=prior_bytes
  assert gate['schema']=='work8-v32-independent-source-gate-v1' and gate['stage']==stage and gate['branch']==limits['branch']
  assert gate['approved'] is True and gate['status']==limits['status'] and gate['reviewer']=='independent_v31'
  assert gate['parentCommit']==PARENT and gate['applicationBuilds']==0 and gate['candidateReuploads']==0
  assert gate['localPreflight']['status']=='PASS' and sha(gate['localPreflight']['receiptSha256'])
  assert gate['contract']['status']=='PASS' and gate['contract']['method']=='METHOD_B_GUARDED_CRITICAL_PERSISTENCE'
  assert gate['contract']['sameInitializedCachedBrain'] is True and gate['contract']['securityPolicyUnchanged'] is True
  assert gate['contract']['absentStoresInitialized'] is False and gate['contract']['originalDeclaredStores']==13
  assert gate['acceptedPrivateHandoff']['runId']==41256737269 and gate['acceptedPrivateHandoff']['checksPassed']==25
  assert gate['acceptedPrivateHandoff']['receiptSha256']=='1ea6434ced3b1977ef01e2a210e2e7eff473776499c2ffcf0794cb70ff6c1fe5'
  assert gate['acceptedPrivateHandoff']['independentReviewSha256']=='c46d645a3dcec606946ce5a478d16207bda9dc3ad2a8c471dd1c189700db32e9'
  assert gate['instrumentation']['readOnlyEntryOverlay'] is True and sha(gate['instrumentation']['originalEntrySha256']) and sha(gate['instrumentation']['overlayEntrySha256'])
  assert gate['instrumentation']['originalEntrySha256']!=gate['instrumentation']['overlayEntrySha256']
  assert gate['instrumentation']['files'] and all(sha(e['sha256']) and isinstance(e['bytes'],int) and e['bytes']>0 for e in gate['instrumentation']['files'])
  entries={}
  for entry in gate['files']:
   p=verify_bound_file(controller,entry)
   assert entry['path'] not in entries and p!=gate_file,'DUPLICATE_OR_SELF_HASH_REFUSED'
   entries[entry['path']]=entry
  for entry in gate['instrumentation']['files']:
   assert entries.get(entry['path'])==entry,'INSTRUMENTATION_NOT_SOURCE_GATED'
  evidence_contract=verify_evidence_contract(controller,script,gate,entries)
  authority=verify_narrow_authority(controller,script,gate,entries)
  for deleted in gate['requiredDeletions']:assert not (controller/deleted).exists(),'PRIOR_WORKFLOW_RETAINED'
  assert '.github/workflows/work8-v31-native-brain-preflight-20261101.yml' in gate['requiredDeletions']
  opposite=STAGES['full' if stage=='preflight' else 'preflight']['workflow']
  for absent in gate['requiredAbsentPaths']:assert not (controller/absent).exists(),'UNAUTHORISED_STAGE_WORKFLOW_PRESENT'
  assert opposite in gate['requiredAbsentPaths'] and not (controller/opposite).exists(),'OTHER_STAGE_WORKFLOW_MUST_NOT_REGISTER_A_CREATE_RUN'
  assert limits['workflow'] in entries,'CURRENT_STAGE_WORKFLOW_NOT_SOURCE_GATED'
  for name in ['vercel.json','empireai-web/vercel.json']:
   deployment=json.loads((controller/name).read_text())['git']['deploymentEnabled']
   assert all(deployment[s['branch']] is False for s in STAGES.values())
  assert digest(script/'components.json')==PINS_SHA,'APPLICATION_PINS_CHANGED'
  for path,expected in PRIVATE_FILES.items():assert digest(controller/path)==expected,'ACCEPTED_PRIVATE_HANDOFF_SOURCE_CHANGED'
  assert 'scripts/work8/native-transition/private-exchanges.mjs' in entries,'NEW_CAPTURE_EXCHANGES_NOT_INDEPENDENTLY_SOURCE_GATED'
  source=subprocess.check_output(['git','rev-parse','HEAD'],cwd=controller,text=True).strip();tree=subprocess.check_output(['git','rev-parse','HEAD^{tree}'],cwd=controller,text=True).strip()
  assert source==os.environ['GITHUB_SHA'] and commit(tree)
  hosted=None
  if stage=='full':
   hosted=verify_hosted_preflight(script,gate)
   budget['priorStageRetainedArtifactBytes']=hosted['artifactBytes']
   assert budget['priorStageRetainedArtifactBytes']<budget['maximumAdditionalArtifactBytes']-2*1024**2,'NO_RETAINED_ARTIFACT_CAPACITY_FOR_FULL_EXAMINATION'
  result.update(status=gate['status'],reviewer=gate['reviewer'],source=source,tree=tree,gateSha256=digest(gate_file),reviewedFiles=gate['files'],instrumentation=gate['instrumentation'],localPreflight=gate['localPreflight'],contract=gate['contract'],acceptedPrivateHandoff=gate['acceptedPrivateHandoff'],evidenceContract=evidence_contract,authority=authority,hostedPreflight=hosted)
 except Exception:
  result['firstFailure']='V32_SOURCE_OR_LIVE_PREFLIGHT_AUTHORITY_GATE_REFUSED'
 finally:
  os.environ.pop('GH_PREFLIGHT_READ_TOKEN',None)
  (out/'workflow-budget.json').write_text(json.dumps(budget,indent=2)+'\n')
  (out/'v32-source-gate.json').write_text(json.dumps(result,indent=2)+'\n')
  import candidate_packages
  candidate_packages.write_index(out,'work8-bounded-upload-v1',exactGeneratedSecretCheck=True)
 if result['status']=='FAIL':raise SystemExit(1)

if __name__=='__main__':main()

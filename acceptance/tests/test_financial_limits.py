"""Changed financial/admission controls only; no hosted or application claims."""
import copy,json,pathlib,sys,unittest
V65=pathlib.Path(__file__).resolve().parents[2]/'v65'
sys.path.insert(0,str(V65/'adapter'))
sys.path.insert(0,str(V65/'tests'))
import github_contract as g
from test_executor_guard import authority_fixture,fixture

H='a'*64
E={'runId':'123','workflowCommit':'b'*40}
def row(ident=1,size=1):
 return {'id':ident,'size_in_bytes':size,'digest':'sha256:'+H,'expired':False,'created_at':'2026-11-08T12:00:00Z','expires_at':'2026-11-09T12:00:00Z','workflow_run':{'id':123,'head_sha':E['workflowCommit']}}
def listing(*rows):return {'total_count':len(rows),'artifacts':list(rows)}

class NativeAuthorityControls(unittest.TestCase):
 def test_proposed_plan_is_not_authority(self):
  a=json.loads((V65/'launch-plan.json').read_text())['authority']
  with self.assertRaisesRegex(g.Refusal,'SEPARATE_EXPLICIT_OWNER_DECISION_REQUIRED'):g.validate_authority(a)
 def test_exact_future_decision_fixture_is_not_execution(self):
  self.assertEqual(g.validate_authority(authority_fixture())['reservationUSD'],2.11)
 def test_consumed_qualification_reservation_refused(self):
  a=authority_fixture();a['reservationId']='V92-A5-QUALIFICATION-ONCE-20261108'
  with self.assertRaisesRegex(g.Refusal,'DISTINCT_FULL_NATIVE_RESERVATION_REQUIRED'):g.validate_authority(a)
 def test_consumed_v95_and_v98_reservations_refused(self):
  for reservation in ('V95-A5-NATIVE-ONCE-20261108','V97-FRONTEND-STARTUP-ONCE-20261109'):
   with self.subTest(reservation=reservation):
    a=authority_fixture();a['reservationId']=reservation
    with self.assertRaisesRegex(g.Refusal,'DISTINCT_FULL_NATIVE_RESERVATION_REQUIRED'):g.validate_authority(a)
 def test_missing_reservation_receipt_refused(self):
  a=authority_fixture();a['reservationReceiptSHA256']=None
  with self.assertRaisesRegex(g.Refusal,'DISTINCT_FULL_NATIVE_RESERVATION_REQUIRED'):g.validate_authority(a)
 def test_stale_ledger_refused(self):
  a=authority_fixture();a['availableBeforeReservationUSD']=7.86
  with self.assertRaisesRegex(g.Refusal,'CURRENT_FINANCIAL_AUTHORITY_REQUIRED'):g.validate_authority(a)
 def test_wrong_final_ledger_refused(self):
  a=authority_fixture();a['remainingUnreservedUSD']=7.80
  with self.assertRaisesRegex(g.Refusal,'CURRENT_COMMITTED_RESERVATION_REQUIRED'):g.validate_authority(a)
 def test_qualification_scope_refused(self):
  a=authority_fixture();a['approvalScope']='one-qualified-a5-attempt'
  with self.assertRaisesRegex(g.Refusal,'SEPARATE_EXPLICIT_OWNER_DECISION_REQUIRED'):g.validate_authority(a)
 def test_boolean_attempt_refused(self):
  a=authority_fixture();a['maximumAttempts']=True
  with self.assertRaisesRegex(g.Refusal,'SEPARATE_EXPLICIT_OWNER_DECISION_REQUIRED'):g.validate_authority(a)
 def test_nan_exposure_refused(self):
  a=authority_fixture();a['maximumProspectiveUSD']=float('nan')
  with self.assertRaisesRegex(g.Refusal,'FINITE_CURRENT_EXPOSURE_REQUIRED'):g.validate_authority(a)
 def test_above_reviewed_ceiling_refused(self):
  a=authority_fixture();a['maximumProspectiveUSD']=2.110001
  with self.assertRaisesRegex(g.Refusal,'REVIEWED_SINGLE_ATTEMPT_FINANCIAL_CAP_REQUIRED'):g.validate_authority(a)
 def test_insufficient_approved_exposure_refused(self):
  a=authority_fixture();a['maximumProspectiveUSD']=0.000001
  with self.assertRaisesRegex(g.Refusal,'REVIEWED_SINGLE_ATTEMPT_FINANCIAL_CAP_REQUIRED'):g.validate_authority(a)

class ArtifactBudgetControls(unittest.TestCase):
 def test_small_three_stage_plan_fits(self):
  self.assertLessEqual(g.validate_preupload_size(64*1024**2,listing(),E)['maximumProspectiveServiceZipBytes'],128*1024**2)
  self.assertEqual(g.validate_preupload_size(64*1024**2,listing(),E)['retentionDays'],7)
  self.assertEqual(g.validate_current_artifact_listing(listing(row(1),row(2),row(3)),E)['cumulativeObjects'],3)
 def test_truncated_listing_refused(self):
  value=listing(row());value['total_count']=2
  with self.assertRaisesRegex(g.Refusal,'CUMULATIVE_ARTIFACT_OBJECT_BOUND'):g.validate_current_artifact_listing(value,E)
 def test_fourth_object_refused_before_upload(self):
  with self.assertRaisesRegex(g.Refusal,'CUMULATIVE_ARTIFACT_OBJECT_BOUND'):g.validate_preupload_size(1,listing(row(1),row(2),row(3)),E)
 def test_duplicate_id_refused(self):
  with self.assertRaisesRegex(g.Refusal,'CURRENT_ARTIFACT_ID_REQUIRED'):g.validate_current_artifact_listing(listing(row(),row()),E)
 def test_historical_input_cannot_count_as_current_artifact(self):
  value=row();value['workflow_run']['id']=41860150363
  with self.assertRaisesRegex(g.Refusal,'CURRENT_ARTIFACT_BINDING'):g.validate_current_artifact_listing(listing(value),E)
 def test_wrong_commit_refused(self):
  value=row();value['workflow_run']['head_sha']='c'*40
  with self.assertRaisesRegex(g.Refusal,'CURRENT_ARTIFACT_BINDING'):g.validate_current_artifact_listing(listing(value),E)
 def test_expired_artifact_refused(self):
  value=row();value['expired']=True
  with self.assertRaisesRegex(g.Refusal,'CURRENT_ARTIFACT_BINDING'):g.validate_current_artifact_listing(listing(value),E)
 def test_long_retention_refused(self):
  value=row();value['expires_at']='2026-11-15T13:00:01Z'
  with self.assertRaisesRegex(g.Refusal,'ARTIFACT_RETENTION_BOUND'):g.validate_current_artifact_listing(listing(value),E)
 def test_exact_seven_day_service_tolerance_admitted(self):
  value=row();value['expires_at']='2026-11-15T13:00:00Z'
  self.assertEqual(g.validate_current_artifact_listing(listing(value),E)['cumulativeObjects'],1)
 def test_timezone_free_retention_refused(self):
  value=row();value['created_at']='2026-11-08T12:00:00';value['expires_at']='2026-11-09T12:00:00'
  with self.assertRaisesRegex(g.Refusal,'ARTIFACT_RETENTION_BOUND'):g.validate_current_artifact_listing(listing(value),E)
 def test_service_byte_cap_refused(self):
  with self.assertRaisesRegex(g.Refusal,'CUMULATIVE_ARTIFACT_EXPOSURE_BOUND'):g.validate_current_artifact_listing(listing(row(size=128*1024**2+1)),E)
 def test_payload_cap_refused(self):
  with self.assertRaisesRegex(g.Refusal,'ARTIFACT_UPLOAD_PAYLOAD_BOUND'):g.validate_preupload_size(64*1024**2+1,listing(),E)
 def test_envelope_space_reserved_before_upload(self):
  with self.assertRaisesRegex(g.Refusal,'PREUPLOAD_ARTIFACT_EXPOSURE_BOUND'):g.validate_preupload_size(1,listing(row(size=112*1024**2)),E)
 def test_boolean_size_refused(self):
  with self.assertRaisesRegex(g.Refusal,'ARTIFACT_UPLOAD_PAYLOAD_BOUND'):g.validate_preupload_size(True,listing(),E)

class HistoricalDiagnosticScopeControls(unittest.TestCase):
 def values(self):
  q,e,p=fixture();q['evidenceMode']=g.FRESH_ADMISSION_MODE;q['historicalDiagnosticEvidence']=copy.deepcopy(g.V94_DIAGNOSTIC_EVIDENCE)
  digest=g.V94_DIAGNOSTIC_EVIDENCE['diagnosticControlsSHA256'];q['diagnosticControlsSHA256']=digest;q['evidenceBindings']['diagnosticControlsSHA256']=digest
  return q,e,p
 def test_exact_historical_controls_do_not_replace_fresh_host(self):
  q,e,p=self.values();self.assertFalse(g.validate_executor_security(q,e,p)['applicationAcceptance'])
 def test_wrong_historical_job_refused(self):
  q,e,p=self.values();q['historicalDiagnosticEvidence']['jobId']+=1
  with self.assertRaisesRegex(g.Refusal,'EXACT_PRESERVED_V94_DIAGNOSTICS_REQUIRED'):g.validate_executor_security(q,e,p)
 def test_wrong_historical_digest_refused(self):
  q,e,p=self.values();q['diagnosticControlsSHA256']=H;q['evidenceBindings']['diagnosticControlsSHA256']=H
  with self.assertRaisesRegex(g.Refusal,'EXACT_PRESERVED_V94_DIAGNOSTICS_REQUIRED'):g.validate_executor_security(q,e,p)
 def test_new_mode_still_requires_current_principal_denials(self):
  q,e,p=self.values();q['nativeObservation']['writer']['privateDenied']=False
  with self.assertRaisesRegex(g.Refusal,'ACTUAL_WRITER_PERMISSION_DENIALS_REQUIRED'):g.validate_executor_security(q,e,p)
 def test_unknown_mode_refused(self):
  q,e,p=self.values();q['evidenceMode']='reuse-dead-runner'
  with self.assertRaisesRegex(g.Refusal,'NATIVE_EVIDENCE_MODE_REFUSED'):g.validate_executor_security(q,e,p)

if __name__=='__main__':unittest.main(verbosity=2)

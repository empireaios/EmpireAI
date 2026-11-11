"""Successor V112 master-authority and exact A01 routing controls, offline only."""
import copy
import json
from pathlib import Path
import sys
import unittest
HERE=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(HERE));sys.path.insert(0,str(HERE.parent/'v65/tests'))
import native_acceptance as entry
from test_orchestration import fixture,rehash
from test_executor_guard import authority_fixture

class V112Bindings(unittest.TestCase):
 def test_exact_fresh_route_and_published_v109_parent(self):
  self.assertEqual(entry.LAUNCH_BRANCH,'work8/v112-a5-20261111-a01')
  self.assertEqual(entry.REVIEW_BRANCH,'work8/v112-review-20261111-a01')
  self.assertEqual(entry.PARENT,'ea4d0b57909e1c41249b9605e322da3a4d5b518c')
  self.assertEqual(entry.RELEASE_PATH,'acceptance/v112-a01-release.json')
  self.assertEqual(entry.WORKFLOW,'.github/workflows/work8-v112-a5.yml')
  text=(entry.SOURCE/entry.WORKFLOW).read_text()
  self.assertIn("github.event.ref == '"+entry.LAUNCH_BRANCH+"'",text)
  self.assertIn('timeout-minutes: 300',text);self.assertIn('github.run_attempt == 1',text)
  self.assertIn('runs-on: ubuntu-24.04',text)
  self.assertEqual(text.count('uses: actions/upload-artifact@'),3)
  self.assertEqual(entry.runner.REVIEW_REF,entry.REVIEW_BRANCH)
  self.assertEqual(entry.runner.LAUNCH_REF,'refs/heads/'+entry.LAUNCH_BRANCH)
  self.assertEqual(entry.runner.WORKFLOW_PATH,entry.WORKFLOW)
 def test_checked_in_templates_never_commit_or_authorize(self):
  plan=json.loads((entry.SOURCE/'v65/launch-plan.json').read_text());a=plan['authority']
  for field in ('maximumAttempts','reservationUSD','maximumProspectiveUSD','cumulativeAfterCents'):
   self.assertEqual(a[field],0)
  for field in ('ownerDecisionRecorded','reservationCommitted','financialExposureBoundVerified','accountBillingContextVerified','paidRunnerAuthorized'):
   self.assertIs(a[field],False)
  self.assertIsNone(a['masterLedgerRecordReference'])
  self.assertEqual(a['independentAckAuthority']['maximumOwnerEndorsements'],0)
  with self.assertRaises(entry.guard.Refusal):entry.guard.validate_authority(a)
  template=json.loads((HERE/'external-release.template.json').read_text())
  self.assertEqual(template['maximumAttempts'],0)
  self.assertEqual(template['reservationReceipt']['reservationUSD'],'0.00')
  self.assertEqual(template['reservationReceipt']['before'],entry.LEDGER_BEFORE)
 def test_master_finance_identity_and_unverified_billing_cannot_be_swapped(self):
  fields={'masterAuthorityId':['other',None],'masterAuthoritySHA256':['a'*64,None],
   'campaignId':['other',None],'attemptId':['other',None],
   'financialExposureBoundVerified':[False,None],'financialReviewSHA256':['b'*64,None],
   'accountBillingContextVerified':[True,None],'paidRunnerAuthorized':[True,None],
   'masterCeilingCents':[True,100000.0,100001,None]}
  for key,values in fields.items():
   for value in values:
    with self.subTest(key=key,value=value):
     record,source,commit,template=fixture();record['ownerApprovalReceipt'][key]=value;rehash(record)
     with self.assertRaisesRegex(entry.guard.Refusal,'OWNER_APPROVAL'):entry.validate_release(record,source,commit,template)
 def test_cumulative_pool_cannot_reset_inflate_or_double_count_prior_holds(self):
  for key,value in [('masterCeilingCents',100001),('masterCeilingCents',True),('cumulativeBeforeCents',2000),('cumulativeAfterCents',0),('cumulativeAfterCents',3995),('remainingBeforeCents',102000),('remainingAfterCents',100000),('remainingAfterCents',98000.0)]:
   with self.subTest(key=key):
    a=authority_fixture();a[key]=value
    with self.assertRaisesRegex(entry.guard.Refusal,'CUMULATIVE_MASTER_LEDGER'):entry.guard.validate_authority(a)
 def test_ledger_file_version_event_and_digests_are_exact(self):
  for key,value in [('ledgerId','new-pool'),('libraryFileId','other-file'),('version',0),('version',2),('version',True),('sha256',''),('eventId','other-attempt'),('eventSHA256',None)]:
   with self.subTest(key=key):
    a=authority_fixture();a['masterLedgerRecordReference'][key]=value
    with self.assertRaisesRegex(entry.guard.Refusal,'MASTER_CAMPAIGN'):entry.guard.validate_authority(a)
 def test_reservation_preserves_history_and_exact_cumulative_arithmetic(self):
  for key,value in [('priorAggregateHoldsUSD','0.00'),('priorA5HoldsUSD','0.00'),('consumedExposureCents',3995),('remainingAuthorityCents',100000),('remainingReservedExposureCents',0),('settledChargeCents',2000),('settledChargeCents',False),('settledChargeCents',0.0)]:
   record,source,commit,template=fixture();record['reservationReceipt']['after'][key]=value;rehash(record)
   with self.subTest(key=key),self.assertRaisesRegex(entry.guard.Refusal,'UNIQUE_NATIVE_RESERVATION'):entry.validate_release(record,source,commit,template)
 def test_receipt_references_cannot_diverge(self):
  for field in ('financialReviewSHA256','masterLedgerRecordReference'):
   record,source,commit,template=fixture();record['launchPlan']['authority'][field]=None
   with self.subTest(field=field),self.assertRaisesRegex(entry.guard.Refusal,'OPERATIVE_AUTHORITY_RECEIPTS'):entry.validate_release(record,source,commit,template)
  for version in (True,1.0):
   record,source,commit,template=fixture();record['reservationReceipt']['masterLedgerRecordReference']=dict(record['reservationReceipt']['masterLedgerRecordReference'],version=version);rehash(record)
   with self.subTest(version=version),self.assertRaisesRegex(entry.guard.Refusal,'UNIQUE_NATIVE_RESERVATION'):entry.validate_release(record,source,commit,template)
 def test_historical_and_future_routes_and_reservations_are_refused(self):
  for route in ('work8/v111-a5-20261111','work8/v112-a5-20261111-a02'):
   record,source,commit,template=fixture();record['launchBranch']=route
   with self.assertRaisesRegex(entry.guard.Refusal,'EXACT_ROUTE'):entry.validate_release(record,source,commit,template)
  for reservation in ('V111-A5-NATIVE-ONCE-20261111','V112-A5-A02-20261111'):
   record,source,commit,template=fixture();record['ownerApprovalReceipt']['reservationId']=reservation;rehash(record)
   with self.assertRaisesRegex(entry.guard.Refusal,'OWNER_APPROVAL'):entry.validate_release(record,source,commit,template)
 def test_complete_source_bound_a01_keeps_two_acks_and_bounded_resources(self):
  plan=entry.validate_release(*fixture());a=plan['authority']
  self.assertEqual(a['reservationUSD'],20);self.assertEqual(a['remainingAfterCents'],98000)
  self.assertEqual(a['cumulativeAfterCents'],2000);self.assertEqual(a['priorOverallHoldsUSD'],19.95)
  self.assertEqual(a['priorA5HoldsUSD'],10);self.assertIs(a['accountBillingContextVerified'],False)
  self.assertEqual(a['independentAckAuthority'],entry.ACK_AUTHORITY)
  self.assertEqual(plan['durationInterpretation']['hardJobSeconds'],18000)

if __name__=='__main__':unittest.main(verbosity=2)

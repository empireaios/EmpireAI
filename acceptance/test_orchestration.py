#!/usr/bin/env python3
"""Focused offline admission/return tests; no packages, Docker or native work."""
import argparse
import copy
import json
import os
from pathlib import Path
import re
import sys
import tarfile
import tempfile
import unittest
from unittest import mock

sys.dont_write_bytecode = True
import native_acceptance as entry
from bind_source import build


def fixture():
    """Synthetic in-memory receipt, never an operative release record."""
    template = json.loads((entry.SOURCE/'v65/launch-plan.json').read_text())
    source = {'sourceManifestSHA256': '1'*64, 'workflowSHA256': '2'*64}
    binding = {'tree': '3'*40, 'parent': entry.PARENT,
               'manifestSHA256': source['sourceManifestSHA256'],
               'workflowSHA256': source['workflowSHA256']}
    owner = {'schema': 'work8-v104-owner-approval-v1', 'ownerDecisionRecorded': True,
             'directive': 'EMPIREAI_V104_SEPARATE_NATIVE_EXECUTION_APPROVAL',
             'scope': 'one-native-a5-08-09-attempt', 'maximumAttempts': 1,
             'maximumJobSeconds': 18000, 'maximumAdditionalExposureUSD': '2.11',
             'maximumReservationUSD': '2.11', 'noAutomaticRetry': True,
             'approvedSource': binding, 'reservationId': entry.RESERVATION,
             'independentAckAuthority': entry.ACK_AUTHORITY}
    reservation = {'schema': 'work8-v104-reservation-v1',
                   'recordType': 'ACCOUNTING_HOLD_NOT_PROVIDER_CHARGE',
                   'status': 'COMMITTED', 'reservationId': entry.RESERVATION,
                   'approvedSource': binding, 'reservationUSD': '2.11',
                   'before': dict(entry.LEDGER_BEFORE), 'after': dict(entry.LEDGER_AFTER)}
    plan = copy.deepcopy(template)
    plan['status'] = 'OWNER_APPROVED_EXTERNAL_RELEASE'
    plan['authority'].update(ownerDecisionRecorded=True, approvalScope='one-native-a5-08-09-attempt',
        maximumAttempts=1, reservationCommitted=True, reservationId=entry.RESERVATION,
        reservationUSD=2.11, maximumProspectiveUSD=2.11, currentOverallHoldsUSD=18.79,
        currentA5HoldsUSD=8.84, remainingUnreservedUSD=1.16,
        independentAckAuthority=copy.deepcopy(entry.ACK_AUTHORITY))
    record = {'schema': 'work8-v99-external-release-v1', 'repository': entry.REPOSITORY,
              'launchBranch': entry.LAUNCH_BRANCH, 'workflowPath': entry.WORKFLOW,
              'maximumAttempts': 1, 'source': binding, 'launchPlan': plan,
              'ownerApprovalReceipt': owner, 'reservationReceipt': reservation}
    rehash(record)
    commit = {'tree': {'sha': binding['tree']}, 'parents': [{'sha': entry.PARENT}]}
    return record, source, commit, template


def rehash(record):
    owner_sha = entry.digest(entry.canonical(record['ownerApprovalReceipt']))
    record['ownerApprovalSHA256'] = owner_sha
    record['reservationReceipt']['ownerApprovalSHA256'] = owner_sha
    reservation_sha = entry.digest(entry.canonical(record['reservationReceipt']))
    record['reservationReceiptSHA256'] = reservation_sha
    record['launchPlan']['authority'].update(ownerApprovalReceiptSHA256=owner_sha,
                                            reservationReceiptSHA256=reservation_sha)


def args(root, command, **extra):
    values = dict(root=str(root), command=command, stage=None, label=None,
                  artifact_id=None, artifact_digest=None)
    values.update(extra)
    return argparse.Namespace(**values)


class ExternalReleaseTests(unittest.TestCase):
    def test_complete_synthetic_binding_and_template_has_no_authority(self):
        values = fixture()
        self.assertEqual(entry.validate_release(*values), values[0]['launchPlan'])
        with self.assertRaises(entry.guard.Refusal):
            entry.guard.validate_authority(values[3]['authority'])
        source_template = json.loads((entry.HERE/'external-release.template.json').read_text())
        with self.assertRaises(entry.guard.Refusal):
            entry.validate_release(source_template, *values[1:])

    def test_exact_tree_single_parent_manifest_and_route(self):
        for field in ('tree', 'parent', 'manifestSHA256', 'workflowSHA256'):
            with self.subTest(field=field):
                record, source, commit, template = fixture()
                record['source'][field] = 'e'*len(record['source'][field])
                rehash(record)
                with self.assertRaisesRegex(entry.guard.Refusal, 'EXACT_SOURCE'):
                    entry.validate_release(record, source, commit, template)
        record, source, commit, template = fixture()
        commit['parents'].append({'sha': '7'*40})
        with self.assertRaisesRegex(entry.guard.Refusal, 'EXACT_SOURCE'):
            entry.validate_release(record, source, commit, template)
        record['launchBranch'] = 'work8/v91-qualification-20261108'
        with self.assertRaisesRegex(entry.guard.Refusal, 'EXACT_ROUTE'):
            entry.validate_release(record, source, commit, template)

    def test_smaller_owner_cost_duration_or_reservation_does_not_silently_pass(self):
        changes = {'ownerDecisionRecorded': False, 'maximumAttempts': 2,
                   'maximumJobSeconds': 3600, 'maximumAdditionalExposureUSD': '0.001',
                   'maximumReservationUSD': '0.00', 'noAutomaticRetry': False,
                   'scope': 'qualification-only'}
        for field, value in changes.items():
            with self.subTest(field=field):
                record, source, commit, template = fixture()
                record['ownerApprovalReceipt'][field] = value
                rehash(record)
                with self.assertRaisesRegex(entry.guard.Refusal, 'OWNER_APPROVAL'):
                    entry.validate_release(record, source, commit, template)

    def test_changed_receipt_and_plan_fail_even_with_valid_other_hashes(self):
        record, source, commit, template = fixture()
        record['reservationReceipt']['after']['A5HoldsUSD'] = '2.20'
        with self.assertRaisesRegex(entry.guard.Refusal, 'CANONICAL_HASH'):
            entry.validate_release(record, source, commit, template)
        rehash(record)
        with self.assertRaisesRegex(entry.guard.Refusal, 'UNIQUE_NATIVE_RESERVATION'):
            entry.validate_release(record, source, commit, template)
        record, source, commit, template = fixture()
        record['launchPlan']['durationPlan']['examinationSeconds'] += 1
        with self.assertRaisesRegex(entry.guard.Refusal, 'PLAN_BOUNDS'):
            entry.validate_release(record, source, commit, template)


class SourceAndAttemptTests(unittest.TestCase):
    def test_recreated_branch_or_incomplete_run_listing_cannot_reuse_grant(self):
        current = {'id': 99, 'run_attempt': 1, 'event': 'create',
                   'head_branch': entry.LAUNCH_BRANCH, 'head_sha': '8'*40,
                   'path': entry.WORKFLOW, 'status': 'in_progress', 'workflow_id': 123,
                   'actor': {'id': entry.OWNER_ID, 'login': 'empireaios', 'type': 'User'},
                   'triggering_actor': {'id': entry.OWNER_ID, 'login': 'empireaios', 'type': 'User'}}
        with mock.patch.dict(os.environ, GITHUB_RUN_ID='99', GITHUB_SHA='8'*40):
            with mock.patch.object(entry.runner, 'api', side_effect=[current, {'total_count': 1, 'workflow_runs': [current]}]):
                self.assertEqual(entry.single_launch_readback()['matchingRuns'], 1)
            for listing in ({'total_count': 0, 'workflow_runs': []},
                            {'total_count': 2, 'workflow_runs': [current]},
                            {'total_count': 2, 'workflow_runs': [current, dict(current, id=98)]},
                            {'total_count': 1, 'workflow_runs': [dict(current, id=98)]}):
                with self.subTest(listing=listing), mock.patch.object(entry.runner, 'api', side_effect=[current, listing]):
                    with self.assertRaises(entry.guard.Refusal):
                        entry.single_launch_readback()

    def make_source(self, root):
        (root/'acceptance').mkdir()
        (root/'.github/workflows').mkdir(parents=True)
        (root/entry.WORKFLOW).write_text('synthetic workflow\n')
        (root/'acceptance/config.json').write_bytes((entry.HERE/'config.json').read_bytes())
        (root/'sample.py').write_text('x = 1\n')
        (root/'acceptance/source-manifest.json').write_text(json.dumps(build(root)))

    def test_unindexed_file_changed_mode_and_changed_bytes_refused(self):
        for change in ('extra', 'mode', 'bytes'):
            with self.subTest(change=change), tempfile.TemporaryDirectory() as d:
                root = Path(d)
                self.make_source(root)
                self.assertGreater(entry.validate_source(root)['filesVerified'], 0)
                if change == 'extra':
                    (root/'extra').write_text('unreviewed')
                elif change == 'mode':
                    (root/'sample.py').chmod(0o755)
                else:
                    (root/'sample.py').write_text('x = 2\n')
                with self.assertRaisesRegex(entry.guard.Refusal, 'COMPLETE_SOURCE_INVENTORY'):
                    entry.validate_source(root)

    def test_symbolic_link_source_refused(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            (root/'real').write_text('data')
            (root/'link').symlink_to(root/'real')
            with self.assertRaisesRegex(entry.guard.Refusal, 'SOURCE_LINK'):
                entry.source_inventory(root)

    def test_operation_exclusive_attempt_never_automatically_repeats(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            entry.mark_attempt(root, 'native', 'full')
            with self.assertRaisesRegex(entry.guard.Refusal, 'ALREADY_ATTEMPTED'):
                entry.mark_attempt(root, 'native', 'full')
            receipt = json.loads((root/'acceptance-attempts/native-full.json').read_text())
            self.assertFalse(receipt['automaticRetry'])


class FailureReturnAndUploadTests(unittest.TestCase):
    def test_foreign_identity_cannot_authorize_cleanup(self):
        with tempfile.TemporaryDirectory() as d, mock.patch.dict(os.environ, GITHUB_RUN_ID='99', GITHUB_SHA='8'*40):
            root = Path(d)
            (root/'runner-identity.json').write_text(json.dumps({
                'runId': '98', 'runAttempt': 1, 'workflowCommit': '8'*40,
                'repository': entry.REPOSITORY, 'hostUid': 1001, 'hostGid': 1001}))
            with self.assertRaisesRegex(entry.guard.Refusal, 'CLEANUP_CURRENT_IDENTITY'):
                entry.cleanup_identity(root)

    def test_source_admission_failure_still_exports_first_failure_without_native(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            entry.runner.preserve_first_failure(root, 'identity', entry.guard.Refusal('SOURCE_BINDING_FAILED'))
            (root/'private').mkdir()
            (root/'private/never-export.json').write_text('{"private":"not allowed"}')
            with mock.patch.object(entry, 'validate_root', return_value=root), \
                 mock.patch.object(entry, 'validate_source', side_effect=AssertionError('must not read source')), \
                 mock.patch.object(entry, 'admitted_plan', side_effect=AssertionError('must not grant authority')), \
                 mock.patch.object(entry.runner, 'run', side_effect=AssertionError('must not execute process')):
                cleanup = entry.execute(args(root, 'cleanup'))
                self.assertEqual(cleanup['status'], 'NO_EXECUTOR_IDENTITY_NO_RESOURCES_STARTED')
                entry.execute(args(root, 'final-export'))
            output = root/'final-export'
            self.assertEqual({p.name for p in output.iterdir()},
                             {'evidence-export.tar.gz', 'evidence-export-receipt.json'})
            with tarfile.open(output/'evidence-export.tar.gz') as archive:
                self.assertFalse(any('private' in name for name in archive.getnames()))
                first = json.load(archive.extractfile('runtime-evidence/first-runtime-failure.json'))
                self.assertEqual(first['code'], 'SOURCE_BINDING_FAILED')
            self.assertLess(sum(p.stat().st_size for p in output.iterdir()), 1024**2)

    def test_early_final_readback_uses_live_provider_without_creating_native_admission(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            run = {'id': 99, 'run_attempt': 1, 'head_sha': '8'*40, 'event': 'create',
                   'path': entry.WORKFLOW, 'head_branch': entry.LAUNCH_BRANCH, 'status': 'in_progress',
                   'actor': {'id': entry.OWNER_ID, 'login': 'empireaios', 'type': 'User'},
                   'triggering_actor': {'id': entry.OWNER_ID, 'login': 'empireaios', 'type': 'User'}}
            job = {'id': 100, 'run_id': 99, 'name': entry.JOB_NAME, 'status': 'in_progress',
                   'labels': ['ubuntu-24.04'], 'runner_id': 101, 'runner_name': 'test-runner'}
            artifact = {'id': 102, 'name': 'v99-test-final', 'expired': False,
                        'workflow_run': {'id': 99, 'head_sha': '8'*40}, 'size_in_bytes': 1000,
                        'digest': 'sha256:'+'a'*64, 'created_at': '2026-11-08T12:00:00Z',
                        'expires_at': '2026-11-15T12:00:00Z'}
            prefix = '/repos/'+entry.REPOSITORY
            responses = {prefix: {'id': int(entry.guard.REPOSITORY_ID), 'visibility': 'public', 'private': False, 'archived': False},
                         prefix+'/actions/runs/99': run,
                         prefix+'/actions/runs/99/attempts/1/jobs?per_page=100': {'total_count': 1, 'jobs': [job]},
                         prefix+'/actions/artifacts/102': artifact,
                         prefix+'/actions/runs/99/artifacts?per_page=100': {'total_count': 1, 'artifacts': [artifact]}}
            with mock.patch.dict(os.environ, GITHUB_RUN_ID='99', GITHUB_SHA='8'*40, RUNNER_NAME='test-runner'), \
                 mock.patch.object(entry, 'validate_root', return_value=root), \
                 mock.patch.object(entry, 'validate_source', side_effect=AssertionError('no source admission')), \
                 mock.patch.object(entry, 'admitted_plan', side_effect=AssertionError('no native authority')), \
                 mock.patch.object(entry.runner, 'api', side_effect=lambda path, **kwargs: responses[path]):
                result = entry.execute(args(root, 'artifact-check', label='final', artifact_id='102',
                                            artifact_digest='a'*64))
            self.assertEqual(result['id'], 102)
            self.assertFalse((root/'runner-identity.json').exists())
            self.assertFalse((root/'run-contract.json').exists())
            self.assertFalse(json.loads((root/'artifact-return-provider.json').read_text())['nativeAdmissionGranted'])

    def test_cumulative_envelope_duplicate_and_native_exact_file_limits(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            exported = root/'metadata'
            exported.mkdir()
            (exported/'index.json').write_text('{}')
            receipt = entry.preupload(root, 'packages-and-executor', exported)
            self.assertEqual(receipt['retentionDays'], 7)
            with self.assertRaisesRegex(entry.guard.Refusal, 'ONCE_MAXIMUM_THREE'):
                entry.preupload(root, 'packages-and-executor', exported)
            with self.assertRaisesRegex(entry.guard.Refusal, 'EXACT_TWO_FILES'):
                entry.preupload(root, 'preflight', exported)
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            exported = root/'native'
            exported.mkdir()
            (exported/'evidence-export.tar.gz').write_bytes(b'bounded-test')
            (exported/'evidence-export-receipt.json').write_text('{}')
            with mock.patch.object(entry, 'ENVELOPE_RESERVE', 64*1024**2):
                entry.preupload(root, 'preflight', exported)
                with self.assertRaisesRegex(entry.guard.Refusal, 'CUMULATIVE_SERVICE_BOUND'):
                    entry.preupload(root, 'final', exported)

    def test_upload_symlink_and_hardlink_refused(self):
        for link_type in ('symlink', 'hardlink'):
            with self.subTest(link_type=link_type), tempfile.TemporaryDirectory() as d:
                root = Path(d)
                exported = root/'metadata'
                exported.mkdir()
                source = root/'not-for-export'
                source.write_text('private')
                if link_type == 'symlink':
                    (exported/'link').symlink_to(source)
                else:
                    os.link(source, exported/'link')
                with self.assertRaises(entry.guard.Refusal):
                    entry.preupload(root, 'packages-and-executor', exported)


class WorkflowTests(unittest.TestCase):
    def test_one_bounded_job_three_uploads_no_reconstruction_or_qualification_campaign(self):
        workflow = (entry.SOURCE/entry.WORKFLOW).read_text()
        steps = workflow.split('    steps:\n', 1)[1]
        self.assertEqual(sum(map(int, re.findall(r'timeout-minutes: (\d+)', steps))), 210)
        self.assertEqual(workflow.count('uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02'), 3)
        self.assertEqual(workflow.count('retention-days: 7'), 3)
        self.assertEqual(entry.ARTIFACT_RETENTION_DAYS, 7)
        self.assertEqual(json.loads((entry.HERE/'config.json').read_text())['artifactRetentionDays'], 7)
        self.assertIn('github.run_attempt == 1', workflow)
        self.assertIn("github.event.ref == '"+entry.LAUNCH_BRANCH+"'", workflow)
        self.assertNotRegex(workflow, r'workflow_dispatch|schedule:|workflow_run:|reconstruct_all|qualify_only.py|run_campaign|continue-on-error|actions/cache')
        commands = re.findall(r'python3 -B acceptance/native_acceptance.py ([a-z-]+)', workflow)
        self.assertEqual(commands, ['identity', 'download', 'prepare', 'admission', 'review-export',
            'await-review', 'native', 'native-export', 'await-review', 'native', 'cleanup',
            'final-export', 'artifact-check'])


if __name__ == '__main__':
    unittest.main()

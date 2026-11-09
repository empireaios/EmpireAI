"""Focused admission controls; no external approval or provider work is created."""
import copy
import importlib.util
import io
import json
import os
from pathlib import Path
import re
import tempfile
import time
import unittest
import urllib.error
from unittest.mock import patch

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('v97_admission_under_test', HERE / 'admission.py')
admission = importlib.util.module_from_spec(spec)
spec.loader.exec_module(admission)


def synthetic_release():
    """Synthetic, offline pure-validation operands, never a saved owner receipt."""
    source = {'sourceManifestSHA256': 'a' * 64, 'workflowSHA256': 'b' * 64}
    commit = {'tree': {'sha': 'c' * 40}, 'parents': [{'sha': admission.PARENT}]}
    binding = {'tree': 'c' * 40, 'parent': admission.PARENT,
               'manifestSHA256': 'a' * 64, 'workflowSHA256': 'b' * 64}
    owner = {'schema': 'work8-v97-owner-approval-v1', 'ownerDecisionRecorded': True,
             'directive': 'EMPIREAI_V97_SEPARATE_FRONTEND_DIAGNOSTIC_APPROVAL',
             'scope': admission.SCOPE, 'maximumAttempts': 1,
             'maximumJobSeconds': 1800, 'maximumNativeSeconds': 1200,
             'maximumAdditionalExposureUSD': admission.MAX_EXPOSURE_USD,
             'maximumReservationUSD': admission.MAX_EXPOSURE_USD,
             'noAutomaticRetry': True, 'approvedSource': binding,
             'reservationId': admission.RESERVATION_ID,
             'A5AcceptanceAuthorized': False, 'businessLifecycleAuthorized': False}
    reservation = {'schema': 'work8-v97-reservation-v1',
                   'recordType': 'ACCOUNTING_HOLD_NOT_PROVIDER_CHARGE',
                   'status': 'COMMITTED', 'reservationId': admission.RESERVATION_ID,
                   'ownerApprovalSHA256': admission.digest(admission.canonical(owner)),
                   'approvedSource': binding, 'reservationUSD': admission.MAX_EXPOSURE_USD,
                   'before': {'aggregateHoldsUSD': '12.16', 'A5HoldsUSD': '2.21',
                              'unreservedA5AuthorityUSD': '7.79'},
                   'after': {'aggregateHoldsUSD': '12.46', 'A5HoldsUSD': '2.51',
                             'unreservedA5AuthorityUSD': '7.49'}}
    record = {'schema': 'work8-v97-external-release-v1', 'repository': admission.REPOSITORY,
              'launchBranch': admission.BRANCH, 'workflowPath': admission.WORKFLOW,
              'maximumAttempts': 1, 'source': binding,
              'ownerApprovalReceipt': owner, 'reservationReceipt': reservation}
    rehash(record)
    return record, source, commit


def rehash(record):
    record['ownerApprovalSHA256'] = admission.digest(admission.canonical(record['ownerApprovalReceipt']))
    record['reservationReceipt']['ownerApprovalSHA256'] = record['ownerApprovalSHA256']
    record['reservationReceiptSHA256'] = admission.digest(admission.canonical(record['reservationReceipt']))


class AdmissionControls(unittest.TestCase):
    def setUp(self):
        self.record, self.source, self.commit = synthetic_release()

    def assert_refused(self, record=None, source=None, commit=None):
        with self.assertRaises(admission.Refusal):
            admission.validate_release(record if record is not None else self.record,
                                       source if source is not None else self.source,
                                       commit if commit is not None else self.commit)

    def test_pure_synthetic_operands_do_not_create_authority(self):
        outcome = admission.validate_release(self.record, self.source, self.commit)
        self.assertEqual(outcome['source']['tree'], self.commit['tree']['sha'])
        config = json.loads((HERE / 'config.json').read_text())
        self.assertFalse(config['localOwnerDecisionRecorded'])
        self.assertFalse(config['localReservationCommitted'])
        self.assertEqual(config['currentAuthority']['additionalAttemptsAuthorized'], 0)

    def test_missing_external_approval_and_reservation_refused(self):
        for key in ['ownerApprovalReceipt', 'reservationReceipt']:
            altered = copy.deepcopy(self.record)
            altered.pop(key)
            self.assert_refused(altered)
        altered = copy.deepcopy(self.record)
        altered['ownerApprovalReceipt']['ownerDecisionRecorded'] = False
        rehash(altered)
        self.assert_refused(altered)
        altered = copy.deepcopy(self.record)
        altered['reservationReceipt']['status'] = 'PROPOSED'
        rehash(altered)
        self.assert_refused(altered)

    def test_source_tree_manifest_workflow_and_parent_changes_refused(self):
        for key in ['tree', 'parent', 'manifestSHA256', 'workflowSHA256']:
            changed = copy.deepcopy(self.record)
            changed['source'][key] = 'd' * len(changed['source'][key])
            rehash(changed)
            self.assert_refused(changed)
        changed = copy.deepcopy(self.commit)
        changed['parents'].append({'sha': 'd' * 40})
        self.assert_refused(commit=changed)

    def test_wrong_branch_repository_workflow_or_scope_refused(self):
        for key in ['repository', 'launchBranch', 'workflowPath']:
            changed = copy.deepcopy(self.record)
            changed[key] = 'unreviewed'
            self.assert_refused(changed)
        changed = copy.deepcopy(self.record)
        changed['ownerApprovalReceipt']['scope'] = 'full-a5-examination'
        rehash(changed)
        self.assert_refused(changed)

    def test_retry_deadline_cost_and_business_expansion_refused(self):
        for key, value in [('maximumAttempts', 2), ('maximumJobSeconds', 1801),
                           ('maximumNativeSeconds', 1201), ('noAutomaticRetry', False),
                           ('maximumAdditionalExposureUSD', '0.31'),
                           ('maximumReservationUSD', '0.31'),
                           ('businessLifecycleAuthorized', True), ('A5AcceptanceAuthorized', True)]:
            changed = copy.deepcopy(self.record)
            changed['ownerApprovalReceipt'][key] = value
            rehash(changed)
            self.assert_refused(changed)

    def test_reservation_id_or_ledger_mutation_refused(self):
        for key in ['reservationId', 'reservationUSD', 'recordType']:
            changed = copy.deepcopy(self.record)
            changed['reservationReceipt'][key] = 'unreviewed'
            rehash(changed)
            self.assert_refused(changed)
        changed = copy.deepcopy(self.record)
        changed['reservationReceipt']['after']['A5HoldsUSD'] = '2.52'
        rehash(changed)
        self.assert_refused(changed)

    def test_hash_tampering_refused(self):
        for key in ['ownerApprovalSHA256', 'reservationReceiptSHA256']:
            changed = copy.deepcopy(self.record)
            changed[key] = '0' * 64
            self.assert_refused(changed)

    def test_boolean_attempt_counts_refused(self):
        changed = copy.deepcopy(self.record)
        changed['maximumAttempts'] = True
        self.assert_refused(changed)
        changed = copy.deepcopy(self.record)
        changed['ownerApprovalReceipt']['maximumAttempts'] = True
        rehash(changed)
        self.assert_refused(changed)

    def test_branch_recreation_or_foreign_current_launch_refused(self):
        current = {'id': 123, 'run_attempt': 1, 'head_branch': admission.BRANCH,
                   'head_sha': 'a' * 40, 'event': 'create', 'path': admission.WORKFLOW}
        admission.validate_single_launch({'total_count': 1, 'workflow_runs': [current]}, '123', 'a' * 40)
        for field, value in [('id', 124), ('run_attempt', 2), ('head_sha', 'b' * 40),
                             ('event', 'workflow_dispatch'), ('path', 'unreviewed'),
                             ('head_branch', 'recreated-other-branch')]:
            altered = dict(current, **{field: value})
            with self.assertRaises(admission.Refusal):
                admission.validate_single_launch({'total_count': 1, 'workflow_runs': [altered]}, '123', 'a' * 40)
        with self.assertRaises(admission.Refusal):
            admission.validate_single_launch({'total_count': 2, 'workflow_runs': [current, current]}, '123', 'a' * 40)

    def test_new_branch_workflow_uses_current_numeric_provider_id(self):
        route = admission.workflow_runs_path({'workflow_id': 321, 'path': admission.WORKFLOW})
        self.assertIn('/actions/workflows/321/runs?', route)
        self.assertNotIn('work8-v97-frontend-startup.yml', route)
        self.assertIn('branch=work8%2Fv97-frontend-startup-20261109', route)
        for value in [None, True, '321', 0, -1]:
            with self.assertRaises(admission.Refusal):
                admission.workflow_runs_path({'workflow_id': value, 'path': admission.WORKFLOW})
        with self.assertRaises(admission.Refusal):
            admission.workflow_runs_path({'workflow_id': 321, 'path': 'unreviewed'})

    def test_actual_workflow_and_admission_interfaces_agree(self):
        workflow = (HERE.parent / admission.WORKFLOW).read_text()
        job_names = re.findall(r'^    name: (.+)$', workflow, re.MULTILINE)
        self.assertEqual(job_names, [admission.JOB_NAME])
        commands = re.findall(r'python3 -B frontend_startup/([a-z_]+)\.py ([a-z-]+)', workflow)
        self.assertEqual(commands, [('admission', 'admit'), ('admission', 'download'),
                                    ('runner', 'run'), ('runner', 'cleanup'),
                                    ('runner', 'readback'), ('runner', 'export')])
        self.assertEqual(workflow.count('--root "$RUNNER_TEMP/v97-frontend-$GITHUB_RUN_ID"'), 6)
        self.assertRegex(workflow, r'(?m)^    timeout-minutes: 30$')
        self.assertRegex(workflow, r'(?m)^    runs-on: ubuntu-24\.04$')
        self.assertIn("github.event.ref == '" + admission.BRANCH + "'", workflow)
        self.assertIn('github.run_attempt == 1', workflow)

    def test_authenticated_launch_requires_both_provider_owner_actors(self):
        actor = {'id': admission.OWNER_ID, 'login': 'empireaios', 'type': 'User'}
        run = {'actor': actor, 'triggering_actor': dict(actor)}
        proof = admission.validate_launch_actor(run, {})
        self.assertEqual(proof['authenticationBasis'], 'CURRENT_PROVIDER_RUN_ACTOR_AND_TRIGGERING_ACTOR')
        self.assertEqual(proof['actor'], actor)
        for field in ['actor', 'triggering_actor']:
            for changed in [None, {}, {'id': 123, 'login': 'empireaios', 'type': 'User'},
                            {'id': admission.OWNER_ID, 'login': 'foreign', 'type': 'User'},
                            {'id': admission.OWNER_ID, 'login': 'empireaios', 'type': 'Bot'},
                            {'id': str(admission.OWNER_ID), 'login': 'empireaios', 'type': 'User'}]:
                with self.assertRaises(admission.Refusal):
                    admission.validate_launch_actor(dict(run, **{field: changed}), {})
            missing = dict(run)
            missing.pop(field)
            with self.assertRaises(admission.Refusal):
                admission.validate_launch_actor(missing, {})

    def test_spoofed_git_author_cannot_replace_authenticated_launch_actor(self):
        forged = {'author': {'id': admission.OWNER_ID, 'login': 'empireaios', 'type': 'User'},
                  'actor': {'id': 123, 'login': 'foreign', 'type': 'User'},
                  'triggering_actor': {'id': 123, 'login': 'foreign', 'type': 'User'}}
        with self.assertRaisesRegex(admission.Refusal, 'AUTHENTICATED_OWNER_LAUNCH_REQUIRED'):
            admission.validate_launch_actor(forged, {})

    def test_launch_actor_environment_must_agree_when_present(self):
        actor = {'id': admission.OWNER_ID, 'login': 'empireaios', 'type': 'User'}
        run = {'actor': actor, 'triggering_actor': actor}
        correct = {'GITHUB_ACTOR_ID': str(admission.OWNER_ID), 'GITHUB_ACTOR': 'empireaios',
                   'GITHUB_TRIGGERING_ACTOR': 'empireaios'}
        admission.validate_launch_actor(run, correct)
        for field in correct:
            with self.assertRaisesRegex(admission.Refusal, 'OWNER_LAUNCH_ENVIRONMENT_DISAGREEMENT'):
                admission.validate_launch_actor(run, dict(correct, **{field: 'foreign'}))

    def test_expired_or_too_short_retained_artifact_refused(self):
        value = {'id': admission.ARTIFACT_ID, 'name': admission.ARTIFACT_NAME,
                 'expired': False, 'size_in_bytes': admission.ARTIFACT_BYTES,
                 'digest': 'sha256:' + admission.ARTIFACT_SHA256,
                 'workflow_run': {'id': admission.ARTIFACT_RUN, 'head_sha': admission.ARTIFACT_COMMIT},
                 'expires_at': '2100-01-01T00:00:00Z'}
        admission.artifact_metadata(value)
        for field, changed_value in [('expired', True), ('digest', 'sha256:' + '0' * 64),
                                     ('expires_at', '2000-01-01T00:00:00Z')]:
            with self.assertRaises(admission.Refusal):
                admission.artifact_metadata(dict(value, **{field: changed_value}))

    def test_api_token_never_forwarded_to_signed_download(self):
        class ControlledOpener:
            def __init__(self): self.requests = []
            def open(self, request, timeout):
                self.requests.append(request)
                if len(self.requests) == 1:
                    raise urllib.error.HTTPError(request.full_url, 302, 'controlled',
                        {'Location': 'https://control.blob.core.windows.net/file?sig=synthetic'}, None)
                return io.BytesIO(b'abc')
        opener = ControlledOpener()
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            history = {'id': admission.ARTIFACT_RUN, 'run_attempt': 1,
                       'head_sha': admission.ARTIFACT_COMMIT, 'status': 'completed'}
            with patch.object(admission, 'validate_admission', return_value={
                    'runId': '123', 'nativeDeadlineEpoch': time.time() + 1200}), \
                 patch.object(admission, 'api', side_effect=[{'expires_at': '2100-01-01T00:00:00Z'}, history]), \
                 patch.object(admission, 'artifact_metadata', side_effect=lambda x: x), \
                 patch.object(admission.urllib.request, 'build_opener', return_value=opener), \
                 patch.object(admission, 'ARTIFACT_BYTES', 3), \
                 patch.object(admission, 'ARTIFACT_SHA256', admission.digest(b'abc')), \
                 patch.object(admission, 'deliver_zip', return_value={'packagesRebuilt': False}), \
                 patch.dict(os.environ, {'GH_TOKEN': 'CONTROL_SECRET_NEVER_FORWARD'}, clear=True):
                result = admission.download(root)
            self.assertFalse(result['providerTokenForwarded'])
            self.assertEqual(opener.requests[0].get_header('Authorization'), 'Bearer CONTROL_SECRET_NEVER_FORWARD')
            self.assertIsNone(opener.requests[1].get_header('Authorization'))
            self.assertNotIn('CONTROL_SECRET_NEVER_FORWARD', (root / 'package-download.json').read_text())

    def test_cdn_scope_and_credentials_refused(self):
        good = 'https://productionresultssa.blob.core.windows.net/actions/file?sig=synthetic'
        self.assertEqual(admission.validate_download_url(good), good)
        for url in ['http://productionresultssa.blob.core.windows.net/file',
                    'https://evil.example/file', 'https://evilblob.core.windows.net/file',
                    'https://productionresultssa.blob.core.windows.net.evil.example/file',
                    'https://user:secret@productionresultssa.blob.core.windows.net/file',
                    'https://productionresultssa.blob.core.windows.net:444/file',
                    'https://productionresultssa.blob.core.windows.net/file#fragment']:
            with self.assertRaises(admission.Refusal):
                admission.validate_download_url(url)

    def test_read_only_api_rejects_foreign_scope_before_network(self):
        with patch.object(admission.urllib.request, 'build_opener') as opener:
            for path in ['/user', '/repos/other/repo', 'https://evil.example']:
                with self.assertRaises(admission.Refusal):
                    admission.api(path)
            opener.assert_not_called()

    def test_native_token_presence_refused_before_reading_receipts(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            with patch.object(admission, 'host_context', return_value=(root, '123')):
                for token in ['GH_TOKEN', 'GITHUB_TOKEN']:
                    with patch.dict(os.environ, {token: 'synthetic-secret'}, clear=True):
                        with self.assertRaisesRegex(admission.Refusal, 'NATIVE_PROVIDER_TOKEN_REFUSED'):
                            admission.validate_admission(root)

    def test_source_addition_omission_edit_mode_cache_and_symlink_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            (root / 'frontend_startup').mkdir()
            (root / '.github/workflows').mkdir(parents=True)
            (root / admission.WORKFLOW).write_text('name: synthetic\n')
            (root / 'frontend_startup/config.json').write_bytes((HERE / 'config.json').read_bytes())
            original = root / 'original.txt'
            original.write_text('bound-content')
            manifest = {'schema': 'work8-v97-complete-source-manifest-v1',
                        'exclusions': [admission.MANIFEST_PATH],
                        'files': admission.source_inventory(root)}
            (root / admission.MANIFEST_PATH).write_text(json.dumps(manifest))
            admission.validate_source(root)
            added = root / 'new.txt'
            added.write_text('additional')
            with self.assertRaises(admission.Refusal): admission.validate_source(root)
            added.unlink()
            original.unlink()
            with self.assertRaises(admission.Refusal): admission.validate_source(root)
            original.write_text('mutated')
            with self.assertRaises(admission.Refusal): admission.validate_source(root)
            original.write_text('bound-content')
            original.chmod(0o755)
            with self.assertRaises(admission.Refusal): admission.validate_source(root)
            original.chmod(0o644)
            link = root / 'link'
            link.symlink_to(original)
            with self.assertRaises(admission.Refusal): admission.validate_source(root)
            link.unlink()
            nested_git = root / 'frontend_startup/.git'
            nested_git.mkdir()
            (nested_git / 'unreviewed.py').write_text('unreviewed')
            with self.assertRaisesRegex(admission.Refusal, 'NESTED_GIT_METADATA_REFUSED'):
                admission.validate_source(root)
            (nested_git / 'unreviewed.py').unlink()
            nested_git.rmdir()
            cache = root / '__pycache__'
            cache.mkdir()
            (cache / 'x.pyc').write_bytes(b'cache')
            with self.assertRaises(admission.Refusal): admission.validate_source(root)

    def test_source_config_cannot_grant_local_authority_even_rehashed(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            (root / 'frontend_startup').mkdir()
            (root / '.github/workflows').mkdir(parents=True)
            (root / admission.WORKFLOW).write_text('name: synthetic\n')
            config = json.loads((HERE / 'config.json').read_text())
            config['localOwnerDecisionRecorded'] = True
            (root / 'frontend_startup/config.json').write_text(json.dumps(config))
            (root / admission.MANIFEST_PATH).write_text(json.dumps({
                'schema': 'work8-v97-complete-source-manifest-v1',
                'exclusions': [admission.MANIFEST_PATH], 'files': admission.source_inventory(root)}))
            with self.assertRaisesRegex(admission.Refusal, 'FAIL_CLOSED_PREPARATION_CONFIG_CHANGED'):
                admission.validate_source(root)

    def test_first_receipt_immutable_and_links_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            p = root / 'first.json'
            admission.atomic(p, {'status': 'FIRST'})
            first = p.read_bytes()
            with self.assertRaises(FileExistsError): admission.atomic(p, {'status': 'SECOND'})
            self.assertEqual(p.read_bytes(), first)
            link = root / 'link.json'
            link.symlink_to(p)
            with self.assertRaises(OSError): admission.read_json(link)
            fifo = root / 'fifo.json'
            os.mkfifo(fifo)
            started = time.monotonic()
            with self.assertRaises(admission.Refusal): admission.read_json(fifo)
            self.assertLess(time.monotonic() - started, 0.5)

    def test_wrong_local_principal_refused_without_provider_call(self):
        with patch.object(admission.os, 'getuid', return_value=0):
            with patch.object(admission, 'api') as api:
                with self.assertRaisesRegex(admission.Refusal, 'ORIGINAL_HOST_UID_GID_REQUIRED'):
                    admission.admit(Path('/synthetic'))
                api.assert_not_called()


if __name__ == '__main__':
    unittest.main()

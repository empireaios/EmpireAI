#!/usr/bin/env python3
"""Deterministic V99 integration controls, not Docker or native acceptance."""
import base64
import copy
import contextlib
import io
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import native_acceptance as entry
from test_orchestration import fixture, rehash, args
import test_orchestration as legacy


def provider_run():
    return {'id': 99, 'run_attempt': 1, 'event': 'create', 'head_branch': entry.LAUNCH_BRANCH,
            'head_sha': '8'*40, 'path': entry.WORKFLOW, 'status': 'in_progress', 'workflow_id': 123,
            'actor': {'id': entry.OWNER_ID, 'login': 'empireaios', 'type': 'User'},
            'triggering_actor': {'id': entry.OWNER_ID, 'login': 'empireaios', 'type': 'User'}}


class V99SourceSecurityTests(unittest.TestCase):
    def test_nested_git_including_empty_directory_and_empty_cache_are_refused(self):
        for relative, code in [('nested/.git', 'NESTED_GIT'), ('__pycache__', 'SOURCE_CACHE')]:
            with self.subTest(relative=relative), tempfile.TemporaryDirectory() as d:
                root = Path(d)
                (root/relative).mkdir(parents=True)
                with self.assertRaisesRegex(entry.guard.Refusal, code):
                    entry.source_inventory(root)
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            (root/'.git').mkdir()
            (root/'.git/metadata').write_text('ordinary root git metadata')
            (root/'source').write_text('indexed')
            self.assertEqual([r['path'] for r in entry.source_inventory(root)], ['source'])

    def test_fifo_json_is_refused_without_open_blocking(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d)/'fifo'
            os.mkfifo(p)
            with self.assertRaisesRegex(entry.guard.Refusal, 'REGULAR_BOUNDED_JSON'):
                entry.read_json(p)

    def test_setid_and_hardlinked_sources_refused(self):
        for mode in ('setid', 'hardlink'):
            with self.subTest(mode=mode), tempfile.TemporaryDirectory() as d:
                root = Path(d)
                p = root/'source'
                p.write_text('data')
                if mode == 'setid':
                    p.chmod(0o4755)
                else:
                    os.link(p, root/'copy')
                with self.assertRaisesRegex(entry.guard.Refusal, 'SPECIAL_FILE'):
                    entry.source_inventory(root)

    def test_nonoperative_config_even_if_manifest_reindexed(self):
        from bind_source import build
        for field, value in [('currentAuthority', {'additionalAttemptsAuthorized': 1}),
                             ('operatingLocks', {'acceptedRequirements': 49}),
                             ('frontendStartupDiagnosticMayRepeat', True)]:
            with self.subTest(field=field), tempfile.TemporaryDirectory() as d:
                root = Path(d)
                legacy.SourceAndAttemptTests().make_source(root)
                config = json.loads((root/'acceptance/config.json').read_text())
                config[field] = value
                (root/'acceptance/config.json').write_text(json.dumps(config))
                (root/'acceptance/source-manifest.json').write_text(json.dumps(build(root)))
                with self.assertRaises(entry.guard.Refusal):
                    entry.validate_source(root)

    def test_consumed_authority_wrong_parent_and_missing_message_scope_rejected(self):
        changes = [('schema', 'work8-v95-owner-approval-v1'),
                   ('directive', 'EMPIREAI_V95_SEPARATE_NATIVE_EXECUTION_APPROVAL'),
                   ('reservationId', 'V95-A5-NATIVE-ONCE-20261108'),
                   ('maximumAdditionalExposureUSD', '0.30'),
                   ('independentAckAuthority', None)]
        for key, value in changes:
            with self.subTest(key=key):
                record, source, commit, template = fixture()
                record['ownerApprovalReceipt'][key] = value
                rehash(record)
                with self.assertRaisesRegex(entry.guard.Refusal, 'OWNER_APPROVAL'):
                    entry.validate_release(record, source, commit, template)
        record, source, commit, template = fixture()
        commit['parents'] = [{'sha': '8e06e3a1637519842548d29e03a5cd38bd10f409'}]
        with self.assertRaisesRegex(entry.guard.Refusal, 'EXACT_SOURCE'):
            entry.validate_release(record, source, commit, template)

    def test_provider_credentials_and_remote_docker_overrides_removed(self):
        names = entry.CREDENTIAL_ENV + entry.DOCKER_OVERRIDE_ENV
        with mock.patch.dict(os.environ, {k: 'synthetic-test-value' for k in names}):
            entry.drop_credentials()
            self.assertFalse(any(k in os.environ for k in names))

    def test_current_workflow_uses_numeric_provider_id_and_owner_authentication(self):
        run = provider_run()
        with mock.patch.dict(os.environ, GITHUB_RUN_ID='99', GITHUB_SHA='8'*40), \
             mock.patch.object(entry.runner, 'api', side_effect=[run, {'total_count': 1, 'workflow_runs': [run]}]) as api:
            proof = entry.single_launch_readback()
        self.assertEqual(proof['authenticatedLaunch'], entry.validate_launch_actor(run, {}))
        self.assertIn('/actions/workflows/123/runs?branch=work8%2Fv99-a5-20261109', api.call_args_list[1].args[0])
        for key in ('actor', 'triggering_actor'):
            bad = copy.deepcopy(run)
            bad[key]['id'] = 999
            with self.subTest(key=key), self.assertRaisesRegex(entry.guard.Refusal, 'AUTHENTICATED_OWNER'):
                entry.validate_launch_actor(bad, {})
        with self.assertRaisesRegex(entry.guard.Refusal, 'ENVIRONMENT_DISAGREEMENT'):
            entry.validate_launch_actor(run, {'GITHUB_ACTOR_ID': '999'})

    def test_actual_provider_runner_debug_refuses_before_release_or_work(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)/'v99-a5-99'
            with mock.patch.object(entry, 'validate_root', return_value=root), \
                 mock.patch.object(entry, 'validate_source', return_value={}), \
                 mock.patch.dict(os.environ, RUNNER_DEBUG='1'), \
                 mock.patch.object(entry.runner, 'api') as api:
                with self.assertRaisesRegex(entry.guard.Refusal, 'PROVIDER_RUNNER_DEBUG_REFUSED'):
                    entry.execute(args(root, 'identity'))
                api.assert_not_called()
            self.assertFalse(root.exists())

    def test_bounded_console_never_prints_large_result_payload(self):
        output = io.StringIO()
        with mock.patch.object(sys, 'argv', ['native_acceptance.py', 'identity', '--root', '/unused']), \
             mock.patch.object(entry, 'execute', return_value={'privateFixture': 'test-private-marker'*10000}), \
             contextlib.redirect_stdout(output):
            self.assertEqual(entry.main(), 0)
        raw = output.getvalue()
        self.assertLessEqual(len(raw.encode()), 2048)
        self.assertNotIn('test-private-marker', raw)
        result = json.loads(raw)
        self.assertEqual(result['wholeRowsAccepted'], [])
        self.assertFalse(result['rawOutputRetained'])


class V99AdmissionIntegrationTests(unittest.TestCase):
    def test_exact_release_fetch_identity_and_later_admission_compose(self):
        record, source, commit, template = fixture()
        commit['sha'] = '8'*40
        raw = entry.canonical(record)
        run = provider_run()
        prefix = '/repos/'+entry.REPOSITORY
        responses = {
            prefix+'/actions/runs/99': run,
            prefix+'/actions/workflows/123/runs?branch=work8%2Fv99-a5-20261109&per_page=100':
                {'total_count': 1, 'workflow_runs': [run]},
            prefix+'/git/ref/heads/'+entry.REVIEW_BRANCH: {'object': {'sha': '9'*40}},
            prefix+'/commits/'+'9'*40+'?per_page=1': {'author': {'login': 'empireaios', 'id': entry.OWNER_ID}},
            prefix+'/contents/'+entry.RELEASE_PATH+'?ref='+'9'*40:
                {'type': 'file', 'encoding': 'base64', 'size': len(raw), 'content': base64.b64encode(raw).decode()},
            prefix+'/git/commits/'+'8'*40: commit,
        }
        proof = {'schema': 'synthetic-offline-retained-evidence', 'nativeAccepted': False}
        def fake_identity(root, job_name, authority_file):
            self.assertEqual(job_name, entry.JOB_NAME)
            self.assertEqual(entry.read_json(authority_file), record['launchPlan'])
            root.mkdir(mode=0o700)
            identity = {'workflowCommit': '8'*40}
            entry.atomic(root/'runner-identity.json', identity, exclusive=True)
            return identity
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)/'v99-a5-99'
            with mock.patch.dict(os.environ, GITHUB_RUN_ID='99', GITHUB_SHA='8'*40,
                                  GITHUB_REF='refs/heads/'+entry.LAUNCH_BRANCH, GITHUB_RUN_ATTEMPT='1'), \
                 mock.patch.object(entry, 'validate_root', return_value=root), \
                 mock.patch.object(entry, 'validate_source', return_value=source), \
                 mock.patch.object(entry, 'verify_retained_evidence', return_value=proof) as retained, \
                 mock.patch.object(entry.runner, 'api', side_effect=lambda path, **kw: responses[path]), \
                 mock.patch.object(entry.runner, 'identity', side_effect=fake_identity), \
                 mock.patch.object(entry, 'git_value', side_effect=lambda *a: commit['tree']['sha'] if a[-1] == 'HEAD^{tree}' else '8'*40):
                entry.execute(args(root, 'identity'))
                self.assertEqual(entry.admitted_plan(root, source), root/'operative-launch-plan.json')
                self.assertEqual(retained.call_count, 2)
                self.assertEqual(entry.read_json(root/'retained-evidence-admission.json'), proof)
                stored = entry.read_json(root/'single-launch-readback.json')
                self.assertEqual(stored['authenticatedLaunch'], entry.validate_launch_actor(run))
                with mock.patch.object(entry, 'verify_retained_evidence', return_value={'changed': True}):
                    with self.assertRaisesRegex(entry.guard.Refusal, 'RETAINED_NATIVE_EVIDENCE_CHANGED'):
                        entry.admitted_plan(root, source)
                stored['authenticatedLaunch']['actor']['id'] = 1
                (root/'single-launch-readback.json').write_text(json.dumps(stored))
                with self.assertRaisesRegex(entry.guard.Refusal, 'AUTHENTICATED_OWNER_LAUNCH'):
                    entry.admitted_plan(root, source)
            self.assertFalse((root/'packages').exists())
            self.assertFalse((root/'run-contract.json').exists())

    def test_workflow_enforces_read_only_provider_scopes_and_suppresses_progress(self):
        workflow = (entry.SOURCE/entry.WORKFLOW).read_text()
        self.assertIn('  issues: read', workflow)
        self.assertNotIn(': write', workflow)
        self.assertIn('show-progress: false', workflow)
        self.assertIn("ACTIONS_STEP_DEBUG: 'false'", workflow)
        self.assertIn("ACTIONS_RUNNER_DEBUG: 'false'", workflow)
        self.assertIn('-u GH_TOKEN -u GITHUB_TOKEN -u ACTIONS_RUNTIME_TOKEN python3 -B acceptance/native_acceptance.py native', workflow)
        self.assertNotIn('frontend_startup/runner.py', workflow)
        self.assertNotIn('qualify_only.py', workflow)


if __name__ == '__main__':
    unittest.main()

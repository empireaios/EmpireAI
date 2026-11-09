"""V99 changed-boundary source controls. No Docker/native/application PASS."""
import ast
import base64
import copy
import hashlib
import json
import os
import pathlib
import shutil
import sys
import tempfile
import time
import types
import unittest
from unittest import mock

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'adapter'))
sys.path.insert(0, str(HERE))
import github_contract as g
import runner
from test_executor_guard import authority_fixture, contract_fixture

SCRIPT = HERE.parent / 'foundation/controller/scripts/work8/native-transition'
EXAMINER = SCRIPT / 'examine-v26.py'
H = 'a' * 64


def reuse_fixture():
    backend = {'image': 'sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0'}
    frontends = {'normal': {'sha256': '391b15ded61649159291a4cad6f8071ce1fdf05f2e0f3732d3b1cf695a43e1d9'}, 'recovery': {'sha256': '2c9a14895e7888ef5f29964a894b9ab99c4affb6ed038f83e5039c2ddf781167'}}
    startup = {'runId': 42539444860, 'jobId': 128910880107, 'artifactId': 13640304481, 'artifactSHA256': '22e9f1b1bd9ba1de469c4249b9fb933a91872b3530db78293f7648345e044238', 'sourceCommit': 'fbf326f14df64c1cc3717942a490f19af4a87a89', 'sourceTree': 'dfac35790ff7af1ad6dceaa0cdf6ee1a37796aa5', 'normal': 'PASS_NATIVE_STARTUP_AND_READINESS', 'recovery': 'PASS_NATIVE_STARTUP_AND_READINESS', 'security': 'PASS', 'firstErrorPreservation': 'PASS', 'cleanupAndIndependentReadback': 'PASS', 'originalA5Acceptance': False}
    proof = {'schema': 'work8-v99-retained-evidence-reuse-v1', 'status': 'VERIFIED_HISTORICAL_EVIDENCE_ONLY', 'qualificationRepeated': False, 'frontendDiagnosticRepeated': False, 'currentNativeLifecycleAccepted': False, 'currentExecutionAuthority': False, 'frontendStartup': startup, 'packageIdentities': {'carrier': copy.deepcopy(backend), **copy.deepcopy(frontends)}, 'compatibleSourceSHA256': {'currentPackages': hashlib.sha256((SCRIPT / 'current_packages.py').read_bytes()).hexdigest()}}
    return proof, backend, frontends


class RetainedStartupControls(unittest.TestCase):
    def test_actual_retained_payload_and_prepared_package_adaptation_join(self):
        evidence = runner.load_module('v99_actual_retained_evidence', HERE.parent.parent / 'acceptance/retained_evidence.py')
        proof = evidence.verify_retained_evidence(HERE.parent.parent)
        pins = proof['packageIdentities']
        with tempfile.TemporaryDirectory() as directory:
            prepared = pathlib.Path(directory) / 'controller'
            shutil.copytree(SCRIPT, prepared)
            runner.replace_assignments(prepared / 'current_packages.py', {'BACKEND': pins['carrier'], 'FRONTENDS': {'normal': pins['normal'], 'recovery': pins['recovery']}})
            joined = evidence.verify_retained_evidence(HERE.parent.parent, prepared)
            self.assertEqual(joined, proof)
            receipt = g.frontend_reuse_receipt(joined, pins['carrier'], {'normal': pins['normal'], 'recovery': pins['recovery']})
            self.assertFalse(receipt['currentNativeLifecycleAccepted'])

    def test_exact_retained_receipt_is_explicitly_not_current_native_acceptance(self):
        receipt = g.frontend_reuse_receipt(*reuse_fixture())
        self.assertFalse(receipt['frontendStartedThisPreflight'])
        self.assertFalse(receipt['currentNativeLifecycleAccepted'])

    def test_every_historical_boundary_rejects_changed_value(self):
        original, backend, frontends = reuse_fixture()
        paths = [(key,) for key in original if key not in ('frontendStartup', 'packageIdentities', 'compatibleSourceSHA256')]
        paths += [('frontendStartup', key) for key in original['frontendStartup']]
        paths += [('packageIdentities', key) for key in original['packageIdentities']]
        paths += [('compatibleSourceSHA256', 'currentPackages')]
        for path in paths:
            with self.subTest(path=path):
                proof = copy.deepcopy(original)
                target = proof
                for key in path[:-1]:
                    target = target[key]
                old = target[path[-1]]
                target[path[-1]] = not old if isinstance(old, bool) else 'changed'
                with self.assertRaises(g.Refusal):
                    g.frontend_reuse_receipt(proof, backend, frontends)

    def test_current_packages_cannot_substitute_other_archives_or_image(self):
        for role in ('carrier', 'normal', 'recovery'):
            with self.subTest(role=role):
                proof, backend, frontends = reuse_fixture()
                if role == 'carrier':
                    backend['image'] = 'sha256:' + H
                else:
                    frontends[role]['sha256'] = H
                with self.assertRaisesRegex(g.Refusal, 'RETAINED_FRONTEND_PACKAGE_IDENTITY_CHANGED'):
                    g.frontend_reuse_receipt(proof, backend, frontends)

    def test_source_template_is_not_current_execution_authority(self):
        plan = json.loads((HERE.parent / 'launch-plan.json').read_text())
        with self.assertRaises(g.Refusal):
            g.validate_authority(plan['authority'])
        self.assertFalse(plan['authority']['reservationCommitted'])
        self.assertEqual(plan['authority']['reservationUSD'], 0)

    def test_consumed_v95_authority_and_old_ledger_are_refused(self):
        for changes in ({'ownerDirective': 'EMPIREAI_V95_SEPARATE_NATIVE_EXECUTION_APPROVAL'}, {'reservationId': 'V95-A5-NATIVE-ONCE-20261108'}, {'priorOverallHoldsUSD': 12.15}, {'maximumProspectiveUSD': .01}, {'independentAckAuthority': None}):
            with self.subTest(changes=changes):
                a = authority_fixture()
                a.update(changes)
                with self.assertRaises(g.Refusal):
                    g.validate_authority(a)

    def test_fresh_prospective_authority_requires_exact_source_bound_evidence(self):
        c, env = contract_fixture()
        self.assertEqual(g.validate_contract(c, 200, env), c)
        del c['retainedEvidenceSHA256']
        with self.assertRaisesRegex(g.Refusal, 'SOURCE_BOUND_RETAINED_EVIDENCE_REQUIRED'):
            g.validate_contract(c, 200, env)


class EndorsementControls(unittest.TestCase):
    def setUp(self):
        self.c, _ = contract_fixture()
        self.c['executor'].update(jobStartedAtEpoch=time.time() - 100, expiresAtEpoch=time.time() + 500)
        self.stage = 'preflight'
        self.commit = 'c' * 40
        self.data = b'{"fixture":"source-control-only"}\n'
        self.artifact = {'id': 123, 'sha256': H}
        self.value = {'schema': 'work8-v99-independent-ack-endorsement-v1', 'repository': g.REPOSITORY, 'runId': str(self.c['executor']['runId']), 'runAttempt': 1, 'stage': self.stage, 'reviewCommit': self.commit, 'ackSHA256': hashlib.sha256(self.data).hexdigest(), 'artifactId': 123, 'artifactSHA256': H, 'decision': 'PASS', 'scope': 'INDEPENDENT_REVIEW_ONLY_NOT_A5_ACCEPTANCE'}
        when = runner.datetime.datetime.fromtimestamp(time.time() - 10, runner.datetime.timezone.utc).isoformat().replace('+00:00', 'Z')
        self.comment = {'id': 456, 'issue_url': 'https://api.github.com/repos/empireaios/EmpireAI/issues/113', 'user': {'login': 'empireaios', 'id': 295548100, 'type': 'User'}, 'created_at': when, 'updated_at': when, 'body': json.dumps(self.value, sort_keys=True, separators=(',', ':'))}

    def invoke(self, rows):
        with mock.patch.object(runner, 'api', return_value=rows) as api:
            out = runner.authenticated_ack_endorsement(self.c, self.stage, self.commit, self.data, self.artifact, deadline=time.monotonic() + 100)
            self.assertIn('/issues/113/comments?since=', api.call_args.args[0])
            self.assertTrue(api.call_args.args[0].endswith('&per_page=100'))
            return out

    def test_authenticated_owner_exact_comment_is_bound_to_raw_ack_bytes(self):
        receipt = self.invoke([self.comment])
        self.assertEqual(receipt['rawAckSHA256'], hashlib.sha256(self.data).hexdigest())
        self.assertEqual(receipt['authenticatedBy'], 'GITHUB_ISSUE_COMMENT_USER')

    def test_missing_endorsement_keeps_gate_pending(self):
        self.assertIsNone(self.invoke([]))

    def test_foreign_comment_is_neither_authority_nor_a_dos_trigger(self):
        foreign = copy.deepcopy(self.comment)
        foreign['user']['id'] = 2
        self.assertIsNone(self.invoke([foreign]))
        self.assertEqual(self.invoke([foreign, self.comment])['commentId'], 456)

    def test_every_content_binding_rejects_changed_owner_endorsement(self):
        for key in ('repository', 'runAttempt', 'reviewCommit', 'ackSHA256', 'artifactId', 'artifactSHA256', 'decision', 'scope'):
            with self.subTest(key=key):
                changed = copy.deepcopy(self.comment)
                value = copy.deepcopy(self.value)
                value[key] = 'changed'
                changed['body'] = json.dumps(value, sort_keys=True, separators=(',', ':'))
                with self.assertRaisesRegex(g.Refusal, 'EXACT_CANONICAL_ACK_ENDORSEMENT_REQUIRED'):
                    self.invoke([changed])

    def test_noncanonical_duplicate_keys_and_trailing_newline_rejected(self):
        for body in (json.dumps(self.value, indent=2), self.comment['body'] + '\n', self.comment['body'][:-1] + ',"decision":"PASS"}'):
            with self.subTest(body_kind=len(body)):
                with self.assertRaisesRegex(g.Refusal, 'EXACT_CANONICAL_ACK_ENDORSEMENT_REQUIRED'):
                    self.invoke([{**self.comment, 'body': body}])

    def test_duplicate_owner_and_incomplete_pagination_rejected(self):
        for rows in ([self.comment, self.comment], [self.comment] * 100):
            with self.subTest(count=len(rows)):
                with self.assertRaises(g.Refusal):
                    self.invoke(rows)

    def test_edited_old_future_wrong_issue_and_noninteger_identity_rejected(self):
        old = '1970-01-01T00:00:00Z'
        future = '2099-01-01T00:00:00Z'
        mutations = ({'updated_at': old}, {'created_at': old, 'updated_at': old}, {'created_at': future, 'updated_at': future}, {'issue_url': self.comment['issue_url'] + '0'}, {'id': True})
        for update in mutations:
            with self.subTest(update=update):
                with self.assertRaises(g.Refusal):
                    self.invoke([{**self.comment, **update}])


class SequentialSourceInteractionControls(unittest.TestCase):
    """Execute original orchestrator branches with inert dependency interfaces.

    This validates order, gates and failure stops, never native assertions.
    """
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = pathlib.Path(self.temp.name)
        self.events = []
        self.private = self.root / 'private'
        self.out = self.root / 'out'
        (self.private / 'evidence').mkdir(parents=True)
        self.out.mkdir()
        (self.private / 'evidence/live-brain-capture.json').write_text(json.dumps({'status': 'PASS_ACTUAL_NATIVE_LIVE_BRAIN_PREFLIGHT'}))
        tree = ast.parse(EXAMINER.read_text())
        self.branch = next(n for n in ast.walk(tree) if isinstance(n, ast.If) and isinstance(n.test, ast.Name) and n.test.id == 'PREFLIGHT' and any(isinstance(z, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'wrong_reader_code' for t in z.targets) for z in n.body))
        proof, backend, frontends = reuse_fixture()
        def event(kind, *args, **kwargs):
            self.events.append((kind, *args))
        def run(args, **kwargs):
            event('run', args)
            if '/proc/self/ns/time' in str(args):
                return 'time:[fixture-only]'
            return '{}'
        def readback(phase, capture=False):
            event('readback', phase, capture)
            return phase != getattr(self, 'failed_phase', None)
        self.context = {'json': json, 'time': time, 'os': types.SimpleNamespace(readlink=lambda path: 'time:[fixture-only]'), 'pathlib': pathlib, 'PRIVATE': self.private, 'OUT': self.out, 'ROOT': self.root, 'SCRIPT': SCRIPT, 'STAGE_NAME': 'full', 'execution_contract': g, 'CONTRACT': {'campaignId': 'fixture-only', 'retainedEvidence': proof, 'retainedEvidenceSHA256': H}, 'current_packages': types.SimpleNamespace(BACKEND=backend, FRONTENDS=frontends), 'NAMES': {r: r for r in ('backend', 'browser', 'frontend', 'anchor')}, 'LABEL': 'fixture-only', 'BROWSER': 'fixture-image', 'components': {}, 'created': [], 'result': {}, 'live_contract': {}, 'accepted_private_contract': {'browser': {}}, 'safe_docker_contract': lambda value: {}, 'browser_options': lambda *args: [], 'child_timeout': lambda role: 100, 'run': run, 'start_front': lambda *args: event('front', *args), 'set_policy': lambda released: event('policy', released), 'signal': lambda *args: event('signal', *args), 'marker': lambda name, **kwargs: event('marker', name), 'inspect': lambda name: {'State': {'Running': False, 'ExitCode': 0}}, 'capture_frontend_origin': lambda **kwargs: event('front-origin'), 'independent_readbacks': readback, 'candidate_packages': types.SimpleNamespace(directory_bytes=lambda path: 0)}

    def tearDown(self):
        self.temp.cleanup()

    def execute(self, preflight):
        self.context['STAGE_NAME'] = 'preflight' if preflight else 'full'
        body = copy.deepcopy(self.branch.body if preflight else self.branch.orelse)
        exec(compile(ast.fix_missing_locations(ast.Module(body=body, type_ignores=[])), str(EXAMINER), 'exec'), self.context)

    def test_preflight_reuses_frontend_evidence_but_captures_new_brain(self):
        self.execute(True)
        self.assertFalse(any(e[0] == 'front' for e in self.events))
        self.assertIn(('signal', 'capture-live-brain.json', {'mode': 'PREFLIGHT'}), self.events)
        self.assertIn(('signal', 'stop-runtime.json'), self.events)
        self.assertFalse(self.context['result']['preflightStateIsFullLifecycleBaseline'])
        self.assertFalse(self.context['result']['frontendStarted'])
        receipt = json.loads((self.out / 'frontend-native-qualification.json').read_text())
        self.assertEqual(receipt['retainedEvidenceSHA256'], H)

    def test_full_source_sequence_retains_same_backend_baseline_through_final_drain(self):
        self.execute(False)
        meaningful = [e for e in self.events if e[0] in ('front', 'readback', 'policy') or (e[0] == 'signal' and e[1] in ('capture-live-brain.json', 'stop-runtime.json', 'readback-complete.json'))]
        self.assertEqual(meaningful, [('front', 'normal', 'NORMAL'), ('signal', 'capture-live-brain.json', {'mode': 'BASELINE'}), ('readback', 'normal', True), ('policy', False), ('front', 'recovery', 'RECOVERY'), ('readback', 'recovery', False), ('front', 'normal', 'NORMAL_RETURN'), ('policy', True), ('readback', 'returned', True), ('readback', 'replayed', True), ('signal', 'stop-runtime.json'), ('readback', 'final', False), ('signal', 'readback-complete.json')])
        self.assertFalse(any(e[0] == 'run' and e[1][:3] == ['docker', 'rm', '-f'] for e in self.events))
        self.assertEqual(self.context['result']['wholeRowsAccepted'], [])

    def test_failed_recovery_readback_stops_before_return(self):
        self.failed_phase = 'recovery'
        with self.assertRaisesRegex(AssertionError, 'RECOVERY_INDEPENDENT_READBACK_FAILED'):
            self.execute(False)
        self.assertNotIn(('front', 'normal', 'NORMAL_RETURN'), self.events)

    def test_failed_final_readback_cannot_signal_success_or_accept_rows(self):
        self.failed_phase = 'final'
        with self.assertRaisesRegex(AssertionError, 'FINAL_INDEPENDENT_READBACK_FAILED'):
            self.execute(False)
        self.assertNotIn(('signal', 'readback-complete.json'), self.events)
        self.assertNotIn('status', self.context['result'])

    def test_failure_preservation_and_scoped_cleanup_remain_in_outer_finally(self):
        tree = ast.parse(EXAMINER.read_text())
        outer = next(n for n in tree.body if isinstance(n, ast.Try) and n.finalbody and any(isinstance(h, ast.ExceptHandler) and h.name == 'error' for h in n.handlers))
        failure = ast.unparse(ast.Module(body=outer.handlers[0].body, type_ignores=[]))
        cleanup = ast.unparse(ast.Module(body=outer.finalbody, type_ignores=[]))
        self.assertIn('save_first', failure)
        self.assertIn("stage = 'cleanup'", cleanup)
        self.assertIn('temporaryContainersAndNetworkRemoved', cleanup)
        self.assertIn('privateTemporaryDataRemoved', cleanup)

    def test_internal_policy_is_bound_to_fresh_owner_and_fixed_deadline(self):
        tree = ast.parse(EXAMINER.read_text())
        function = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == 'set_policy')
        source = ast.unparse(function)
        self.assertIn("CONTRACT['authority']['ownerApprovalReceiptSHA256']", source)
        self.assertIn("TIME_BUDGET['stageDeadlineEpochMs']", source)
        self.assertIn("'releaseExpiryExtended': False", source)


if __name__ == '__main__':
    unittest.main()

#!/usr/bin/env python3
"""Offline bounded-read tests; no provider or application calls."""
import base64
import json
import os
from pathlib import Path
import signal
import sys
import tempfile
import time
import unittest
from unittest import mock

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import native_acceptance as entry
runner = entry.runner


class Response:
    def __init__(self, delay=0):
        self.delay = delay

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self, maximum):
        time.sleep(self.delay)
        return b'{}'


class ApiDeadlineTests(unittest.TestCase):
    def test_expired_budget_refuses_before_open(self):
        with mock.patch.dict(os.environ, GH_TOKEN='synthetic-offline-test'), \
             mock.patch.object(runner.urllib.request, 'build_opener') as opener:
            with self.assertRaisesRegex(runner.Refusal, '^INDEPENDENT_REVIEW_DEADLINE$'):
                runner.api('/repos/'+runner.REPOSITORY, deadline=time.monotonic()-1)
            opener.assert_not_called()

    def test_absolute_deadline_interrupts_open_and_response_read(self):
        original_handler = signal.getsignal(signal.SIGALRM)
        self.assertEqual(signal.getitimer(signal.ITIMER_REAL), (0.0, 0.0))
        for phase in ('open', 'read'):
            with self.subTest(phase=phase):
                def fake_open(request, timeout):
                    self.assertLessEqual(timeout, 0.05)
                    if phase == 'open':
                        time.sleep(0.2)
                    return Response(delay=0.2 if phase == 'read' else 0)
                opener = mock.Mock()
                opener.open.side_effect = fake_open
                start = time.monotonic()
                with mock.patch.dict(os.environ, GH_TOKEN='synthetic-offline-test'), \
                     mock.patch.object(runner.urllib.request, 'build_opener', return_value=opener):
                    with self.assertRaisesRegex(runner.Refusal, '^INDEPENDENT_REVIEW_DEADLINE$'):
                        runner.api('/repos/'+runner.REPOSITORY, deadline=start+0.04)
                self.assertLess(time.monotonic()-start, 0.18)
                self.assertEqual(signal.getitimer(signal.ITIMER_REAL), (0.0, 0.0))
                self.assertIs(signal.getsignal(signal.SIGALRM), original_handler)

    def test_success_restores_handler_and_alarm(self):
        original_handler = signal.getsignal(signal.SIGALRM)
        opener = mock.Mock()
        opener.open.return_value = Response()
        with mock.patch.dict(os.environ, GH_TOKEN='synthetic-offline-test'), \
             mock.patch.object(runner.urllib.request, 'build_opener', return_value=opener):
            self.assertEqual(runner.api('/repos/'+runner.REPOSITORY, deadline=time.monotonic()+1), {})
        self.assertGreater(opener.open.call_args.kwargs['timeout'], 0)
        self.assertLessEqual(opener.open.call_args.kwargs['timeout'], 1)
        self.assertEqual(signal.getitimer(signal.ITIMER_REAL), (0.0, 0.0))
        self.assertIs(signal.getsignal(signal.SIGALRM), original_handler)

    def test_initial_artifact_reads_receive_same_deadline(self):
        executor = {'runId': '99', 'workflowCommit': '8'*40}
        artifact = {'id': 102, 'name': 'synthetic-final', 'expired': False,
                    'workflow_run': {'id': 99, 'head_sha': '8'*40}, 'size_in_bytes': 1000,
                    'digest': 'sha256:'+'a'*64, 'created_at': '2026-11-08T12:00:00Z',
                    'expires_at': '2026-11-15T12:00:00Z'}
        values = [artifact, {'total_count': 1, 'artifacts': [artifact]}]
        with mock.patch.object(runner, 'api', side_effect=values) as api:
            runner.service_artifact({'executor': executor}, '102', 'a'*64, deadline=12345.5)
        self.assertEqual(len(api.call_args_list), 2)
        self.assertTrue(all(call.kwargs['deadline'] == 12345.5 for call in api.call_args_list))


class CompleteAckDeadlineTests(unittest.TestCase):
    def make_root(self, path):
        root = Path(path)
        (root/'run-contract.json').write_text(json.dumps({'executor': {'runId': '99',
                                                                    'workflowCommit': '8'*40}}))
        return root

    def test_initial_metadata_uses_wait_budget_and_last_sleep_is_capped(self):
        clock = [100.0]
        seen = []
        sleeps = []
        def service(*args, deadline=None):
            seen.append(('service', deadline))
            clock[0] = 109.8
            return {'id': 102, 'sha256': 'a'*64}
        def api(*args, deadline=None, **kwargs):
            seen.append(('poll', deadline))
            clock[0] += 0.05
            return None
        def sleep(seconds):
            sleeps.append(seconds)
            clock[0] += seconds
        with tempfile.TemporaryDirectory() as d, \
             mock.patch.object(runner.time, 'monotonic', side_effect=lambda: clock[0]), \
             mock.patch.object(runner.time, 'sleep', side_effect=sleep), \
             mock.patch.object(runner, 'validate_contract'), \
             mock.patch.object(runner, 'package_bindings', return_value={}), \
             mock.patch.object(runner, 'require_remaining_lifetime'), \
             mock.patch.object(runner, 'service_artifact', side_effect=service), \
             mock.patch.object(runner, 'api', side_effect=api):
            root = self.make_root(d)
            with self.assertRaisesRegex(runner.Refusal, '^INDEPENDENT_REVIEW_DEADLINE$'):
                runner.await_review(root, 'packages-and-executor', '102', 'a'*64, 10)
            self.assertFalse((root/'source-review.json').exists())
        self.assertEqual(seen, [('service', 110.0), ('poll', 110.0)])
        self.assertEqual(len(sleeps), 1)
        self.assertAlmostEqual(sleeps[0], 0.15)
        self.assertEqual(clock[0], 110.0)

    def test_late_valid_ack_is_not_committed_after_deadline(self):
        clock = [100.0]
        deadline_calls = []
        receipt = json.dumps({'artifactId': 102, 'artifactSHA256': 'a'*64}).encode()
        def api(path, *, deadline=None, **kwargs):
            deadline_calls.append(deadline)
            if '/git/ref/' in path:
                return {'object': {'sha': '9'*40}}
            if '/commits/' in path:
                return {'author': {'login': 'empireaios', 'id': 295548100}}
            clock[0] = 110.1
            return {'type': 'file', 'encoding': 'base64', 'size': len(receipt),
                    'content': base64.b64encode(receipt).decode()}
        with tempfile.TemporaryDirectory() as d, \
             mock.patch.object(runner.time, 'monotonic', side_effect=lambda: clock[0]), \
             mock.patch.object(runner, 'validate_contract'), \
             mock.patch.object(runner, 'package_bindings', return_value={}), \
             mock.patch.object(runner, 'require_remaining_lifetime'), \
             mock.patch.object(runner, 'verify_ack'), \
             mock.patch.object(runner, 'service_artifact', return_value={'id': 102, 'sha256': 'a'*64}), \
             mock.patch.object(runner, 'api', side_effect=api):
            root = self.make_root(d)
            with self.assertRaisesRegex(runner.Refusal, '^INDEPENDENT_REVIEW_DEADLINE$'):
                runner.await_review(root, 'packages-and-executor', '102', 'a'*64, 10)
            self.assertFalse((root/'source-review.json').exists())
            self.assertFalse((root/'review-transport-packages-and-executor.json').exists())
        self.assertEqual(deadline_calls, [110.0, 110.0, 110.0])


if __name__ == '__main__':
    unittest.main()

"""Local process/transport fault fixtures, never native A5 acceptance."""
import importlib.util
import json
import os
from pathlib import Path
import sys
import unittest

sys.dont_write_bytecode = True
SOURCE = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(SOURCE/'v65/foundation/runtime'))
sys.path.insert(0, str(SOURCE/'v65/foundation/controller/scripts/work8/native-transition'))
import native_diagnostics

spec = importlib.util.spec_from_file_location('v104_launch_controller', SOURCE/'v65/foundation/runtime/launch-controller.py')
supervisor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(supervisor)


def diagnostic(assertion='LIVE_BRAIN_CAPTURE_FAILED'):
    return native_diagnostics.sanitize({'schema': native_diagnostics.SCHEMA,
        'stage': 'NORMAL_VIEW', 'operation': 'EXAMINATION_ASSERTION',
        'assertion': assertion, 'errno': 'EACCES', 'privateRecords': 'DO_NOT_EXPORT'})


def line(value):
    return supervisor.NativeFailureCapture.PREFIX + json.dumps(value).encode() + b'\n'


class NativeSupervisorReturnTests(unittest.TestCase):
    def capture(self):
        return supervisor.NativeFailureCapture(native_diagnostics.sanitize)

    def run_fixture(self, script, seconds=2):
        return supervisor.supervise([sys.executable, '-B', '-c', script],
            {'PATH': os.environ.get('PATH', ''), 'PYTHONDONTWRITEBYTECODE': '1'},
            seconds, cleanup_seconds=1, native_sanitizer=native_diagnostics.sanitize)

    def test_split_record_preserves_first_safe_failure_only(self):
        capture = self.capture()
        original = diagnostic()
        raw = line({**original, 'privateRecords': 'NEVER_RETAIN_THIS'})
        self.assertFalse(capture.feed(1, raw[:17]))
        self.assertTrue(capture.feed(1, raw[17:]))
        self.assertEqual(capture.first, original)
        self.assertFalse(capture.feed(2, line(diagnostic('ACTUAL_NATIVE_STARTUP_DEADLINE'))))
        self.assertEqual(capture.first, original)
        self.assertNotIn('NEVER_RETAIN_THIS', json.dumps(capture.first))

    def test_overlong_malformed_and_cross_stream_records_do_not_replace_cause(self):
        capture = self.capture()
        self.assertFalse(capture.feed(1, b'x' * 20000))
        self.assertLessEqual(sum(map(len, capture.buffers.values())), capture.MAX_LINE)
        self.assertFalse(capture.feed(1, line(diagnostic())))
        self.assertFalse(capture.feed(1, b'WORK8_NATIVE_FIRST_FAILURE {bad}\n'))
        raw = line(diagnostic())
        self.assertFalse(capture.feed(1, raw[:40]))
        self.assertFalse(capture.feed(2, raw[40:]))
        self.assertTrue(capture.feed(1, raw[40:]))
        self.assertEqual(capture.first, diagnostic())

    def test_hostile_values_are_sanitized_without_raw_error_text(self):
        capture = self.capture()
        hostile = {'schema': native_diagnostics.SCHEMA,
            'stage': 'owner-secret', 'operation': 'owner-secret',
            'assertion': 'owner-secret', 'errno': 'owner-secret',
            'sourceFrames': ['owner-secret:1:2'], 'identity': {'pid': 'owner-secret'}}
        self.assertTrue(capture.feed(1, line(hostile)))
        self.assertNotIn('owner-secret', json.dumps(capture.first))
        self.assertEqual(capture.first['assertion'], 'UNKNOWN')

    def test_invalid_projection_or_sanitizer_failure_is_ignored(self):
        def refusal(value):
            raise RuntimeError('PRIVATE_DIAGNOSTIC_REFUSED')
        for sanitizer in (lambda value: [], lambda value: {},
                          lambda value: {'schema': native_diagnostics.SCHEMA,
                                         'firstFailure': True, 'rawErrorOrRecordsRetained': True},
                          refusal):
            with self.subTest(sanitizer=sanitizer):
                capture = supervisor.NativeFailureCapture(sanitizer)
                self.assertFalse(capture.feed(1, line(diagnostic())))
                self.assertIsNone(capture.first)
                self.assertNotIn('PRIVATE_DIAGNOSTIC_REFUSED', repr(capture.__dict__))

    def test_clean_success_has_no_failure_record(self):
        observed = self.run_fixture("print('ordinary bounded output')")
        self.assertEqual(observed['controllerExitCode'], 0)
        self.assertIsNone(observed['firstNativeFailure'])
        self.assertIsNone(observed['firstObservedFailureKind'])
        self.assertFalse(observed['rawOutputRetained'])

    def test_nonzero_process_retains_safe_native_failure(self):
        raw = line(diagnostic())
        observed = self.run_fixture('import os;os.write(2,' + repr(raw) + ');raise SystemExit(7)')
        self.assertEqual(observed['controllerExitCode'], 7)
        self.assertEqual(observed['firstNativeFailure'], diagnostic())
        self.assertEqual(observed['firstObservedFailureKind'], 'NATIVE_DIAGNOSTIC')
        self.assertEqual(observed['nativeFailureObservationSequence'], 1)
        self.assertIsNone(observed['supervisorCauseObservationSequence'])
        self.assertTrue(observed['requiresImmediateRuntimeCleanup'])

    def test_later_supervisor_deadline_does_not_overwrite_native_failure(self):
        raw = line(diagnostic())
        observed = self.run_fixture('import os,time;os.write(1,' + repr(raw) + ');time.sleep(5)', seconds=.2)
        self.assertEqual(observed['firstNativeFailure'], diagnostic())
        self.assertEqual(observed['firstSupervisorCause'], 'CONTROLLER_STAGE_DEADLINE')
        self.assertEqual(observed['firstObservedFailureKind'], 'NATIVE_DIAGNOSTIC')
        self.assertLess(observed['nativeFailureObservationSequence'], observed['supervisorCauseObservationSequence'])
        self.assertTrue(observed['observationOrderOnly'])

    def test_supervisor_deadline_precedes_shutdown_native_diagnostic(self):
        raw = line(diagnostic())
        script = ('import os,signal,time\n'
                  'def stop(*args):\n os.write(2,' + repr(raw) + ');raise SystemExit(7)\n'
                  'signal.signal(signal.SIGINT,stop)\ntime.sleep(5)')
        observed = self.run_fixture(script, seconds=.2)
        self.assertEqual(observed['firstNativeFailure'], diagnostic())
        self.assertEqual(observed['firstSupervisorCause'], 'CONTROLLER_STAGE_DEADLINE')
        self.assertEqual(observed['firstObservedFailureKind'], 'SUPERVISOR')
        self.assertLess(observed['supervisorCauseObservationSequence'], observed['nativeFailureObservationSequence'])


if __name__ == '__main__':
    unittest.main(verbosity=2)

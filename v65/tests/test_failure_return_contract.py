"""Deterministic V104 failure-return composition; no application acceptance.

Uses retained provider preflight bytes plus the existing explicitly
representative full-receipt fixture. Set V104_RETAINED_PREFLIGHT and
V104_RETAINED_ACK to the independently verified V103 checkpoint paths.
"""
import ast
import copy
import importlib.util
import json
import os
from pathlib import Path
import shutil
import sys
import tarfile
import tempfile
import unittest
from unittest import mock

sys.dont_write_bytecode = True
SOURCE = Path(__file__).resolve().parents[2]
sys.path[:0] = [str(SOURCE/'v65/adapter'), str(SOURCE/'v65/foundation/runtime'), str(SOURCE/'v65/tests')]
import runner
import final_evidence as final
import test_final_evidence as fixture
from runtime_common import Refusal
D = SOURCE/'v65/foundation/controller/scripts/work8/native-transition'
native = final.diagnostic_module('native_diagnostics')
controller = final.diagnostic_module('controller_failure')
supervisor = runner.load_module('v104_test_supervisor', SOURCE/'v65/foundation/runtime/launch-controller.py')
fixture.RETAINED = Path(os.environ['V104_RETAINED_PREFLIGHT'])
fixture.ACK2 = Path(os.environ['V104_RETAINED_ACK'])


def write(path, value):
    fixture.write(path, value)


def fault():
    return native.sanitize({'schema': native.SCHEMA, 'stage': 'NORMAL_VIEW',
        'assertion': 'PHASE_DEADLINE', 'operation': 'EXAMINATION_ASSERTION', 'errno': 'EACCES',
        'sourceFrames': ['examine-v26.py:143:0']})


class FailureReturnContract(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = fixture.representative(Path(self.temp.name)/'campaign')

    def tearDown(self):
        self.temp.cleanup()

    def archive(self):
        receipt = final.verify_final_directory(self.root/'final-export')
        archive = self.root/'final-export/evidence-export.tar.gz'
        self.assertEqual(receipt['sha256'], final.sha(archive.read_bytes()))
        with tarfile.open(archive) as stream:
            files = {m.name: stream.extractfile(m).read() for m in stream.getmembers()}
        index = json.loads(files['export-index.json'])
        for row in index['files']:
            self.assertEqual(row['bytes'], len(files[row['path']]))
            self.assertEqual(row['sha256'], final.sha(files[row['path']]))
        self.assertFalse(index['applicationAcceptance'])
        return receipt, files

    def fail_export(self):
        (self.root/'evidence/full/browser-lifecycle.json').unlink(missing_ok=True)
        fixture.reindex(self.root)
        with self.assertRaises(Refusal):
            final.finalize(self.root, runner.exporter(self.root))
        receipt, files = self.archive()
        self.assertEqual(receipt['label'], 'failure')
        self.assertNotIn('evidence/full/browser-lifecycle.json', files)
        return files

    def host_fault(self, error=None):
        error = error or AssertionError('PHASE_DEADLINE:normal-observed.json')
        self.assertTrue(controller.preserve(self.root/'evidence/full', error, 'normal-view', 'full',
            make_failure=native.from_error, parse_browser=lambda _: {'diagnostics': []}))

    def test_success_complete_receipts_and_historical_preflight_diagnostic_roundtrip(self):
        self.assertTrue((self.root/'evidence/preflight/first-native-failure.json').exists())
        result = final.finalize(self.root, runner.exporter(self.root))
        self.assertEqual(result['label'], 'final')
        receipt, files = self.archive()
        self.assertEqual(receipt['label'], 'final')
        self.assertTrue({final.FULL+n for n in final.REQUIRED_FULL} <= set(files))
        self.assertFalse(result['applicationAcceptance'])

    def test_controlled_native_fault_cleanup_and_independent_failure_readback(self):
        first = fault()
        write(self.root/'evidence/full/first-native-failure.json', first)
        self.host_fault()
        source = "import sys;print('WORK8_NATIVE_FIRST_FAILURE '+"+repr(json.dumps(first))+",flush=True);sys.exit(1)"
        observed = supervisor.supervise([sys.executable, '-c', source], {'PATH': os.environ['PATH']}, 5,
                                       native_sanitizer=native.sanitize)
        contract = fixture.read(self.root/'run-contract.json')
        write(self.root/'controller-supervisor-full.json', {'schema': 'work8-v65-controller-supervisor-v1',
            'phase': 'full', 'sessionId': contract['executor']['sessionId'], 'status': 'FAIL_CLOSED',
            'wholeRowsAccepted': [], **observed})
        runner.preserve_first_failure(self.root, 'native', runner.Refusal('NATIVE_CONTROLLER_FIRST_FAILURE'))
        first_runtime = (self.root/'runtime-evidence/first-runtime-failure.json').read_bytes()
        with mock.patch.object(runner, 'run', return_value=b''):
            self.assertEqual(runner.cleanup(self.root)['status'], 'PASS_SCOPED_CLEANUP')
        files = self.fail_export()
        self.assertEqual((self.root/'runtime-evidence/first-runtime-failure.json').read_bytes(), first_runtime)
        p = json.loads(files['prior-cause-projections/evidence-full-first-native-failure.json'])
        self.assertEqual(p['nativeDiagnostic'], first)
        host = json.loads(files['prior-cause-projections/evidence-full-first-controller-failure.json'])
        self.assertEqual((host['stage'], host['operation'], host['marker']),
                         ('normal-view', 'WAIT_FOR_CONTROL_MARKER', 'normal-observed.json'))
        sup = json.loads(files['prior-cause-projections/controller-supervisor-full.json'])
        self.assertEqual(sup['nativeDiagnostic'], first)
        self.assertEqual(sup['controllerExitCode'], 1)
        self.assertTrue(sup['observationOrderOnly'])
        self.assertNotEqual(p['phase'], json.loads(files['prior-cause-projections/evidence-preflight-first-native-failure.json'])['phase'])

    def test_host_first_receipt_never_overwritten_by_cleanup_error(self):
        self.host_fault(); path = self.root/'evidence/full/first-controller-failure.json'; before = path.read_bytes()
        controller.preserve(path.parent, RuntimeError('SECRET_CLEANUP_VALUE'), 'cleanup', 'full',
                            make_failure=native.from_error, parse_browser=lambda _: {'diagnostics': []})
        self.assertEqual(before, path.read_bytes())
        self.assertNotIn(b'SECRET_CLEANUP_VALUE', b''.join(self.fail_export().values()))

    def test_diagnostic_write_failure_cannot_replace_original_exception(self):
        primary = AssertionError('PHASE_DEADLINE:normal-observed.json')
        with mock.patch.object(controller.os, 'open', side_effect=OSError('private disk error')):
            self.assertFalse(controller.preserve(self.root/'evidence/full', primary, 'normal-view', 'full',
                make_failure=native.from_error, parse_browser=lambda _: {'diagnostics': []}))
        self.assertEqual(str(primary), 'PHASE_DEADLINE:normal-observed.json')
        with mock.patch.object(native, 'from_error', side_effect=ValueError('malformed')):
            self.assertFalse(controller.preserve(self.root/'evidence/full', primary, 'normal-view', 'full',
                make_failure=native.from_error, parse_browser=lambda _: {'diagnostics': []}))

    def test_browser_cause_retained_but_unknown_values_redacted(self):
        row = {'stage': 'NORMAL_AUTHENTICATION', 'firstFailure': True, 'name': 'TimeoutError',
            'code': 'BROWSER_TIMEOUT', 'sourceFrames': ['browser.mjs:24:2'], 'browserConnected': True,
            'ownerPageClosed': False, 'arbitraryErrorValuesRetained': False}
        write(self.root/'evidence/full/browser-stderr-sanitized.json', {
            'schema': 'work8-browser-sanitized-stderr-v1', 'stream': 'stderr', 'diagnostics': [row],
            'unclassifiedLinesOmitted': 8, 'arbitraryStderrRetained': False, 'privateField': 'PRIVATE_SENTINEL'})
        files = self.fail_export()
        p = json.loads(files['prior-cause-projections/evidence-full-browser-stderr-sanitized.json'])
        self.assertEqual(p['browserDiagnostics'], [row]); self.assertNotIn(b'PRIVATE_SENTINEL', b''.join(files.values()))
        row.update(code='PRIVATE_UPPERCASE_TOKEN', stage='PRIVATE_STAGE', sourceFrames=['/private/foo:1:2'])
        safe = final.bounded_browser(row, native)
        self.assertEqual(safe['code'], 'UNCLASSIFIED_ERROR'); self.assertEqual(safe['stage'], 'UNKNOWN')
        self.assertEqual(safe['sourceFrames'], [])

    def test_missing_sanitizer_still_exports_bounded_failure_archive(self):
        self.host_fault()
        with mock.patch.object(final, 'diagnostic_module', side_effect=FileNotFoundError('private-path')):
            files = self.fail_export()
        p = json.loads(files['prior-cause-projections/evidence-full-first-controller-failure.json'])
        self.assertEqual(p['status'], 'UNAVAILABLE_OR_INVALID')
        self.assertRegex(p['sourceReceiptSHA256'], '^[a-f0-9]{64}$')
        self.assertNotIn(b'private-path', b''.join(files.values()))

    def test_untrusted_nested_native_schema_does_not_abort_other_producers(self):
        write(self.root/'evidence/full/first-native-failure.json', {'schema': native.SCHEMA, 'sourceFrames': 7})
        self.host_fault(); files = self.fail_export()
        self.assertEqual(json.loads(files['prior-cause-projections/evidence-full-first-native-failure.json'])['status'], 'UNAVAILABLE_OR_INVALID')
        self.assertEqual(json.loads(files['prior-cause-projections/evidence-full-first-controller-failure.json'])['stage'], 'normal-view')

    def test_command_and_docker_receipts_survive_without_raw_output(self):
        write(self.root/'evidence/full/command-first-exception.json', {'schema': 'work8-v61-command-output-metadata-v1',
            'exception': {'exceptionClass': 'TimeoutExpired', 'configuredDeadlineMs': 1000,
                          'elapsedMonotonicMs': 1002, 'numericErrno': None}, 'exitCode': None,
            'safeFirstFailure': fault(), 'raw': 'PRIVATE_SENTINEL'})
        write(self.root/'evidence/full/host-private-handoff-first-failure.json', {
            'schema': 'WORK8_HOST_PRIVATE_HANDOFF_FAILURE_V1', 'operation': 'HOST_OPEN_PRIVATE_PARENT',
            'errno': 'EACCES', 'numericErrno': 13, 'identity': {'effectiveUid': 1001}, 'raw': 'PRIVATE_SENTINEL'})
        files = self.fail_export(); value = json.loads(files['prior-cause-projections/evidence-full-command-first-exception.json'])
        self.assertEqual(value['commandException']['exceptionClass'], 'TimeoutExpired')
        self.assertEqual(value['nativeDiagnostic']['errno'], 'EACCES')
        handoff = json.loads(files['prior-cause-projections/evidence-full-host-private-handoff-first-failure.json'])
        self.assertEqual(handoff['operation'], 'HOST_OPEN_PRIVATE_PARENT')
        self.assertEqual(handoff['errno'], 'EACCES')
        self.assertNotIn(b'PRIVATE_SENTINEL', b''.join(files.values()))

    def test_host_stage_and_marker_allowlist_covers_source_literals(self):
        tree = ast.parse((D/'examine-v26.py').read_text())
        stages = set(); markers = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'stage' for t in node.targets):
                stages.update(n.value for n in ast.walk(node.value) if isinstance(n, ast.Constant) and isinstance(n.value, str))
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == 'marker' and node.args and isinstance(node.args[0], ast.Constant):
                markers.add(node.args[0].value)
        self.assertLessEqual(stages, controller.HOST_STAGES)
        self.assertLessEqual(stages, final.HOST_STAGES)
        self.assertEqual(markers, controller.MARKERS)

    def test_all_failure_producers_fit_existing_archive_bound(self):
        self.host_fault()
        first = fault()
        first['sourceFrames'] = ['examine-v26.py:999999:999999']*8
        for phase in ('preflight', 'full'):
            write(self.root/'evidence'/phase/'first-native-failure.json', first)
        observed = {'schema': 'work8-v65-controller-supervisor-v1', 'phase': 'full',
            'controllerExitCode': -9, 'firstSupervisorCause': 'CONTROLLER_STAGE_DEADLINE',
            'firstNativeFailure': first, 'firstObservedFailureKind': 'NATIVE_DIAGNOSTIC',
            'nativeFailureObservationSequence': 1, 'supervisorCauseObservationSequence': 2}
        write(self.root/'controller-supervisor-full.json', observed)
        command = {'schema': 'work8-v61-command-output-metadata-v1', 'safeFirstFailure': first,
            'exception': {'exceptionClass': 'TimeoutExpired', 'configuredDeadlineMs': 2147483647,
                'elapsedMonotonicMs': 2147483647, 'numericErrno': 2147483647}, 'exitCode': -255}
        write(self.root/'evidence/full/command-first-exception.json', command)
        browser = {'stage': 'RECOVERY_AUTHENTICATED_CANONICAL_PRESENTATION', 'name': 'TimeoutError',
            'code': 'COMPONENT_VERIFIED_AVAILABILITY_BOUND_INVALID', 'sourceFrames': ['browser.mjs:999999:999999']*8,
            'browserConnected': True, 'ownerPageClosed': False, 'arbitraryErrorValuesRetained': False}
        write(self.root/'evidence/full/browser-stderr-sanitized.json', {'schema': 'work8-browser-sanitized-stderr-v1', 'diagnostics': [browser]})
        write(self.root/'evidence/full/transition-browser-result.json', {'failure': browser, 'failedStage': browser['stage']})
        files = self.fail_export()
        receipt, _ = self.archive()
        self.assertLessEqual((self.root/'final-export/evidence-export.tar.gz').stat().st_size, 16384)
        self.assertGreaterEqual(len(files), 10)


if __name__ == '__main__':
    unittest.main(verbosity=2)

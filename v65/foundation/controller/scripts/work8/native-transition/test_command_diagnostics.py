"""Controlled negative tests of the exact amended coordinator invocation."""
import ast
import hashlib
import json
import os
import pathlib
import subprocess
import sys
import tempfile
import unittest

import command_diagnostics
from native_diagnostics import from_error, save_first, sanitize

HERE = pathlib.Path(__file__).resolve().parent
NODE = pathlib.Path(os.environ['WORK8_TEST_NODE'])
MEMBERSHIP = pathlib.Path(os.environ['WORK8_TEST_MEMBERSHIP'])
RESULTS = []
ARTIFACTS = pathlib.Path(os.environ['WORK8_TEST_EVIDENCE'])
ARTIFACTS.mkdir(parents=True, exist_ok=True)


class DiagnosticControls(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='work8-v61-negative-')
        self.out = pathlib.Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def invoke(self, command, timeout=5, log='command.log'):
        # Compile the actual run() node without executing module-level app setup.
        tree = ast.parse((HERE / 'examine-v26.py').read_text())
        node = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == 'run')
        import time
        context = {'time': time, 'START': time.monotonic(),
                   'BUDGET': {'startedAtEpoch': time.time(), 'maximumSeconds': 1200,
                              'cleanupAndUploadReserveSeconds': 60},
                   'PLAN': {'preflightSeconds': 900, 'examinationSeconds': 1500},
                   'PREFLIGHT': True,
                   'OUT': self.out, 'stage': 'original-mounted-entrypoint-contract-before-startup',
                   'invoke_reviewed_command': command_diagnostics.invoke,
                   'emit_fallback': lambda out: None}
        exec(compile(ast.Module(body=[node], type_ignores=[]), 'examine-v26.py', 'exec'), context)
        return context['run'](command, timeout=timeout, log=log)

    def fixture(self, mode, behavior='exit'):
        sink = self.out / 'coordinator'; sink.mkdir()
        return [str(NODE), str(HERE / 'diagnostic-pipeline-control.mjs'), mode,
                str(MEMBERSHIP), str(sink), behavior]

    def preserve(self, test_id):
        target = ARTIFACTS / test_id; target.mkdir()
        for path in self.out.glob('*.json'):
            (target / path.name).write_bytes(path.read_bytes())
        for path in self.out.glob('*.log'):
            (target / path.name).write_bytes(path.read_bytes())
        RESULTS.append({'id': test_id, 'status': 'PASS', 'files': [
            {'path': str(path.relative_to(ARTIFACTS)), 'bytes': path.stat().st_size,
             'sha256': hashlib.sha256(path.read_bytes()).hexdigest()} for path in sorted(target.iterdir())]})

    def test_child_protected_entrypoint_through_actual_recorder(self):
        with self.assertRaisesRegex(RuntimeError, '^COMMAND_FAILED$'):
            self.invoke(self.fixture('protected-entrypoint'))
        first = json.loads((self.out / 'first-native-failure.json').read_text())
        self.assertEqual(first['assertion'], 'OPERATOR_PATH_NOT_PROTECTED')
        self.assertEqual(first['identity']['pid'], first['origin']['pid'])
        self.assertNotEqual(first['origin']['parentPid'], first['origin']['pid'])
        self.preserve('actual-child-protected-entrypoint')

    def test_timeout_preserves_partial_child_error(self):
        with self.assertRaisesRegex(RuntimeError, '^COMMAND_FAILED$'):
            self.invoke(self.fixture('system-errno', 'timeout'), timeout=1)
        first = json.loads((self.out / 'first-native-failure.json').read_text())
        meta = json.loads((self.out / 'command-first-exception.json').read_text())
        self.assertEqual(first['assertion'], 'ENOENT')
        self.assertEqual(first['errno'], 'ENOENT')
        self.assertEqual(first['commandException']['exceptionClass'], 'TimeoutExpired')
        self.assertEqual(meta['exception']['exceptionClass'], 'TimeoutExpired')
        self.assertGreater(meta['rawOutputBytes'], 0)
        self.assertEqual(meta['exception']['configuredDeadlineMs'], 1000)
        self.preserve('timeout-with-valid-child-partial')

    def test_invalid_utf8_does_not_discard_child_cause(self):
        with self.assertRaisesRegex(RuntimeError, '^COMMAND_FAILED$'):
            self.invoke(self.fixture('system-errno', 'invalid-utf8'))
        first = json.loads((self.out / 'first-native-failure.json').read_text())
        self.assertEqual(first['assertion'], 'ENOENT')
        self.assertEqual(first['origin']['pid'], first['identity']['pid'])
        self.preserve('invalid-utf8-before-valid-child-receipt')

    def test_unterminated_stdout_cannot_destroy_stderr_frame(self):
        with self.assertRaisesRegex(RuntimeError, '^COMMAND_FAILED$'):
            self.invoke(self.fixture('system-errno', 'unterminated-stdout'))
        first = json.loads((self.out / 'first-native-failure.json').read_text())
        self.assertEqual(first['assertion'], 'ENOENT')
        meta = json.loads((self.out / 'command-first-exception.json').read_text())
        self.assertGreater(meta['streams']['stdout']['bytes'], 0)
        self.assertGreater(meta['streams']['stderr']['bytes'], 0)
        self.assertNotIn('private arbitrary', json.dumps(meta))
        self.preserve('unterminated-stdout-separate-stderr-frame')

    def test_real_spawn_oserror_and_first_failure_immutable(self):
        with self.assertRaisesRegex(RuntimeError, '^COMMAND_FAILED$'):
            self.invoke([str(self.out / 'does-not-exist')])
        before = (self.out / 'first-native-failure.json').read_bytes()
        first = json.loads(before)
        self.assertEqual(first['errno'], 'ENOENT')
        self.assertEqual(first['commandException']['exceptionClass'], 'OSError')
        self.assertEqual(first['commandException']['numericErrno'], 2)
        save_first(self.out, from_error(RuntimeError('ACTUAL_RUNTIME_EXITED'), 'CLEANUP', 'EXAMINATION_ASSERTION'))
        self.assertEqual((self.out / 'first-native-failure.json').read_bytes(), before)
        self.preserve('real-spawn-oserror-cleanup-overwrite-refused')

    def test_untrusted_secret_suppressed_end_to_end(self):
        with self.assertRaisesRegex(RuntimeError, '^COMMAND_FAILED$'):
            self.invoke(self.fixture('untrusted-message'))
        first = json.loads((self.out / 'first-native-failure.json').read_text())
        self.assertEqual(first['assertion'], 'UNCLASSIFIED_NATIVE_STARTUP_ERROR')
        for path in self.out.rglob('*'):
            if path.is_file():
                self.assertNotIn(('AK' + 'IA' + 'A' * 16).encode(), path.read_bytes())
                self.assertNotIn(b'private fixture', path.read_bytes())
        self.preserve('secret-suppression-through-coordinator')

    def test_parent_failure_after_child_cannot_replace_first(self):
        with self.assertRaises(RuntimeError): self.invoke(self.fixture('system-errno'))
        before = (self.out / 'first-native-failure.json').read_bytes()
        with self.assertRaises(RuntimeError): self.invoke([str(self.out / 'missing-after-child')], log='cleanup.log')
        self.assertEqual(before, (self.out / 'first-native-failure.json').read_bytes())
        self.assertEqual(json.loads(before)['assertion'], 'ENOENT')
        self.preserve('later-parent-failure-cannot-replace-child')


if __name__ == '__main__':
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(DiagnosticControls)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    receipt = {'schema': 'work8-v62-first-error-negative-controls-v1',
               'status': 'PASS' if result.wasSuccessful() else 'FAIL',
               'testsRun': result.testsRun, 'testsPassed': len(RESULTS),
               'node': subprocess.check_output([str(NODE), '--version'], text=True).strip(),
               'actualCoordinatorFunctionSource': 'coordinator.mjs:retainFirst (unchanged extracted exact source)',
               'actualControllerInvocation': 'examine-v26.py:run AST executes command_diagnostics.invoke',
               'nativeApplicationStarted': False, 'containerExecution': False,
               'uploadAndIndependentReadback': 'PENDING_ROOT', 'tests': RESULTS,
               'source': [{'file': path.name, 'bytes': path.stat().st_size,
                           'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
                          for path in sorted(HERE.iterdir()) if path.is_file()]}
    (ARTIFACTS / 'negative-control-result.json').write_text(json.dumps(receipt, indent=2) + '\n')
    sys.exit(0 if result.wasSuccessful() else 1)

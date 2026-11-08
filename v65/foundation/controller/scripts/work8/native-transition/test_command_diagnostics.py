"""Controlled negative tests of the exact amended coordinator invocation."""
import ast
import hashlib
import json
import os
import errno
import stat
import traceback
import pathlib
import subprocess
import sys
import tempfile
import unittest

import command_diagnostics
from native_diagnostics import ERRNOS, from_error, save_first, sanitize

HERE = pathlib.Path(__file__).resolve().parent
NODE = pathlib.Path(os.environ['WORK8_TEST_NODE'])
MEMBERSHIP = pathlib.Path(os.environ['WORK8_TEST_MEMBERSHIP'])
CONTROL_IDS = {
    'test_child_protected_entrypoint_through_actual_recorder': 'actual-child-protected-entrypoint',
    'test_timeout_preserves_partial_child_error': 'timeout-with-valid-child-partial',
    'test_invalid_utf8_does_not_discard_child_cause': 'invalid-utf8-before-valid-child-receipt',
    'test_unterminated_stdout_cannot_destroy_stderr_frame': 'unterminated-stdout-separate-stderr-frame',
    'test_real_spawn_oserror_and_first_failure_immutable': 'real-spawn-oserror-cleanup-overwrite-refused',
    'test_untrusted_secret_suppressed_end_to_end': 'secret-suppression-through-coordinator',
    'test_parent_failure_after_child_cannot_replace_first': 'later-parent-failure-cannot-replace-child',
}
ARTIFACTS = pathlib.Path(os.environ['WORK8_TEST_EVIDENCE'])
ARTIFACTS.mkdir(mode=0o700, parents=True, exist_ok=True)
if not ARTIFACTS.is_absolute() or ARTIFACTS.resolve() != ARTIFACTS or not stat.S_ISDIR(ARTIFACTS.lstat().st_mode):
    raise ValueError('DIAGNOSTIC_EVIDENCE_ROOT_REFUSED')
CASES = ARTIFACTS / 'cases'
CASES.mkdir(mode=0o700)


def encoded(value):
    return (json.dumps(value, sort_keys=True, separators=(',', ':')) + '\n').encode()


def write_exclusive(path, value):
    data = encoded(value)
    if not 0 < len(data) <= 32768:
        raise ValueError('DIAGNOSTIC_EVIDENCE_BOUND')
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data); stream.flush(); os.fsync(stream.fileno())
    directory = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try: os.fsync(directory)
    finally: os.close(directory)
    return {'path': str(path.relative_to(ARTIFACTS)), 'bytes': len(data),
            'sha256': hashlib.sha256(data).hexdigest()}


def first_error(path):
    if not path.exists():
        return None
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    with os.fdopen(fd, 'rb') as stream:
        info = os.fstat(stream.fileno())
        if not stat.S_ISREG(info.st_mode) or info.st_nlink != 1 or info.st_uid != os.getuid() or not 0 < info.st_size <= 16384:
            raise ValueError('DIAGNOSTIC_FIRST_ERROR_FILE_REFUSED')
        data = stream.read(16385)
    if len(data) != info.st_size:
        raise ValueError('DIAGNOSTIC_FIRST_ERROR_CHANGED')
    value = json.loads(data)
    safe = sanitize(value)
    if value != safe:
        raise ValueError('DIAGNOSTIC_FIRST_ERROR_FIELDS_REFUSED')
    return safe


def control_failure(error):
    kind, value, trace = error
    known = errno.errorcode.get(getattr(value, 'errno', None))
    frames = [f'test_command_diagnostics.py:{frame.lineno}:0'
              for frame in traceback.extract_tb(trace)
              if pathlib.Path(frame.filename).resolve() == pathlib.Path(__file__).resolve()
              and 0 < frame.lineno < 1000000][-8:]
    return {'exceptionClass': kind.__name__ if kind in (AssertionError, OSError, ValueError, RuntimeError, KeyError, TypeError) else 'OTHER',
            'operation': 'ASSERT_DIAGNOSTIC_CONTROL', 'errno': known if known in ERRNOS else None,
            'sourceFrames': frames, 'rawErrorRetained': False}


class DiagnosticResult(unittest.TextTestResult):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.records = []

    def _exc_info_to_string(self, error, test):
        # unittest's default traceback may echo arbitrary assertion operands.
        return json.dumps(control_failure(error), sort_keys=True)

    def startTest(self, test):
        test.control_sequence = self.testsRun + 1
        super().startTest(test)

    def record(self, test, status, error=None):
        try:
            row = test.capture()
        except BaseException:
            if test.tmp is not None: test.tmp._finalizer.detach()
            raise RuntimeError('DIAGNOSTIC_EVIDENCE_CUSTODY_FAILED') from None
        existing = next((entry for entry in self.records if entry['id'] == test.control_id), None)
        if existing is not None:
            existing['status'] = 'FAIL'
            return
        entry = {'id': test.control_id, 'status': status, 'sequence': test.control_sequence,
                 'files': [row], 'cleanup': test.cleanup_record}
        if error is not None:
            failure = {'schema': 'work8-v87-first-failed-diagnostic-control-v1',
                       'id': test.control_id, 'sequence': test.control_sequence,
                       'caseReceipt': row, 'controlFailure': control_failure(error),
                       'capturedBeforeTeardown': not test.teardown_started,
                       'applicationStarted': False}
            try: write_exclusive(ARTIFACTS / 'first-failed-control.json', failure)
            except FileExistsError: pass
        self.records.append(entry)

    def addSuccess(self, test):
        self.record(test, 'PASS')
        super().addSuccess(test)

    def addFailure(self, test, error):
        self.record(test, 'FAIL', error)
        super().addFailure(test, error)

    def addError(self, test, error):
        self.record(test, 'FAIL', error)
        super().addError(test, error)


class DiagnosticControls(unittest.TestCase):
    def __init__(self, methodName='runTest'):
        super().__init__(methodName)
        self.control_id = CONTROL_IDS[methodName]
        self.case_receipt = None
        self.teardown_started = False
        self.teardown_complete = False
        self.tmp = self.out = None
        self.cleanup_record = {'status':'NOT_CREATED', 'privateTemporaryDirectoryRemoved':True,
                               'caseSHA256BeforeCleanup':None, 'caseSHA256AfterCleanup':None}

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='private-control-', dir=ARTIFACTS)
        self.out = pathlib.Path(self.tmp.name)
        self.cleanup_record['status'] = 'PENDING'
        self.cleanup_record['privateTemporaryDirectoryRemoved'] = False

    def tearDown(self):
        # Preserve structured first-error bytes before deleting private fixtures,
        # including when unittest has already recorded an assertion failure.
        try:
            row = self.capture()
        except BaseException:
            # Never silently erase an error whose safe custody could not be
            # established. It stays in this private, unexported scoped folder.
            if self.tmp is not None: self.tmp._finalizer.detach()
            raise
        self.teardown_started = True
        before = hashlib.sha256((ARTIFACTS / row['path']).read_bytes()).hexdigest()
        try:
            self.tmp.cleanup()
        finally:
            after = hashlib.sha256((ARTIFACTS / row['path']).read_bytes()).hexdigest()
            removed = not self.out.exists()
            self.cleanup_record.update(status='PASS' if removed and before == after == row['sha256'] else 'FAIL',
                privateTemporaryDirectoryRemoved=removed, caseSHA256BeforeCleanup=before, caseSHA256AfterCleanup=after)
        self.teardown_complete = True
        if self.cleanup_record['status'] != 'PASS':
            raise RuntimeError('DIAGNOSTIC_FIRST_ERROR_CUSTODY_CHANGED')

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

    def capture(self):
        if self.case_receipt is not None:
            return self.case_receipt
        safe = first_error(self.out / 'first-native-failure.json') if self.out is not None else None
        receipt = {'schema': 'work8-v87-diagnostic-control-case-v1',
                   'id': self.control_id, 'sequence': self.control_sequence,
                   'firstError': safe,
                   'firstErrorSHA256': hashlib.sha256(encoded(safe)).hexdigest() if safe is not None else None,
                   'controlSourceSHA256': hashlib.sha256(pathlib.Path(__file__).read_bytes()).hexdigest(),
                   'capturedBeforeTeardown': True, 'rawOutputRetained': False,
                   'applicationStarted': False}
        self.case_receipt = write_exclusive(CASES / (self.control_id + '.json'), receipt)
        return self.case_receipt

    def preserve(self, test_id):
        if test_id != self.control_id:
            raise ValueError('DIAGNOSTIC_CONTROL_ID_CHANGED')
        self.capture()

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
    result = unittest.TextTestRunner(verbosity=2, resultclass=DiagnosticResult).run(suite)
    receipt = {'schema': 'work8-v62-first-error-negative-controls-v1',
               'status': 'PASS' if result.wasSuccessful() else 'FAIL',
               'testsRun': result.testsRun, 'testsPassed': sum(row['status'] == 'PASS' for row in result.records),
               'testsFailed': sum(row['status'] == 'FAIL' for row in result.records),
               'node': subprocess.check_output([str(NODE), '--version'], text=True).strip(),
               'actualCoordinatorFunctionSource': 'coordinator.mjs:retainFirst (unchanged extracted exact source)',
               'actualControllerInvocation': 'examine-v26.py:run AST executes command_diagnostics.invoke',
               'nativeApplicationStarted': False, 'containerExecution': False,
               'uploadAndIndependentReadback': 'PENDING_ROOT', 'tests': result.records,
               'caseEvidenceSchema': 'work8-v87-diagnostic-control-case-v1',
               'firstFailedControl': ({'path': 'first-failed-control.json',
                   'bytes': (ARTIFACTS / 'first-failed-control.json').stat().st_size,
                   'sha256': hashlib.sha256((ARTIFACTS / 'first-failed-control.json').read_bytes()).hexdigest()}
                   if (ARTIFACTS / 'first-failed-control.json').exists() else None),
               'source': [{'file': path.name, 'bytes': path.stat().st_size,
                           'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
                          for path in sorted(HERE.iterdir()) if path.is_file()]}
    write_exclusive(ARTIFACTS / 'negative-control-result.json', receipt)
    sys.exit(0 if result.wasSuccessful() else 1)

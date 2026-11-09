"""Focused V96 diagnostic controls; no Docker runtime or native acceptance claim."""
import json
import os
import pathlib
import tempfile
import unittest

import docker_diagnostics as diagnostic


class DockerDiagnosticControls(unittest.TestCase):
    def classify(self, text, source='DOCKER_CLI_STDERR', args=None):
        return diagnostic.classify(text, source=source, args=args or ['docker', 'run', '-d'])

    def test_mount_readonly_cause_with_literal_safe_context(self):
        result = self.classify('docker: Error response from daemon: failed to create task: OCI runtime create failed: error mounting "tmpfs" to rootfs at "/frontend/app/.next/cache": mkdirat /frontend/app/.next/cache: read-only file system')
        self.assertEqual(result['safeErrorCode'], 'MOUNT_DESTINATION_CREATION_FAILED')
        self.assertEqual(result['errno'], 'EROFS')
        self.assertEqual(result['numericErrno'], 30)
        self.assertEqual(result['pathContext'], 'FRONTEND_NEXT_CACHE')
        self.assertEqual(result['mountKind'], 'TMPFS')

    def test_missing_permission_and_operation_errors(self):
        for phrase, code in [('no such file or directory', 'ENOENT'), ('permission denied', 'EACCES'),
                             ('operation not permitted', 'EPERM'), ('not a directory', 'ENOTDIR')]:
            with self.subTest(code=code):
                result = self.classify('OCI runtime create failed: mount /frontend: ' + phrase)
                self.assertEqual(result['errno'], code)
                self.assertEqual(result['safeErrorCode'], 'MOUNT_OPERATION_FAILED')

    def test_exec_namespace_and_cgroup_classification(self):
        for text, code in [('exec /frontend/runtime/bin/node: ENOENT', 'PROCESS_EXECUTION_FAILED'),
                           ('setns: operation not permitted', 'NAMESPACE_OPERATION_FAILED'),
                           ('cgroup: permission denied', 'CGROUP_OPERATION_FAILED')]:
            with self.subTest(code=code):
                self.assertEqual(self.classify('OCI runtime create failed: ' + text)['safeErrorCode'], code)

    def test_exit125_or_app_words_do_not_establish_oci_cause(self):
        result = self.classify('exit 125: app said mkdir mount /frontend/app/.next/cache EROFS')
        self.assertEqual(result['safeErrorCode'], 'DOCKER_CLI_ERROR_UNCLASSIFIED')
        self.assertIsNone(result['errno'])
        self.assertEqual(result['pathContext'], 'UNCLASSIFIED')
        self.assertFalse(result['causeInferredFromExitCode'])

    def test_unknown_actual_infrastructure_error_is_explicit(self):
        self.assertEqual(self.classify('OCI runtime create failed: opaque vendor failure')['safeErrorCode'], 'OCI_ERROR_UNCLASSIFIED')

    def test_attached_child_cannot_forge_infrastructure_diagnostic(self):
        raw = 'docker: Error response from daemon: OCI runtime create failed: mount /frontend/app/.next/cache: EROFS'
        for args in [['docker', 'run', 'image'], ['docker', 'run', '-d', '--detach=false', 'image'],
                     ['docker', 'run', '-d', '--detach=False', 'image'],
                     ['docker', 'run', '-d', '--detach=FALSE', 'image'],
                     ['docker', 'run', '-d', '-d=False', 'image'],
                     ['docker', 'run', '-d', '--attach=stderr', 'image'],
                     ['docker', 'start', '-a', 'container']]:
            with self.subTest(args=args):
                result = self.classify(raw, args=args)
                self.assertEqual(result['safeErrorCode'], 'DOCKER_CLI_ERROR_UNCLASSIFIED')
                self.assertIsNone(result['errno'])
                self.assertEqual(result['pathContext'], 'UNCLASSIFIED')

    def test_nonattached_start_and_create_allow_daemon_diagnostics(self):
        for args in [['docker', 'create', 'image'], ['docker', 'start', 'scoped-container'],
                     ['docker', 'run', '--detach', 'image']]:
            with self.subTest(args=args):
                self.assertEqual(self.classify('OCI runtime create failed: ENOENT', args=args)['errno'], 'ENOENT')

    def test_state_error_classification(self):
        result = self.classify('mkdir /frontend/app/.next/cache: EROFS', source='CONTAINER_STATE_ERROR', args=['docker', 'inspect', 'scoped-container'])
        self.assertEqual(result['operation'], 'DOCKER_INSPECT_STATE')
        self.assertEqual(result['errno'], 'EROFS')

    def test_argv_and_source_gate_refuse_unreviewed_commands(self):
        for args in [['sh', '-c', 'docker run'], ['/tmp/docker', 'run'], ['docker', 'rm'], ['docker', 'exec'], ['docker']]:
            with self.subTest(args=args):
                self.assertIsNone(self.classify('OCI runtime error', args=args))
        self.assertIsNone(self.classify('OCI runtime error', source='STDOUT'))
        self.assertIsNone(self.classify('OCI runtime error', source='CONTAINER_STATE_ERROR', args=['docker', 'run']))

    def test_no_secret_or_arbitrary_path_retained(self):
        secret = 'synthetic-confidential-test-value-123'
        raw = 'OCI runtime create failed: mount /private/' + secret + ': permission denied; token=' + secret + ' Bearer ' + secret
        value = self.classify(raw, args=['docker', 'run', '--env', 'PASSWORD=' + secret])
        encoded = json.dumps(value)
        for forbidden in [secret, '/private/', 'PASSWORD', 'Bearer', 'token=']:
            self.assertNotIn(forbidden, encoded)
        self.assertEqual(value['pathContext'], 'UNCLASSIFIED')

    def test_known_path_prefixes_suffixes_and_subpaths_are_not_mislabelled(self):
        for path in ['/private/frontend/app/.next/cache', '/frontend/app/.next/cache-secret',
                     '/frontend/app/.next/cache/private', '/frontend/app/.next/cachex', '/tmp-secret']:
            with self.subTest(path=path):
                self.assertEqual(self.classify('OCI runtime error mounting ' + path + ': EROFS')['pathContext'], 'UNCLASSIFIED')

    def test_input_bound_and_invalid_utf8(self):
        result = self.classify(b'OCI runtime create failed: ' + b'X' * diagnostic.MAX_INPUT + b' EROFS /frontend/app/.next/cache')
        self.assertTrue(result['inputTruncated'])
        self.assertIsNone(result['errno'])
        self.assertEqual(result['pathContext'], 'UNCLASSIFIED')
        self.assertEqual(self.classify(b'OCI runtime create failed: \xff EACCES')['errno'], 'EACCES')
        self.assertTrue(self.classify('OCI runtime create failed: ' + '\U0001f600' * diagnostic.MAX_INPUT)['inputTruncated'])

    def test_empty_stream_does_not_claim_error(self):
        self.assertIsNone(self.classify(b''))
        self.assertIsNone(self.classify(' \n'))

    def test_first_failure_survives_later_cleanup_diagnostic(self):
        with tempfile.TemporaryDirectory() as root:
            first = diagnostic.capture_first(root, 'OCI runtime create failed: mount /frontend: EROFS', source='DOCKER_CLI_STDERR', args=['docker', 'run', '-d'])
            target = pathlib.Path(root) / diagnostic.FILENAME
            before = target.read_bytes()
            second = diagnostic.capture_first(root, 'container state: EACCES', source='CONTAINER_STATE_ERROR', args=['docker', 'inspect'])
            self.assertEqual(first, second)
            self.assertEqual(before, target.read_bytes())
            self.assertEqual(target.stat().st_mode & 0o777, 0o600)
            self.assertEqual(diagnostic.validate(json.loads(before)), first)
            companion = pathlib.Path(root) / diagnostic.STATE_FILENAME
            companion_bytes = companion.read_bytes()
            self.assertEqual(json.loads(companion_bytes)['errno'], 'EACCES')
            diagnostic.capture_first(root, 'container state: ENOENT', source='CONTAINER_STATE_ERROR', args=['docker', 'inspect'])
            self.assertEqual(companion_bytes, companion.read_bytes())

    def test_unknown_cli_does_not_mask_precise_state_companion(self):
        with tempfile.TemporaryDirectory() as root:
            diagnostic.capture_first(root, 'opaque CLI failure', source='DOCKER_CLI_STDERR', args=['docker', 'run'])
            first = diagnostic.capture_first(root, 'mount /frontend/app/.next/cache: EROFS', source='CONTAINER_STATE_ERROR', args=['docker', 'inspect'])
            self.assertEqual(first['safeErrorCode'], 'DOCKER_CLI_ERROR_UNCLASSIFIED')
            companion = json.loads((pathlib.Path(root) / diagnostic.STATE_FILENAME).read_text())
            self.assertEqual(companion['safeErrorCode'], 'MOUNT_OPERATION_FAILED')
            self.assertEqual(companion['errno'], 'EROFS')

    def test_existing_symlink_and_hardlink_are_refused(self):
        with tempfile.TemporaryDirectory() as root:
            root = pathlib.Path(root)
            protected = root / 'protected'
            protected.write_text('synthetic protected bytes')
            target = root / diagnostic.FILENAME
            target.symlink_to(protected)
            with self.assertRaises(OSError):
                diagnostic.capture_first(root, 'OCI runtime error', source='DOCKER_CLI_STDERR', args=['docker', 'run'])
            self.assertEqual(protected.read_text(), 'synthetic protected bytes')
            target.unlink()
            os.link(protected, target)
            with self.assertRaises(ValueError):
                diagnostic.capture_first(root, 'OCI runtime error', source='DOCKER_CLI_STDERR', args=['docker', 'run'])

    def test_existing_oversized_nonregular_and_untrusted_json_refused(self):
        with tempfile.TemporaryDirectory() as root:
            target = pathlib.Path(root) / diagnostic.FILENAME
            target.write_bytes(b'x' * (diagnostic.MAX_RECEIPT + 1))
            target.chmod(0o600)
            with self.assertRaises(ValueError):
                diagnostic.capture_first(root, 'OCI runtime error', source='DOCKER_CLI_STDERR', args=['docker', 'run'])
            target.unlink()
            os.mkfifo(target, mode=0o600)
            with self.assertRaises(ValueError):
                diagnostic.capture_first(root, 'OCI runtime error', source='DOCKER_CLI_STDERR', args=['docker', 'run'])
            target.unlink()
            target.write_text('{"arbitrary": "synthetic-secret"}')
            target.chmod(0o600)
            with self.assertRaises(ValueError):
                diagnostic.capture_first(root, 'OCI runtime error', source='DOCKER_CLI_STDERR', args=['docker', 'run'])

    def test_validation_refuses_extra_fields_enum_values_and_bool_errno(self):
        original = self.classify('OCI runtime create failed: EPERM')
        for field, value in [('secret', 'synthetic-secret'), ('pathContext', '/private/path'),
                             ('numericErrno', True), ('inputTruncated', 1),
                             ('operation', 'DOCKER_INSPECT_STATE'),
                             ('classificationOrigin', 'CONTAINER_STATE_ERROR')]:
            row = dict(original)
            row[field] = value
            with self.subTest(field=field), self.assertRaises(ValueError):
                diagnostic.validate(row)


if __name__ == '__main__':
    unittest.main()

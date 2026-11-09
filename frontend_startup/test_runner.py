"""Deterministic runner controls. Docker is always simulated, never accepted."""
import copy
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile
import time
import types
import unittest
from unittest.mock import patch

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
spec = importlib.util.spec_from_file_location('v97_startup_runner', HERE / 'runner.py')
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


class RunnerControls(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='v97-runner-control-')
        self.root = Path(self.temporary.name).resolve()
        self.root.chmod(0o700)
        self.receipt = {'campaignId': 'work8-v97-frontend-123', 'runId': '123',
                        'sourceTree': 'a'*40, 'sourceCommit': 'b'*40,
                        'nativeDeadlineEpoch': time.time()+100, 'deadlineEpoch': time.time()+200,
                        'packageManifestSHA256': 'c'*64}
        runner.write_first(self.root / 'admission.json', self.receipt)

    def tearDown(self):
        self.temporary.cleanup()

    def native(self):
        return runner.Native(self.root, self.receipt)

    def fake_admission(self):
        return types.SimpleNamespace(require_native=lambda root: self.receipt)

    def test_no_scope_means_zero_docker_operations(self):
        with patch.object(runner.subprocess, 'run') as command:
            result = runner.cleanup(self.root)
        self.assertEqual(result['status'], 'NO_NATIVE_SCOPE_CREATED')
        command.assert_not_called()

    def test_native_deadline_refuses_command_before_invocation(self):
        native = self.native()
        native.deadline = time.time()-1
        with patch.object(runner, 'invoke') as command:
            with self.assertRaisesRegex(runner.Refusal, 'NATIVE_DEADLINE_EXPIRED'):
                native.command(['docker', 'start', native.names['normal']])
        command.assert_not_called()

    def test_no_admission_cannot_create_attempt_scope_or_docker(self):
        module = types.SimpleNamespace(require_native=lambda root: (_ for _ in ()).throw(ValueError('AUTHORITY_REQUIRED')))
        with patch.object(runner, 'admission_module', return_value=module), patch.object(runner.subprocess, 'run') as command:
            with self.assertRaises(ValueError): runner.run(self.root)
        command.assert_not_called()
        self.assertFalse((self.root / 'native-attempt.json').exists())
        self.assertFalse((self.root / 'resource-scope.json').exists())

    def orchestration(self, fail_role=None, cleanup_fail=False):
        events = []
        def launch(instance, role):
            events.append(role)
            if role == fail_role: raise runner.Refusal('CONTROLLED_START_FAILURE')
        def clean(root):
            events.append('cleanup')
            if cleanup_fail: raise runner.Refusal('CONTROLLED_CLEANUP_FAILURE')
            return {'status': 'PASS_SCOPED_CLEANUP'}
        contexts = [patch.object(runner, 'admission_module', return_value=self.fake_admission()),
                    patch.object(runner.Native, 'prepare', lambda instance: events.append('prepare')),
                    patch.object(runner.Native, 'start_anchor', lambda instance: events.append('anchor')),
                    patch.object(runner.Native, 'launch', launch),
                    patch.object(runner.Native, 'negative_control', lambda instance: events.append('negative')),
                    patch.object(runner.Native, 'capture_state_error', lambda *args, **kwargs: None),
                    patch.object(runner, 'cleanup', clean)]
        from contextlib import ExitStack
        with ExitStack() as stack:
            for context in contexts: stack.enter_context(context)
            if fail_role or cleanup_fail:
                with self.assertRaisesRegex(runner.Refusal, 'NATIVE_STARTUP_QUALIFICATION_FAILED'):
                    runner.run(self.root)
            else:
                result = runner.run(self.root)
                self.assertEqual(result['normal'], 'PASS_NATIVE_STARTUP_AND_READINESS')
                self.assertEqual(result['recovery'], 'PASS_NATIVE_STARTUP_AND_READINESS')
                self.assertFalse(result['applicationAcceptance'])
        return events

    def test_single_sequence_normal_recovery_negative_cleanup_no_business(self):
        self.assertEqual(self.orchestration(), ['prepare', 'anchor', 'normal', 'recovery', 'negative', 'cleanup'])
        result = json.loads((self.root / 'evidence/runner-result.json').read_text())
        self.assertFalse(result['brainInitialized'])
        self.assertFalse(result['backendApplicationStarted'])
        self.assertEqual(result['A5_08'], 'NOT_EXECUTED')
        self.assertEqual(result['A5_09'], 'NOT_EXECUTED')

    def test_first_normal_failure_stops_before_recovery_and_cleans(self):
        self.assertEqual(self.orchestration(fail_role='normal'), ['prepare', 'anchor', 'normal', 'cleanup'])
        value = json.loads((self.root / 'evidence/runner-result.json').read_text())
        self.assertEqual(value['recovery'], 'NOT_EXECUTED')
        self.assertEqual(value['status'], 'FAIL')
        first = (self.root / 'evidence/first-startup-failure.json').read_bytes()
        runner.safe_failure(self.root / 'evidence', 'CLEANUP', runner.Refusal('LATER_FAILURE'))
        self.assertEqual(first, (self.root / 'evidence/first-startup-failure.json').read_bytes())

    def test_cleanup_failure_cannot_leave_success_status(self):
        self.orchestration(cleanup_fail=True)
        result = json.loads((self.root / 'evidence/runner-result.json').read_text())
        self.assertEqual(result['status'], 'FAIL')
        self.assertEqual(result['cleanup'], 'FAIL')

    def test_consumed_attempt_refuses_second_startup(self):
        self.orchestration()
        with patch.object(runner, 'admission_module', return_value=self.fake_admission()), patch.object(runner.Native, 'prepare') as prepare:
            with self.assertRaisesRegex(runner.Refusal, 'NATIVE_ATTEMPT_ALREADY_CONSUMED'):
                runner.run(self.root)
        prepare.assert_not_called()

    def test_malformed_optional_inspect_never_replaces_original_failure(self):
        native = self.native()
        for payload in (b'[]', b'null', b'[null]', b'{}', b'not-json'):
            with self.subTest(payload=payload), patch.object(runner.subprocess, 'run',
                    return_value=subprocess.CompletedProcess(['docker', 'inspect'], 0, payload, b'')):
                native.capture_state_error('normal')
        self.assertFalse((native.out / 'first-docker-failure.json').exists())

    def test_process_exit_without_oci_error_is_immutable_and_sanitized(self):
        native = self.native()
        payload = {'State': {'Status': 'exited', 'Running': False, 'ExitCode': 1,
                            'Pid': 0, 'OOMKilled': False, 'Error': ''},
                   'Image': 'sha256:'+'a'*64, 'Config': {'Env': ['SECRET=CONTROL_ONLY_DO_NOT_RETAIN']}}
        with patch.object(runner.subprocess, 'run', return_value=subprocess.CompletedProcess(
                ['docker', 'inspect'], 0, json.dumps([payload]).encode(), b'')):
            native.capture_state_error('normal')
        first = (native.out / 'normal-final-state.json').read_bytes()
        value = json.loads(first)
        self.assertEqual(value['exitCode'], 1)
        self.assertEqual(value['pid'], 0)
        self.assertFalse(value['stateErrorPresent'])
        self.assertNotIn(b'CONTROL_ONLY_DO_NOT_RETAIN', first)
        payload['State']['ExitCode'] = 125
        with patch.object(runner.subprocess, 'run', return_value=subprocess.CompletedProcess(
                ['docker', 'inspect'], 0, json.dumps([payload]).encode(), b'')):
            native.capture_state_error('normal')
        self.assertEqual(first, (native.out / 'normal-final-state.json').read_bytes())
        receipt = runner.export(self.root)
        self.assertGreater(receipt['files'], 0)
        with tarfile.open(self.root / 'export/frontend-startup-evidence.tar.gz') as archive:
            self.assertEqual(first, archive.extractfile('evidence/normal-final-state.json').read())

    def test_full_create_start_contract_capture_on_failed_start(self):
        native = self.native()
        calls = []
        argv = ['docker', 'run', '-d', '--name', native.names['normal'], '--read-only',
                '--user', '65534:65534', '--entrypoint', '/frontend/runtime/bin/node',
                'sha256:'+'f'*64, '/frontend/app/server.js']
        def command(args, **kwargs):
            calls.append(args)
            if args[1] == 'exec': return '{"listeners":0}'
            if args[1] == 'start': raise RuntimeError('COMMAND_FAILED')
            return ''
        with patch.object(runner.packages, 'frontend_argv', return_value=argv), \
             patch.object(native, 'command', side_effect=command), \
             patch.object(native, 'verify_container') as inspect, \
             patch.object(native, 'capture_state_error') as capture, \
             patch.object(native, 'wait_readiness') as readiness:
            with self.assertRaises(RuntimeError): native.launch('normal')
        self.assertEqual(calls[1], ['docker', 'create'] + argv[3:])
        self.assertEqual(calls[2], ['docker', 'start', native.names['normal']])
        capture.assert_called_once_with('normal')
        readiness.assert_not_called()
        inspect.assert_called_once_with('normal', running=False)

    def test_existing_listener_refused_before_container_creation(self):
        native = self.native()
        with patch.object(runner.packages, 'frontend_argv', return_value=['docker', 'run', '-d', 'image']), \
             patch.object(native, 'command', return_value='{"listeners":1}') as command:
            with self.assertRaisesRegex(runner.Refusal, 'FRESH_FRONTEND_LISTENER_REQUIRED'):
                native.launch('recovery')
        self.assertEqual(command.call_count, 1)
        self.assertEqual(command.call_args.args[0][1], 'exec')

    def container_payload(self, native, running, apparmor):
        role = 'normal'
        return {'Image': runner.packages.BACKEND['image'], 'AppArmorProfile': apparmor,
                'Config': {'Entrypoint': ['/frontend/runtime/bin/node'], 'Cmd': ['/frontend/app/server.js'],
                           'WorkingDir': '/frontend/app', 'User': '65534:65534',
                           'Env': ['PORT=43117', 'HOSTNAME=localhost', 'NODE_OPTIONS=--dns-result-order=ipv4first',
                                   'NODE_ENV=production', 'BRAIN_API_URL=http://native-backend:43100',
                                   'VERCEL_GIT_COMMIT_SHA='+runner.packages.FRONTENDS[role]['commit'], 'NEXT_TELEMETRY_DISABLED=1']},
                'HostConfig': {'ReadonlyRootfs': True, 'Privileged': False, 'CapAdd': [], 'CapDrop': ['ALL'],
                               'SecurityOpt': ['no-new-privileges'], 'Memory': 1024**3, 'NanoCpus': 1000000000,
                               'PidsLimit': 128, 'NetworkMode': 'container:'+native.names['anchor'],
                               'PortBindings': {}, 'PidMode': '', 'IpcMode': 'private', 'UsernsMode': '',
                               'Devices': [], 'DeviceRequests': [], 'VolumesFrom': [],
                               'Tmpfs': {'/tmp': 'rw,noexec,nosuid,size=32m',
                                         '/frontend/app/.next/cache': 'rw,noexec,nosuid,nodev,size=64m,mode=0700,uid=65534,gid=65534'}},
                'Mounts': [{'Type': 'bind', 'Source': str(native.package_root/role), 'Destination': '/frontend', 'RW': False, 'Propagation': 'rprivate'},
                           {'Type': 'bind', 'Source': str(native.controller), 'Destination': '/examination', 'RW': False, 'Propagation': 'rprivate'}],
                'State': {'Running': running, 'Status': 'running' if running else 'created', 'OOMKilled': False, 'Error': ''}}

    def test_created_empty_apparmor_is_observed_without_claiming_runtime_enforcement(self):
        native = self.native()
        value = self.container_payload(native, False, '')
        anchor = {'Id': 'a'*64, 'Config': {'Labels': {'work8.native': native.label}}}
        with patch.object(native, 'inspect', side_effect=lambda role: anchor if role == 'anchor' else value):
            native.verify_container('normal', running=False)
        saved = json.loads((native.out/'normal-created.json').read_text())
        self.assertEqual(saved['appArmorProfile'], '')
        self.assertFalse(saved['appArmorRuntimeEnforcementVerified'])
        self.assertFalse(saved['running'])
        # An unconfined or missing profile is never admitted, even before start.
        for profile in ('unconfined', None):
            value['AppArmorProfile'] = profile
            with self.subTest(profile=profile), patch.object(native, 'inspect', side_effect=lambda role: anchor if role == 'anchor' else value):
                with self.assertRaisesRegex(runner.Refusal, 'ORIGINAL_FRONTEND_SECURITY_REQUIRED'):
                    native.verify_container('normal', running=False, save=False)

    def test_running_apparmor_requires_actual_docker_default_profile(self):
        native = self.native()
        value = self.container_payload(native, True, 'docker-default')
        anchor = {'Id': 'a'*64, 'Config': {'Labels': {'work8.native': native.label}}}
        with patch.object(native, 'inspect', side_effect=lambda role: anchor if role == 'anchor' else value):
            native.verify_container('normal', running=True)
        saved = json.loads((native.out/'normal-running.json').read_text())
        self.assertEqual(saved['appArmorProfile'], 'docker-default')
        self.assertTrue(saved['appArmorRuntimeEnforcementVerified'])
        for profile in ('', 'unconfined', None):
            value['AppArmorProfile'] = profile
            with self.subTest(profile=profile), patch.object(native, 'inspect', side_effect=lambda role: anchor if role == 'anchor' else value):
                with self.assertRaisesRegex(runner.Refusal, 'ORIGINAL_FRONTEND_SECURITY_REQUIRED'):
                    native.verify_container('normal', running=True, save=False)

    def test_readiness_requires_exact_200_without_redirect(self):
        native = self.native()
        values = iter([{'status': 302, 'ready': False, 'transportError': False},
                       {'status': 200, 'ready': True, 'transportError': False}])
        with patch.object(native, 'inspect', return_value={'State': {'Running': True, 'Error': ''}}), \
             patch.object(native, 'command', side_effect=lambda *args, **kwargs: json.dumps(next(values))), \
             patch.object(runner.time, 'sleep'):
            native.wait_readiness('normal')
        value = json.loads((native.out / 'normal-readiness.json').read_text())
        self.assertEqual(value['status'], 200)
        self.assertEqual(value['attempts'], 2)
        self.assertFalse(value['bodyRetained'])

    def test_readiness_refuses_container_exit(self):
        native = self.native()
        with patch.object(native, 'inspect', return_value={'State': {'Running': False, 'Error': ''}}), \
             patch.object(native, 'command') as command:
            with self.assertRaisesRegex(runner.Refusal, 'FRONTEND_EXITED_BEFORE_READY'):
                native.wait_readiness('normal')
        command.assert_not_called()

    def test_process_probe_refuses_unreviewed_secret_field_before_persistence(self):
        native = self.native()
        with patch.object(native, 'command', return_value=json.dumps({'schema': 'work8-v97-process-probe-v1', 'SECRET': 'controlsecret'})):
            with self.assertRaisesRegex(runner.Refusal, 'PROCESS_PROBE_FIELDS_REQUIRED'):
                native.verify_process('normal')
        self.assertFalse((native.out / 'normal-process.json').exists())

    def test_cleanup_attempts_other_owned_resources_after_first_removal_fails(self):
        label = self.receipt['campaignId']
        scope = {'label': label, 'names': runner.names(label), 'network': label+'-network'}
        (self.root / 'resource-scope.json').write_text('{}')
        ids = ['1'*64, '2'*64]
        net = '3'*64
        removed = []
        def command(args, **kwargs):
            rc, output = 0, b''
            if args[1:3] == ['context', 'show']: output = b'default\n'
            elif args[1:3] == ['context', 'inspect']: output = b'"unix:///var/run/docker.sock"\n'
            elif args[1] == 'ps': output = ('\n'.join([i for i in ids if i not in removed])).encode()
            elif args[1:3] == ['network', 'ls']: output = b'' if net in removed else net.encode()
            elif args[1] == 'inspect':
                role = 'normal' if args[2] == ids[0] else 'anchor'
                output = json.dumps([{'Name': '/'+scope['names'][role], 'Config': {'Labels': {'work8.native': label}}, 'State': {'Error': ''}}]).encode()
            elif args[1:3] == ['network', 'inspect']:
                output = json.dumps([{'Name': scope['network'], 'Labels': {'work8.native': label}}]).encode()
            elif args[1] == 'rm':
                if args[-1] == ids[0]: rc = 1
                else: removed.append(args[-1])
            elif args[1:3] == ['network', 'rm']: removed.append(args[-1])
            return subprocess.CompletedProcess(args, rc, output, b'')
        with patch.object(runner, 'validate_scope', return_value=scope), patch.object(runner.subprocess, 'run', side_effect=command):
            with self.assertRaisesRegex(runner.Refusal, 'SCOPED_CLEANUP_INCOMPLETE'):
                runner.cleanup(self.root)
        self.assertIn(ids[1], removed)
        self.assertIn(net, removed)
        value = json.loads((self.root / 'evidence/cleanup.json').read_text())
        self.assertEqual(value['status'], 'FAIL_SCOPED_CLEANUP')
        self.assertEqual(value['containers'], 1)

    def test_export_requires_independent_cleanup_for_success(self):
        out = self.root / 'evidence'; out.mkdir()
        runner.write_first(out / 'runner-result.json', {'status': 'STARTUP_QUALIFICATION_PASS_PENDING_INDEPENDENT_TERMINAL_READBACK'})
        with self.assertRaisesRegex(runner.Refusal, 'INDEPENDENT_CLEANUP_REQUIRED_BEFORE_SUCCESS_EXPORT'):
            runner.export(self.root)

    def test_actual_error_recorder_cleanup_and_export_preserve_first_cause(self):
        native = self.native()
        error = 'docker: Error response from daemon: OCI runtime create failed: exec: no such file or directory SECRET_VALUE_NOT_RETAINED'
        with patch('command_diagnostics.subprocess.run', return_value=subprocess.CompletedProcess(['docker', 'start'], 128, b'', error.encode())):
            with self.assertRaises(RuntimeError): native.command(['docker', 'start', native.names['normal']])
        from docker_diagnostics import capture_first
        capture_first(native.out, error, source='CONTAINER_STATE_ERROR', args=['docker', 'inspect', native.names['normal']])
        first = (native.out / 'first-docker-failure.json').read_bytes()
        capture_first(native.out, 'OCI runtime namespace operation not permitted', source='CONTAINER_STATE_ERROR',
                      args=['docker', 'inspect', native.names['normal']])
        self.assertEqual(first, (native.out / 'first-docker-failure.json').read_bytes())
        runner.write_first(native.out / 'runner-result.json', {'status': 'FAIL', 'applicationAcceptance': False})
        receipt = runner.export(self.root)
        archive = self.root / 'export/frontend-startup-evidence.tar.gz'
        self.assertEqual(receipt['sha256'], hashlib.sha256(archive.read_bytes()).hexdigest())
        with tarfile.open(archive) as z:
            index = json.load(z.extractfile('export-index.json'))
            for row in index['files']:
                data = z.extractfile(row['path']).read()
                self.assertNotIn(b'SECRET_VALUE_NOT_RETAINED', data)
                self.assertEqual(row['sha256'], hashlib.sha256(data).hexdigest())
            self.assertEqual(z.extractfile('evidence/first-docker-failure.json').read(), first)

    def test_export_refuses_unknown_artifact_and_credential_pattern(self):
        out = self.root / 'evidence'; out.mkdir()
        (out / 'not-allowed.json').write_text('{}')
        with self.assertRaisesRegex(runner.Refusal, 'EXPORT_UNREVIEWED_FILE'): runner.export(self.root)
        (out / 'not-allowed.json').unlink()
        (out / 'runner-result.json').write_text(json.dumps({'secret': 'ghp_'+'A'*36}))
        with self.assertRaisesRegex(runner.Refusal, 'EXPORT_SECRET_OR_SIZE_REFUSED'): runner.export(self.root)

    def test_export_first_receipt_symlink_and_hardlink_refused(self):
        out = self.root / 'evidence'; out.mkdir()
        target = self.root / 'protected.json'; target.write_text('{}')
        (out / 'runner-result.json').symlink_to(target)
        with self.assertRaisesRegex(runner.Refusal, 'BOUNDED_OWNED_REGULAR_FILE_REQUIRED'): runner.export(self.root)
        (out / 'runner-result.json').unlink()
        os.link(target, out / 'runner-result.json')
        with self.assertRaisesRegex(runner.Refusal, 'BOUNDED_OWNED_REGULAR_FILE_REQUIRED'): runner.export(self.root)


if __name__ == '__main__':
    unittest.main()

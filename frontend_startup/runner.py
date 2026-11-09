#!/usr/bin/env python3
"""One isolated frontend-only Docker qualification; no Brain or business lifecycle.

All native calls require a separately approved, source-bound admission. Local
control tests may replace Docker responses but can never establish native PASS.
"""
import argparse
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import sys
import tarfile
import time

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent
CONTROLLER = SOURCE / 'v65/foundation/controller/scripts/work8/native-transition'
sys.path.insert(0, str(CONTROLLER))
import current_packages as packages
from command_diagnostics import invoke
from docker_diagnostics import capture_first, validate as validate_docker_diagnostic

MAX_PAYLOAD = 512 * 1024
MAX_ARCHIVE = 512 * 1024
MAX_COMMAND_OUTPUT = 1024 * 1024
SCHEMA = 'work8-v97-frontend-startup-v1'
PHASES = {'SETUP', 'ANCHOR', 'NORMAL', 'RECOVERY', 'NEGATIVE', 'CLEANUP', 'EXPORT'}
ROLES = ('anchor', 'normal', 'recovery', 'negative')
FIRST_NAMES = {'first-docker-failure.json', 'first-docker-state-error.json',
               'first-native-failure.json', 'command-first-exception.json', 'first-startup-failure.json'}
EVIDENCE_NAMES = FIRST_NAMES | {'runner-result.json', 'runtime-identity.json', 'package-readback.json',
    'controller-readback.json', 'anchor-state.json', 'normal-created.json', 'normal-running.json',
    'recovery-created.json', 'recovery-running.json', 'normal-process.json', 'recovery-process.json',
    'normal-readiness.json', 'recovery-readiness.json', 'normal-removed.json', 'recovery-removed.json',
    'normal-launch.json', 'recovery-launch.json', 'negative-control.json', 'cleanup.json',
    'cleanup-independent-readback.json', 'image-ownership.json'}
EVIDENCE_NAMES.update({role + '-final-state.json' for role in ROLES})
ROOT_NAMES = {'admission.json', 'package-download.json', 'first-admission-failure.json'}
PATTERNS = [re.compile(p) for p in (rb'gh[pousr]_[A-Za-z0-9]{36,}', rb'github_pat_[A-Za-z0-9_]{60,}',
    rb'AKIA[A-Z0-9]{16}', rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
    rb'(?i)Bearer\s+(?!\[REDACTED\])[^\s"<>]{8,}', rb'empireai_session=[^;\s"<>]{8,}')]


class Refusal(ValueError):
    pass


def need(ok, code):
    if not ok:
        raise Refusal(code)


def sha(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def encoded(value):
    return (json.dumps(value, sort_keys=True, separators=(',', ':')) + '\n').encode()


def regular(path, bound=MAX_PAYLOAD):
    path = Path(path)
    info = path.lstat()
    need(path.is_absolute() and path.resolve() == path and stat.S_ISREG(info.st_mode) and
         info.st_nlink == 1 and info.st_uid == os.getuid() and 0 < info.st_size <= bound,
         'BOUNDED_OWNED_REGULAR_FILE_REQUIRED')
    return info


def read_json(path, bound=MAX_PAYLOAD):
    regular(path, bound)
    return json.loads(Path(path).read_bytes())


def write_first(path, value):
    path = Path(path)
    data = encoded(value)
    need(len(data) <= MAX_PAYLOAD and not any(p.search(data) for p in PATTERNS), 'SAFE_RECEIPT_BOUND')
    try:
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    except FileExistsError:
        read_json(path)
        return False
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data); stream.flush(); os.fsync(stream.fileno())
    directory = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        os.fsync(directory)
    finally:
        os.close(directory)
    return True


def admission_module():
    spec = importlib.util.spec_from_file_location('v97_admission', HERE / 'admission.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def names(label):
    need(re.fullmatch(r'work8-v97-frontend-[0-9]{1,30}', label) is not None, 'EXACT_RESOURCE_LABEL_REQUIRED')
    return {role: label + '-' + role for role in ROLES}


def validate_scope(root):
    root = Path(root)
    need(root.is_absolute() and root.resolve() == root and root.stat().st_uid == os.getuid() and
         root.stat().st_mode & 0o777 == 0o700, 'OWNED_CANONICAL_ROOT_REQUIRED')
    scope = read_json(root / 'resource-scope.json')
    need(scope.get('schema') == 'work8-v97-resource-scope-v1' and
         scope.get('runId') == os.environ.get('GITHUB_RUN_ID') and
         scope.get('runAttempt') == 1 and os.environ.get('GITHUB_RUN_ATTEMPT') == '1' and
         scope.get('hostUid') == os.getuid() == 1001 and os.getgid() == 1001 and
         scope.get('root') == str(root) and
         scope.get('names') == names(scope.get('label', '')) and
         scope.get('network') == scope['label'] + '-network' and
         scope.get('admissionSHA256') == sha(root / 'admission.json'), 'SCOPED_CLEANUP_BINDING_REQUIRED')
    return scope


def safe_failure(out, phase, error):
    code = str(error) if isinstance(error, Refusal) and re.fullmatch('[A-Z0-9_]{1,100}', str(error)) else 'COMMAND_OR_RUNTIME_FAILURE'
    write_first(out / 'first-startup-failure.json', {'schema': SCHEMA, 'firstFailure': True,
        'phase': phase if phase in PHASES else 'SETUP', 'safeErrorCode': code,
        'exceptionClass': type(error).__name__ if type(error).__name__ in {'Refusal', 'RuntimeError', 'OSError', 'TimeoutExpired', 'ValueError'} else 'OTHER',
        'rawOutputRetained': False, 'applicationAcceptance': False})


class Native:
    def __init__(self, root, admission):
        self.root = Path(root)
        self.out = self.root / 'evidence'
        self.out.mkdir(mode=0o700, exist_ok=True)
        self.admission = admission
        self.label = admission['campaignId']
        self.names = names(self.label)
        self.network = self.label + '-network'
        self.deadline = admission['nativeDeadlineEpoch']
        self.phase = 'SETUP'
        self.controller = self.root / 'controller'
        self.package_root = self.root / 'verified-standalone'
        self.imported_image = False

    def command(self, argv, timeout=30, expected_exit_codes=(0,), out=None):
        remaining = self.deadline - time.time()
        need(remaining > 0, 'NATIVE_DEADLINE_EXPIRED')
        result = invoke(argv, out=out or self.out, stage=self.phase,
                        timeout=min(timeout, remaining), expected_exit_codes=expected_exit_codes)
        need(len(result.encode()) <= MAX_COMMAND_OUTPUT, 'COMMAND_OUTPUT_BOUND')
        return result

    def inspect(self, role):
        return json.loads(self.command(['docker', 'inspect', self.names[role]]))[0]

    def capture_state_error(self, role, out=None):
        # Diagnostic capture is independent of the native deadline and precedes cleanup.
        try:
            response = subprocess.run(['docker', 'inspect', self.names[role]], stdout=subprocess.PIPE,
                                      stderr=subprocess.DEVNULL, timeout=5, check=False)
            if response.returncode or len(response.stdout) > MAX_COMMAND_OUTPUT:
                return
            payload = json.loads(response.stdout)[0]
            state = payload.get('State')
            need(isinstance(state, dict), 'CONTAINER_STATE_SCHEMA_REQUIRED')
            error = state.get('Error')
            image = payload.get('Image')
            numeric = lambda value, minimum, maximum: value if type(value) is int and minimum <= value <= maximum else None
            # State.Error can be empty when Node starts and then exits. Preserve
            # the first bounded lifecycle observation independently of OCI text.
            write_first((out or self.out) / (role + '-final-state.json'), {
                'schema': SCHEMA, 'role': role, 'firstObservation': True,
                'status': state.get('Status') if state.get('Status') in {'created', 'running', 'paused', 'restarting', 'removing', 'exited', 'dead'} else 'UNCLASSIFIED',
                'running': state.get('Running') is True, 'exitCode': numeric(state.get('ExitCode'), -255, 255),
                'pid': numeric(state.get('Pid'), 0, 2147483647), 'oomKilled': state.get('OOMKilled') is True,
                'stateErrorPresent': bool(error),
                'image': image if isinstance(image, str) and re.fullmatch('sha256:[a-f0-9]{64}', image) else None,
                'rawStateErrorOrEnvironmentRetained': False})
            if error:
                capture_first(out or self.out, error, source='CONTAINER_STATE_ERROR',
                              args=['docker', 'inspect', self.names[role]])
        except Exception:
            # Optional inspection must never replace the first command cause.
            pass

    def prepare(self):
        need(os.getuid() == os.getgid() == 1001, 'ORIGINAL_HOST_PRINCIPAL_REQUIRED')
        need(not any(os.environ.get(k) for k in ('GH_TOKEN', 'GITHUB_TOKEN', 'ACTIONS_RUNTIME_TOKEN',
                'DOCKER_HOST', 'DOCKER_CONTEXT', 'DOCKER_CONFIG', 'DOCKER_TLS_VERIFY', 'DOCKER_CERT_PATH', 'DOCKER_API_VERSION')), 
             'NATIVE_ENVIRONMENT_TOKEN_REFUSED')
        manifest_path = self.root / 'packages/v65-packages.json'
        need(sha(manifest_path) == self.admission['packageManifestSHA256'], 'EXACT_PACKAGE_MANIFEST_REQUIRED')
        manifest = read_json(manifest_path)
        need(manifest.get('schema') == 'work8-v65-source-reconstructed-packages-v1', 'EXACT_PACKAGE_SCHEMA_REQUIRED')
        packages.BACKEND = manifest['backend']
        packages.FRONTENDS = manifest['frontends']
        self.package_root.mkdir(mode=0o755)
        need(not self.controller.exists(), 'FRESH_CONTROLLER_COPY_REQUIRED')
        shutil.copytree(CONTROLLER, self.controller)
        controller_index = []
        for path in sorted(self.controller.rglob('*')):
            need(not path.is_symlink(), 'CONTROLLER_LINK_REFUSED')
            if path.is_file():
                original = CONTROLLER / path.relative_to(self.controller)
                need(path.stat().st_nlink == 1 and sha(path) == sha(original), 'CONTROLLER_COPY_CHANGED')
                path.chmod(0o555 if original.stat().st_mode & 0o111 else 0o444)
                controller_index.append({'path': str(path.relative_to(self.controller)), 'sha256': sha(path)})
            else:
                need(path.is_dir(), 'CONTROLLER_SPECIAL_FILE_REFUSED')
        for path in sorted(self.controller.rglob('*'), reverse=True):
            if path.is_dir(): path.chmod(0o555)
        self.controller.chmod(0o555)
        write_first(self.out / 'controller-readback.json', {'schema': SCHEMA, 'files': controller_index,
            'copyByteIdentityVerified': True, 'directoriesMode': '0555', 'ownerUid': os.getuid(),
            'applicationStarted': False})
        observations = {}
        for role in ('normal', 'recovery'):
            archive = self.root / 'packages/archives' / packages.FRONTENDS[role]['file']
            observations[role] = packages.verify_frontend(archive, role, self.package_root / role)
            observations[role]['extractedReadback'] = packages.verify_extracted_frontend(archive, role, self.package_root / role)
        backend = self.root / 'packages/archives' / packages.BACKEND['file']
        observations['carrier'] = packages.verify_backend(backend)
        write_first(self.out / 'package-readback.json', {'schema': SCHEMA, 'components': observations,
            'applicationPackagesRebuilt': False, 'Q01_Q05Repeated': False})
        # Docker version/runtime identity is observed afresh; source qualification is not rerun.
        need(self.command(['docker', 'context', 'show']).strip() == 'default', 'LOCAL_DEFAULT_DOCKER_CONTEXT_REQUIRED')
        endpoint = json.loads(self.command(['docker', 'context', 'inspect', 'default', '--format', '{{json .Endpoints.docker.Host}}']))
        need(endpoint == 'unix:///var/run/docker.sock', 'LOCAL_DOCKER_SOCKET_REQUIRED')
        version = json.loads(self.command(['docker', 'version', '--format', '{{json .Server}}']))
        info = json.loads(self.command(['docker', 'info', '--format', '{{json .}}']))
        need(version.get('Os') == 'linux' and version.get('Arch') in ('amd64', 'x86_64') and
             info.get('OSType') == 'linux' and info.get('Architecture') in ('x86_64', 'amd64'), 'LINUX_AMD64_DOCKER_REQUIRED')
        need(any('seccomp' in x for x in info.get('SecurityOptions', [])) and
             not any('rootless' in x or 'userns' in x for x in info.get('SecurityOptions', [])),
             'DOCKER_ORIGINAL_NAMESPACE_SECCOMP_REQUIRED')
        safe_version = lambda x: x if isinstance(x, str) and re.fullmatch('[A-Za-z0-9_.+() -]{1,100}', x) else 'UNCLASSIFIED'
        write_first(self.out / 'runtime-identity.json', {'schema': SCHEMA, 'dockerServerVersion': safe_version(version.get('Version')),
            'components': [{'name': item.get('Name') if item.get('Name') in ('Engine', 'containerd', 'runc', 'docker-init') else 'OTHER',
                            'version': safe_version(item.get('Version'))} for item in version.get('Components', [])[:8]],
            'dockerEngineIdSHA256': hashlib.sha256(str(info.get('ID', '')).encode()).hexdigest(),
            'securityOptions': [x for x in info.get('SecurityOptions', []) if x in ('name=seccomp,profile=builtin', 'name=apparmor', 'name=cgroupns')],
            'cgroupVersion': info.get('CgroupVersion') if info.get('CgroupVersion') in ('1', '2') else None,
            'actualHostUid': os.getuid(), 'actualHostGid': os.getgid(), 'fullRuntimeQualificationRepeated': False})
        existing = subprocess.run(['docker', 'image', 'inspect', packages.BACKEND['image']],
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=10, check=False)
        need(existing.returncode in (0, 1), 'IMAGE_INVENTORY_REFUSED')
        write_first(self.out / 'image-ownership.json', {'schema': SCHEMA, 'image': packages.BACKEND['image'],
            'presentBeforeImport': existing.returncode == 0, 'sharedImageDeletionPermitted': False})
        self.command(['docker', 'load', '--input', str(backend)], timeout=180)
        actual = json.loads(self.command(['docker', 'image', 'inspect', packages.BACKEND['image']]))[0]
        need(actual['Id'] == packages.BACKEND['image'] and actual['Architecture'] == 'amd64' and actual['Os'] == 'linux', 'EXACT_CARRIER_IMAGE_REQUIRED')
        self.imported_image = True

    def start_anchor(self):
        self.phase = 'ANCHOR'
        self.command(['docker', 'network', 'create', '--internal', '--label', 'work8.native=' + self.label, self.network])
        network = json.loads(self.command(['docker', 'network', 'inspect', self.network]))[0]
        need(network['Internal'] is True and network.get('Labels', {}).get('work8.native') == self.label,
             'INTERNAL_SCOPED_NETWORK_REQUIRED')
        self.command(['docker', 'create', '--name', self.names['anchor'], '--label', 'work8.native=' + self.label,
            '--network', self.network, '--network-alias', 'native-backend', '--pull', 'never', '--read-only',
            '--user', '65534:65534', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges',
            '--memory', '128m', '--cpus', '0.25', '--pids-limit', '32',
            '--entrypoint', '/usr/local/bin/node', packages.BACKEND['image'], '-e',
            'setInterval(()=>{},1000)'])
        self.command(['docker', 'start', self.names['anchor']])
        actual = self.inspect('anchor')
        need(actual['State']['Running'] and actual['HostConfig']['ReadonlyRootfs'] and
             actual['Config']['User'] == '65534:65534' and not actual['HostConfig'].get('PortBindings') and
             not actual.get('Mounts') and actual['Config']['Entrypoint'] == ['/usr/local/bin/node'] and
             actual['Config']['Cmd'] == ['-e', 'setInterval(()=>{},1000)'], 'MINIMAL_NETWORK_ANCHOR_REQUIRED')
        write_first(self.out / 'anchor-state.json', {'schema': SCHEMA, 'running': True,
            'brainInitialized': False, 'backendApplicationStarted': False, 'noPublishedPorts': True,
            'networkInternal': True, 'image': actual['Image'], 'readonlyRootfs': True, 'uidGid': '65534:65534'})

    def launch(self, role):
        self.phase = role.upper()
        argv = packages.frontend_argv(role, self.package_root / role, name=self.names[role],
            anchor=self.names['anchor'], label=self.label, script_dir=self.controller)
        need(argv[:3] == ['docker', 'run', '-d'], 'REVIEWED_FULL_FRONTEND_INVOCATION_REQUIRED')
        listener = json.loads(self.command(['docker', 'exec', self.names['anchor'], '/usr/local/bin/node', '-e', LISTENER_PROBE]))
        need(listener == {'listeners': 0}, 'FRESH_FRONTEND_LISTENER_REQUIRED')
        create = ['docker', 'create'] + argv[3:]
        write_first(self.out / (role + '-launch.json'), {'schema': SCHEMA, 'role': role,
            'completeSourceArgvSHA256': hashlib.sha256(encoded(argv)).hexdigest(),
            'actualCreateArgvSHA256': hashlib.sha256(encoded(create)).hexdigest(),
            'onlyRunDetachReplacedByCreate': True, 'image': packages.BACKEND['image'],
            'entrypoint': '/frontend/runtime/bin/node', 'command': '/frontend/app/server.js',
            'readinessPath': '/login', 'publishedPorts': [], 'credentialsInjected': False})
        try:
            self.command(create)
            self.verify_container(role, running=False)
            self.command(['docker', 'start', self.names[role]])
            self.verify_container(role, running=True)
            self.verify_process(role)
            self.wait_readiness(role)
            # A fresh post-readiness inspection excludes an immediately exited process.
            self.verify_container(role, running=True, save=False)
        except Exception:
            self.capture_state_error(role)
            raise
        finally:
            # Removal is performed by the outer scoped cleanup on failures.
            pass
        self.command(['docker', 'rm', '-fv', self.names[role]])
        self.verify_absent(role)

    def verify_container(self, role, running, save=True):
        actual = self.inspect(role)
        config, host, state = actual['Config'], actual['HostConfig'], actual['State']
        anchor = self.inspect('anchor')
        need(re.fullmatch('[a-f0-9]{64}', anchor['Id']) is not None and anchor['Config'].get('Labels', {}).get('work8.native') == self.label, 'EXACT_ANCHOR_ID_REQUIRED')
        need(actual['Image'] == packages.BACKEND['image'] and config['Entrypoint'] == ['/frontend/runtime/bin/node'] and
             config['Cmd'] == ['/frontend/app/server.js'] and config['WorkingDir'] == '/frontend/app', 'EXACT_FRONTEND_ENTRYPOINT_REQUIRED')
        need(config['User'] == '65534:65534' and
             (actual.get('AppArmorProfile') == 'docker-default' if running else actual.get('AppArmorProfile') in ('', 'docker-default')) and
             host['ReadonlyRootfs'] is True and host['Privileged'] is False and
             host.get('CapAdd') in (None, []) and set(host.get('CapDrop') or []) == {'ALL'} and
             'no-new-privileges' in host.get('SecurityOpt', []) and not any('unconfined' in x for x in host.get('SecurityOpt', [])) and
             host['Memory'] == 1024**3 and host['NanoCpus'] == 1000000000 and host['PidsLimit'] == 128 and
             host['NetworkMode'] in {'container:' + self.names['anchor'], 'container:' + anchor['Id']} and not host.get('PortBindings') and
             host.get('PidMode', '') == '' and host.get('IpcMode') in ('private', '') and
             host.get('UsernsMode', '') == '' and
             not host.get('Devices') and not host.get('DeviceRequests') and not host.get('VolumesFrom'),
             'ORIGINAL_FRONTEND_SECURITY_REQUIRED')
        expected_mounts = {'/frontend': str(self.package_root / role), '/examination': str(self.controller)}
        binds = [m for m in actual.get('Mounts', []) if m.get('Type') == 'bind']
        need(len(binds) == 2 and {m['Destination']: m['Source'] for m in binds} == expected_mounts and
             all(m['RW'] is False and m.get('Propagation') in ('rprivate', 'private') for m in binds), 'EXACT_READONLY_BIND_MOUNTS_REQUIRED')
        need(not [m for m in actual.get('Mounts', []) if m.get('Type') not in ('bind', 'tmpfs')], 'UNREVIEWED_MOUNT_REFUSED')
        tmpfs = host.get('Tmpfs', {})
        need(set(tmpfs) == {'/tmp', '/frontend/app/.next/cache'} and
             set(tmpfs['/tmp'].split(',')) == {'rw', 'noexec', 'nosuid', 'size=32m'} and
             set(tmpfs['/frontend/app/.next/cache'].split(',')) ==
                {'rw', 'noexec', 'nosuid', 'nodev', 'size=64m', 'mode=0700', 'uid=65534', 'gid=65534'},
             'EXACT_PROTECTED_TMPFS_REQUIRED')
        env = dict(x.split('=', 1) for x in config.get('Env', []))
        for key, expected in {'PORT': '43117', 'HOSTNAME': 'localhost', 'NODE_OPTIONS': '--dns-result-order=ipv4first',
                'NODE_ENV': 'production', 'BRAIN_API_URL': 'http://native-backend:43100',
                'VERCEL_GIT_COMMIT_SHA': packages.FRONTENDS[role]['commit'], 'NEXT_TELEMETRY_DISABLED': '1'}.items():
            need(env.get(key) == expected, 'EXACT_FRONTEND_ENVIRONMENT_REQUIRED')
        need(set(env) <= {'PATH', 'NODE_VERSION', 'YARN_VERSION', 'PORT', 'HOSTNAME', 'NODE_OPTIONS', 'NODE_ENV',
                          'BRAIN_API_URL', 'VERCEL_GIT_COMMIT_SHA', 'NEXT_TELEMETRY_DISABLED'}, 'UNREVIEWED_FRONTEND_ENVIRONMENT_REFUSED')
        need(state['Running'] is running and not state['OOMKilled'] and not state.get('Error') and
             state['Status'] == ('running' if running else 'created'), 'EXPECTED_CONTAINER_STATE_REQUIRED')
        if save:
            write_first(self.out / (role + ('-running.json' if running else '-created.json')), {
                'schema': SCHEMA, 'role': role, 'status': state['Status'], 'running': running,
                'image': actual['Image'], 'entrypoint': config['Entrypoint'], 'command': config['Cmd'],
                'uidGid': config['User'], 'readonlyRootfs': True, 'capDrop': ['ALL'], 'privileged': False,
                'noNewPrivileges': True, 'appArmorProfile': actual['AppArmorProfile'],
                'appArmorRuntimeEnforcementVerified': running, 'noPublishedPorts': True, 'noUnreviewedMounts': True,
                'mounts': [{'destination': destination, 'sourceRole': 'frontend-package' if destination == '/frontend' else 'reviewed-controller', 'readOnly': True} for destination in sorted(expected_mounts)],
                'tmpfs': tmpfs, 'environmentKeys': sorted(env), 'rawInspectRetained': False})

    def verify_process(self, role):
        data = json.loads(self.command(['docker', 'exec', self.names[role], '/frontend/runtime/bin/node', '-e', PROCESS_PROBE]))
        need(set(data) == {'schema', 'nodeVersion', 'uid', 'gid', 'self', 'main', 'cache', 'mounts', 'readonlyErrors'}, 'PROCESS_PROBE_FIELDS_REQUIRED')
        need(data.get('schema') == 'work8-v97-process-probe-v1' and data.get('nodeVersion') == 'v22.23.2' and
             data.get('uid') == data.get('gid') == 65534, 'EXACT_FRONTEND_PROCESS_REQUIRED')
        for who in ('self', 'main'):
            identity = data[who]
            need(set(identity) == {'uids', 'gids', 'capEff', 'capPrm', 'capBnd', 'capAmb', 'noNewPrivileges', 'seccomp'} and
                 identity['uids'] == identity['gids'] == [65534, 65534, 65534, 65534] and identity['noNewPrivileges'] == 1 and
                 identity['seccomp'] == 2 and all(identity[k] == '0000000000000000' for k in ('capEff', 'capPrm', 'capBnd', 'capAmb')),
                 'NATIVE_PRINCIPAL_SECURITY_REQUIRED')
        need(data['cache'] == {'uid': 65534, 'gid': 65534, 'mode': '0700', 'writeReadDelete': True}, 'PRIVATE_CACHE_OWNERSHIP_REQUIRED')
        need(set(data['readonlyErrors']) == {'root', 'frontend', 'controller'} and
             all(v in ('EROFS', 'EACCES') for v in data['readonlyErrors'].values()), 'READONLY_NEGATIVE_CONTROL_REQUIRED')
        need(set(data['mounts']) == {'/', '/frontend', '/examination', '/frontend/app/.next/cache'}, 'PROCESS_MOUNT_SET_REQUIRED')
        for mount in data['mounts'].values():
            need(set(mount) == {'readOnly', 'filesystem', 'flags'} and type(mount['readOnly']) is bool and
                 mount['filesystem'] in {'overlay', 'tmpfs', 'ext4', 'xfs', 'btrfs', 'fuse-overlayfs'} and
                 isinstance(mount['flags'], list) and set(mount['flags']) <= {'ro', 'rw', 'noexec', 'nosuid', 'nodev'}, 'PROCESS_MOUNT_FIELDS_REQUIRED')
        for target in ('/', '/frontend', '/examination'):
            need(data['mounts'][target]['readOnly'] is True, 'NATIVE_READONLY_MOUNT_REQUIRED')
        cache = data['mounts']['/frontend/app/.next/cache']
        need(cache['filesystem'] == 'tmpfs' and cache['readOnly'] is False and
             {'noexec', 'nosuid', 'nodev'} <= set(cache['flags']), 'NATIVE_PROTECTED_CACHE_REQUIRED')
        write_first(self.out / (role + '-process.json'), data)

    def wait_readiness(self, role):
        end = min(self.deadline, time.time() + 90)
        attempts = 0
        while time.time() < end:
            attempts += 1
            payload = self.inspect(role)
            need(payload['State']['Running'] and not payload['State'].get('Error'), 'FRONTEND_EXITED_BEFORE_READY')
            result = self.command(['docker', 'exec', self.names['anchor'], '/usr/local/bin/node',
                '--dns-result-order=ipv4first', '-e', READINESS_PROBE], timeout=6)
            value = json.loads(result)
            need(set(value) == {'status', 'ready', 'transportError'}, 'READINESS_PROBE_SCHEMA')
            if value['ready'] is True and value['status'] == 200 and value['transportError'] is False:
                write_first(self.out / (role + '-readiness.json'), {'schema': SCHEMA, 'role': role,
                    'method': 'GET', 'path': '/login', 'status': 200, 'ready': True, 'attempts': attempts,
                    'origin': 'http://localhost:43117', 'backendApplicationStarted': False, 'bodyRetained': False})
                return
            time.sleep(min(0.5, max(0, end - time.time())))
        raise Refusal('FRONTEND_READINESS_DEADLINE')

    def verify_absent(self, role):
        ids = self.command(['docker', 'ps', '-aq', '--filter', 'label=work8.native=' + self.label,
                            '--filter', 'name=^/' + self.names[role] + '$']).split()
        need(not ids, 'REMOVED_FRONTEND_STILL_PRESENT')
        archive = self.root / 'packages/archives' / packages.FRONTENDS[role]['file']
        verified = packages.verify_extracted_frontend(archive, role, self.package_root / role)
        write_first(self.out / (role + '-removed.json'), {'schema': SCHEMA, 'role': role,
            'independentFreshInventoryEmpty': True, 'postUnmountPackageReadback': verified,
            'underlyingCacheEmptyReadonly': True})

    def negative_control(self):
        self.phase = 'NEGATIVE'
        out = self.out / 'negative'
        out.mkdir(mode=0o700)
        name = self.names['negative']
        self.command(['docker', 'create', '--name', name, '--label', 'work8.native=' + self.label,
            '--network', 'none', '--pull', 'never', '--read-only', '--user', '65534:65534',
            '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--memory', '64m',
            '--cpus', '0.25', '--pids-limit', '16', '--entrypoint', '/work8-intentionally-missing',
            packages.BACKEND['image']], out=out)
        failed = False
        try:
            self.command(['docker', 'start', name], timeout=10, out=out)
        except RuntimeError:
            failed = True
        finally:
            self.capture_state_error('negative', out=out)
        need(failed, 'EXPECTED_STARTUP_FAILURE_NOT_OBSERVED')
        actual = self.inspect('negative')
        need(not actual['State']['Running'] and actual['State']['Pid'] == 0 and bool(actual['State'].get('Error')),
             'EXPECTED_CREATED_NOT_STARTED_CONTROL_REQUIRED')
        before = {}
        for name in ('first-docker-failure.json', 'first-docker-state-error.json'):
            value = validate_docker_diagnostic(read_json(out / name, 4096))
            need(value['errno'] == 'ENOENT' and value['safeErrorCode'] == 'PROCESS_EXECUTION_FAILED', 'CAUSAL_NEGATIVE_DIAGNOSTIC_REQUIRED')
            before[name] = sha(out / name)
        self.command(['docker', 'rm', '-fv', self.names['negative']])
        need(not self.command(['docker', 'ps', '-aq', '--filter', 'label=work8.native=' + self.label,
            '--filter', 'name=^/' + self.names['negative'] + '$']).split(), 'NEGATIVE_CONTAINER_REMAINS')
        # A later failure must not replace the first genuine OCI cause.
        capture_first(out, 'OCI runtime: namespace operation not permitted', source='CONTAINER_STATE_ERROR',
                      args=['docker', 'inspect', self.names['negative']])
        need(all(sha(out / name) == digest for name, digest in before.items()), 'FIRST_DOCKER_CAUSE_MUTATED')
        write_first(self.out / 'negative-control.json', {'schema': SCHEMA, 'status': 'PASS_ACTUAL_DOCKER_FAILURE_CONTROL',
            'expectedFailure': 'FIXED_MISSING_ENTRYPOINT', 'containerNeverStarted': True,
            'firstFailureImmutableAfterCleanup': True, 'freshResourceReadbackEmpty': True,
            'diagnosticSHA256': before, 'causeOfV95Established': False, 'applicationAcceptance': False})


LISTENER_PROBE = r"""const fs=require('fs');let listeners=0;for(const file of ['/proc/net/tcp','/proc/net/tcp6'])for(const line of fs.readFileSync(file,'utf8').trim().split('\n').slice(1)){const fields=line.trim().split(/\s+/);if(fields[3]==='0A'&&parseInt(fields[1].split(':')[1],16)===43117)listeners++;}console.log(JSON.stringify({listeners}));"""
READINESS_PROBE = """fetch('http://localhost:43117/login',{redirect:'manual',signal:AbortSignal.timeout(2500)}).then(r=>{console.log(JSON.stringify({status:r.status,ready:r.status===200,transportError:false}));return r.body?.cancel();}).catch(()=>console.log(JSON.stringify({status:null,ready:false,transportError:true})));"""
PROCESS_PROBE = r"""const fs=require('fs');function ident(p){const m=Object.fromEntries(fs.readFileSync(p,'utf8').trim().split('\n').map(l=>{const i=l.indexOf(':');return[l.slice(0,i),l.slice(i+1).trim()];}));return{uids:m.Uid.split(/\s+/).map(Number),gids:m.Gid.split(/\s+/).map(Number),capEff:m.CapEff,capPrm:m.CapPrm,capBnd:m.CapBnd,capAmb:m.CapAmb,noNewPrivileges:Number(m.NoNewPrivs),seccomp:Number(m.Seccomp)};}const mounts={};for(const line of fs.readFileSync('/proc/self/mountinfo','utf8').trim().split('\n')){const [l,r]=line.split(' - '),f=l.split(' '),g=r.split(' ');if(['/','/frontend','/examination','/frontend/app/.next/cache'].includes(f[4]))mounts[f[4]]={readOnly:f[5].split(',').includes('ro'),filesystem:g[0],flags:f[5].split(',').filter(x=>['ro','rw','noexec','nosuid','nodev'].includes(x))};}const cache='/frontend/app/.next/cache',st=fs.statSync(cache),p=cache+'/.work8-v97-cache-control';let ok=false;try{fs.writeFileSync(p,'bounded-cache-control',{flag:'wx',mode:0o600});ok=fs.readFileSync(p,'utf8')==='bounded-cache-control';}finally{if(fs.existsSync(p))fs.unlinkSync(p);}const errors={};for(const[key,path]of Object.entries({root:'/work8-v97-readonly-control',frontend:'/frontend/app/.work8-v97-readonly-control',controller:'/examination/.work8-v97-readonly-control'})){try{const fd=fs.openSync(path,'wx',0o600);fs.closeSync(fd);fs.unlinkSync(path);errors[key]='WRITE_UNEXPECTEDLY_ALLOWED';}catch(e){errors[key]=['EROFS','EACCES'].includes(e.code)?e.code:'UNCLASSIFIED';}}console.log(JSON.stringify({schema:'work8-v97-process-probe-v1',nodeVersion:process.version,uid:process.getuid(),gid:process.getgid(),self:ident('/proc/self/status'),main:ident('/proc/1/status'),cache:{uid:st.uid,gid:st.gid,mode:(st.mode&0o777).toString(8).padStart(4,'0'),writeReadDelete:ok},mounts,readonlyErrors:errors}));"""


def cleanup(root, *, independent=False):
    root = Path(root)
    if not (root / 'resource-scope.json').exists():
        # No resource admission means no Docker operations are permitted.
        return {'schema': SCHEMA, 'status': 'NO_NATIVE_SCOPE_CREATED', 'dockerCalled': False}
    scope = validate_scope(root)
    need(not any(os.environ.get(k) for k in ('DOCKER_HOST', 'DOCKER_CONTEXT', 'DOCKER_CONFIG', 'DOCKER_TLS_VERIFY', 'DOCKER_CERT_PATH', 'DOCKER_API_VERSION')), 'CLEANUP_REMOTE_DOCKER_REFUSED')
    context = subprocess.run(['docker', 'context', 'show'], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=5, check=False)
    endpoint = subprocess.run(['docker', 'context', 'inspect', 'default', '--format', '{{json .Endpoints.docker.Host}}'], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=5, check=False)
    need(context.returncode == endpoint.returncode == 0 and context.stdout.strip() == b'default' and len(endpoint.stdout) <= 1024 and json.loads(endpoint.stdout) == 'unix:///var/run/docker.sock', 'CLEANUP_LOCAL_DOCKER_REQUIRED')
    out = root / 'evidence'
    out.mkdir(mode=0o700, exist_ok=True)
    started = time.monotonic()
    command = lambda args, timeout=5: subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                                     timeout=timeout, check=False)
    def inventory(kind):
        argv = ['docker', 'ps', '-aq'] if kind == 'containers' else ['docker', 'network', 'ls', '-q']
        response = command(argv + ['--filter', 'label=work8.native=' + scope['label']])
        need(response.returncode == 0 and len(response.stdout) < 8192, 'CLEANUP_INVENTORY_UNAVAILABLE')
        ids = response.stdout.decode().split()
        need(all(re.fullmatch('[a-f0-9]{12,64}', value) for value in ids) and len(ids) <= 4, 'SCOPED_RESOURCE_INVENTORY_REFUSED')
        return ids
    errors = []
    def checked_inventory(kind):
        try:
            return inventory(kind)
        except Exception:
            errors.append('CONTAINER_INVENTORY_FAILED' if kind == 'containers' else 'NETWORK_INVENTORY_FAILED')
            return []
    before = {'containers': checked_inventory('containers'), 'networks': checked_inventory('networks')}
    if independent:
        need(not errors and not before['containers'] and not before['networks'], 'INDEPENDENT_CLEANUP_READBACK_NOT_EMPTY')
        value = {'schema': SCHEMA, 'status': 'PASS_INDEPENDENT_PROCESS_RESOURCE_READBACK', 'dockerCalled': True,
                 'containers': 0, 'networks': 0, 'sharedDaemonStopped': False, 'sharedImagesDeleted': False,
                 'rawOutputRetained': False, 'scope': 'OWNED_CONTAINERS_INTERNAL_NETWORK_AND_CONTAINER_TMPFS',
                 'immutableInputArchivesAndImportedImageRetainedUntilEphemeralRunnerTeardown': True}
        write_first(out / 'cleanup-independent-readback.json', value)
        return value
    for identifier in before['containers']:
        try:
            response = command(['docker', 'inspect', identifier], timeout=5)
            need(response.returncode == 0 and len(response.stdout) <= MAX_COMMAND_OUTPUT, 'CLEANUP_CONTAINER_INSPECT_REQUIRED')
            item = json.loads(response.stdout)[0]
            need(item['Name'].lstrip('/') in set(scope['names'].values()) and item['Config'].get('Labels', {}).get('work8.native') == scope['label'],
                 'CLEANUP_CONTAINER_SCOPE_REQUIRED')
            role = next(k for k, v in scope['names'].items() if v == item['Name'].lstrip('/'))
            if item.get('State', {}).get('Error'):
                try:
                    target = out / 'negative' if role == 'negative' else out
                    target.mkdir(mode=0o700, exist_ok=True)
                    capture_first(target, item['State']['Error'], source='CONTAINER_STATE_ERROR', args=['docker', 'inspect', scope['names'][role]])
                except Exception:
                    errors.append('CLEANUP_DIAGNOSTIC_UNAVAILABLE')
            result = command(['docker', 'rm', '-fv', identifier], timeout=10)
            need(result.returncode == 0, 'SCOPED_CONTAINER_REMOVAL_FAILED')
        except Exception:
            # Keep removing other independently scoped objects; preserve failure.
            errors.append('SCOPED_CONTAINER_CLEANUP_FAILED')
    for identifier in before['networks']:
        try:
            response = command(['docker', 'network', 'inspect', identifier], timeout=5)
            need(response.returncode == 0 and len(response.stdout) <= MAX_COMMAND_OUTPUT, 'CLEANUP_NETWORK_INSPECT_REQUIRED')
            item = json.loads(response.stdout)[0]
            need(item['Name'] == scope['network'] and item.get('Labels', {}).get('work8.native') == scope['label'], 'CLEANUP_NETWORK_SCOPE_REQUIRED')
            need(command(['docker', 'network', 'rm', identifier], timeout=5).returncode == 0, 'SCOPED_NETWORK_REMOVAL_FAILED')
        except Exception:
            errors.append('SCOPED_NETWORK_CLEANUP_FAILED')
    after = {'containers': checked_inventory('containers'), 'networks': checked_inventory('networks')}
    if after['containers'] or after['networks']:
        errors.append('SCOPED_RESOURCES_REMAIN')
    value = {'schema': SCHEMA, 'status': 'FAIL_SCOPED_CLEANUP' if errors else 'PASS_SCOPED_CLEANUP',
             'removedContainers': len(before['containers']) - len(after['containers']),
             'removedNetworks': len(before['networks']) - len(after['networks']),
             'containers': len(after['containers']), 'networks': len(after['networks']),
             'sharedDaemonStopped': False, 'sharedImagesDeleted': False,
             'elapsedMilliseconds': round(1000*(time.monotonic()-started)),
             'rawOutputRetained': False, 'scope': 'OWNED_CONTAINERS_INTERNAL_NETWORK_AND_CONTAINER_TMPFS',
             'immutableInputArchivesAndImportedImageRetainedUntilEphemeralRunnerTeardown': True,
             'safeErrors': errors}
    write_first(out / 'cleanup.json', value)
    need(not errors, 'SCOPED_CLEANUP_INCOMPLETE')
    return value


def run(root):
    root = Path(root)
    admission = admission_module().require_native(root)
    native = Native(root, admission)
    need(write_first(root / 'native-attempt.json', {'schema': SCHEMA, 'runId': admission['runId'],
        'runAttempt': 1, 'sourceTree': admission['sourceTree'], 'startedAtEpoch': time.time()}), 'NATIVE_ATTEMPT_ALREADY_CONSUMED')
    scope = {'schema': 'work8-v97-resource-scope-v1', 'label': native.label, 'names': native.names,
             'network': native.network, 'runId': str(admission['runId']), 'runAttempt': 1,
             'root': str(root), 'hostUid': os.getuid(), 'admissionSHA256': sha(root / 'admission.json')}
    need(write_first(root / 'resource-scope.json', scope), 'RESOURCE_SCOPE_ALREADY_CREATED')
    result = {'schema': SCHEMA, 'status': 'FAIL', 'normal': 'NOT_EXECUTED', 'recovery': 'NOT_EXECUTED',
              'negativeDiagnosticControl': 'NOT_EXECUTED', 'applicationAcceptance': False,
              'A5_08': 'NOT_EXECUTED', 'A5_09': 'NOT_EXECUTED', 'brainInitialized': False,
              'backendApplicationStarted': False, 'Q01_Q05Repeated': False, 'automaticRetry': False,
              'sourceTree': admission['sourceTree'], 'sourceCommit': admission['sourceCommit'],
              'runId': admission['runId']}
    failure = None
    try:
        native.prepare()
        native.start_anchor()
        native.launch('normal'); result['normal'] = 'PASS_NATIVE_STARTUP_AND_READINESS'
        native.launch('recovery'); result['recovery'] = 'PASS_NATIVE_STARTUP_AND_READINESS'
        native.negative_control(); result['negativeDiagnosticControl'] = 'PASS_ACTUAL_FAILURE_PRESERVATION'
        result['status'] = 'STARTUP_QUALIFICATION_PASS_PENDING_INDEPENDENT_TERMINAL_READBACK'
    except Exception as error:
        failure = error
        for role in ROLES:
            native.capture_state_error(role, out=(native.out / 'negative') if role == 'negative' and (native.out / 'negative').is_dir() else native.out)
        safe_failure(native.out, native.phase, error)
    finally:
        try:
            result['cleanup'] = cleanup(root)['status']
        except Exception as error:
            result['cleanup'] = 'FAIL'; result['status'] = 'FAIL'
            safe_failure(native.out, 'CLEANUP', error)
            failure = failure or error
        write_first(native.out / 'runner-result.json', result)
    if failure:
        raise Refusal('NATIVE_STARTUP_QUALIFICATION_FAILED') from None
    return result


def export(root):
    root = Path(root)
    need(root.is_absolute() and root.resolve() == root, 'CANONICAL_EXPORT_ROOT_REQUIRED')
    files = {}
    def take(path, relative):
        regular(path)
        data = path.read_bytes()
        need(len(data) <= MAX_PAYLOAD and not any(pattern.search(data) for pattern in PATTERNS), 'EXPORT_SECRET_OR_SIZE_REFUSED')
        value = json.loads(data)
        if path.name in ('first-docker-failure.json', 'first-docker-state-error.json'):
            validate_docker_diagnostic(value)
        need(relative not in files, 'EXPORT_DUPLICATE')
        files[relative] = data
    for name in sorted(ROOT_NAMES):
        if (root / name).exists(): take(root / name, name)
    for directory, prefix in ((root / 'evidence', 'evidence'), (root / 'evidence/negative', 'evidence/negative')):
        if not directory.exists(): continue
        need(directory.is_dir() and directory.resolve() == directory, 'EXPORT_DIRECTORY_REFUSED')
        for path in sorted(directory.iterdir()):
            if path.is_dir():
                need(prefix == 'evidence' and path.name == 'negative', 'EXPORT_UNREVIEWED_DIRECTORY')
                continue
            allowed = (FIRST_NAMES | {'negative-final-state.json'}) if prefix.endswith('/negative') else EVIDENCE_NAMES
            need(path.name in allowed and path.suffix == '.json', 'EXPORT_UNREVIEWED_FILE')
            take(path, prefix + '/' + path.name)
    need(files and sum(map(len, files.values())) <= MAX_PAYLOAD and len(files) <= 40, 'BOUNDED_EXPORT_REQUIRED')
    if 'evidence/runner-result.json' in files:
        result = json.loads(files['evidence/runner-result.json'])
        if result['status'].startswith('STARTUP_QUALIFICATION_PASS'):
            need('evidence/cleanup-independent-readback.json' in files, 'INDEPENDENT_CLEANUP_REQUIRED_BEFORE_SUCCESS_EXPORT')
    index = {'schema': 'work8-v97-evidence-export-v1', 'files': [{'path': name, 'bytes': len(data),
             'sha256': hashlib.sha256(data).hexdigest()} for name, data in sorted(files.items())],
             'applicationAcceptance': False, 'independentProviderReadbackRequired': True,
             'maximumUncompressedBytes': MAX_PAYLOAD, 'maximumCompressedBytes': MAX_ARCHIVE}
    files['export-index.json'] = encoded(index)
    destination = root / 'export'; destination.mkdir(mode=0o700, exist_ok=True)
    target = destination / 'frontend-startup-evidence.tar.gz'
    need(not target.exists(), 'EXPORT_ALREADY_CREATED')
    with tarfile.open(target, 'x:gz', format=tarfile.PAX_FORMAT) as archive:
        for name, data in sorted(files.items()):
            info = tarfile.TarInfo(name); info.size = len(data); info.mode = 0o600; info.uid = info.gid = info.mtime = 0
            archive.addfile(info, io.BytesIO(data))
    target.chmod(0o600)
    need(target.stat().st_size <= MAX_ARCHIVE, 'COMPRESSED_EXPORT_BOUND')
    # Read back the exported bytes with an independent archive reader before upload.
    with tarfile.open(target, 'r:gz') as archive:
        need(set(archive.getnames()) == set(files), 'EXPORTED_MEMBER_SET_CHANGED')
        for name, data in files.items():
            need(archive.extractfile(name).read() == data, 'EXPORTED_BYTES_CHANGED')
    receipt = {'schema': SCHEMA, 'status': 'LOCAL_EXPORT_READBACK_PASS_PROVIDER_READBACK_PENDING',
               'bytes': target.stat().st_size, 'sha256': sha(target), 'files': len(index['files']),
               'privateDataIncluded': False, 'nativeAcceptanceClaimed': False}
    write_first(destination / 'export-receipt.json', receipt)
    return receipt


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=('run', 'cleanup', 'readback', 'export'))
    parser.add_argument('--root', required=True)
    args = parser.parse_args()
    try:
        result = (run(args.root) if args.action == 'run' else cleanup(args.root) if args.action == 'cleanup'
                  else cleanup(args.root, independent=True) if args.action == 'readback' else export(args.root))
        summary = {'schema': SCHEMA, 'operation': args.action, 'status': result.get('status'),
                   'nativeAcceptanceClaimed': False}
        if args.action == 'run':
            summary.update(normal=result.get('normal'), recovery=result.get('recovery'), cleanup=result.get('cleanup'))
        if args.action == 'export':
            summary.update(bytes=result.get('bytes'), sha256=result.get('sha256'), files=result.get('files'))
        text = json.dumps(summary, sort_keys=True, separators=(',', ':'))
        need(len(text.encode()) <= 2048, 'CONSOLE_SUMMARY_BOUND')
        print(text)
    except Exception as error:
        code = str(error) if isinstance(error, Refusal) else 'QUALIFICATION_OPERATION_REFUSED'
        print(json.dumps({'schema': SCHEMA, 'status': 'FAIL', 'safeErrorCode': code,
                          'rawOutputRetained': False, 'nativeAcceptanceClaimed': False}))
        raise SystemExit(1)


if __name__ == '__main__':
    main()

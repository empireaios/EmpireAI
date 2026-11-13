#!/usr/bin/env python3
"""Credentialless image-build check of the actual root-to-UID1001 ingress graph.

Only public synthetic host settings are created, then removed. Native services,
transport, authentication, retained private inputs and owner actions never start.
"""
import argparse
import hashlib
import http.client
import json
import os
import pathlib
import signal
import socket
import stat
import subprocess
import time


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def require(value, code):
    if not value:
        raise ValueError(code)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--runtime-root', required=True)
    parser.add_argument('--receipt', required=True)
    args = parser.parse_args()
    root = pathlib.Path(args.runtime_root).resolve()
    receipt = pathlib.Path(args.receipt).resolve()
    require(os.geteuid() == 0, 'ACTUAL_ROOT_BUILD_REQUIRED')
    require(root.is_absolute() and root != pathlib.Path('/'), 'ISOLATED_IMAGE_ROOT_REQUIRED')
    control = root / 'control/owner_review'
    bootstrap = root / 'private/host-bootstrap.json'
    require(not bootstrap.exists() and not any((root / 'private').iterdir()), 'FRESH_PUBLIC_IMAGE_REQUIRED')
    manifest_file = control / 'runtime-manifest.json'
    manifest = json.loads(manifest_file.read_bytes())
    require(manifest['schema'] == 'A09_HOST_RUNTIME_MANIFEST_V1', 'EXACT_RUNTIME_MANIFEST')
    require(len(manifest['ingressRoutes']) == 8 and manifest['staticAssetPaths'], 'COMPLETE_FRESH_ROUTES_REQUIRED')
    origin = 'https://a09-credentialless-build.invalid'
    config = {'schema': 'A09_HOST_BOOTSTRAP_V1', 'origin': origin,
              'expiresAtMs': int(time.time() * 1000) + 60_000,
              'ingressRoutes': manifest['ingressRoutes'],
              'staticAssetPaths': manifest['staticAssetPaths']}
    raw = json.dumps(config, separators=(',', ':')).encode() + b'\n'
    require(len(raw) <= 4 * 1024 * 1024, 'PUBLIC_FIXTURE_BOUND')
    env = {'PATH': '/usr/local/bin:/usr/bin:/bin', 'LANG': 'C.UTF-8',
           'TZ': 'UTC', 'NODE_ENV': 'production', 'PYTHONDONTWRITEBYTECODE': '1'}

    def enter_image():
        os.chroot(root)
        os.chdir('/control')
        os.umask(0o077)

    helper = """import importlib.util,sys
s=importlib.util.spec_from_file_location('exact_preflight','/control/owner_review/host/root-preflight.py')
m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
m.write_host_bootstrap(sys.stdin.buffer.read(4*1024*1024+1))
"""
    child = None
    started = time.monotonic()
    try:
        created = subprocess.run(['/usr/bin/python3', '-I', '-B', '-c', helper],
                                 input=raw, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                 env=env, preexec_fn=enter_image, timeout=8)
        require(created.returncode == 0, 'EXACT_BOOTSTRAP_HELPER_FAILED')
        info = bootstrap.stat()
        require(info.st_uid == 0 and info.st_gid == 1001
                and stat.S_IMODE(info.st_mode) == 0o440 and bootstrap.read_bytes() == raw,
                'ACTUAL_ROOT_GROUP_BOOTSTRAP_READBACK')
        with socket.socket() as probe:
            require(probe.connect_ex(('127.0.0.1', 8080)) != 0, 'TEST_PORT_MUST_START_CLOSED')
        command = ['/usr/bin/setpriv', '--reuid=1001', '--regid=1001',
                   '--init-groups', '--no-new-privs', '--bounding-set=-all',
                   '--inh-caps=-all', '--ambient-caps=-all',
                   '/usr/local/bin/node', '/control/owner_review/host/bounded-ingress.mjs']
        child = subprocess.Popen(command, stdin=subprocess.DEVNULL,
                                 stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                 env=env, preexec_fn=enter_image, start_new_session=True)
        deadline = time.monotonic() + 8
        status = None
        while time.monotonic() < deadline:
            require(child.poll() is None, 'ACTUAL_UID1001_INGRESS_TERMINATED')
            connection = http.client.HTTPConnection('127.0.0.1', 8080, timeout=0.4)
            try:
                connection.request('GET', '/__owner-review/health',
                                   headers={'Host': 'a09-credentialless-build.invalid'})
                response = connection.getresponse()
                body = response.read(4097)
                require(len(body) <= 4096, 'HEALTH_BODY_BOUND')
                status = response.status
                require(status == 200, 'ACTUAL_UID1001_HEALTH_FAILED')
                break
            except (ConnectionRefusedError, TimeoutError, OSError):
                time.sleep(0.025)
            finally:
                connection.close()
        require(status == 200, 'ACTUAL_UID1001_INGRESS_READINESS_DEADLINE')
        # Kernel credentials of the exact child which read bootstrap and served
        # health. This is the real setpriv transition, not a mocked root run.
        credentials = pathlib.Path(f'/proc/{child.pid}/status').read_text()
        uid = next(line for line in credentials.splitlines() if line.startswith('Uid:')).split()[1:]
        gid = next(line for line in credentials.splitlines() if line.startswith('Gid:')).split()[1:]
        require(uid == ['1001'] * 4 and gid == ['1001'] * 4, 'ACTUAL_CHILD_CREDENTIALS')
        no_new_privs = next(line for line in credentials.splitlines() if line.startswith('NoNewPrivs:')).split()[1]
        require(no_new_privs == '1', 'ACTUAL_NO_NEW_PRIVS')
        child.terminate()
        stdout, stderr = child.communicate(timeout=3)
        require(len(stdout) + len(stderr) <= 65536, 'CHILD_OUTPUT_BOUND')
        require(child.returncode == -signal.SIGTERM, 'EXPECTED_CHILD_TERMINATION')
        with socket.socket() as probe:
            require(probe.connect_ex(('127.0.0.1', 8080)) != 0, 'INGRESS_PORT_CLOSED_AFTER_TEST')
        result = {'schema': 'A09_CREDENTIALLESS_IMAGE_HOST_GRAPH_SMOKE_V1', 'status': 'PASS',
                  'inheritedUmask': '0077', 'bootstrapMode': '0440', 'bootstrapUID': 0,
                  'bootstrapGID': 1001, 'actualChildUID': 1001, 'actualChildGID': 1001,
                  'actualNoNewPrivileges': True, 'exactPreflightWriterUsed': True,
                  'fullFreshStaticAssetPathCount': len(manifest['staticAssetPaths']),
                  'nativeRouteCount': len(manifest['ingressRoutes']), 'healthStatus': status,
                  'portClosedAfterCleanup': True, 'runtimeManifestSHA256': sha(manifest_file),
                  'preflightSHA256': sha(control / 'host/root-preflight.py'),
                  'ingressSHA256': sha(control / 'host/bounded-ingress.mjs'),
                  'elapsedSeconds': round(time.monotonic() - started, 3),
                  'privateInputsUsed': False, 'transportStarted': False,
                  'nativeApplicationStarted': False, 'ownerActionObserved': False}
    finally:
        if child is not None and child.poll() is None:
            os.killpg(child.pid, signal.SIGKILL)
            child.wait(timeout=2)
        if bootstrap.exists():
            bootstrap.unlink()
        require(not any((root / 'private').iterdir()), 'NO_FIXTURE_LEFT_IN_IMAGE')
        os.chown(root / 'private', 0, 0)
        os.chmod(root / 'private', 0o755)
    require(not receipt.exists() and not receipt.is_relative_to(root), 'PUBLIC_BUILD_RECEIPT_OUTSIDE_IMAGE')
    receipt.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result), flush=True)


if __name__ == '__main__':
    main()

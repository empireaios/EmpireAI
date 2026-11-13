#!/usr/bin/env python3
"""One public, credentialless A09 image build; private state arrives at runtime.

Published location: v128/owner_review/portable/build_image.py. All sibling build
helpers retain their D-relative output interface. No native app starts here.
"""
import hashlib
import importlib.util
import json
import os
import pathlib
import re
import selectors
import signal
import stat
import subprocess
import sys
import time
import zipfile

REPO = pathlib.Path('/repo')
D = pathlib.Path(__file__).resolve().parent
WORK = pathlib.Path('/work')
OUTPUT = pathlib.Path('/output')
BASE_MANIFEST_SHA = 'e8c69d86735f6df3efa06b324694fe51f0422785f83a3bd463052636c2421944'
BACKEND_ARCHIVE = 'archives/backend-v65-source-equivalent.tar.gz'
BACKEND_BYTES = 207560277
BACKEND_SHA = 'b99d11a65d40d6a6a197da6ba805e72a72ac55d4551ad13f31930ec5eeadbcb6'


def sha(path):
    with pathlib.Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def verify_source_manifest():
    manifest_path = REPO / 'v128/owner_review/source-manifest.json'
    info = manifest_path.lstat()
    assert stat.S_ISREG(info.st_mode) and manifest_path.resolve() == manifest_path
    assert info.st_size <= 32 * 1024 * 1024
    manifest = json.loads(manifest_path.read_bytes())
    assert manifest['schema'] == 'A09_REVIEW_SOURCE_MANIFEST_V1'
    assert manifest['selfExcluded'] is True
    expected = {
        'operationIdentity': 'V128-CONNECTOR-MEDIA-OWNER-REVIEW-A09-20261113',
        'branch': 'work8/v128-media-owner-review-20261113-a09',
        'parentCommit': '690f66acf64d9d40a8e39a87b5a24d31982f9cad',
        'parentTree': '6d00c07c09205d6a5f7cc77e929a3b26fa39110e',
        'retainedApplicationCommit': '6c1e63ba20619ee480742fd87dc810ca93152e22',
        'retainedA08RunId': '43434940694',
        'completeFrontendSourceSHA256': '12fc6f3a250693e6d9eef0ab597cbda477aa9e86a31cadaea1e3fc797e401209',
        'completeFrontendFileCount': 962,
    }
    assert all(manifest.get(key) == value for key, value in expected.items()), 'EXACT_SOURCE_IDENTITY'
    rows = manifest['files']
    assert isinstance(rows, list) and 1 <= len(rows) <= 100000
    seen = set()
    total = 0
    for row in rows:
        name = row['path']
        assert isinstance(name, str) and len(name) <= 1024
        relative = pathlib.PurePosixPath(name)
        assert not relative.is_absolute() and relative.as_posix() == name
        assert name and all(part not in ('..', '.', '.git') for part in relative.parts)
        assert name not in seen and name != 'v128/owner_review/source-manifest.json'
        seen.add(name)
        path = REPO / name
        assert path.resolve() == path and path.is_relative_to(REPO), 'SOURCE_SYMLINK_OR_ESCAPE'
        actual = path.lstat()
        assert stat.S_ISREG(actual.st_mode) and actual.st_nlink == 1
        assert type(row['bytes']) is int and 0 <= row['bytes'] == actual.st_size
        assert isinstance(row['sha256'], str) and re.fullmatch('[a-f0-9]{64}', row['sha256'])
        total += actual.st_size
        assert total <= 1024 * 1024 * 1024
        assert sha(path) == row['sha256'], 'SOURCE_PIN_MISMATCH'
    required = ['v128/owner_review/authority.json', 'v128/owner_review/reservation.json',
                'v128/owner_review/host/root-preflight.py', 'vercel.json', 'empireai-web/vercel.json',
                'v126/native_private/raw_blob_transport.py', 'v126/native_private/retained-blob-manifest.json']
    assert all(name in seen for name in required), 'CRITICAL_SOURCE_PIN_MISSING'
    return {'sourceManifestSHA256': sha(manifest_path), 'sourceFileCount': len(rows),
            'sourceFileAggregateBytes': total}


def run(label, argv, timeout):
    # Build commands receive no provider or owner credential environment.
    env = {'PATH': '/usr/local/bin:/usr/bin:/bin', 'LANG': 'C.UTF-8', 'TZ': 'UTC',
           'PYTHONDONTWRITEBYTECODE': '1', 'PYTHONUNBUFFERED': '1'}
    start = time.monotonic()
    child = subprocess.Popen(argv, cwd=WORK, env=env, stdin=subprocess.DEVNULL,
                             stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                             start_new_session=True)
    selector = selectors.DefaultSelector()
    selector.register(child.stdout, selectors.EVENT_READ)
    total = 0
    log = WORK / (label + '.log')
    try:
        with log.open('xb') as stream:
            while selector.get_map():
                if time.monotonic() - start > timeout:
                    raise TimeoutError('BUILD_STAGE_DEADLINE_' + label)
                for key, _ in selector.select(0.2):
                    raw = os.read(key.fileobj.fileno(), 65536)
                    if not raw:
                        selector.unregister(key.fileobj)
                        continue
                    total += len(raw)
                    if total > 32 * 1024 * 1024:
                        raise ValueError('BUILD_STAGE_OUTPUT_BOUND_' + label)
                    stream.write(raw)
        if child.wait(timeout=2) != 0:
            raise ValueError('BUILD_STAGE_FAILED_' + label)
    finally:
        selector.close()
        if child.poll() is None:
            os.killpg(child.pid, signal.SIGKILL)
            child.wait(timeout=2)
    receipt = {'stage': label, 'elapsedSeconds': round(time.monotonic() - start, 3),
               'exitCode': child.returncode, 'logBytes': total, 'logSHA256': sha(log)}
    (D / ('image-build-' + label + '.json')).write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt), flush=True)
    return receipt


def main():
    assert os.geteuid() == 0 and D == REPO / 'v128/owner_review/portable'
    publication = os.environ.get('A09_SOURCE_COMMIT_SHA', '')
    assert re.fullmatch('[a-f0-9]{40}', publication), 'REVIEWED_PUBLICATION_COMMIT_REQUIRED'
    provider_commit = os.environ.get('RAILWAY_GIT_COMMIT_SHA')
    assert not provider_commit or provider_commit == publication, 'PROVIDER_PUBLICATION_COMMIT_MISMATCH'
    owner = REPO / 'v128/owner_review'
    spec = importlib.util.spec_from_file_location('preflight', owner / 'host/root-preflight.py')
    preflight = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(preflight)
    authority = json.loads((owner / 'authority.json').read_bytes())
    reservation = json.loads((owner / 'reservation.json').read_bytes())
    preflight.validate_admission(authority, reservation, authority['operationIdentity'])
    source_admission = verify_source_manifest()
    branch = reservation['gitPublicationIdentity']
    for name in ('vercel.json', 'empireai-web/vercel.json'):
        assert json.loads((REPO / name).read_bytes())['git']['deploymentEnabled'][branch] is False
    assert not OUTPUT.exists()
    started = time.monotonic()
    receipts = []
    native = REPO / 'v126/native_private'
    retained_zip = WORK / 'retained.zip'
    receipts.append(run('public-retained-transport', [sys.executable, '-B', str(native / 'fetch_retained_raw.py'), str(retained_zip)], 310))
    # The transport verified the entire immutable338MB/41blob bundle; extract
    # only the exact retained backend OCI archive, never any private runtime state.
    archive_path = WORK / 'backend.tar.gz'
    with zipfile.ZipFile(retained_zip) as archive:
        assert archive.namelist().count(BACKEND_ARCHIVE) == 1
        info = archive.getinfo(BACKEND_ARCHIVE)
        assert info.file_size == BACKEND_BYTES
        assert stat.S_IFMT(info.external_attr >> 16) in (0, stat.S_IFREG)
        received = 0
        with archive.open(info) as source, archive_path.open('xb') as target:
            while chunk := source.read(1024 * 1024):
                received += len(chunk)
                assert received <= BACKEND_BYTES
                target.write(chunk)
        assert received == BACKEND_BYTES and sha(archive_path) == BACKEND_SHA
    receipts.append(run('retained-runtime-extraction', [sys.executable, '-B', str(D / 'extract_portable_runtime.py'),
        '--backend-archive', str(archive_path), '--output', str(D / 'extracted'), '--controls', str(native)], 120))
    receipts.append(run('pinned-redis-package-data', [sys.executable, '-B', str(native / 'fetch-redis-dependencies.py'), str(D / 'redis-packages')], 210))
    receipts.append(run('exact-frontend-source', [sys.executable, '-B', str(D / 'prepare_frontend_source.py'), str(REPO), str(D / 'extracted')], 90))
    receipts.append(run('actual-fresh-next-build', [sys.executable, '-B', str(D / 'build_frontend_portable.py'),
        str(D / 'frontend-source'), str(D / 'extracted'), str(D / 'frontend-build-inputs.json')], 790))
    receipts.append(run('public-runtime-assembly', [sys.executable, '-B', str(D / 'assemble_portable_runtime.py'),
        '--retained', str(D / 'extracted'), '--frontend', str(D / 'frontend-runtime'), '--repository', str(REPO),
        '--output', str(OUTPUT), '--base-root', '/'], 180))
    build_basis = {'schema': 'A09_IMAGE_BUILD_BASIS_V1', 'sourcePublicationCommit': publication,
                   **source_admission,
                   'baseImageManifestSHA256': BASE_MANIFEST_SHA, 'retainedArchiveSHA256': BACKEND_SHA,
                   'credentiallessBuild': True, 'nativeApplicationStarted': False,
                   'privateStateOrOwnerCredentialsIncluded': False,
                   'freshNextBuildMayDifferFromLocalBytes': True, 'stages': receipts}
    (D / 'image-build-basis.json').write_text(json.dumps(build_basis, indent=2) + '\n')
    receipts.append(run('complete-runtime-manifest', [sys.executable, '-B', str(D / 'generate_runtime_manifest.py'),
        '--runtime-root', str(OUTPUT), '--repository', str(REPO), '--metadata-directory', str(D),
        '--publication-commit', publication], 120))
    assert (OUTPUT / 'control/owner_review/runtime-manifest.json').is_file()
    assert (OUTPUT / 'control/owner_review/build-provenance.json').is_file()
    print(json.dumps({'schema': 'A09_PUBLIC_IMAGE_BUILD_COMPLETE_V1', 'status': 'PASS',
                      'sourcePublicationCommit': publication,
                      'runtimeManifestSHA256': sha(OUTPUT / 'control/owner_review/runtime-manifest.json'),
                      'buildProvenanceSHA256': sha(OUTPUT / 'control/owner_review/build-provenance.json'),
                      'elapsedSeconds': round(time.monotonic() - started, 3),
                      'nativeApplicationStarted': False, 'ownerActionObserved': False}), flush=True)


if __name__ == '__main__':
    main()

#!/usr/bin/python3
"""Inside root timeout, verify all runtime pins before creating any listener."""
import json
import hashlib
import math
import os
import pathlib
import re
import stat
import time
import urllib.parse

CONTROL = pathlib.Path('/control/owner_review')
PRIVATE = pathlib.Path('/private')


def require(value, code):
    if not value:
        raise ValueError(code)


def validate_admission(authority, reservation, operation):
    require(operation == 'V132-A10-PRIVATE-REVIEW-A01-20261114', 'EXACT_A09_OPERATION')
    require(authority.get('schema') == 'A09_STANDING_TECHNICAL_AUTHORITY_REFERENCE_V1'
            and authority.get('operationIdentity') == operation
            and authority.get('standingAuthorityId') == 'GRAND-KING-V112-MASTER-20261111'
            and authority.get('standingAuthoritySHA256') == '2e54ce38da8c021b0211351bd9524f3dc2ab99cc48466dc10a0465748a58fc66'
            and authority.get('ownerEmailSHA256') == 'a437be3d7f2e7927959c2be2040016464de75d69529d9abd197e47a8caa21267'
            and authority.get('originalTargetPredicateIds') == ['A10-05']
            and authority.get('ownerDirective') == 'V132'
            and authority.get('explicitTransferAuthorizationSHA256') == '2dc55f3f8512067b8e5ea57631e3d82291567f1eb50c400113d169432873a16f', 'EXACT_TECHNICAL_AUTHORITY')
    for key in ('nativeApprovalsGranted', 'personalOwnerActionDelegated',
                'positiveApprovalRequired', 'productionPermission', 'businessPublicationPermission'):
        require(authority.get(key) is False, 'AUTHORITY_SCOPE_' + key)
    require(authority.get('notASignature') is True
            and authority.get('commerce') == 'LOCKED'
            and authority.get('pillow') == 'NOT_BORN'
            and authority.get('work9') == 'INACTIVE', 'AUTHORITY_LOCKS')
    require(reservation.get('schema') == 'A09_FINANCIAL_LAUNCH_RESERVATION_REFERENCE_V1'
            and reservation.get('operationIdentity') == operation
            and reservation.get('status') == 'RESERVED_IN_CANONICAL_LEDGER', 'CANONICAL_RESERVATION_REQUIRED')
    exact = {'cumulativeCeilingUSD': 1000, 'maximumAggregateExposureUSD': 5,
             'maximumRuntimeSeconds': 1200, 'killGraceSeconds': 5, 'replicas': 1,
             'vCPUs': 1, 'memoryGB': 2, 'restartPolicyType': 'NEVER',
             'provider': 'RAILWAY', 'gitPublicationIdentity': 'work8/v132-media-owner-review-20261114-a01'}
    for key, value in exact.items():
        require(reservation.get(key) == value and not isinstance(reservation.get(key), bool),
                'EXACT_RESERVED_BOUND_' + key)
    amount = reservation.get('expectedCountedExposureUSD')
    require(type(amount) in (int, float) and math.isfinite(amount)
            and 5 <= amount <= 1000, 'CUMULATIVE_COUNTED_EXPOSURE')
    version = reservation.get('savedLedgerVersion')
    require((type(version) is int and version > 0) or
            (type(version) is str and re.fullmatch('v[1-9][0-9]*', version)), 'SAVED_LEDGER_VERSION')
    ledger_sha = reservation.get('savedLedgerSHA256', '')
    require(isinstance(ledger_sha, str) and re.fullmatch('[a-f0-9]{64}', ledger_sha)
            and reservation.get('independentReadbackSHA256') == ledger_sha,
            'INDEPENDENT_LEDGER_READBACK')
    require(reservation.get('maximumCredibleExposureIsNotProviderDollarCap') is True
            and reservation.get('actualChargesStatus') == 'UNCONFIRMED', 'EXPOSURE_RECONCILIATION_STATUS')

    # Bind the new execution to the same existing aggregate hold, without a new allocation.
    successor = {'savedLedgerVersion': 90, 'savedLedgerSHA256': '01a6291e667fb4184d6aeae89d7f1d073d1943be44a679acc897bc366ee07606', 'independentReadbackSHA256': '01a6291e667fb4184d6aeae89d7f1d073d1943be44a679acc897bc366ee07606', 'financialReservationId': 'V130-A10-PRIVATE-REVIEW-A01-20261114', 'executionAttempt': 1, 'buildAttempt': 1, 'privateSessionAttempt': 1, 'maximumSuccessfulPrivateTransfers': 1, 'maximumPrivateTransferAttempts': 1, 'automaticRetries': 0, 'leaseExtensions': 0, 'maximumAggregateExposureUSD': 5, 'additionalAllocationUSD': 0, 'financialGateSHA256': 'ac2d805b9c39c74189d65505a027f55c90bc436c71877de0c873abb89ea43c60', 'expectedCountedExposureUSD': 93, 'newDeploymentExpiryBoundAtLaunch': True}
    for key, value in successor.items():
        require(type(reservation.get(key)) is type(value) and reservation.get(key) == value,
                'EXACT_V132_SUCCESSOR_BINDING_' + key)
    for key, value in {'maximumSuccessfulPrivateTransfers': 1, 'maximumPrivateTransferAttempts': 1,
                       'automaticRetries': 0, 'leaseExtensions': 0, 'additionalAllocationUSD': 0,
                       'maximumAggregateExposureUSD': 5, 'maximumRuntimeSeconds': 1200, 'killGraceSeconds': 5}.items():
        require(type(authority.get(key)) is int and authority.get(key) == value,
                'EXACT_V132_TRANSFER_SCOPE_' + key)
    require(authority.get('destination') == {'projectId': 'afedd0ad-ebc1-45c1-b4aa-9782b5251ca3', 'environmentId': 'dd4591b0-1d8e-4561-812d-33c03b9d9efa', 'serviceId': 'df5d6c1f-178f-41b6-8eb5-c7870f9f06d2', 'origin': 'https://a10-v132-owner-review-isolated-review.up.railway.app'}, 'EXACT_V132_AUTHORIZED_DESTINATION')
    require(authority.get('financialGateSHA256') == reservation['financialGateSHA256'], 'EXACT_V132_FINANCIAL_GATE')


def write_host_bootstrap(raw):
    """Create the one immutable root-owned bootstrap readable by review GID1001."""
    require(type(raw) is bytes and 0 < len(raw) <= 4 * 1024 * 1024, 'HOST_BOOTSTRAP_BOUND')
    PRIVATE.mkdir(mode=0o750, exist_ok=True)
    info = PRIVATE.lstat()
    require(stat.S_ISDIR(info.st_mode) and info.st_uid == 0 and not info.st_mode & 0o022
            and PRIVATE.resolve() == PRIVATE, 'ROOT_PRIVATE_DIRECTORY_REQUIRED')
    os.chown(PRIVATE, 0, 1001)
    os.chmod(PRIVATE, 0o750)
    fd = os.open(PRIVATE / 'host-bootstrap.json', os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o440)
    try:
        os.fchown(fd, 0, 1001)
        # The root watchdog deliberately inherits umask 077. Restore the exact
        # reviewed group-read mode after creation so UID/GID1001 can read it.
        os.fchmod(fd, 0o440)
        require(os.write(fd, raw) == len(raw), 'HOST_BOOTSTRAP_COMPLETE_WRITE')
        os.fsync(fd)
        created = os.fstat(fd)
        require(stat.S_ISREG(created.st_mode) and created.st_nlink == 1
                and created.st_uid == 0 and created.st_gid == 1001
                and stat.S_IMODE(created.st_mode) == 0o440
                and created.st_size == len(raw),
                'HOST_BOOTSTRAP_EXACT_READ_PERMISSIONS')
    finally:
        os.close(fd)


def main():
    require(os.geteuid() == 0, 'ROOT_PREFLIGHT_REQUIRED')
    origin = os.environ.get('A09_REVIEW_ORIGIN', '')
    parsed = urllib.parse.urlsplit(origin)
    require(parsed.scheme == 'https' and parsed.netloc and parsed.path == ''
            and not parsed.query and not parsed.fragment and not parsed.username
            and not parsed.password and parsed.port in (None, 443), 'FIXED_HTTPS_ORIGIN')
    expiry = int(os.environ.get('A09_EXPIRES_AT_MS', '0'))
    require(0 < expiry - time.time_ns() // 1_000_000 <= 1_200_000, 'FIXED_EXPIRY')
    source = os.environ.get('A09_SOURCE_COMMIT_SHA', '')
    require(re.fullmatch('[a-f0-9]{40}', source), 'FIXED_SOURCE_COMMIT')
    actual_source = os.environ.get('RAILWAY_GIT_COMMIT_SHA')
    require(not actual_source or actual_source == source, 'PROVIDER_SOURCE_MISMATCH')
    require(origin == 'https://a10-v132-owner-review-isolated-review.up.railway.app', 'EXACT_V132_ORIGIN')
    identity = {}
    for field, name in [('projectId', 'RAILWAY_PROJECT_ID'),
                        ('environmentId', 'RAILWAY_ENVIRONMENT_ID'),
                        ('serviceId', 'RAILWAY_SERVICE_ID'),
                        ('deploymentId', 'RAILWAY_DEPLOYMENT_ID'),
                        ('replicaId', 'RAILWAY_REPLICA_ID')]:
        value = os.environ.get(name, '')
        pattern = '[A-Za-z0-9_-]{1,128}' if field == 'replicaId' else \
            '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}'
        require(re.fullmatch(pattern, value), 'PROVIDER_ID_' + field)
        if field == 'deploymentId':
            require(value != 'e7d16214-cc83-4fcb-812f-510066c8a949', 'NEW_SUCCESSOR_DEPLOYMENT_REQUIRED')
        if field in ('projectId', 'environmentId', 'serviceId'):
            expected_name = {'projectId': 'A09_EXPECTED_PROJECT_ID',
                             'environmentId': 'A09_EXPECTED_ENVIRONMENT_ID',
                             'serviceId': 'A09_EXPECTED_SERVICE_ID'}[field]
            require(value == os.environ.get(expected_name), 'PROVIDER_EXPECTED_ID_' + field)
        if field in ('projectId', 'environmentId', 'serviceId'):
            require(value == {'projectId': 'afedd0ad-ebc1-45c1-b4aa-9782b5251ca3', 'environmentId': 'dd4591b0-1d8e-4561-812d-33c03b9d9efa', 'serviceId': 'df5d6c1f-178f-41b6-8eb5-c7870f9f06d2', 'origin': 'https://a10-v132-owner-review-isolated-review.up.railway.app'}[field], 'EXACT_V132_DESTINATION_ID_' + field)
        identity[field] = value
    manifest_path = CONTROL / 'runtime-manifest.json'
    info = manifest_path.lstat()
    require(stat.S_ISREG(info.st_mode) and info.st_uid == 0 and not info.st_mode & 0o022
            and info.st_size <= 32 * 1024 * 1024 and manifest_path.resolve() == manifest_path,
            'ROOT_RUNTIME_MANIFEST_REQUIRED')
    manifest_raw = manifest_path.read_bytes()
    manifest = json.loads(manifest_raw)
    require(manifest.get('schema') == 'A09_HOST_RUNTIME_MANIFEST_V1', 'RUNTIME_MANIFEST_SCHEMA')
    manifest_sha = hashlib.sha256(manifest_raw).hexdigest()
    expected_manifest_sha = os.environ.get('A09_RUNTIME_MANIFEST_SHA256')
    require(not expected_manifest_sha or expected_manifest_sha == manifest_sha, 'RUNTIME_MANIFEST_PIN')
    files = manifest.get('files')
    require(isinstance(files, list) and 1 <= len(files) <= 100_000, 'RUNTIME_FILE_PINS_REQUIRED')
    total_bytes = 0
    seen = set()
    checked_directories = set()
    for row in files:
        path = pathlib.Path(row['path'])
        allowed = str(path).startswith(('/control/', '/app/', '/frontend/', '/opt/redis/',
                    '/usr/local/lib/', '/usr/lib/', '/lib/')) or str(path) in (
                    '/usr/local/bin/node', '/usr/bin/redis-server', '/usr/bin/python3',
                    '/usr/local/bin/python3', '/usr/local/bin/python3.11',
                    '/usr/bin/timeout', '/usr/bin/setpriv',
                    '/lib64/ld-linux-x86-64.so.2', '/bin/sh', '/usr/bin/sh',
                    '/usr/bin/dash', '/usr/bin/env', '/etc/passwd', '/etc/group',
                    '/etc/ld.so.cache', '/etc/ld.so.conf')
        require(path.is_absolute() and path.resolve() == path and allowed
                and str(path) not in seen, 'RUNTIME_PIN_PATH')
        seen.add(str(path))
        for parent in path.parents:
            if parent in checked_directories:
                break
            parent_info = parent.lstat()
            require(stat.S_ISDIR(parent_info.st_mode) and parent_info.st_uid == 0
                    and not parent_info.st_mode & 0o022, 'RUNTIME_PIN_PARENT_PERMISSIONS')
            checked_directories.add(parent)
        pin_info = path.lstat()
        require(stat.S_ISREG(pin_info.st_mode) and pin_info.st_uid == 0
                and not pin_info.st_mode & 0o022 and pin_info.st_size == row['bytes']
                and re.fullmatch('[a-f0-9]{64}', row['sha256']), 'RUNTIME_PIN_PERMISSIONS')
        total_bytes += pin_info.st_size
        require(total_bytes <= 1024 * 1024 * 1024, 'RUNTIME_PIN_TOTAL_SIZE')
        with path.open('rb') as stream:
            digest = hashlib.file_digest(stream, 'sha256').hexdigest()
        require(digest == row['sha256'], 'RUNTIME_PIN_DIGEST')
    must_pin = [
        '/usr/local/bin/node', '/usr/bin/python3', '/usr/bin/timeout', '/usr/bin/setpriv',
        '/etc/passwd', '/etc/group', '/etc/ld.so.cache', '/etc/ld.so.conf',
        '/control/owner_review/host/root-entry.py',
        '/control/owner_review/host/root-watchdog.py',
        '/control/owner_review/host/root-preflight.py',
        '/control/owner_review/host/root-supervisor.py',
        '/control/owner_review/host/process_graph.py',
        '/control/owner_review/host/bounded-ingress.mjs',
        '/control/owner_review/review-transport.mjs',
        '/control/owner_review/review-supervisor.mjs',
        '/control/owner_review/native-diagnostics.mjs',
        '/control/owner_review/controller-transport-public-key.pem',
        '/app/backend/dist/runtime/commerce-runtime/governed/work8-connector-media.js',
    ]
    require(all(path in seen for path in must_pin), 'HOST_NATIVE_TRANSPORT_RUNTIME_PINS_REQUIRED')
    operation = os.environ.get('A09_OPERATION_ID', '')
    require(re.fullmatch('[A-Za-z0-9._:-]{8,160}', operation), 'OPERATION_IDENTITY')
    authority_sha = os.environ.get('A09_AUTHORITY_SHA256', '')
    finance_sha = os.environ.get('A09_FINANCIAL_RESERVATION_SHA256', '')
    require(re.fullmatch('[a-f0-9]{64}', authority_sha)
            and re.fullmatch('[a-f0-9]{64}', finance_sha), 'AUTHORITY_FINANCIAL_PINS')
    authority_path, reservation_path = CONTROL / 'authority.json', CONTROL / 'reservation.json'
    require(str(authority_path) in seen and str(reservation_path) in seen,
            'AUTHORITY_FINANCIAL_RUNTIME_PINS_REQUIRED')
    authority_raw, reservation_raw = authority_path.read_bytes(), reservation_path.read_bytes()
    require(hashlib.sha256(authority_raw).hexdigest() == authority_sha
            and hashlib.sha256(reservation_raw).hexdigest() == finance_sha,
            'AUTHORITY_FINANCIAL_ACTUAL_HASH')
    authority, reservation = json.loads(authority_raw), json.loads(reservation_raw)
    validate_admission(authority, reservation, operation)
    actual_branch = os.environ.get('RAILWAY_GIT_BRANCH')
    require(not actual_branch or actual_branch == reservation['gitPublicationIdentity'], 'PROVIDER_BRANCH_MISMATCH')
    source_manifest_path = CONTROL / 'source-manifest.json'
    require(str(source_manifest_path) in seen, 'SOURCE_MANIFEST_RUNTIME_PIN_REQUIRED')
    with source_manifest_path.open('rb') as stream:
        source_manifest_sha = hashlib.file_digest(stream, 'sha256').hexdigest()
    config = {'schema': 'A09_HOST_BOOTSTRAP_V1', 'ingressRoutes': manifest['ingressRoutes'],
              'staticAssetPaths': manifest['staticAssetPaths'], **identity,
              'origin': origin, 'expiresAtMs': expiry, 'provider': 'RAILWAY',
              'ownerReviewClosesAtMs': expiry - 90_000,
              'publicationCommit': source, 'operationIdentity': operation,
              'runtimeManifestSHA256': manifest_sha,
              'sourceManifestSHA256': source_manifest_sha,
              'authoritySHA256': authority_sha, 'financialReservationSHA256': finance_sha}
    raw = json.dumps(config, separators=(',', ':')).encode() + b'\n'
    require(len(raw) <= 4 * 1024 * 1024, 'HOST_BOOTSTRAP_BOUND')
    write_host_bootstrap(raw)
    os.execv('/usr/bin/python3', ['/usr/bin/python3', '-I', '-B', str(CONTROL / 'host/root-supervisor.py')])


if __name__ == '__main__':
    try:
        main()
    except Exception:
        print('A09_HOST_ENTRY_REFUSED', flush=True)
        raise SystemExit(78)

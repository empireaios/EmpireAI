"""Fail-closed bounded transfer of sanitized private examination receipts.

This transfers evidence only, never application stores. Failures are recorded
outside the private directory before cleanup and cannot become a native PASS.
"""
import hashlib, json, os, pathlib, re, stat

MAX_MEMBER = 2 * 1024 * 1024  # Preserve the original strict per-member bound.
MAX_ENTRIES = 256
FAILURE_NAME = 'first-evidence-handoff-failure.json'
ERROR_CODES = {
    'HANDOFF_SOURCE_DIRECTORY_REFUSED', 'HANDOFF_ENTRY_COUNT_BOUND',
    'HANDOFF_UNREVIEWED_MEMBER', 'HANDOFF_NONREGULAR_MEMBER',
    'HANDOFF_MEMBER_SIZE_BOUND', 'HANDOFF_MEMBER_CHANGED',
    'HANDOFF_UTF8_OR_JSON_INVALID', 'HANDOFF_PNG_SIGNATURE_REFUSED',
    'HANDOFF_SENSITIVE_CONTENT_REFUSED', 'HANDOFF_FIRST_NATIVE_FAILURE_BOUND',
    'HANDOFF_DESTINATION_CONFLICT', 'HANDOFF_IO_OR_SANITIZER_FAILURE',
}
HOST_ONLY = {
    'artifact-index.json', 'runner-result.json', 'stage-start.json',
    'workflow-budget.json', 'native-time-budget.json', 'exact-components.json',
    'current-package-import.json', 'owner-policy-lifecycle.json',
    'container-lifecycle.json', 'mounted-entrypoint-preflight.json',
    'phase-b-private-contract.json', 'reused-private-handoff.json',
    'accepted-module-preflight-reused.json', 'frontend-native-qualification.json',
    'new-private-capture-channel-controls.json', 'first-docker-failure.json',
    'first-docker-state-error.json', 'command-first-exception.json', FAILURE_NAME,
}
PRIVATE_NAMES = {
    'first-native-failure.json', 'last-startup-observation.json',
    'native-storage-preflight.json', 'native-storage-child-bindings.json',
    'live-brain-ready.json', 'live-brain-capture.json', 'live-brain-channel-failure.json',
    'actual-runtime-ready.json', 'native-drain-observation.json',
    'native-runtime-result.json', 'sanitized-runtime.log', 'isolation.json',
    'observation-clock-contract.json', 'browser-lifecycle.json',
    'transition-http-observations.json', 'transition-browser-result.json',
    'normal-replay-comparison.json', 'returned-comparison.json',
    'replayed-comparison.json', 'recovery-schema-comparison.json',
    'recovery-canonical-business.png', 'private-handoff-first-failure.json',
    'frontend-origin-boundary.json',
}
PRIVATE_PATTERN = re.compile(
    r'(?:(?:normal|recovery|returned|replayed|final)-(?:independent-gate|whole-app-readback|commerce-independent-readback|persistence-capture|brain-audit-projection)|frontend-(?:startup|listener)-(?:NORMAL|RECOVERY|NORMAL_RETURN|PREFLIGHT_NORMAL|PREFLIGHT_RECOVERY|[0-9]{1,20}|normal|recovery))\.json')
SECRET_PATTERNS = [re.compile(x) for x in (
    rb'(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})',
    rb'(?<![A-Za-z0-9_])re_[A-Za-z0-9]{32,}', rb'AKIA[A-Z0-9]{16}',
    rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
    rb'(?i)Bearer\s+(?!\[REDACTED\])[^\s"<>]{8,}',
    rb'empireai_session=(?!\[REDACTED\])[^;\s"<>]{8,}',
)]


class HandoffRefusal(Exception):
    pass


def allowed_name(name):
    return name not in HOST_ONLY and (name in PRIVATE_NAMES or PRIVATE_PATTERN.fullmatch(name) is not None)


def _require(condition, code):
    if not condition:
        raise HandoffRefusal(code)


def _write_exclusive(target, data):
    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
    except BaseException:
        # Only a file newly opened by this call may be removed.
        target.unlink(missing_ok=True)
        raise


def transfer(source, destination, *, stage, redact, generated, save_first, sanitize):
    source, destination = pathlib.Path(source), pathlib.Path(destination)
    _require(stage in ('preflight', 'full'), 'HANDOFF_STAGE_REFUSED')
    _require(destination.is_absolute() and destination.resolve() == destination and
             destination.is_dir() and not destination.is_symlink(), 'HANDOFF_DESTINATION_REFUSED')
    first = destination / FAILURE_NAME
    copied = []
    errors = []

    def fail(exc, path=None, observed_bytes=None):
        code = str(exc) if isinstance(exc, HandoffRefusal) and str(exc) in ERROR_CODES else 'HANDOFF_IO_OR_SANITIZER_FAILURE'
        name = path.name if path is not None and allowed_name(path.name) else None
        receipt = {
            'schema': 'work8-v101-evidence-handoff-first-failure-v1',
            'firstFailure': True, 'stage': stage, 'operation': 'SANITIZED_PRIVATE_EVIDENCE_HANDOFF',
            'code': code, 'memberName': name,
            'observedBytes': observed_bytes if type(observed_bytes) is int and 0 <= observed_bytes <= 2**31-1 else None,
            'maximumMemberBytesExclusive': MAX_MEMBER,
            'errno': exc.errno if isinstance(exc, OSError) and type(exc.errno) is int and 0 <= exc.errno <= 4095 else None,
            'rawErrorOrRecordsRetained': False, 'nativeAcceptanceClaimed': False,
        }
        data = (json.dumps(receipt, sort_keys=True, separators=(',', ':')) + '\n').encode()
        _require(len(data) <= 4096, 'HANDOFF_DIAGNOSTIC_SIZE_BOUND')
        try:
            _write_exclusive(first, data)
        except FileExistsError:
            pass
        errors.append(code)

    try:
        _require(source.is_absolute() and source.resolve() == source and source.is_dir() and
                 not source.is_symlink(), 'HANDOFF_SOURCE_DIRECTORY_REFUSED')
        entries = []
        for path in source.iterdir():
            entries.append(path)
            _require(len(entries) <= MAX_ENTRIES, 'HANDOFF_ENTRY_COUNT_BOUND')
        entries.sort()
    except Exception as exc:
        fail(exc)
        entries = []

    for path in entries:
        observed_bytes = None
        try:
            _require(allowed_name(path.name), 'HANDOFF_UNREVIEWED_MEMBER')
            before = path.lstat()
            observed_bytes = before.st_size
            _require(stat.S_ISREG(before.st_mode) and before.st_nlink == 1 and
                     path.resolve() == path, 'HANDOFF_NONREGULAR_MEMBER')
            _require(before.st_size < MAX_MEMBER, 'HANDOFF_MEMBER_SIZE_BOUND')
            fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
            with os.fdopen(fd, 'rb') as stream:
                opened = os.fstat(stream.fileno())
                _require((opened.st_dev, opened.st_ino, opened.st_size) ==
                         (before.st_dev, before.st_ino, before.st_size), 'HANDOFF_MEMBER_CHANGED')
                raw = stream.read(MAX_MEMBER)
                after = os.fstat(stream.fileno())
            _require(len(raw) == before.st_size and
                     (after.st_dev, after.st_ino, after.st_size, after.st_mtime_ns) ==
                     (before.st_dev, before.st_ino, before.st_size, before.st_mtime_ns), 'HANDOFF_MEMBER_CHANGED')
            if path.suffix in ('.json', '.log'):
                try:
                    if path.suffix == '.json':
                        json.loads(raw)
                    data = redact(raw.decode('utf8')).encode('utf8')
                    if path.suffix == '.json':
                        json.loads(data)
                except (ValueError, UnicodeError):
                    raise HandoffRefusal('HANDOFF_UTF8_OR_JSON_INVALID') from None
            elif path.suffix == '.png':
                _require(raw.startswith(b'\x89PNG\r\n\x1a\n'), 'HANDOFF_PNG_SIGNATURE_REFUSED')
                data = raw
            else:
                raise HandoffRefusal('HANDOFF_UNREVIEWED_MEMBER')
            _require(len(data) < MAX_MEMBER, 'HANDOFF_MEMBER_SIZE_BOUND')
            _require(not any(value.encode() in data for value in generated if value) and
                     not any(pattern.search(data) for pattern in SECRET_PATTERNS),
                     'HANDOFF_SENSITIVE_CONTENT_REFUSED')
            if path.name == 'first-native-failure.json':
                _require(len(data) <= 16384, 'HANDOFF_FIRST_NATIVE_FAILURE_BOUND')
                save_first(destination, sanitize(json.loads(data)))
            else:
                _require(not (destination / path.name).exists(), 'HANDOFF_DESTINATION_CONFLICT')
                _write_exclusive(destination / path.name, data)
            copied.append({'path': path.name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
        except Exception as exc:
            fail(exc, path, observed_bytes)
    return {
        'status': 'PASS_SANITIZED_PRIVATE_EVIDENCE_HANDOFF' if not errors else 'FAIL_SANITIZED_PRIVATE_EVIDENCE_HANDOFF',
        'copiedCount': len(copied), 'failureCount': len(errors),
        'firstFailureCode': errors[0] if errors else None,
        'firstFailureReceipt': FAILURE_NAME if first.exists() else None,
        'rawErrorOrRecordsRetained': False,
    }

"""Bounded Docker startup causes, without raw messages, arguments or paths.

This classifies observed Docker/OCI text. It does not prove that a proposed
remedy works, and neither exit 125 nor a fixture establishes a native cause.
"""
import errno
import json
import os
import pathlib
import re
import stat

SCHEMA = 'work8-v96-first-docker-failure-v1'
FILENAME = 'first-docker-failure.json'
STATE_FILENAME = 'first-docker-state-error.json'
MAX_INPUT = 65536
MAX_RECEIPT = 4096
SOURCES = {'DOCKER_CLI_STDERR', 'CONTAINER_STATE_ERROR'}
OPERATIONS = {'DOCKER_RUN', 'DOCKER_CREATE', 'DOCKER_START', 'DOCKER_INSPECT_STATE'}
CODES = {'DOCKER_CLI_ERROR_UNCLASSIFIED', 'DOCKER_STATE_ERROR_UNCLASSIFIED',
         'OCI_ERROR_UNCLASSIFIED', 'MOUNT_DESTINATION_CREATION_FAILED',
         'MOUNT_OPERATION_FAILED', 'PROCESS_EXECUTION_FAILED',
         'NAMESPACE_OPERATION_FAILED', 'CGROUP_OPERATION_FAILED',
         'FILESYSTEM_OPERATION_FAILED'}
ERRNOS = {'EROFS', 'ENOENT', 'EACCES', 'EPERM', 'ENOTDIR', 'ENOSPC', 'ENOMEM', 'EBUSY'}
PATHS = {'FRONTEND_NEXT_CACHE', 'FRONTEND_APP', 'FRONTEND_NODE',
         'FRONTEND_ROOT', 'EXAMINATION_ROOT', 'TEMPORARY_ROOT', 'UNCLASSIFIED'}
MOUNT_KINDS = {'TMPFS', 'BIND', 'UNCLASSIFIED'}
ORIGINS = {'DOCKER_INFRASTRUCTURE_TEXT', 'CONTAINER_STATE_ERROR', 'UNCLASSIFIED_COMMAND_BOUNDARY'}


def _operation(source, args):
    if source not in SOURCES or not isinstance(args, (list, tuple)) or len(args) < 2:
        return None
    # The reviewed coordinator uses this exact executable name. Do not accept
    # arbitrary wrappers, shell strings, or a lookalike pathname/basename.
    if args[0] != 'docker':
        return None
    if source == 'CONTAINER_STATE_ERROR':
        return 'DOCKER_INSPECT_STATE' if args[1] == 'inspect' else None
    return {'run': 'DOCKER_RUN', 'create': 'DOCKER_CREATE', 'start': 'DOCKER_START'}.get(args[1])


def _bounded(raw):
    if isinstance(raw, bytes):
        return raw[:MAX_INPUT].decode('utf8', errors='replace'), len(raw) > MAX_INPUT
    if isinstance(raw, str):
        prefix = raw[:MAX_INPUT].encode('utf8', errors='replace')
        return prefix[:MAX_INPUT].decode('utf8', errors='replace'), len(raw) > MAX_INPUT or len(prefix) > MAX_INPUT
    return '', False


def _daemon_only_boundary(args):
    if args[1] == 'create':
        return True
    if args[1] == 'start':
        return len(args) == 3 and isinstance(args[2], str) and not args[2].startswith('-')
    if args[1] != 'run' or len(args) < 3 or args[2] not in {'-d', '--detach'}:
        return False
    # Detached RUN stderr belongs to Docker. Attached application stderr can
    # forge Docker/OCI wording and must never establish an infrastructure cause.
    for value in args[3:]:
        if not isinstance(value, str):
            return False
        if (value in {'-a', '--attach'} or value.startswith(('--detach=', '-d=')) or
                value.startswith('--attach=') or
                re.fullmatch(r'-[a-zA-Z]*a[a-zA-Z]*', value)):
            return False
    return True


def _safe_context(text):
    # Only these literal reviewed paths can be represented. A longer pathname,
    # prefix, suffix, environment value, or arbitrary host source is not copied.
    known = [('/frontend/app/.next/cache', 'FRONTEND_NEXT_CACHE', 'TMPFS'),
             ('/frontend/runtime/bin/node', 'FRONTEND_NODE', 'UNCLASSIFIED'),
             ('/frontend/app', 'FRONTEND_APP', 'UNCLASSIFIED'),
             ('/frontend', 'FRONTEND_ROOT', 'BIND'),
             ('/examination', 'EXAMINATION_ROOT', 'BIND'),
             ('/tmp', 'TEMPORARY_ROOT', 'TMPFS')]
    for path, context, kind in known:
        if re.search(r'(?<![A-Za-z0-9_./-])' + re.escape(path) + r'(?=$|[\s\"\'`:;,\)\]])', text):
            return context, kind
    return 'UNCLASSIFIED', 'UNCLASSIFIED'


def classify(raw, *, source, args):
    """Return an enum-only receipt for a reviewed failed startup boundary.

    The caller supplies actual stderr or State.Error, never whole inspect JSON
    or an exception repr. Arbitrary child text cannot establish an OCI cause.
    """
    operation = _operation(source, args)
    if operation is None:
        return None
    text, truncated = _bounded(raw)
    if not text.strip():
        return None
    lower = text.lower()
    infrastructure = _daemon_only_boundary(args) and any(marker in lower for marker in
                         ('error response from daemon:', 'oci runtime',
                          'failed to create shim task', 'error during container init'))
    trusted_text = source == 'CONTAINER_STATE_ERROR' or infrastructure
    origin = ('CONTAINER_STATE_ERROR' if source == 'CONTAINER_STATE_ERROR' else
              'DOCKER_INFRASTRUCTURE_TEXT' if infrastructure else 'UNCLASSIFIED_COMMAND_BOUNDARY')
    code = ('DOCKER_STATE_ERROR_UNCLASSIFIED' if source == 'CONTAINER_STATE_ERROR'
            else 'DOCKER_CLI_ERROR_UNCLASSIFIED')
    observed_errno = None
    context, kind = 'UNCLASSIFIED', 'UNCLASSIFIED'
    if trusted_text:
        # Phrases map only to Linux errno names; no error operand is retained.
        phrases = {'read-only file system': 'EROFS', 'no such file or directory': 'ENOENT',
                   'permission denied': 'EACCES', 'operation not permitted': 'EPERM',
                   'not a directory': 'ENOTDIR', 'no space left on device': 'ENOSPC',
                   'cannot allocate memory': 'ENOMEM', 'device or resource busy': 'EBUSY'}
        observations = [(m.start(), value) for phrase, value in phrases.items()
                        for m in re.finditer(re.escape(phrase), lower)]
        observations += [(m.start(), m.group()) for m in
                         re.finditer(r'(?<![A-Z0-9_])(?:EROFS|ENOENT|EACCES|EPERM|ENOTDIR|ENOSPC|ENOMEM|EBUSY)(?![A-Z0-9_])', text)]
        if observations:
            observed_errno = min(observations, key=lambda pair: pair[0])[1]
        context, kind = _safe_context(text)
        has_mount = re.search(r'\b(?:mount|mounting|mountpoint|mountpoints)\b', lower) is not None
        has_mkdir = re.search(r'\b(?:mkdir|mkdirat)\b|create (?:a )?mountpoint', lower) is not None
        if has_mount and has_mkdir:
            code = 'MOUNT_DESTINATION_CREATION_FAILED'
        elif has_mount:
            code = 'MOUNT_OPERATION_FAILED'
        elif re.search(r'\b(?:exec|execve|executable)\b', lower):
            code = 'PROCESS_EXECUTION_FAILED'
        elif re.search(r'\b(?:namespace|namespaces|setns|unshare)\b', lower):
            code = 'NAMESPACE_OPERATION_FAILED'
        elif re.search(r'\b(?:cgroup|cgroups)\b', lower):
            code = 'CGROUP_OPERATION_FAILED'
        elif has_mkdir or observed_errno is not None:
            code = 'FILESYSTEM_OPERATION_FAILED'
        elif 'oci runtime' in lower:
            code = 'OCI_ERROR_UNCLASSIFIED'
    return validate({'schema': SCHEMA, 'firstFailure': True, 'source': source,
                     'operation': operation, 'classificationOrigin': origin,
                     'safeErrorCode': code, 'errno': observed_errno,
                     'numericErrno': getattr(errno, observed_errno) if observed_errno else None,
                     'pathContext': context, 'mountKind': kind,
                     'inputTruncated': truncated, 'maximumInspectedBytes': MAX_INPUT,
                     'rawOutputRetained': False, 'argumentsOrEnvironmentRetained': False,
                     'causeInferredFromExitCode': False, 'nativeCorrectionProven': False})


def validate(value):
    """Strict validation is also applied when independently reading a receipt."""
    if not isinstance(value, dict):
        raise ValueError('DOCKER_DIAGNOSTIC_RECEIPT_REFUSED')
    enums = {'source': SOURCES, 'operation': OPERATIONS, 'classificationOrigin': ORIGINS,
             'safeErrorCode': CODES, 'errno': ERRNOS | {None}, 'pathContext': PATHS,
             'mountKind': MOUNT_KINDS}
    constants = {'schema': SCHEMA, 'firstFailure': True, 'maximumInspectedBytes': MAX_INPUT,
                 'rawOutputRetained': False, 'argumentsOrEnvironmentRetained': False,
                 'causeInferredFromExitCode': False, 'nativeCorrectionProven': False}
    if set(value) != set(enums) | set(constants) | {'numericErrno', 'inputTruncated'}:
        raise ValueError('DOCKER_DIAGNOSTIC_FIELDS_REFUSED')
    for name, allowed in enums.items():
        if not isinstance(value[name], (str, type(None))) or value[name] not in allowed:
            raise ValueError('DOCKER_DIAGNOSTIC_ENUM_REFUSED')
    for name, expected in constants.items():
        if type(value[name]) is not type(expected) or value[name] != expected:
            raise ValueError('DOCKER_DIAGNOSTIC_CONSTANT_REFUSED')
    expected_errno = getattr(errno, value['errno']) if value['errno'] else None
    if type(value['numericErrno']) is not type(expected_errno) or value['numericErrno'] != expected_errno:
        raise ValueError('DOCKER_DIAGNOSTIC_ERRNO_REFUSED')
    if type(value['inputTruncated']) is not bool:
        raise ValueError('DOCKER_DIAGNOSTIC_BOUND_REFUSED')
    is_state = value['source'] == 'CONTAINER_STATE_ERROR'
    if ((value['operation'] == 'DOCKER_INSPECT_STATE') != is_state or
            (value['classificationOrigin'] == 'CONTAINER_STATE_ERROR') != is_state):
        raise ValueError('DOCKER_DIAGNOSTIC_SOURCE_REFUSED')
    if value['classificationOrigin'] == 'UNCLASSIFIED_COMMAND_BOUNDARY' and (
            value['safeErrorCode'] != 'DOCKER_CLI_ERROR_UNCLASSIFIED' or
            value['errno'] is not None or value['pathContext'] != 'UNCLASSIFIED' or
            value['mountKind'] != 'UNCLASSIFIED'):
        raise ValueError('DOCKER_DIAGNOSTIC_UNCLASSIFIED_REFUSED')
    return dict(value)


def _read_existing(directory, name):
    fd = os.open(name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=directory)
    with os.fdopen(fd, 'rb') as stream:
        info = os.fstat(stream.fileno())
        if (not stat.S_ISREG(info.st_mode) or info.st_nlink != 1 or
                info.st_uid != os.geteuid() or info.st_mode & 0o077 or
                not 0 < info.st_size <= MAX_RECEIPT):
            raise ValueError('DOCKER_DIAGNOSTIC_EXISTING_FILE_REFUSED')
        data = stream.read(MAX_RECEIPT + 1)
    if len(data) != info.st_size:
        raise ValueError('DOCKER_DIAGNOSTIC_EXISTING_SIZE_REFUSED')
    try:
        value = validate(json.loads(data))
        if name == STATE_FILENAME and value['source'] != 'CONTAINER_STATE_ERROR':
            raise ValueError('DOCKER_DIAGNOSTIC_STATE_SOURCE_REFUSED')
        return value
    except (ValueError, TypeError, UnicodeError):
        raise ValueError('DOCKER_DIAGNOSTIC_EXISTING_CONTENT_REFUSED') from None


def _capture_name(directory, name, value):
    if name not in {FILENAME, STATE_FILENAME}:
        raise ValueError('DOCKER_DIAGNOSTIC_FILENAME_REFUSED')
    data = (json.dumps(value, sort_keys=True, separators=(',', ':')) + '\n').encode()
    if len(data) > MAX_RECEIPT:
        raise ValueError('DOCKER_DIAGNOSTIC_RECEIPT_BOUND')
    try:
        fd = os.open(name, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW,
                     0o600, dir_fd=directory)
    except FileExistsError:
        return _read_existing(directory, name)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
        stream.flush()
        os.fsync(stream.fileno())
    os.fsync(directory)
    return value


def capture_first(root, raw, *, source, args):
    """Preserve the first startup error before teardown; later errors cannot replace it."""
    value = classify(raw, source=source, args=args)
    if value is None:
        return None
    root = pathlib.Path(root)
    if not root.is_absolute() or root.resolve() != root:
        raise ValueError('DOCKER_DIAGNOSTIC_ROOT_REFUSED')
    directory = os.open(root, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        first = _capture_name(directory, FILENAME, value)
        # Keep the first precise State.Error as a separate immutable companion.
        # It cannot overwrite earlier stderr, including an unclassified receipt.
        if source == 'CONTAINER_STATE_ERROR':
            _capture_name(directory, STATE_FILENAME, value)
        return first
    finally:
        os.close(directory)

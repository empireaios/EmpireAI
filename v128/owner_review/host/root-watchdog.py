#!/usr/bin/python3
"""Start the A09 app once beneath an independent root-owned hard timeout.

The image entry execs this program as PID 1. A bounded public start window is
fixed once, only after owner readiness and fresh approval, before deployment.
PID 1 derives the private-runtime deadline once, after
the build has completed, and execs the independent timeout. The timed preflight
writes a root-owned bootstrap before listeners; no stage accepts a duration or
command from the app. This candidate is not launchable until fresh authority,
destination, source, financial and runtime bindings are independently verified.
"""
import json
import os
import pathlib
import re
import resource
import stat
import time

CONFIG = pathlib.Path('/private/host-bootstrap.json')
MAX_LIFETIME_MS = 1_200_000
MAX_START_WINDOW_MS = 900_000
KILL_GRACE_SECONDS = 5
OPERATION = 'V133-A10-PRIVATE-REVIEW-A01-20261114'


def require(value, reason):
    if not value:
        raise ValueError(reason)


def derive_runtime_deadline(environment, now_ms):
    """Pure admission; only main(), while root PID 1, may install this result.

    No legacy absolute session expiry, inherited derived deadline, requested
    duration, or second derivation is accepted. The launch window bounds how
    late a new process may begin; the independent fixed relative timeout then
    bounds its lifetime even if the wall clock moves backwards.
    """
    require(type(now_ms) is int and now_ms > 0, 'START_CLOCK_REQUIRED')
    require(environment.get('A09_OPERATION_ID') == OPERATION,
            'EXACT_V133_OPERATION_REQUIRED')
    for name in ('A09_EXPIRES_AT_MS', 'A09_RUNTIME_STARTED_AT_MS',
                 'A09_RUNTIME_DEADLINE_DERIVED'):
        require(name not in environment, 'LEGACY_OR_ALREADY_DERIVED_DEADLINE')

    def milliseconds(name):
        value = environment.get(name)
        require(type(value) is str and re.fullmatch('[1-9][0-9]{12}', value),
                'FIXED_PUBLIC_START_WINDOW_REQUIRED')
        return int(value)

    earliest = milliseconds('A09_START_NOT_BEFORE_MS')
    latest = milliseconds('A09_START_NOT_AFTER_MS')
    outer = milliseconds('A09_MAX_SERVICE_END_MS')
    require(0 < latest - earliest <= MAX_START_WINDOW_MS,
            'BOUNDED_START_WINDOW_REQUIRED')
    require(earliest <= now_ms <= latest, 'OUTSIDE_FIXED_START_WINDOW')
    # An exact relation prevents an arbitrary or unbounded outer deadline.
    # The maximum service envelope is 15 minutes to start plus 20 minutes
    # running; the existing five-second termination grace is additional.
    require(outer == latest + MAX_LIFETIME_MS, 'EXACT_OUTER_DEADLINE_REQUIRED')
    expiry = min(now_ms + MAX_LIFETIME_MS, outer)
    require(expiry - now_ms == MAX_LIFETIME_MS, 'FULL_FIXED_RUNTIME_REQUIRED')
    return {'schema': 'A09_ROOT_RUNTIME_CLOCK_V1',
            'operationIdentity': OPERATION, 'startedAtMs': now_ms,
            'startNotBeforeMs': earliest, 'startNotAfterMs': latest,
            'maximumServiceEndMs': outer, 'expiresAtMs': expiry,
            'maximumRuntimeSeconds': 1200, 'killGraceSeconds': 5,
            'deadlineDerivedOnce': True, 'ownerActionObserved': False}


def checked_config(path=CONFIG):
    require(path.is_absolute() and path.resolve() == path, 'BOOTSTRAP_PATH')
    for parent in (path.parent, *path.parent.parents):
        info = parent.stat()
        require(info.st_uid == 0 and not info.st_mode & 0o022,
                'BOOTSTRAP_PARENT_PERMISSIONS')
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    try:
        info = os.fstat(fd)
        require(stat.S_ISREG(info.st_mode) and info.st_nlink == 1
                and info.st_uid == 0 and not info.st_mode & 0o022
                and info.st_size <= 4 * 1024 * 1024, 'BOOTSTRAP_PERMISSIONS')
        with os.fdopen(os.dup(fd), 'rb') as stream:
            raw = stream.read(4 * 1024 * 1024 + 1)
        require(len(raw) == info.st_size, 'BOOTSTRAP_SIZE')
        config = json.loads(raw)
    finally:
        os.close(fd)
    return config


def timeout_argv(config, now_ms):
    expiry = config.get('expiresAtMs')
    require(type(expiry) is int, 'ABSOLUTE_EXPIRY_REQUIRED')
    remaining = expiry - now_ms
    require(0 < remaining <= MAX_LIFETIME_MS, 'EXPIRED_OR_EXCESS_LIFETIME')
    return ['/usr/bin/timeout', '--signal=TERM',
            f'--kill-after={KILL_GRACE_SECONDS}s', f'{remaining / 1000:.3f}s',
            '/usr/bin/python3', '-I', '-B', '/control/owner_review/host/root-preflight.py']


def main():
    require(os.geteuid() == 0, 'ROOT_WATCHDOG_REQUIRED')
    require(os.getpid() == 1, 'PID1_EXEC_REQUIRED')
    # All preflight and app descendants inherit a zero hard core-dump limit.
    # Failure is terminal before any child, listener, or private input exists.
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
    require(resource.getrlimit(resource.RLIMIT_CORE) == (0, 0), 'CORE_DUMP_LIMIT')
    # Build time cannot consume the private runtime. Derive exactly once here,
    # while still root PID 1; every descendant receives this same deadline.
    # This is a new operation, never an extension of an earlier session.
    started_at_ms = time.time_ns() // 1_000_000
    clock = derive_runtime_deadline(os.environ, started_at_ms)
    os.environ['A09_EXPIRES_AT_MS'] = str(clock['expiresAtMs'])
    os.environ['A09_RUNTIME_STARTED_AT_MS'] = str(clock['startedAtMs'])
    os.environ['A09_RUNTIME_DEADLINE_DERIVED'] = '1'
    # Re-sample before exec so deadline derivation also consumes the budget.
    # Source checks, private restoration and startup remain inside timeout.
    argv = timeout_argv(clock, time.time_ns() // 1_000_000)
    # Do not allow inherited loader hooks to replace timeout, setpriv, or Node.
    for name in ('NODE_OPTIONS', 'NODE_PATH', 'LD_PRELOAD', 'LD_LIBRARY_PATH',
                 'PYTHONPATH', 'PYTHONHOME', 'BASH_ENV', 'ENV'):
        os.environ.pop(name, None)
    os.environ['PATH'] = '/usr/local/bin:/usr/bin:/bin'
    os.umask(0o077)
    os.execv(argv[0], argv)


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Codes only: bootstrap config may contain private fresh credentials.
        print('A09_ROOT_WATCHDOG_REFUSED:' + str(error), flush=True)
        raise SystemExit(78)

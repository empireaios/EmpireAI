#!/usr/bin/python3
"""Start the A09 app once beneath an independent root-owned hard timeout.

The image entry execs this program as PID 1. The absolute service setting is
fixed before deployment. The timed preflight writes a root-owned bootstrap
before listeners; no stage accepts a duration or command from the app.
"""
import json
import os
import pathlib
import stat
import time

CONFIG = pathlib.Path('/private/host-bootstrap.json')
MAX_LIFETIME_MS = 1_200_000
KILL_GRACE_SECONDS = 5


def require(value, reason):
    if not value:
        raise ValueError(reason)


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
    # Public immutable setting is available before manifest checks. All later
    # stages use the same absolute deadline; no relative timer resets.
    config = {'expiresAtMs': int(os.environ.get('A09_EXPIRES_AT_MS', '0'))}
    argv = timeout_argv(config, time.time_ns() // 1_000_000)
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

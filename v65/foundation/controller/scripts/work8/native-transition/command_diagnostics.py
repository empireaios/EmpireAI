"""Exception-aware command invocation; only allowlisted causal receipts persist."""
import errno
import hashlib
import json
import os
import pathlib
import subprocess
import time

from native_diagnostics import from_error, parse_stream, sanitize, save_first


def _text(value):
    return value.decode('utf8', errors='replace') if isinstance(value, bytes) else (value or '')


def _bytes(value):
    return value if isinstance(value, bytes) else (value or '').encode('utf8')


def _write_first(path, value):
    data = (json.dumps(value, indent=2) + '\n').encode()
    fd = None
    try:
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
        with os.fdopen(fd, 'wb') as stream:
            fd = None
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
    except FileExistsError:
        pass
    finally:
        if fd is not None:
            os.close(fd)


def invoke(args, *, out, stage, timeout, cwd=None, input=None, log=None,
           expected_exit_codes=(0,)):
    """Called by the actual coordinator. Raw output remains only in memory.

    The exception class/deadline belong to this command boundary; a valid child
    receipt remains the causal record. Caller/cleanup exceptions cannot replace it.
    """
    out = pathlib.Path(out)
    if log is not None and (pathlib.Path(log).name != log or not log.endswith('.log')):
        raise ValueError('DIAGNOSTIC_FILENAME_REFUSED')
    started = time.monotonic()
    exception = None
    exit_code = None
    try:
        result = subprocess.run(args, cwd=cwd,
                                input=input.encode('utf8') if isinstance(input, str) else input,
                                stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE, timeout=timeout, check=False)
        raw_stdout, raw_stderr = _bytes(result.stdout), _bytes(result.stderr)
        exit_code = result.returncode
    except subprocess.TimeoutExpired as error:
        exception = error
        raw_stdout, raw_stderr = _bytes(error.stdout), _bytes(error.stderr)
    except OSError as error:
        exception = error
        raw_stdout, raw_stderr = b'', b''
    stdout, stderr = _text(raw_stdout), _text(raw_stderr)
    # Protocol records are emitted on stderr. Never let arbitrary unterminated
    # stdout destroy their line framing, including TimeoutExpired partial data.
    child = parse_stream(stderr) or parse_stream(stdout)
    raw = raw_stdout + raw_stderr
    output = stdout + ('\n' if stdout and stderr and not stdout.endswith('\n') else '') + stderr
    elapsed_ms = max(0, round((time.monotonic() - started) * 1000))
    context = {
        'exceptionClass': ('TimeoutExpired' if isinstance(exception, subprocess.TimeoutExpired)
                           else 'OSError' if isinstance(exception, OSError) else None),
        'numericErrno': exception.errno if isinstance(exception, OSError) else None,
        'configuredDeadlineMs': round(timeout * 1000),
        'elapsedMonotonicMs': elapsed_ms,
    }
    metadata = {'schema': 'work8-v61-command-output-metadata-v1',
                'operation': 'EXECUTE_REVIEWED_COMMAND', 'exitCode': exit_code,
                'exception': context, 'rawOutputBytes': len(raw),
                'rawOutputSha256': hashlib.sha256(raw).hexdigest(),
                'rawOutputDigestOrdering': 'STDOUT_THEN_STDERR',
                'streams': {name: {'bytes': len(value), 'sha256': hashlib.sha256(value).hexdigest()}
                            for name, value in [('stdout', raw_stdout), ('stderr', raw_stderr)]},
                'safeFirstFailure': child, 'rawOutputRetained': False}
    failed = exception is not None or exit_code not in expected_exit_codes
    if failed:
        cause = child or from_error(exception or RuntimeError('COMMAND_FAILED'), stage,
                                    'EXECUTE_REVIEWED_COMMAND', '', exit_code)
        cause['commandException'] = context
        save_first(out, sanitize(cause))
        _write_first(out / 'command-first-exception.json', metadata)
    if log:
        # Fixed names are owned by controller source, never child payloads.
        _write_first(out / log, metadata)
    if failed:
        safe = RuntimeError('COMMAND_FAILED')
        safe.safe_command = metadata
        raise safe from None
    return output

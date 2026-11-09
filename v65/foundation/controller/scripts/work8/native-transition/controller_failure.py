"""Write-once controller exception context, independent of child observations.

Diagnostic capture is best effort and must never replace the exception that
caused the controller to fail. No raw exception text is retained.
"""
import json
import os
from pathlib import Path

HOST_STAGES = frozenset(('actual-initialized-native-live-brain-capture', 'actual-live-brain-baseline',
    'actual-runtime-start', 'cleanup', 'drain-and-independent-readback',
    'native-preflight-application-start', 'phase-b-authorised-application-start', 'native-preflight-orderly-drain',
    'new-private-capture-exchanges-refusal-controls', 'normal-return-version', 'normal-view',
    'original-mounted-entrypoint-contract-before-startup', 'preflight', 'recovery-version',
    'retained-v98-frontend-startup-evidence', 'verify-complete-current-package-delivery'))
MARKERS = frozenset(('browser-complete.json', 'live-brain-captured.json', 'normal-complete.json',
    'normal-observed.json', 'recovery-complete.json', 'replayed-observed.json',
    'returned-observed.json', 'runtime-drained.json', 'runtime-ready.json'))
OPERATIONS = frozenset(('EXAMINATION_ASSERTION', 'WAIT_FOR_CONTROL_MARKER',
    'OBSERVE_CONTAINER_EXIT', 'OBSERVE_BROWSER_FAILURE', 'EXECUTE_REVIEWED_COMMAND'))


def context(error):
    text = str(error)
    operation = 'EXAMINATION_ASSERTION'
    result = {}
    prefix, _, suffix = text.partition(':')
    if prefix == 'PHASE_DEADLINE' and suffix in MARKERS:
        operation = 'WAIT_FOR_CONTROL_MARKER'; result['marker'] = suffix
    elif prefix == 'CONTAINER_EXITED' and suffix in ('backend', 'browser'):
        operation = 'OBSERVE_CONTAINER_EXIT'; result['role'] = suffix
    elif prefix == 'BROWSER_FIRST_FAILURE':
        operation = 'OBSERVE_BROWSER_FAILURE'
    elif prefix == 'COMMAND_FAILED':
        operation = 'EXECUTE_REVIEWED_COMMAND'
    return {'operation': operation, **result}


def preserve(out, error, stage, phase, *, make_failure, parse_browser, browser_file=None):
    """Return a fixed availability flag; never throw over the primary error."""
    try:
        value = {'schema': 'work8-v104-controller-first-failure-v1', 'firstFailure': True,
            'phase': phase if phase in ('preflight', 'full') else 'UNKNOWN',
            'stage': stage if stage in HOST_STAGES else 'UNKNOWN', **context(error),
            'safeFirstFailure': make_failure(error, stage, 'EXAMINATION_ASSERTION'),
            'rawOutputRetained': False, 'applicationAcceptance': False}
        try:
            if browser_file is not None:
                path = Path(browser_file)
                if path.is_file() and not path.is_symlink() and path.stat().st_size <= 4096:
                    browser = json.loads(path.read_text())
                    bounded = parse_browser('WORK8_BROWSER_DIAGNOSTIC '+json.dumps({**browser, 'firstFailure': True}))
                    if bounded['diagnostics']:
                        value['browserFailure'] = bounded['diagnostics'][0]
        except Exception:
            pass
        data = (json.dumps(value, sort_keys=True, separators=(',', ':'))+'\n').encode()
        if len(data) > 16384:
            return False
        target = Path(out)/'first-controller-failure.json'
        try:
            fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
        except FileExistsError:
            return True
        with os.fdopen(fd, 'wb') as stream:
            stream.write(data); stream.flush(); os.fsync(stream.fileno())
        return True
    except Exception:
        return False

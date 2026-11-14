"""Bounded Linux descendant stop for one dedicated pre-spawn subreaper.

Call enable_subreaper before this supervisor spawns any processes; pre-existing
descendants are refused. The dedicated supervisor must not start unrelated
children afterward. Siblings and every process outside its descendant tree are
never targets. No PID-only signal is used: pidfds bind each SIGKILL to the
observed process identity. Missing capability, ambiguous census or expiry fails
closed. This verifies process termination, not provider erasure.
"""
import ctypes
import os
import pathlib
import signal
import subprocess
import time

_scope_pid = None
_scope_start = None
_baseline = set()
_enabled = False
last_stop_report = None
_MAX_PROCESSES = 32768


def _identity(pid):
    try:
        raw = pathlib.Path('/proc', str(pid), 'stat').read_text()
    except FileNotFoundError:
        return None
    tail = raw.rsplit(')', 1)
    if len(tail) != 2:
        raise RuntimeError('PROC_STAT_MALFORMED')
    fields = tail[1].split()
    if len(fields) < 20 or fields[0] not in 'RSDZTtXxKWIP':
        raise RuntimeError('PROC_STAT_MALFORMED')
    return {'pid': pid, 'ppid': int(fields[1]), 'state': fields[0],
            'starttime': int(fields[19])}


def _key(item):
    return item['pid'], item['starttime']


def _census(deadline):
    result = {}
    with os.scandir('/proc') as entries:
        count = 0
        for entry in entries:
            if time.monotonic() >= deadline:
                raise TimeoutError('PROCESS_CENSUS_DEADLINE')
            if not entry.name.isdigit():
                continue
            count += 1
            if count > _MAX_PROCESSES:
                raise RuntimeError('PROCESS_CENSUS_BOUND')
            item = _identity(int(entry.name))
            if item is not None:
                result[item['pid']] = item
    return result


def _descendants(census, root_pid, deadline):
    by_parent = {}
    for pid, item in census.items():
        if time.monotonic() >= deadline:
            raise TimeoutError('PROCESS_TREE_DEADLINE')
        by_parent.setdefault(item['ppid'], []).append(pid)
    selected = set()
    frontier = [root_pid]
    # Linear tree traversal remains bounded even for a deeply forked graph.
    while frontier:
        if time.monotonic() >= deadline:
            raise TimeoutError('PROCESS_TREE_DEADLINE')
        parent = frontier.pop()
        for pid in by_parent.get(parent, ()):
            if pid != root_pid and pid not in selected:
                selected.add(pid)
                frontier.append(pid)
    return {pid: census[pid] for pid in selected}


def enable_subreaper():
    """Establish scope once, before managed spawn; failure raises, not best effort."""
    global _scope_pid, _scope_start, _baseline, _enabled
    if _enabled:
        raise RuntimeError('SUBREAPER_ALREADY_ENABLED')
    if not hasattr(os, 'pidfd_open') or not hasattr(signal, 'pidfd_send_signal'):
        raise RuntimeError('PIDFD_REQUIRED')
    me = os.getpid()
    mine = _identity(me)
    if mine is None:
        raise RuntimeError('SELF_IDENTITY_UNAVAILABLE')
    deadline = time.monotonic() + 1.0
    snapshot = _census(deadline)
    baseline = {_key(item) for item in _descendants(snapshot, me, deadline).values()}
    if baseline:
        raise RuntimeError('SUBREAPER_REQUIRES_CHILD_FREE_START')
    libc = ctypes.CDLL(None, use_errno=True)
    if libc.prctl(36, 1, 0, 0, 0) != 0:
        raise OSError(ctypes.get_errno(), 'SUBREAPER_SET_FAILED')
    actual = ctypes.c_int()
    if libc.prctl(37, ctypes.byref(actual), 0, 0, 0) != 0 or actual.value != 1:
        raise RuntimeError('SUBREAPER_READBACK_FAILED')
    probe = os.pidfd_open(me, 0)
    os.close(probe)
    _scope_pid, _scope_start, _baseline = me, mine['starttime'], baseline
    _enabled = True
    return {'subreaperEnabled': True, 'pidfdAvailable': True,
            'preExistingDescendantsExcluded': len(baseline)}


def _signal_pinned(item):
    """Return False for a departed PID; never target a replacement process."""
    try:
        descriptor = os.pidfd_open(item['pid'], 0)
    except ProcessLookupError:
        return False
    try:
        current = _identity(item['pid'])
        if current is None:
            return False
        if _key(current) != _key(item):
            raise RuntimeError('PROCESS_IDENTITY_CHANGED')
        try:
            signal.pidfd_send_signal(descriptor, signal.SIGKILL, None, 0)
        except ProcessLookupError:
            return False
        return True
    finally:
        os.close(descriptor)


def stop_descendants(children, deadline):
    """Stop and reap only this scope before absolute monotonic deadline.

children is the supervisor's existing name -> subprocess.Popen mapping. The
boolean return is accompanied by last_stop_report, containing no process argv,
credentials or filesystem contents. Unknown state always returns False.
"""
    global last_stop_report
    report = {'schema': 'A09_PROCESS_GRAPH_STOP_V1', 'stopped': False,
              'scope': 'DEDICATED_PRESPAWN_SUBREAPER_DESCENDANTS',
              'seenProcesses': 0, 'signalsSent': 0, 'reapedProcesses': 0,
              'baselineExcluded': len(_baseline), 'errors': []}
    last_stop_report = report
    seen = {}
    empty_scans = 0
    try:
        if not _enabled or _scope_pid != os.getpid():
            raise RuntimeError('SUBREAPER_SCOPE_NOT_ENABLED')
        me = _identity(os.getpid())
        if me is None or me['starttime'] != _scope_start:
            raise RuntimeError('SUBREAPER_SCOPE_IDENTITY_CHANGED')
        if not isinstance(deadline, (int, float)) or not time.monotonic() < deadline:
            raise TimeoutError('PROCESS_STOP_DEADLINE')
        if not isinstance(children, dict):
            raise RuntimeError('REGISTERED_CHILDREN_INVALID')
        managed = tuple(children.values())
        for child in managed:
            if not isinstance(child, subprocess.Popen):
                raise RuntimeError('REGISTERED_CHILD_INVALID')
            item = _identity(child.pid)
            if item is not None and _key(item) in _baseline:
                raise RuntimeError('MANAGED_CHILD_PREEXISTS_SCOPE')
        while time.monotonic() < deadline:
            census = _census(deadline)
            descendants = _descendants(census, _scope_pid, deadline)
            # Admission required a child-free dedicated supervisor. Every new
            # descendant is in scope, even after double-fork/setsid adoption.
            scoped = descendants
            for child in managed:
                item = census.get(child.pid)
                if item is not None and child.poll() is None and child.pid not in scoped:
                    raise RuntimeError('MANAGED_CHILD_OUTSIDE_SCOPE')
            for item in scoped.values():
                seen[_key(item)] = item
                if item['state'] not in ('Z', 'X', 'x'):
                    if time.monotonic() >= deadline:
                        raise TimeoutError('PROCESS_STOP_DEADLINE')
                    report['signalsSent'] += int(_signal_pinned(item))
            # Keep Popen returncodes consistent before reaping other adopted PIDs.
            for child in managed:
                child.poll()
            for key, item in tuple(seen.items()):
                current = _identity(item['pid'])
                if current is None:
                    continue
                if _key(current) != key:
                    raise RuntimeError('PROCESS_IDENTITY_CHANGED')
                if current['ppid'] == _scope_pid and current['state'] in ('Z', 'X', 'x'):
                    try:
                        pid, _ = os.waitpid(item['pid'], os.WNOHANG)
                        report['reapedProcesses'] += bool(pid)
                    except ChildProcessError:
                        # Concurrent Popen.poll can already have reaped it.
                        if _identity(item['pid']) is not None:
                            raise RuntimeError('REAP_UNCONFIRMED')
            report['seenProcesses'] = len(seen)
            if not scoped:
                empty_scans += 1
                if empty_scans >= 2:
                    if any(child.poll() is None for child in managed):
                        raise RuntimeError('MANAGED_CHILD_UNREAPED')
                    report['stopped'] = True
                    return True
            else:
                empty_scans = 0
            time.sleep(min(0.005, max(0.0, deadline - time.monotonic())))
        raise TimeoutError('PROCESS_STOP_DEADLINE')
    except (OSError, ValueError, RuntimeError, TimeoutError) as exc:
        # Do not expose /proc paths or exception text from native system calls.
        if type(exc) is RuntimeError or type(exc) is TimeoutError:
            code = str(exc)
        elif isinstance(exc, PermissionError):
            code = 'PROCESS_PERMISSION_UNCONFIRMED'
        else:
            code = 'PROCESS_CENSUS_OR_SIGNAL_UNCONFIRMED'
        report['errors'].append(code)
        report['seenProcesses'] = len(seen)
        return False

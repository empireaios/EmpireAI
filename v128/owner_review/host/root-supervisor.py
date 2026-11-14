#!/usr/bin/python3
"""Fixed A09 host process graph; always inside root PID1 GNU timeout."""
import importlib.util
import json
import os
import pathlib
import queue
import signal
import stat
import subprocess
import threading
import time

CONTROL = pathlib.Path('/control/owner_review')
MAX_LOG_BYTES = 32 * 1024 * 1024
MAX_LOG_LINES = 4000
MAX_LINE_BYTES = 8192
MAX_CUSTODY_BYTES = 24 * 1024 * 1024
MAX_CUSTODY_LINES = 3200
SOFT_SEAL_MS = 90_000
events = queue.Queue(maxsize=64)
children = {}
counts = {'bytes': 0, 'lines': 0, 'custodyBytes': 0, 'custodyLines': 0}
lock = threading.Lock()
stop_requested = threading.Event()
custody_logged = threading.Event()
terminal_reason = None
service_expiry_ms = None


def event(kind, data=None):
    try:
        events.put_nowait((kind, data))
    except queue.Full:
        stop_requested.set()


def signal_handler(_signum, _frame):
    stop_requested.set()


def relay(name, stream):
    """No arbitrary native/transport output is copied into provider logs."""
    buffer = bytearray()
    while True:
        raw = stream.read1(4096)
        if not raw:
            return
        with lock:
            counts['bytes'] += len(raw)
            over = counts['bytes'] > MAX_LOG_BYTES
        if over:
            event('seal', 'PROCESS_OUTPUT_BYTE_BUDGET')
            continue
        buffer.extend(raw)
        if len(buffer) > MAX_LINE_BYTES and b'\n' not in buffer:
            buffer.clear()
            event('seal', 'PROCESS_OUTPUT_LINE_BOUND')
            continue
        while b'\n' in buffer:
            line, _, rest = buffer.partition(b'\n')
            buffer = bytearray(rest)
            with lock:
                counts['lines'] += 1
                over = counts['lines'] > MAX_LOG_LINES
            if len(line) > MAX_LINE_BYTES or over:
                event('seal', 'PROCESS_OUTPUT_LINE_BUDGET')
                continue
            try:
                item = json.loads(line)
            except (ValueError, UnicodeError):
                continue
            if not isinstance(item, dict):
                continue
            schema = item.get('schema')
            if name == 'ingress' and schema == 'A09_HOST_SEAL_REQUEST_V1':
                event('seal', 'INGRESS_BUDGET_OR_EXPIRY')
            elif name == 'native' and schema in ('A09_CUSTODY_CIPHERTEXT_V1', 'A09_CUSTODY_INDEX_V1'):
                with lock:
                    counts['custodyBytes'] += len(line) + 1
                    counts['custodyLines'] += 1
                    allowed = counts['custodyBytes'] <= MAX_CUSTODY_BYTES and counts['custodyLines'] <= MAX_CUSTODY_LINES
                if not allowed:
                    event('seal', 'CUSTODY_LOG_BUDGET')
                    continue
                # These two source-reviewed schemas contain ciphertext/index only.
                print(line.decode('utf8'), flush=True)
                if schema == 'A09_CUSTODY_INDEX_V1' and item.get('complete') is True:
                    custody_logged.set()


def spawn(name, command, unprivileged):
    if unprivileged:
        command = ['/usr/bin/setpriv', '--reuid=1001', '--regid=1001',
                   '--init-groups', '--no-new-privs', '--bounding-set=-all',
                   '--inh-caps=-all', '--ambient-caps=-all', *command]
    child = subprocess.Popen(command, stdin=subprocess.DEVNULL,
                             stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                             start_new_session=True, cwd='/control')
    children[name] = child
    for stream in (child.stdout, child.stderr):
        threading.Thread(target=relay, args=(name, stream), daemon=True).start()
    return child


def send(name, signum):
    child = children.get(name)
    if child and (signum == signal.SIGKILL or child.poll() is None):
        try:
            if signum == signal.SIGKILL:
                # A supervisor can exit while descendants retain its process
                # group. Reap that group even after its leader has exited.
                os.killpg(child.pid, signum)
            else:
                # The native supervisor seals before stopping Redis/frontend.
                # Sending USR1/TERM to its whole group would kill them too early.
                os.kill(child.pid, signum)
        except ProcessLookupError:
            pass


def checked_private_ready():
    path = pathlib.Path('/private/review-bootstrap.json')
    info = path.lstat()
    if path.resolve() != path or not path.is_file() or info.st_uid != 0 or info.st_mode & 0o022:
        raise ValueError('PRIVATE_BOOTSTRAP_NOT_ROOT_FIXED')


def open_native_work_directories():
    # Sticky root-owned directories permit fresh app files while preserving
    # root-owned transport receipts against deletion/rename by the app UID.
    for name in ('/state', '/evidence'):
        path = pathlib.Path(name)
        path.mkdir(mode=0o750, exist_ok=True)
        info = path.lstat()
        if (path.resolve() != path or not stat.S_ISDIR(info.st_mode)
                or info.st_uid != 0 or info.st_mode & 0o022):
            raise ValueError('NATIVE_WORK_DIRECTORY_NOT_ROOT_FIXED')
        os.chown(path, 0, 1001)
        os.chmod(path, 0o1770)


def main():
    global terminal_reason, service_expiry_ms
    if os.geteuid() != 0:
        raise ValueError('HOST_ROOT_REQUIRED')
    spec = importlib.util.spec_from_file_location('a09_watchdog', CONTROL / 'host/root-watchdog.py')
    watchdog = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(watchdog)
    config = watchdog.checked_config()
    watchdog.timeout_argv(config, time.time_ns() // 1_000_000)
    expiry = config['expiresAtMs']
    service_expiry_ms = expiry
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    ingress = spawn('ingress', ['/usr/local/bin/node', str(CONTROL / 'host/bounded-ingress.mjs')], True)
    transport = spawn('transport', ['/usr/local/bin/node', str(CONTROL / 'review-transport.mjs')], False)
    native = None
    soft_sealed = False
    while not stop_requested.is_set():
        now = time.time_ns() // 1_000_000
        if now >= expiry:
            terminal_reason = 'ABSOLUTE_EXPIRY'
            break
        if ingress.poll() is not None:
            terminal_reason = 'INGRESS_TERMINATED'
            break
        if native is None and transport.poll() is not None:
            if transport.returncode != 0:
                terminal_reason = 'TRANSPORT_REFUSED'
                break
            checked_private_ready()
            open_native_work_directories()
            if now >= expiry - SOFT_SEAL_MS:
                terminal_reason = 'REVIEW_WINDOW_ALREADY_CLOSED'
                break
            native = spawn('native', ['/usr/local/bin/node', str(CONTROL / 'review-supervisor.mjs')], True)
        if native is not None:
            if native.poll() is not None:
                terminal_reason = 'NATIVE_TERMINATED'
                break
            if not soft_sealed and now >= expiry - SOFT_SEAL_MS:
                send('native', signal.SIGUSR1)
                soft_sealed = True
        try:
            kind, _data = events.get(timeout=0.02)
            if kind == 'seal':
                terminal_reason = 'BOUNDED_HOST_SEAL'
                break
        except queue.Empty:
            pass
    terminal_reason = terminal_reason or 'HOST_TERM_SIGNAL'
    send('transport', signal.SIGTERM)
    # An early ingress budget or listener failure closes owner admission but
    # must not truncate a bounded encrypted log export. The existing absolute
    # lease still wins; this is neither a restart nor a new review window.
    if native is not None and native.poll() is None:
        send('native', signal.SIGUSR1)
        soft_drain_until = min(time.monotonic() + 80,
                               time.monotonic() + max(0, (expiry - time.time_ns() // 1_000_000) / 1000))
        while (terminal_reason not in ('ABSOLUTE_EXPIRY', 'HOST_TERM_SIGNAL')
               and not stop_requested.is_set() and not custody_logged.is_set()
               and native.poll() is None and time.monotonic() < soft_drain_until):
            time.sleep(0.02)
    # Retain the existing ingress only for backend's bounded read-only export.
    send('native', signal.SIGTERM)
    # Reserve part of the existing five-second PID1 kill grace for group stop
    # and bounded plaintext unlink. The immutable hard timeout is unchanged.
    drain_until = time.monotonic() + 3.0
    while time.monotonic() < drain_until:
        if native is None or native.poll() is not None:
            break
        time.sleep(0.02)
    return 0


def stop_graph_and_cleanup():
    """No fresh lease, no custody wait, and no network operation."""
    for name in tuple(children):
        send(name, signal.SIGKILL)
    for child in children.values():
        try:
            child.wait(timeout=0.1)
        except subprocess.TimeoutExpired:
            pass
    stopped = True
    for child in children.values():
        try:
            os.killpg(child.pid, 0)
            stopped = False
        except ProcessLookupError:
            pass
        except PermissionError:
            stopped = False
    spec = importlib.util.spec_from_file_location('a09_terminal_cleanup', CONTROL / 'host/terminal-cleanup.py')
    cleanup = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(cleanup)
    remaining = 1.0
    if service_expiry_ms is not None:
        remaining = min(remaining, max(0, (service_expiry_ms + 4900 - time.time_ns() // 1_000_000) / 1000))
    return cleanup.cleanup_plaintext(deadline=time.monotonic() + remaining,
                                     processes_stopped=stopped,
                                     ciphertext_log_complete=custody_logged.is_set())


if __name__ == '__main__':
    status = 78
    try:
        status = main()
    except Exception:
        terminal_reason = 'HOST_REFUSED'
    finally:
        try:
            cleanup = stop_graph_and_cleanup()
        except Exception:
            cleanup = {'schema': 'A09_TERMINAL_PLAINTEXT_CLEANUP_V1',
                       'status': 'INCOMPLETE', 'errors': ['CLEANUP_HOST_FAILURE'],
                       'secureErasureClaimed': False, 'providerDeletionClaimed': False,
                       'acceptanceClaimed': False}
        if cleanup['status'] != 'COMPLETE_LOGICAL_UNLINK':
            status = 78
        print(json.dumps(cleanup), flush=True)
        print(json.dumps({'schema': 'A09_HOST_TERMINAL_V1', 'reason': terminal_reason,
                          'processOutputBytes': counts['bytes'],
                          'custodyLogBytes': counts['custodyBytes'],
                          'ownerDecisionClaimed': False}), flush=True)
    raise SystemExit(status)

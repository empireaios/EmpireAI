#!/usr/bin/python3
"""Bounded logical unlink of A09 plaintext after its process graph stops.

The host's original PID1 timeout remains the hard limit. This is not secure
erasure, provider deletion, or proof that a human made a review decision.
"""
import hashlib
import json
import os
import stat
import time

DIRECTORIES = ('private', 'inputs/a08', 'state/review', 'evidence')
EXPORT = 'state/review-export'
FIXED_EXPORT = 'fixed-export.json'
MAX_ENTRIES = 4096
MAX_DEPTH = 12
MAX_EXPORT_BYTES = 12 * 1024 * 1024


class CleanupBoundary(Exception):
    pass


def _open_parent(root_fd, relative):
    parts = relative.split('/')
    if any(not part or part in ('.', '..') for part in parts):
        raise CleanupBoundary('PATH_SCOPE')
    current = os.dup(root_fd)
    try:
        for part in parts[:-1]:
            successor = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW,
                                dir_fd=current)
            os.close(current)
            current = successor
        return current, parts[-1]
    except BaseException:
        os.close(current)
        raise


def _read(root_fd, relative, maximum):
    parent, name = _open_parent(root_fd, relative)
    fd = None
    try:
        fd = os.open(name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK,
                     dir_fd=parent)
        before = os.fstat(fd)
        if not stat.S_ISREG(before.st_mode) or before.st_nlink != 1 or not 0 < before.st_size <= maximum:
            raise CleanupBoundary('READ_BOUND')
        raw = bytearray()
        while len(raw) <= maximum:
            chunk = os.read(fd, min(65536, maximum + 1 - len(raw)))
            if not chunk:
                break
            raw.extend(chunk)
        after = os.fstat(fd)
        identity = lambda item: (item.st_dev, item.st_ino, item.st_size,
                                 item.st_mtime_ns, item.st_ctime_ns)
        if len(raw) != before.st_size or identity(before) != identity(after):
            raise CleanupBoundary('READ_CHANGED')
        return bytes(raw)
    finally:
        if fd is not None:
            os.close(fd)
        os.close(parent)


def cleanup_plaintext(root='/', *, deadline=None, now=time.monotonic,
                      processes_stopped=False, ciphertext_log_complete=False,
                      entry_limit=MAX_ENTRIES):
    """Fixed relative paths only; caller supplies a temporary root in tests.

    No file is overwritten and no symlink is followed. A hardlinked outside
    file is never modified: only the in-scope directory entry is removed.
    """
    started = now()
    deadline = started + 1.0 if deadline is None else min(deadline, started + 1.0)
    result = {
        'schema': 'A09_TERMINAL_PLAINTEXT_CLEANUP_V1',
        'status': 'INCOMPLETE', 'logicalDeletionOnly': True,
        'secureErasureClaimed': False, 'providerDeletionClaimed': False,
        'processGraphStopped': processes_stopped,
        'ciphertextLogCompleteObserved': bool(ciphertext_log_complete),
        'controllerDigestAckObserved': False, 'encryptedExportRetained': False,
        'removedEntries': 0, 'errors': [], 'ownerDecisionClaimed': False,
        'acceptanceClaimed': False,
    }
    root_fd = None
    preserved_digest = None

    def check(depth=0):
        if now() >= deadline:
            raise CleanupBoundary('DEADLINE')
        if depth > MAX_DEPTH or result['removedEntries'] >= entry_limit:
            raise CleanupBoundary('ENTRY_OR_DEPTH_BOUND')

    def remove_at(parent, name, depth=0):
        check(depth)
        try:
            before = os.stat(name, dir_fd=parent, follow_symlinks=False)
        except FileNotFoundError:
            return
        if stat.S_ISDIR(before.st_mode):
            fd = os.open(name, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW,
                         dir_fd=parent)
            try:
                actual = os.fstat(fd)
                if (actual.st_dev, actual.st_ino) != (before.st_dev, before.st_ino) or actual.st_dev != root_device:
                    raise CleanupBoundary('DIRECTORY_IDENTITY_OR_MOUNT')
                with os.scandir(fd) as entries:
                    for entry in entries:
                        remove_at(fd, entry.name, depth + 1)
            finally:
                os.close(fd)
            check(depth)
            os.rmdir(name, dir_fd=parent)
        else:
            os.unlink(name, dir_fd=parent)
        result['removedEntries'] += 1

    try:
        # A symlink ancestor would invalidate the reviewed fixed path scope.
        if os.path.realpath(root) != os.path.abspath(root):
            raise CleanupBoundary('ROOT_SYMLINK')
        root_fd = os.open(root, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        root_device = os.fstat(root_fd).st_dev
        try:
            check()
            raw = _read(root_fd, EXPORT + '/' + FIXED_EXPORT, MAX_EXPORT_BYTES)
            fixed = json.loads(raw)
            if (not isinstance(fixed, dict) or set(fixed) != {'schema', 'envelope', 'ciphertextBase64'}
                    or fixed['schema'] != 'A09_ENCRYPTED_NATIVE_REVIEW_EXPORT_V1'
                    or not isinstance(fixed['envelope'], dict)
                    or not isinstance(fixed['ciphertextBase64'], str)
                    or not fixed['ciphertextBase64']):
                raise CleanupBoundary('FIXED_EXPORT_FORMAT')
            preserved_digest = hashlib.sha256(raw).hexdigest()
            check()
            try:
                ack = json.loads(_read(root_fd, 'evidence/controller-export-ack.json', 4096))
                result['controllerDigestAckObserved'] = (
                    isinstance(ack, dict)
                    and ack.get('schema') == 'A09_EXACT_CIPHERTEXT_CONTROLLER_ACK_V1'
                    and ack.get('exportSHA256') == preserved_digest)
            except (OSError, ValueError, CleanupBoundary):
                pass
        except FileNotFoundError:
            pass
        except (OSError, ValueError, CleanupBoundary):
            result['errors'].append('ENCRYPTED_EXPORT_UNVERIFIED')

        # All writers were first signalled/stopped by the host. Preserve the
        # exact ciphertext export even without an ACK, but never wait past the
        # lease's existing termination grace to obtain one.
        for target in DIRECTORIES:
            try:
                check()
                parent, name = _open_parent(root_fd, target)
                try:
                    remove_at(parent, name)
                finally:
                    os.close(parent)
            except FileNotFoundError:
                continue
            except (OSError, CleanupBoundary) as error:
                result['errors'].append(str(error) if isinstance(error, CleanupBoundary) else 'PATH_UNLINK_FAILED')
        try:
            check()
            parent, name = _open_parent(root_fd, EXPORT)
            try:
                fd = os.open(name, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=parent)
                try:
                    if os.fstat(fd).st_dev != root_device:
                        raise CleanupBoundary('EXPORT_MOUNT')
                    with os.scandir(fd) as entries:
                        for entry in entries:
                            if entry.name != FIXED_EXPORT or preserved_digest is None:
                                remove_at(fd, entry.name)
                finally:
                    os.close(fd)
            finally:
                os.close(parent)
        except FileNotFoundError:
            pass
        except (OSError, CleanupBoundary) as error:
            result['errors'].append(str(error) if isinstance(error, CleanupBoundary) else 'EXPORT_UNLINK_FAILED')

        if preserved_digest is not None:
            try:
                check()
                result['encryptedExportRetained'] = hashlib.sha256(
                    _read(root_fd, EXPORT + '/' + FIXED_EXPORT, MAX_EXPORT_BYTES)).hexdigest() == preserved_digest
                if result['encryptedExportRetained']:
                    result['encryptedExportSHA256'] = preserved_digest
                else:
                    result['errors'].append('ENCRYPTED_EXPORT_CHANGED')
            except (OSError, CleanupBoundary):
                result['errors'].append('ENCRYPTED_EXPORT_READBACK_FAILED')
        if not processes_stopped:
            result['errors'].append('PROCESS_GRAPH_STOP_UNCONFIRMED')
        result['status'] = 'COMPLETE_LOGICAL_UNLINK' if not result['errors'] else 'INCOMPLETE'
    except (OSError, CleanupBoundary) as error:
        result['errors'].append(str(error) if isinstance(error, CleanupBoundary) else 'ROOT_OPEN_FAILED')
    finally:
        if root_fd is not None:
            os.close(root_fd)
    result['elapsedMs'] = max(0, int((now() - started) * 1000))
    # A complete log index is only a recoverability signal. It does not prove
    # that an independent reader retrieved and verified every ciphertext byte.
    result['evidenceCustodyUnconfirmed'] = not (
        result['encryptedExportRetained'] and result['controllerDigestAckObserved'])
    return result

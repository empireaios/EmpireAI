#!/usr/bin/env python3
"""Preserve the actual drained commerce SQLite store and its exact private assets.

This is a SQLite backup, never an event reconstruction or an authentication export.
The caller must drain the exact native/browser containers before invoking this file.
"""
import base64
import contextlib
import copy
import hashlib
import json
import os
import pathlib
import shutil
import sqlite3
import stat
import struct
import sys
import tempfile
import time

LIMIT = 4194304
STATUS = 'PASS_AUTHENTICATED_SOURCE_BOUND_RETAINED_MEDIA_PRESENTATION'
TABLES = ('work8_connector_source_candidates', 'work8_connector_walkthrough', 'work8_connector_media')
ASSETS = (
    ('retained-original.jpg', 'connector-media-original.jpg', 149719, '4fe19c2fbe0907474d053181a5568489d842421e0dbd2b627e487cca61511048'),
    ('retained-revised.png', 'connector-media-revised.png', 599818, '69f1f95ab622041332d5e5e1ee43a59a2c34bd017151a6bb45e260f69e035788'),
)


def require(condition, code):
    if not condition:
        raise RuntimeError('MEDIA_STORE_' + code)


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def encoded(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode()


def digest(value):
    return sha(encoded(value))


def directory(path):
    path = pathlib.Path(path)
    require(path.is_absolute() and path.resolve(strict=True) == path and path.is_dir(), 'DIRECTORY')
    return path


def read_file(path, limit=LIMIT, allow_empty=False):
    require(path.resolve(strict=True) == path, 'SYMLINK')
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    try:
        before = os.fstat(fd)
        require(stat.S_ISREG(before.st_mode) and before.st_nlink == 1 and (before.st_size > 0 or allow_empty) and before.st_size <= limit, 'FILE_TYPE_OR_BOUND')
        with os.fdopen(fd, 'rb', closefd=False) as stream:
            raw = stream.read(limit + 1)
        after = os.fstat(fd)
        require(len(raw) == before.st_size and (before.st_dev, before.st_ino, before.st_size, before.st_mtime_ns, before.st_ctime_ns) == (after.st_dev, after.st_ino, after.st_size, after.st_mtime_ns, after.st_ctime_ns), 'FILE_CHANGED')
        return raw
    finally:
        os.close(fd)


def read_json(path):
    return json.loads(read_file(path))


def no_sidecars(path):
    for suffix in ('-wal', '-shm', '-journal'):
        require(not os.path.lexists(str(path) + suffix), 'UNSAFE_SQLITE_SIDECAR')


def verify_wal(raw):
    if not raw:
        return {'validatedCurrentFrames': 0, 'lastCommittedFrame': 0, 'staleTailFrames': 0, 'staleTrailerDisposition': 'EMPTY_WAL'}
    require(len(raw) >= 32, 'WAL_HEADER')
    magic, version, page_size = struct.unpack('>III', raw[:12])
    require(magic in (0x377F0682, 0x377F0683) and version == 3007000 and 512 <= page_size <= 65536 and page_size & (page_size - 1) == 0, 'WAL_FORMAT')
    require((len(raw) - 32) % (page_size + 24) == 0, 'WAL_FRAME_BOUND')
    order = '<' if magic == 0x377F0682 else '>'
    def checksum(data, pair=(0, 0)):
        one, two = pair
        for first, second in struct.iter_unpack(order + 'II', data):
            one = (one + first + two) & 0xFFFFFFFF
            two = (two + second + one) & 0xFFFFFFFF
        return one, two
    pair = checksum(raw[:24])
    require(pair == struct.unpack('>II', raw[24:32]), 'WAL_HEADER_CHECKSUM')
    validated, committed = 0, 0
    for offset in range(32, len(raw), page_size + 24):
        frame = raw[offset:offset + page_size + 24]
        if frame[8:16] != raw[16:24]:
            # RESTART reuses the WAL from its beginning without truncating its old
            # physical tail. SQLite stops at the first non-current salt pair.
            # Never skip a current-generation checksum error or invent a commit.
            require(committed > 0, 'WAL_STALE_TAIL_WITHOUT_CURRENT_COMMIT')
            trailer = raw[offset:]
            require(all(raw[position + 8:position + 16] != raw[16:24] for position in range(offset, len(raw), page_size + 24)), 'WAL_CURRENT_FRAME_AFTER_STALE_TAIL')
            return {'validatedCurrentFrames': validated, 'lastCommittedFrame': committed, 'staleTailFrames': len(trailer) // (page_size + 24), 'staleTailBytes': len(trailer), 'staleTailSHA256': sha(trailer), 'staleTrailerDisposition': 'IGNORED_OLD_SALT_TRAILER_PER_SQLITE_WAL_FORMAT'}
        require(int.from_bytes(frame[:4], 'big') > 0, 'WAL_FRAME_IDENTITY')
        pair = checksum(frame[:8] + frame[24:], pair)
        require(pair == struct.unpack('>II', frame[16:24]), 'WAL_FRAME_CHECKSUM')
        validated += 1
        if int.from_bytes(frame[4:8], 'big') > 0:
            committed = validated
    return {'validatedCurrentFrames': validated, 'lastCommittedFrame': committed, 'staleTailFrames': 0, 'staleTrailerDisposition': 'NO_STALE_TRAILER'}


def source_components(path, forbidden):
    components = {}
    for suffix in ('', '-wal', '-shm', '-journal'):
        location = pathlib.Path(str(path) + suffix)
        if not os.path.lexists(location):
            continue
        raw = read_file(location, allow_empty=bool(suffix))
        reject_secrets(raw, forbidden)
        if suffix == '-wal':
            verify_wal(raw)
        if suffix == '-journal' and raw:
            require(len(raw) >= 28 and raw[:8] in (b'\xd9\xd5\x05\xf9\x20\xa1\x63\xd7', b'\0' * 8), 'JOURNAL_HEADER')
        components[suffix] = raw
    require('' in components and components[''].startswith(b'SQLite format 3\0'), 'SQLITE_HEADER')
    return components


def reject_secrets(raw, forbidden):
    require(not any(secret in raw for secret in forbidden), 'PRIVATE_AUTH_BYTES_REFUSED')


def typed(value):
    if value is None:
        return ['null', None]
    if isinstance(value, bytes):
        return ['blob', base64.b64encode(value).decode()]
    if isinstance(value, str):
        return ['text', value]
    if isinstance(value, int):
        return ['integer', str(value)]
    if isinstance(value, float):
        return ['real', value.hex()]
    raise RuntimeError('MEDIA_STORE_SQLITE_VALUE_TYPE')


def inventory(connection, forbidden, deadline, full):
    require(connection.execute('PRAGMA integrity_check').fetchall() == [('ok',)], 'INTEGRITY_CHECK')
    schema = connection.execute('SELECT type,name,tbl_name,rootpage,sql FROM sqlite_master ORDER BY type,name').fetchall()
    require(0 < len(schema) <= 256, 'SCHEMA_BOUND')
    tables = [entry[1] for entry in schema if entry[0] == 'table']
    require(set(TABLES if full else TABLES[:2]) <= set(tables), 'REQUIRED_TABLES')
    for prefix, table in zip(('source', 'walkthrough', 'media'), TABLES):
        if table not in tables:
            continue
        for action in ('update', 'delete'):
            name = 'immutable_connector_' + prefix + '_' + action
            require(any(entry[0] == 'trigger' and entry[1] == name and entry[2] == table and 'RAISE(ABORT,' in (entry[4] or '').replace(' ', '').upper() for entry in schema), 'IMMUTABILITY_TRIGGER')
    rows, summaries, count = {}, [], 0
    for table in tables:
        require(time.monotonic() < deadline, 'DEADLINE')
        quoted = '"' + table.replace('"', '""') + '"'
        cursor = connection.execute('SELECT * FROM ' + quoted)
        columns = [item[0] for item in cursor.description]
        values = cursor.fetchmany(10001)
        count += len(values)
        require(len(values) <= 10000 and count <= 20000, 'ROW_BOUND')
        stable = sorted(encoded([typed(value) for value in item]) for item in values)
        for item in stable:
            reject_secrets(item, forbidden)
        complete = encoded({'columns': columns, 'typedRows': [json.loads(item) for item in stable]})
        require(len(complete) <= LIMIT, 'TABLE_BOUND')
        rows[table] = [dict(zip(columns, item)) for item in values]
        summaries.append({'table': table, 'columns': columns, 'rows': len(values), 'typedRowsSHA256': sha(complete)})
    return {'schemaSHA256': digest(schema), 'tables': summaries, 'totalRows': count, 'allRowsSHA256': digest(summaries)}, rows


def verified_records(rows, source, walkthrough, captures, browser, policy, full):
    media_rows = sorted(rows.get(TABLES[2], []), key=lambda item: item['version'])
    require(len(rows[TABLES[0]]) == 1 and len(rows[TABLES[1]]) == 1 and (len(media_rows) == 2 if full else len(media_rows) <= 2), 'ACTUAL_HISTORY_COUNTS')
    source_row, walkthrough_row = rows[TABLES[0]][0], rows[TABLES[1]][0]
    require(source['status'] == 'ADMITTED_SOURCE_OBSERVATION_ONLY', 'SOURCE_ADMISSION')
    require(walkthrough['status'] == 'ADMITTED_RETAINED_FACTS_AND_EXECUTED_DEFER', 'WALKTHROUGH_ADMISSION')
    candidate, supplement = source['record'], walkthrough['record']
    for record in (candidate, supplement):
        require(digest({key: value for key, value in record.items() if key != 'digest'}) == record['digest'], 'ADMISSION_RECORD_DIGEST')
    require(json.loads(source_row['record']) == candidate and json.loads(walkthrough_row['record']) == supplement, 'ADMISSION_RECORD_CONTENT')
    require(source_row['workspace'] == candidate['workspace'] and source_row['id'] == candidate['id'] and source_row['source_sha'] == candidate['source']['receiptSHA256'] and source_row['operation'] == candidate['operationId'], 'SOURCE_COLUMNS')
    require(walkthrough_row['workspace'] == candidate['workspace'] and walkthrough_row['candidate'] == candidate['id'] and walkthrough_row['operation'] == supplement['operationId'] and supplement['candidateDigest'] == candidate['digest'], 'WALKTHROUGH_COLUMNS')
    records = [json.loads(item['record']) for item in media_rows]
    require([item['action'] for item in records] == ['REQUEST_EDIT', 'PROPOSE_RETAINED'][:len(records)], 'MEDIA_ACTIONS')
    require(policy is not None or not records, 'ACTUAL_BINDING_REQUIRED')
    binding_digest = None
    if policy is not None:
        require(policy['schema'] == 'WORK8_CONNECTOR_PRIVATE_MEDIA_BINDING_V1' and policy['workspace'] == candidate['workspace'] and policy['candidateId'] == candidate['id'] and policy['candidateDigest'] == candidate['digest'] and policy['rights'] == 'PRIVATE_FACTUAL_PREPARATION_ONLY' and policy['publicPublicationAllowed'] is False, 'ACTUAL_BINDING_SOURCE')
        require(policy['originalSHA256'] == ASSETS[0][3] and policy['revisedSHA256'] == ASSETS[1][3], 'ACTUAL_BINDING_ASSETS')
        binding_digest = digest({key: policy[key] for key in ('workspace', 'owner', 'candidateId', 'candidateDigest', 'rights', 'publicPublicationAllowed', 'originalSHA256', 'revisedSHA256', 'retainedReviewSHA256')})
    previous = ''
    for version, (item, event) in enumerate(zip(media_rows, records), 1):
        body = dict(event)
        actual = body.pop('digest')
        require(digest(body) == actual and event['previous'] == previous and event['version'] == version and event['ownerApproval'] is False, 'MEDIA_EVENT_CHAIN')
        require(item['workspace'] == event['workspace'] == candidate['workspace'] and item['candidate'] == event['candidateId'] == candidate['id'] and event['candidateDigest'] == candidate['digest'] and item['id'] == event['id'] and item['version'] == version and event['owner'] == policy['owner'] and event['bindingDigest'] == binding_digest and event['externalEffects'] == 0 and event['paidInference'] == 0, 'MEDIA_EVENT_COLUMNS')
        previous = actual
    readbacks = []
    for capture in captures:
        portfolio = capture['value']
        projected = portfolio['connectorSourceCandidates']['candidates']
        require(len(projected) == 1, 'SOURCE_PROJECTION_COUNT')
        canonical = {key: value for key, value in projected[0].items() if key not in ('sourceAgeMs', 'freshness', 'providerExpiry', 'assessmentFreshnessAdmission')}
        require(canonical == candidate and portfolio['connectorWalkthrough']['record'] == supplement, 'BROWSER_ADMISSION_CONTENT')
        media = portfolio['connectorMedia']
        version = media['version']
        require(type(version) is int and 0 <= version <= len(records) and media['ownerApproval'] is False and media['current']['assets'] == [] and media['publicPublicationAllowed'] is False, 'NO_OWNER_APPROVAL')
        require(media['candidateId'] == candidate['id'] and media['candidateDigest'] == candidate['digest'] and media['history'] == records[:version], 'MEDIA_HISTORY_CONTENT')
        require(len(media['original']) == 1 and media['original'][0]['sha256'] == ASSETS[0][3], 'CAPTURE_ORIGINAL')
        shown = [media['original'][0]]
        if version == 2:
            proposal = copy.deepcopy(media['proposal'])
            shown += media['proposal']['assets']
            for asset in proposal['assets']:
                asset.pop('base64')
            require(proposal == records[1] and proposal['editRequestDigest'] == records[0]['digest'], 'PROPOSAL_RECORD_CONTENT')
        else:
            require(media['proposal'] is None, 'UNOBSERVED_PROPOSAL')
        for asset in shown:
            expected = next((item for item in ASSETS if item[3] == asset['sha256']), None)
            require(expected is not None, 'CAPTURE_ASSET_IDENTITY')
            raw = base64.b64decode(asset['base64'], validate=True)
            require(len(raw) == expected[2] and sha(raw) == expected[3] and base64.b64encode(raw).decode() == asset['base64'], 'CAPTURE_ASSET_BYTES')
        readbacks.append({'path': capture['path'], 'sha256': capture['sha256'], 'mediaVersion': version, 'matchesActualHistoryPrefix': True})
    if full:
        desktop = [view for view in browser['views'] if view['name'] == 'desktop']
        require(len(desktop) == 1 and desktop[0]['nativePrincipal']['id'] == policy['owner'], 'DESKTOP_VIEW_PRINCIPAL')
        observed = {capture['path']: capture['value']['connectorMedia'] for capture in captures}
        require(set(observed) == {'connector-media-portfolio-' + suffix + '.json' for suffix in ('before', 'request', 'desktop', 'mobile')}, 'FULL_READBACK_SET')
        require(observed['connector-media-portfolio-desktop.json'] == observed['connector-media-portfolio-mobile.json'] and browser['noOwnerApproval'] is True and browser['finalMedia']['mediaDigest'] == digest(observed['connector-media-portfolio-desktop.json']), 'BROWSER_MEDIA_DIGEST')
    return {'candidateId': candidate['id'], 'candidateDigest': candidate['digest'], 'walkthroughDigest': supplement['digest'], 'mediaVersion': len(records), 'requestId': records[0]['id'] if records else None, 'proposalId': records[1]['id'] if len(records) == 2 else None, 'eventDigests': [event['digest'] for event in records], 'batchDigest': records[-1]['batchDigest'] if records else None, 'ownerId': policy['owner'] if policy else None, 'ownerApproval': False, 'availableNativeReadbacks': readbacks, 'latestEventIndependentlyReadBack': any(item['mediaVersion'] == len(records) for item in readbacks),
            'fullStoredRecordSHA256': {TABLES[0]: [sha(source_row['record'].encode())], TABLES[1]: [sha(walkthrough_row['record'].encode())], TABLES[2]: [sha(item['record'].encode()) for item in media_rows]}}


def snapshot(runtime, private):
    runtime, private = directory(runtime), directory(private)
    require(runtime.parent == private.parent, 'SIBLING_PRIVATE_DIRECTORY')
    evidence = directory(runtime / 'evidence')
    browser_path = runtime / 'browser-output/connector-media-browser-result.json'
    source_path = runtime / 'state/commerce/runtime.sqlite'
    if not source_path.exists():
        return {'status': 'SKIPPED_NO_EXISTING_COMMERCE_DATABASE', 'exported': False}
    deadline = time.monotonic() + 20
    browser = read_json(browser_path) if browser_path.exists() else {}
    full = browser.get('status') == STATUS
    run_id, source_commit = os.environ.get('GITHUB_RUN_ID', ''), os.environ.get('GITHUB_SHA', '')
    require(run_id.isdigit() and len(run_id) <= 20 and len(source_commit) == 40 and all(value in '0123456789abcdef' for value in source_commit), 'CALLER_RUN_IDENTITY')
    drain_path = evidence / 'connector-media-container-drain.json'
    drain = read_json(drain_path)
    expected_scopes = ['work8-v128-connector-browser-' + run_id, 'work8-v126-native-gh-' + run_id, 'work8-v128-frontend-build-' + run_id, 'work8-v128-frontend-carrier-' + run_id, 'work8-v126-carrier-' + sha(str(runtime).encode())[:16]]
    require(drain['schema'] == 'v128-media-container-drain-v1' and drain['runId'] == run_id and drain['sourceCommit'] == source_commit and drain['allScopedContainersAbsent'] is True and drain['scopedContainers'] == expected_scopes, 'CALLER_CONTAINER_DRAIN')
    native_end_path = runtime / 'runtime-output/runtime-termination.json'
    native_end = read_json(native_end_path) if native_end_path.exists() else None
    browser_end_path = evidence / 'connector-browser-termination.json'
    browser_end = read_json(browser_end_path) if browser_end_path.exists() else None
    if full:
        require(native_end is not None and native_end.get('children') and all(item.get('closed') is True and item.get('drain') == 'CHILD_CLOSED' for item in native_end['children']), 'NATIVE_NOT_DRAINED')
        require(native_end['status'] == 'TERMINATED_AFTER_NATIVE_RUNTIME_READY' and browser_end is not None and browser_end['containerAbsent'] is True and browser_end['exitCode'] == 0 and browser['browserClosed'] is True, 'SUCCESSFUL_DRAIN_REQUIRED')
    bootstrap = read_json(private / 'native-bootstrap.json')
    forbidden = [bootstrap[key].encode() for key in ('founderEmail', 'founderPassword', 'adminPassword')]
    require(all(forbidden), 'PRIVATE_SCAN_INPUTS')
    components = source_components(source_path, forbidden)
    source_bytes = components['']
    source = read_json(runtime / 'runtime-output/connector-source-admission.json')
    walkthrough = read_json(runtime / 'runtime-output/connector-walkthrough-admission.json')
    captures = []
    for suffix in ('before', 'request', 'desktop', 'mobile'):
        name = 'connector-media-portfolio-' + suffix + '.json'
        location = runtime / 'browser-output' / name
        if location.exists():
            raw = read_file(location)
            captures.append({'path': name, 'value': json.loads(raw), 'sha256': sha(raw)})
    policy_path = private / 'media/private-media-binding.json'
    policy = read_json(policy_path) if policy_path.exists() else None
    targets = ['connector-media-native-store.sqlite', 'connector-media-original.jpg', 'connector-media-revised.png', 'connector-media-store-custody.json']
    require(all(not os.path.lexists(evidence / name) for name in targets), 'DESTINATION_NOT_FRESH')
    staging = pathlib.Path(tempfile.mkdtemp(prefix='.media-store-staging-', dir=evidence))
    published = []
    try:
        clone = staging / 'source-clone'
        clone.mkdir(mode=0o700)
        clone_path = clone / 'runtime.sqlite'
        for suffix, raw in components.items():
            target = pathlib.Path(str(clone_path) + suffix)
            with target.open('xb') as stream:
                stream.write(raw)
                stream.flush()
                os.fsync(stream.fileno())
            target.chmod(0o600)
        backup_path = staging / targets[0]
        fd = os.open(backup_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        os.close(fd)
        # SQLite sees only the bounded byte clone. Recovery/checkpoint work cannot
        # touch the actual source database, WAL, SHM or rollback journal.
        with contextlib.closing(sqlite3.connect(clone_path, timeout=1)) as original:
            original.execute('PRAGMA query_only=ON')
            original.execute('PRAGMA trusted_schema=OFF')
            source_inventory, source_rows = inventory(original, forbidden, deadline, full)
            identity = verified_records(source_rows, source, walkthrough, captures, browser, policy, full)
            with contextlib.closing(sqlite3.connect(backup_path, timeout=1)) as destination:
                page_size = original.execute('PRAGMA page_size').fetchone()[0]
                def progress(status, remaining, total):
                    require(time.monotonic() < deadline and total * page_size <= LIMIT, 'BACKUP_BOUND_OR_DEADLINE')
                original.backup(destination, pages=64, progress=progress, sleep=0.01)
                destination.execute('PRAGMA journal_mode=DELETE')
                snapshot_inventory, snapshot_rows = inventory(destination, forbidden, deadline, full)
                require(source_inventory == snapshot_inventory and source_rows == snapshot_rows, 'BACKUP_ALL_ROWS_OR_SCHEMA_CHANGED')
                require(verified_records(snapshot_rows, source, walkthrough, captures, browser, policy, full) == identity, 'BACKUP_RECORD_CONTENT')
        require(source_components(source_path, forbidden) == components, 'SOURCE_CHANGED_DURING_BACKUP')
        no_sidecars(backup_path)
        backup_bytes = read_file(backup_path)
        reject_secrets(backup_bytes, forbidden)
        artifacts = [{'path': targets[0], 'bytes': len(backup_bytes), 'sha256': sha(backup_bytes)}]
        missing_assets = []
        for source_name, target_name, length, expected in ASSETS:
            selected = private / 'media' / source_name
            if not selected.exists():
                selected = runtime / 'connector-inputs' / source_name
            if not selected.exists():
                require(not full, 'SUCCESS_ASSET_MISSING')
                missing_assets.append(target_name)
                continue
            raw = read_file(selected)
            require(len(raw) == length and sha(raw) == expected, 'ACTUAL_ASSET_BYTES')
            reject_secrets(raw, forbidden)
            path = staging / target_name
            with path.open('xb') as stream:
                stream.write(raw)
                stream.flush()
                os.fsync(stream.fileno())
            path.chmod(0o600)
            artifacts.append({'path': target_name, 'bytes': len(raw), 'sha256': sha(raw)})
        receipt = {'schema': 'v128-actual-media-store-custody-v1', 'status': 'PRESERVED_ACTUAL_NATIVE_MEDIA_STORE' if full else 'PRESERVED_PARTIAL_NATIVE_MEDIA_STATE_NOT_OWNER_READY', 'method': 'SQLITE_BACKUP_FROM_BOUNDED_POST_DRAIN_BYTE_CLONE', 'historyRecreated': False, 'ownerActionObserved': False, 'ownerApproval': False, 'authStoreIncluded': False, 'credentialByteScanPassed': True, 'retainedForFutureOwnerReview': full, 'nativeSessionAvailable': False, 'wholeRowAccepted': False,
                   'sourceDatabase': {'path': 'state/commerce/runtime.sqlite', 'bytes': len(source_bytes), 'sha256': sha(source_bytes)}, 'sourceComponents': [{'path': 'state/commerce/runtime.sqlite' + suffix, 'bytes': len(raw), 'sha256': sha(raw)} for suffix, raw in components.items()], 'sourceRows': source_inventory, 'snapshotRows': snapshot_inventory, 'actualRecordIdentity': identity, 'artifacts': artifacts, 'maximumFileBytes': LIMIT, 'sourceUnchanged': True, 'originalOpenedBySQLite': False, 'integrityCheck': 'ok', 'snapshotSidecarsAbsent': True,
                   'walValidation': verify_wal(components['-wal']) if '-wal' in components else {'staleTrailerDisposition': 'NO_SOURCE_WAL'},
                   'missingRetainedAssets': missing_assets, 'browserObservationStatus': browser.get('status', 'NO_BROWSER_RESULT_RETAINED'), 'callerRequiresAllScopedContainersAbsent': True,
                   'drainEvidence': {'containerDrainSHA256': sha(read_file(drain_path)), 'runId': run_id, 'sourceCommit': source_commit, 'allScopedContainersAbsent': True, 'nativeTerminationSHA256': sha(read_file(native_end_path)) if native_end_path.exists() else None, 'browserTerminationSHA256': sha(read_file(browser_end_path)) if browser_end_path.exists() else None, 'orderlyTerminationRequired': full}}
        receipt_bytes = encoded(receipt) + b'\n'
        require(len(receipt_bytes) <= LIMIT, 'RECEIPT_BOUND')
        reject_secrets(receipt_bytes, forbidden)
        with (staging / targets[-1]).open('xb') as stream:
            stream.write(receipt_bytes)
            stream.flush()
            os.fsync(stream.fileno())
        (staging / targets[-1]).chmod(0o600)
        for name in [item['path'] for item in artifacts] + [targets[-1]]:
            source_file = staging / name
            with source_file.open('rb') as stream:
                os.fsync(stream.fileno())
            os.link(source_file, evidence / name, follow_symlinks=False)
            published.append(evidence / name)
            source_file.unlink()
        fd = os.open(evidence, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(fd)
        finally:
            os.close(fd)
        return receipt
    except BaseException:
        for output in reversed(published):
            output.unlink()
        raise
    finally:
        shutil.rmtree(staging)


if __name__ == '__main__':
    try:
        require(os.getuid() == 0 and len(sys.argv) == 3, 'CLI_SCOPE')
        result = snapshot(pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]))
        print(json.dumps({'status': result['status'], 'ownerApproval': False, 'historyRecreated': False, 'authStoreIncluded': False}))
    except BaseException as error:
        print(json.dumps({'status': 'FAILED_MEDIA_STORE_CUSTODY', 'errorClass': type(error).__name__, 'errorSHA256': sha(str(error).encode()), 'ownerApproval': False}))
        raise SystemExit(1)

#!/usr/bin/env python3
"""Bounded final receipt transport, not an A5 acceptance decision.

The original producer predicates and the original secret scan are unchanged.
This boundary refuses incomplete success evidence, checks its shared lineage,
and reads every byte of its own deterministic archive back before publication.
An export refusal has a separate, tiny, immutable metadata-only return path.
"""
import gzip
import hashlib
import io
import json
import os
from pathlib import Path
import re
import stat
import tarfile
import zlib

from runtime_common import Refusal, atomic

MAX_FILE = 2 * 1024**2
MAX_TOTAL = 8 * 1024**2
MAX_ARCHIVE = 7 * 1024**2
MAX_DIRECTORY = 8 * 1024**2
MAX_FAILURE = 16 * 1024
FULL = 'evidence/full/'
PHASES = ('normal', 'recovery', 'returned', 'replayed', 'final')
STORES = frozenset(('intelligence', 'pillowMemory', 'pillowRequests',
    'pillowReasoning', 'communications', 'liveCostCentre', 'assurance',
    'financialEvidence', 'commerce', 'brain', 'missions', 'execution', 'shadow'))
REQUIRED_STORES = frozenset(('intelligence', 'pillowMemory', 'communications',
                            'assurance', 'financialEvidence', 'commerce', 'brain'))
# Unconditional successful outputs in examine-v26.py, coordinator.mjs,
# browser.mjs and the three independent readback programs. Optional diagnostic
# files remain governed by the original stage allowlist and are never dropped.
REQUIRED_FULL = frozenset(('stage-start.json', 'workflow-budget.json',
    'native-time-budget.json', 'exact-components.json', 'current-package-import.json',
    'reused-private-handoff.json', 'mounted-entrypoint-preflight.json',
    'native-storage-preflight.json', 'native-storage-child-bindings.json',
    'last-startup-observation.json', 'sanitized-runtime.log',
    'phase-b-private-contract.json', 'isolation.json', 'observation-clock-contract.json',
    'owner-policy-lifecycle.json', 'container-lifecycle.json',
    'frontend-startup-NORMAL.json', 'frontend-startup-RECOVERY.json', 'frontend-startup-NORMAL_RETURN.json',
    'frontend-listener-NORMAL.json', 'frontend-listener-RECOVERY.json',
    'frontend-listener-NORMAL_RETURN.json', 'actual-runtime-ready.json',
    'live-brain-ready.json', 'live-brain-capture.json', 'native-drain-observation.json',
    'native-runtime-result.json', 'runner-result.json', 'browser-lifecycle.json',
    'transition-http-observations.json', 'transition-browser-result.json',
    'normal-replay-comparison.json', 'returned-comparison.json',
    'replayed-comparison.json', 'recovery-schema-comparison.json',
    'recovery-canonical-business.png', 'artifact-index.json')) | frozenset(
        p + '-' + kind + '.json' for p in PHASES
        for kind in ('whole-app-readback', 'commerce-independent-readback', 'independent-gate')) | frozenset(
        p + '-persistence-capture.json' for p in ('normal', 'returned', 'replayed'))
REQUIRED_TOP = frozenset(('run-contract.json', 'launch-contract.json',
    'runner-identity.json', 'source-review.json', 'preflight-review.json',
    'acceptance-source-admission.json', 'controller-supervisor-preflight.json',
    'controller-supervisor-full.json', 'runtime-evidence/receipt-cleanup.json',
    'evidence/preflight/artifact-index.json', 'evidence/preflight/runner-result.json',
    'evidence/preflight/live-brain-ready.json'))
SAFE_PATHS = REQUIRED_TOP | frozenset(FULL + x for x in REQUIRED_FULL)
SAFE_OPERATIONS = frozenset(('GATHER', 'INVENTORY', 'SOURCE_LINEAGE', 'BRAIN_LINEAGE',
    'STATE_INVENTORY', 'TRANSITION', 'CLEANUP', 'ARCHIVE_WRITE', 'ARCHIVE_READBACK', 'FINALIZE'))
HANDOFF_CODES = frozenset(('HANDOFF_SOURCE_DIRECTORY_REFUSED', 'HANDOFF_ENTRY_COUNT_BOUND',
    'HANDOFF_UNREVIEWED_MEMBER', 'HANDOFF_NONREGULAR_MEMBER', 'HANDOFF_MEMBER_SIZE_BOUND',
    'HANDOFF_MEMBER_CHANGED', 'HANDOFF_UTF8_OR_JSON_INVALID', 'HANDOFF_PNG_SIGNATURE_REFUSED',
    'HANDOFF_SENSITIVE_CONTENT_REFUSED', 'HANDOFF_FIRST_NATIVE_FAILURE_BOUND',
    'HANDOFF_DESTINATION_CONFLICT', 'HANDOFF_IO_OR_SANITIZER_FAILURE'))


# Closed diagnostic vocabulary from reviewed exporter guards; no arbitrary token is exported.
KNOWN_CODES = frozenset((
    'EXPORT_ACK_LINEAGE',
    'EXPORT_ACK_PREFLIGHT_IDENTITY',
    'EXPORT_ALREADY_CREATED',
    'EXPORT_ARCHIVE_BOUND',
    'EXPORT_ARCHIVE_IDENTITY_CHANGED',
    'EXPORT_ARCHIVE_INVALID',
    'EXPORT_ARCHIVE_LOGICAL_BOUND',
    'EXPORT_ARCHIVE_MEMBER_REFUSED',
    'EXPORT_ARCHIVE_MEMBER_SIZE_CHANGED',
    'EXPORT_ARCHIVE_STREAM_REFUSED',
    'EXPORT_ARCHIVE_CANONICAL_BYTES_REQUIRED',
    'EXPORT_BRAIN_IDENTITY_REQUIRED',
    'EXPORT_BRAIN_INSTANCE_LINEAGE',
    'EXPORT_BROWSER_SUCCESS_REQUIRED',
    'EXPORT_CANONICAL_PATH_REQUIRED',
    'EXPORT_CANONICAL_ROOT',
    'EXPORT_CHUNK_OFFSET_REFUSED',
    'EXPORT_COMMERCE_LINEAGE',
    'EXPORT_COMMERCE_RECEIPT_REQUIRED',
    'EXPORT_COMPLETE_ARCHIVE_READBACK_REQUIRED',
    'EXPORT_COMPLETE_STAGE_INVENTORY_REQUIRED',
    'EXPORT_CONTROLLER_SUCCESS_REQUIRED',
    'EXPORT_DESTINATION_ALREADY_EXISTS',
    'EXPORT_DESTINATION_PATH_REFUSED',
    'EXPORT_DUPLICATE',
    'EXPORT_DUPLICATE_INDEX',
    'EXPORT_DUPLICATE_JSON_KEY',
    'EXPORT_EMPTY_REFUSED',
    'EXPORT_EXACT_TWO_FILES_REQUIRED',
    'EXPORT_EXECUTOR_LINEAGE',
    'EXPORT_FILE_BOUND',
    'EXPORT_FILE_CHANGED_DURING_READ',
    'EXPORT_FINAL_ALREADY_ATTEMPTED',
    'EXPORT_FINAL_DIRECTORY_REQUIRED',
    'EXPORT_FINAL_STAGE_SCOPE',
    'EXPORT_FIRST_FAILURE_RECORD_INVALID',
    'EXPORT_FRONTEND_SOURCE_LINEAGE',
    'EXPORT_FULL_STAGE_REQUIRED',
    'EXPORT_FULL_SUCCESS_REQUIRED',
    'EXPORT_GENERATED_SECRET_SCAN_REQUIRED',
    'EXPORT_HANDOFF_DIAGNOSTIC_SCHEMA_REFUSED',
    'EXPORT_HANDOFF_DIAGNOSTIC_SECRET_REFUSED',
    'EXPORT_INDEPENDENT_GATE_REQUIRED',
    'EXPORT_INDEX_BOUND',
    'EXPORT_INDEX_ENTRY_BOUND',
    'EXPORT_INDEX_IDENTITY_CHANGED',
    'EXPORT_INPUT_REGULAR_FILE_REQUIRED',
    'EXPORT_LABEL_REFUSED',
    'EXPORT_LAUNCH_CONTRACT_CHANGED',
    'EXPORT_MALFORMED_JSON',
    'EXPORT_MALFORMED_TEXT',
    'EXPORT_NATIVE_DRAIN_REQUIRED',
    'EXPORT_NATIVE_STORAGE_LINEAGE',
    'EXPORT_ORIGINAL_COMPARISON_REQUIRED',
    'EXPORT_PACKAGE_SOURCE_LINEAGE',
    'EXPORT_PARTIAL_PRESENT',
    'EXPORT_PERSISTENCE_CAPTURE_REQUIRED',
    'EXPORT_PERSISTENCE_CONTINUITY',
    'EXPORT_PNG_SIGNATURE_REFUSED',
    'EXPORT_PREFLIGHT_STAGE_SCOPE',
    'EXPORT_READBACK_IDENTITY_REQUIRED',
    'EXPORT_RECEIPT_SCHEMA_REFUSED',
    'EXPORT_RECOVERY_AUTHORITY_REQUIRED',
    'EXPORT_REGULAR_BOUNDED_FILE_REQUIRED',
    'EXPORT_REQUIRED_RECEIPT_MISSING',
    'EXPORT_REQUIRED_STAGE_INDEX_MISSING',
    'EXPORT_RUNTIME_DIRECTORY_REFUSED',
    'EXPORT_RUN_SOURCE_LINEAGE',
    'EXPORT_SCOPED_CLEANUP_REQUIRED',
    'EXPORT_SECRET_PATTERN_REFUSED',
    'EXPORT_SEPARATE_FULL_INSTANCE_REQUIRED',
    'EXPORT_SETUP_FAILURE_SCOPE',
    'EXPORT_SOURCE_ADMISSION_REFUSED',
    'EXPORT_STAGE_DIRECTORY_REFUSED',
    'EXPORT_STAGE_IDENTITY_CHANGED',
    'EXPORT_STAGE_INDEX_MALFORMED',
    'EXPORT_STAGE_INDEX_SCHEMA',
    'EXPORT_STORE_APPLICABILITY',
    'EXPORT_THIRTEEN_STORE_INVENTORY',
    'EXPORT_TOTAL_BOUND',
    'EXPORT_TRANSITION_SEQUENCE_REQUIRED',
    'EXPORT_UNCLASSIFIED_REFUSAL',
    'EXPORT_UNREVIEWED_ARTIFACT_NAME',
    'EXPORT_WHOLE_APPLICATION_LINEAGE',
    'EXPORT_WHOLE_APPLICATION_RECEIPT_REQUIRED',
))

def encoded(value):
    return (json.dumps(value, sort_keys=True, separators=(',', ':'), allow_nan=False)+'\n').encode()


def sha(data):
    return hashlib.sha256(data).hexdigest()


def need(value, code, *, operation='FINALIZE', path=None):
    if not value:
        exc = Refusal(code)
        exc.export_context = {'operation': operation if operation in SAFE_OPERATIONS else 'FINALIZE'}
        if path in SAFE_PATHS:
            exc.export_context['path'] = path
        raise exc


def parse(data, path=None):
    try:
        def pairs(rows):
            out = {}
            for key, value in rows:
                need(key not in out, 'EXPORT_DUPLICATE_JSON_KEY', path=path)
                out[key] = value
            return out
        return json.loads(data, object_pairs_hook=pairs,
                          parse_constant=lambda _: (_ for _ in ()).throw(ValueError()))
    except Refusal:
        raise
    except (ValueError, UnicodeError, RecursionError):
        need(False, 'EXPORT_MALFORMED_JSON', path=path)


def regular_bytes(path, maximum):
    path = Path(path)
    need(path.is_absolute() and path.resolve() == path, 'EXPORT_CANONICAL_PATH_REQUIRED')
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    with os.fdopen(fd, 'rb') as f:
        st = os.fstat(f.fileno())
        need(stat.S_ISREG(st.st_mode) and st.st_nlink == 1 and 0 < st.st_size <= maximum,
             'EXPORT_REGULAR_BOUNDED_FILE_REQUIRED')
        data = f.read(maximum + 1)
    need(len(data) == st.st_size, 'EXPORT_FILE_CHANGED_DURING_READ')
    return data


def validate_success(files):
    """Transport prerequisites only; complete original A5 review remains required."""
    required = REQUIRED_TOP | frozenset(FULL + x for x in REQUIRED_FULL)
    for path in sorted(required):
        need(path in files, 'EXPORT_REQUIRED_RECEIPT_MISSING', operation='INVENTORY', path=path)
    values = {n: parse(b, n) for n, b in files.items() if n.endswith('.json')}
    def get(name):
        return values[FULL + name]
    contract = values['run-contract.json']
    executor = contract['executor']
    session = executor['sessionId']
    run_id = str(executor['runId'])
    need(re.fullmatch(r'[0-9]{1,20}', run_id) is not None and
         session == 'github-actions:'+run_id+':1:'+str(executor['jobId']) and
         executor['runAttempt'] == 1, 'EXPORT_EXECUTOR_LINEAGE', operation='SOURCE_LINEAGE')
    identity = values['runner-identity.json']
    need(all(identity[k] == executor[k] for k in ('sessionId', 'runId', 'jobId', 'workflowCommit')),
         'EXPORT_EXECUTOR_LINEAGE', operation='SOURCE_LINEAGE')
    components = get('exact-components.json')
    need(components == contract['sources'], 'EXPORT_PACKAGE_SOURCE_LINEAGE', operation='SOURCE_LINEAGE')
    backend = contract['sources']['backend']['commit']
    for phase in ('preflight', 'full'):
        status = values['controller-supervisor-'+phase+'.json']
        need(status['phase'] == phase and status['sessionId'] == session and
             status['controllerExitCode'] == 0 and status['firstSupervisorCause'] is None and
             status['status'] == 'CONTROLLER_EXITED_ZERO_REQUIRES_INDEPENDENT_REVIEW',
             'EXPORT_CONTROLLER_SUCCESS_REQUIRED', operation='SOURCE_LINEAGE')
    start, result = get('stage-start.json'), get('runner-result.json')
    for value in (start, result):
        need(value['sessionId'] == session and value['runContractSHA256'] == sha(files['run-contract.json']) and
             value['sourceReviewSHA256'] == sha(files['source-review.json']) and
             value['launchContractSHA256'] == contract['launchContractSHA256'] and
             value['controllerManifestSHA256'] == contract['controllerManifestSHA256'],
             'EXPORT_RUN_SOURCE_LINEAGE', operation='SOURCE_LINEAGE')
    need(start['stage'] == 'full' and start['campaignId'] == contract['campaignId'],
         'EXPORT_FULL_STAGE_REQUIRED', operation='SOURCE_LINEAGE')
    need(result['status'] == 'PASS_AWAITING_INDEPENDENT_TECHNICAL_REVIEW' and
         result['phaseBStarted'] is True and result['wholeRowsAccepted'] == [] and
         result['temporaryContainersAndNetworkRemoved'] is True and result['privateTemporaryDataRemoved'] is True,
         'EXPORT_FULL_SUCCESS_REQUIRED', operation='SOURCE_LINEAGE')
    need(sha(files['launch-contract.json']) == contract['launchContractSHA256'],
         'EXPORT_LAUNCH_CONTRACT_CHANGED', operation='SOURCE_LINEAGE')
    # Both current ACKs must bind the same run contract, not unrelated histories.
    for name, stage in (('source-review.json', 'packages-and-executor'), ('preflight-review.json', 'preflight')):
        ack = values[name]
        bindings = ack.get('bindings', {})
        need(ack.get('schema') == 'work8-v65-independent-ack-v1' and ack.get('decision') == 'PASS' and
             ack.get('stage') == stage and str(ack.get('runId')) == run_id and ack.get('runAttempt') == 1 and
             ack.get('workflowCommit') == executor['workflowCommit'] and ack.get('applicationAcceptance') is False and
             all(bindings.get(k) == contract[k] for k in ('controllerManifestSHA256', 'driverManifestSHA256',
                 'launchContractSHA256', 'packageManifestSHA256', 'runnerIdentitySHA256', 'sourceIdentitiesSHA256')),
             'EXPORT_ACK_LINEAGE', operation='SOURCE_LINEAGE', path=name)
        if stage == 'preflight':
            need(bindings.get('runContractSHA256') == sha(files['run-contract.json']) and
                 bindings.get('artifactIndexSHA256') == sha(files['evidence/preflight/artifact-index.json']) and
                 bindings.get('runnerResultSHA256') == sha(files['evidence/preflight/runner-result.json']),
                 'EXPORT_ACK_PREFLIGHT_IDENTITY', operation='SOURCE_LINEAGE', path=name)
    ready, live, capture = get('actual-runtime-ready.json'), get('live-brain-ready.json'), get('live-brain-capture.json')
    att = capture['capture']['attestation']
    generation, instance = live['generation'], live['instanceId']
    need(isinstance(generation, str) and 0 < len(generation) <= 100 and
         isinstance(instance, str) and 0 < len(instance) <= 100,
         'EXPORT_BRAIN_IDENTITY_REQUIRED', operation='BRAIN_LINEAGE')
    need(live['source'] == ready['source'] == att['source'] == backend and
         generation == ready['generation'] == att['runtimeGeneration'] and
         instance == att['instanceId'] and capture['ready'] == live and
         capture['status'] == 'PASS_ACTUAL_LIVE_BRAIN_BASELINE' and capture['mode'] == 'BASELINE' and
         capture['independentMembershipMatched'] is True and att['sameCachedInstance'] is True and
         capture['finalIdentity'] == live['identity'] and live['actualApplicationInitialized'] is True,
         'EXPORT_BRAIN_INSTANCE_LINEAGE', operation='BRAIN_LINEAGE')
    need(instance != values['evidence/preflight/live-brain-ready.json']['instanceId'],
         'EXPORT_SEPARATE_FULL_INSTANCE_REQUIRED', operation='BRAIN_LINEAGE')
    storage = get('native-storage-child-bindings.json')
    need(storage['source'] == backend and storage['generation'] == generation and
         storage['actualNativeRootsPresent'] is True and storage['fullEnvironmentRetained'] is False and
         {r['role'] for r in storage['roles']} == {'brain-worker', 'primary'} and
         len(storage['roles']) == 2 and all(r['source'] == backend and r['uid'] == 65534 for r in storage['roles']),
         'EXPORT_NATIVE_STORAGE_LINEAGE', operation='BRAIN_LINEAGE')
    baseline_applicability = None
    for phase in PHASES:
        path = FULL + phase + '-whole-app-readback.json'
        whole = values[path]
        brain = whole['brainLiveBaseline']
        applicable = whole['storeApplicability']
        need(whole['phase'] == phase and
             whole['status'] == 'PASS_DECLARED_DOMAIN_PRESERVATION_WITH_SEPARATE_DIAGNOSTIC_CLASSIFICATION' and
             whole['sourceDeclaredSqliteStores'] == 13 and whole['readOnlySqlite'] is True and
             whole['rawRowsRetained'] is False and whole['wholeRowsAccepted'] == [],
             'EXPORT_WHOLE_APPLICATION_RECEIPT_REQUIRED', operation='STATE_INVENTORY', path=path)
        need(brain['instanceId'] == instance and brain['source'] == backend and
             brain['generation'] == generation and brain['pid'] == live['identity']['pid'] and
             brain['baselineLogicalSha256'] == att['logicalStoreSha256'] and
             brain['fullSchemaSha256'] == att['schemaObjectsSha256'] and brain['fullSchemaPreserved'] is True,
             'EXPORT_WHOLE_APPLICATION_LINEAGE', operation='BRAIN_LINEAGE', path=path)
        need(set(whole['stores']) == STORES and set(whole['fullSchemas']) == STORES | {'generation'} and
             applicable['stage'] == 'full' and applicable['declaredCount'] == 13 and
             applicable['requiredPresentCount'] == 7 and applicable['missingStateCreated'] is False and
             set(applicable['stores']) == STORES,
             'EXPORT_THIRTEEN_STORE_INVENTORY', operation='STATE_INVENTORY', path=path)
        for name in STORES:
            rule, store = applicable['stores'][name], whole['stores'][name]
            need(type(store['present']) is bool and store['present'] == rule['present'] and
                 rule['requiredPresent'] == (name in REQUIRED_STORES) and
                 (store['present'] or name not in REQUIRED_STORES),
                 'EXPORT_STORE_APPLICABILITY', operation='STATE_INVENTORY', path=path)
        if baseline_applicability is None:
            baseline_applicability = applicable
        else:
            need(applicable == baseline_applicability and whole['unchangedNativeChildRoots'] is True and
                 whole['unchangedGenerationAuthority'] is True and whole['originalBusinessAndStaticRowsPreserved'] is True,
                 'EXPORT_PERSISTENCE_CONTINUITY', operation='STATE_INVENTORY', path=path)
        commerce = get(phase+'-commerce-independent-readback.json')
        need(commerce['phase'] == phase and commerce['status'] == 'PASS_INDEPENDENT_PROCESS_COMMERCE_READBACK_ONLY' and
             commerce['noDuplicateReplay'] is True and commerce['authorityRestored'] is False and
             commerce['actualCashMovement'] == 0 and commerce['liveCommerce'] == 'LOCKED',
             'EXPORT_COMMERCE_RECEIPT_REQUIRED', operation='TRANSITION')
        need(commerce['canonical'] == get('normal-commerce-independent-readback.json')['canonical'],
             'EXPORT_COMMERCE_LINEAGE', operation='TRANSITION')
        gate = get(phase+'-independent-gate.json')
        scripts = ['offline-commerce-readback.mjs', 'whole-app-readback.mjs']
        if phase in ('normal', 'returned', 'replayed'):
            scripts.append('capture-canonical-persistence.mjs')
        need(gate['phase'] == phase and gate['attempts'] == 1 and gate['allPassed'] is True and
             gate['outcomes'] == {script: 'PASS' for script in scripts},
             'EXPORT_INDEPENDENT_GATE_REQUIRED', operation='STATE_INVENTORY',
             path=FULL+phase+'-independent-gate.json')
    for phase in ('normal', 'returned', 'replayed'):
        need(get(phase+'-persistence-capture.json')['status'] == 'PASS_PRIVATE_CANONICAL_CAPTURE',
             'EXPORT_PERSISTENCE_CAPTURE_REQUIRED', operation='STATE_INVENTORY')
    for name in ('normal-replay-comparison.json', 'returned-comparison.json',
                 'replayed-comparison.json', 'recovery-schema-comparison.json'):
        need(get(name)['pass'] is True, 'EXPORT_ORIGINAL_COMPARISON_REQUIRED', operation='TRANSITION')
    browser = get('transition-browser-result.json')
    need(browser['status'] == 'PASS_AWAITING_INDEPENDENT_BUSINESS_REVIEW' and
         browser['wholeRowsAccepted'] == [] and browser['productionEffects'] is False,
         'EXPORT_BROWSER_SUCCESS_REQUIRED', operation='TRANSITION')
    phases = browser['phases']
    need([p['phase'] for p in phases] == ['NORMAL', 'RECOVERY', 'NORMAL_RETURN'],
         'EXPORT_TRANSITION_SEQUENCE_REQUIRED', operation='TRANSITION')
    for phase, role in zip(phases, ('normal', 'recovery', 'normal')):
        need(phase['commit'] == contract['sources'][role]['commit'],
             'EXPORT_FRONTEND_SOURCE_LINEAGE', operation='TRANSITION')
    need(phases[1]['readOnly'] is True and phases[1]['frontendWriteStatus'] == 423 and
         phases[1]['directAuthorityWriteStatus'] == 423 and phases[1]['authenticatedSameOwnerContext'] is True,
         'EXPORT_RECOVERY_AUTHORITY_REQUIRED', operation='TRANSITION')
    drain = get('native-drain-observation.json')
    runtime = get('native-runtime-result.json')
    need(drain['source'] == runtime['source'] == backend and drain['generation'] == generation and
         drain['actualNativeWritersDrained'] is True and runtime['actualNativeWritersDrained'] is True and
         runtime['status'] == 'PASS_TECHNICAL_RUNTIME_ONLY' and
         type(drain['startedAtMs']) is int and type(drain['completedAtMs']) is int and
         drain['completedAtMs'] >= drain['startedAtMs'], 'EXPORT_NATIVE_DRAIN_REQUIRED', operation='CLEANUP')
    cleanup = values['runtime-evidence/receipt-cleanup.json']
    labels = [contract['campaignId'] + suffix for suffix in ('', '-preflight', '-full')]
    need(cleanup['status'] == 'PASS_SCOPED_CLEANUP' and cleanup['authorisedLabels'] == labels and
         cleanup['independentEmptyInventoryReadback'] is True and cleanup['privateTemporaryDataRemoved'] is True and
         cleanup['errorCount'] == 0 and cleanup['errors'] == [] and
         {(r['type'], r['label'], r['remainingCount']) for r in cleanup['finalInventory']} ==
         {(typ, label, 0) for typ in ('container', 'network') for label in labels} and
         len(cleanup['finalInventory']) == 6, 'EXPORT_SCOPED_CLEANUP_REQUIRED', operation='CLEANUP')
    return {'schema': 'work8-v101-final-transport-validation-v1',
            'status': 'COMPLETE_SOURCE_BOUND_RECEIPTS_REQUIRE_INDEPENDENT_A5_REVIEW',
            'sessionId': session, 'runId': run_id,
            'runContractSHA256': sha(files['run-contract.json']),
            'requiredFullReceipts': len(REQUIRED_FULL), 'all13StoreApplicabilityEntries': True,
            'fullInstanceId': instance, 'generationSHA256': sha(generation.encode()),
            'originalA5PredicatesChanged': False, 'applicationAcceptance': False}


def write_archive(directory, files, label, maximum=MAX_ARCHIVE):
    directory = Path(directory)
    need(not directory.exists(), 'EXPORT_DESTINATION_ALREADY_EXISTS', operation='ARCHIVE_WRITE')
    directory.mkdir(mode=0o700)
    index = {'schema': 'work8-v101-final-export-index-v1', 'label': label,
             'files': [{'path': n, 'bytes': len(b), 'sha256': sha(b)} for n, b in sorted(files.items())],
             'logicalBytes': sum(map(len, files.values())), 'maximumLogicalBytes': MAX_TOTAL,
             'applicationAcceptance': False, 'privateDataIncluded': False}
    payloads = {**files, 'export-index.json': encoded(index)}
    need(index['logicalBytes'] <= MAX_TOTAL and len(payloads) <= 600,
         'EXPORT_TOTAL_BOUND', operation='ARCHIVE_WRITE')
    target = directory/'evidence-export.tar.gz'
    with target.open('xb') as stream:
        os.chmod(target, 0o600)
        with gzip.GzipFile(filename='', mode='wb', fileobj=stream, mtime=0) as zipped:
            with tarfile.open(fileobj=zipped, mode='w|') as archive:
                for name, data in sorted(payloads.items()):
                    info = tarfile.TarInfo(name)
                    info.size = len(data)
                    info.mode = 0o600
                    info.uid = info.gid = info.mtime = 0
                    archive.addfile(info, io.BytesIO(data))
        stream.flush()
        os.fsync(stream.fileno())
    need(target.stat().st_size <= maximum, 'EXPORT_ARCHIVE_BOUND', operation='ARCHIVE_WRITE')
    receipt = {'schema': 'work8-v101-final-export-receipt-v1', 'label': label,
               'file': target.name, 'bytes': target.stat().st_size, 'sha256': sha(target.read_bytes()),
               'exportIndexSHA256': sha(payloads['export-index.json']), 'files': len(files),
               'maximumBytes': maximum, 'applicationAcceptance': False,
               'independentlyReadBack': False}
    atomic(directory/'evidence-export-receipt.json', receipt, exclusive=True)
    verify_final_directory(directory)
    return receipt


def verify_final_directory(directory):
    """No extraction: inspect bounded archive members and match every index row."""
    directory = Path(directory)
    need(directory.is_absolute() and directory.resolve() == directory and directory.is_dir(),
         'EXPORT_FINAL_DIRECTORY_REQUIRED', operation='ARCHIVE_READBACK')
    need({p.name for p in directory.iterdir()} == {'evidence-export.tar.gz', 'evidence-export-receipt.json'},
         'EXPORT_EXACT_TWO_FILES_REQUIRED', operation='ARCHIVE_READBACK')
    receipt = parse(regular_bytes(directory/'evidence-export-receipt.json', MAX_FAILURE))
    raw = regular_bytes(directory/'evidence-export.tar.gz', MAX_ARCHIVE)
    need(receipt['schema'] == 'work8-v101-final-export-receipt-v1' and
         receipt['file'] == 'evidence-export.tar.gz' and receipt['bytes'] == len(raw) and
         receipt['sha256'] == sha(raw) and receipt['applicationAcceptance'] is False,
         'EXPORT_ARCHIVE_IDENTITY_CHANGED', operation='ARCHIVE_READBACK')
    need(receipt['label'] in ('final', 'failure') and
         receipt['maximumBytes'] == (MAX_ARCHIVE if receipt['label'] == 'final' else MAX_FAILURE) and
         len(raw) <= receipt['maximumBytes'] and
         len(raw) + (directory/'evidence-export-receipt.json').stat().st_size <= MAX_DIRECTORY,
         'EXPORT_ARCHIVE_BOUND', operation='ARCHIVE_READBACK')
    files = {}
    total = 0
    try:
        decoder = zlib.decompressobj(31)
        decoded = decoder.decompress(raw, MAX_TOTAL + 2*1024**2 + 1)
        need(len(decoded) <= MAX_TOTAL + 2*1024**2 and decoder.eof and not decoder.unused_data and
             not decoder.unconsumed_tail and len(raw) >= 10 and raw[:8] == b'\x1f\x8b\x08\x00\x00\x00\x00\x00',
             'EXPORT_ARCHIVE_STREAM_REFUSED', operation='ARCHIVE_READBACK')
    except zlib.error:
        need(False, 'EXPORT_ARCHIVE_STREAM_REFUSED', operation='ARCHIVE_READBACK')
    try:
        with tarfile.open(fileobj=io.BytesIO(decoded), mode='r:') as archive:
            for member in archive:
                p = Path(member.name)
                need(member.isfile() and not p.is_absolute() and '..' not in p.parts and
                     member.name not in files and 0 <= member.size <= MAX_FILE and
                     len(files) < 600, 'EXPORT_ARCHIVE_MEMBER_REFUSED', operation='ARCHIVE_READBACK')
                total += member.size
                need(total <= MAX_TOTAL + 128*1024, 'EXPORT_ARCHIVE_LOGICAL_BOUND', operation='ARCHIVE_READBACK')
                files[member.name] = archive.extractfile(member).read(member.size + 1)
                need(len(files[member.name]) == member.size, 'EXPORT_ARCHIVE_MEMBER_SIZE_CHANGED', operation='ARCHIVE_READBACK')
    except (tarfile.TarError, EOFError, OSError):
        need(False, 'EXPORT_ARCHIVE_INVALID', operation='ARCHIVE_READBACK')
    canonical = io.BytesIO()
    with tarfile.open(fileobj=canonical, mode='w|') as archive:
        for name, data in sorted(files.items()):
            info = tarfile.TarInfo(name)
            info.size = len(data)
            info.mode = 0o600
            info.uid = info.gid = info.mtime = 0
            archive.addfile(info, io.BytesIO(data))
    need(decoded == canonical.getvalue(), 'EXPORT_ARCHIVE_CANONICAL_BYTES_REQUIRED', operation='ARCHIVE_READBACK')
    index_raw = files.pop('export-index.json', b'')
    need(bool(index_raw) and sha(index_raw) == receipt['exportIndexSHA256'],
         'EXPORT_INDEX_IDENTITY_CHANGED', operation='ARCHIVE_READBACK')
    index = parse(index_raw)
    need(index['schema'] == 'work8-v101-final-export-index-v1' and index['label'] == receipt['label'] and
         index['files'] == [{'path': n, 'bytes': len(b), 'sha256': sha(b)} for n, b in sorted(files.items())] and
         receipt['files'] == len(files) and index['logicalBytes'] == sum(map(len, files.values())) and
         index['applicationAcceptance'] is False,
         'EXPORT_COMPLETE_ARCHIVE_READBACK_REQUIRED', operation='ARCHIVE_READBACK')
    return {'status': 'PASS_EXACT_ARCHIVE_READBACK', 'label': receipt['label'],
            'sha256': receipt['sha256'], 'files': len(files),
            'applicationAcceptance': False}


def preserve_failure(root, exc, operation):
    # Only trusted exception classes with a bounded EXPORT_* guard token can
    # propagate a code; arbitrary exception messages never enter this path.
    code = str(exc) if isinstance(exc, Refusal) and str(exc) in KNOWN_CODES else 'EXPORT_UNCLASSIFIED_REFUSAL'
    context = {'operation': operation if operation in SAFE_OPERATIONS else 'FINALIZE'}
    observed = getattr(exc, 'export_context', {})
    if observed.get('operation') in SAFE_OPERATIONS:
        context['operation'] = observed['operation']
    if observed.get('path') in SAFE_PATHS:
        context['path'] = observed['path']
    receipt = {'schema': 'work8-v101-first-export-failure-v1', 'code': code,
               'context': context, 'rawOutputRetained': False, 'applicationAcceptance': False}
    bindings = {}
    for name, key in (('run-contract.json', 'runContractSHA256'),
                      ('acceptance-source-admission.json', 'sourceAdmissionSHA256')):
        try:
            data = regular_bytes(root/name, MAX_FILE)
            parse(data)
            bindings[key] = sha(data)
        except Exception:
            pass
    receipt['inputIdentityHashes'] = bindings
    if type(getattr(exc, 'errno', None)) is int and 0 <= exc.errno <= 4095:
        receipt['errno'] = exc.errno
    target = root/'runtime-evidence/first-export-failure.json'
    if not target.exists():
        atomic(target, receipt, exclusive=True)
    raw = regular_bytes(target, MAX_FAILURE)
    existing = parse(raw)
    # Existing first evidence is immutable and must itself meet this exact safe
    # schema; do not upload a malformed pre-existing file merely by its name.
    need(set(existing) <= {'schema', 'code', 'context', 'rawOutputRetained', 'applicationAcceptance', 'errno', 'inputIdentityHashes'} and
         existing.get('schema') == receipt['schema'] and existing.get('rawOutputRetained') is False and
         existing.get('applicationAcceptance') is False and
         existing.get('code') in KNOWN_CODES and
         set(existing.get('context', {})) <= {'operation', 'path'} and
         existing['context'].get('operation') in SAFE_OPERATIONS and
         ('path' not in existing['context'] or existing['context']['path'] in SAFE_PATHS) and
         ('errno' not in existing or type(existing['errno']) is int and 0 <= existing['errno'] <= 4095) and
         set(existing.get('inputIdentityHashes', {})) <= {'runContractSHA256', 'sourceAdmissionSHA256'} and
         all(re.fullmatch('[a-f0-9]{64}', value) is not None for value in existing.get('inputIdentityHashes', {}).values()),
         'EXPORT_FIRST_FAILURE_RECORD_INVALID')
    return raw


def handoff_failure_files(root, exporter):
    """Only the host handoff's small closed schema can enter failure transport."""
    files = {}
    for phase in ('preflight', 'full'):
        name = 'evidence/'+phase+'/first-evidence-handoff-failure.json'
        if not (root/name).exists():
            continue
        try:
            raw = regular_bytes(root/name, 4096)
            value = parse(raw)
            member = value.get('memberName')
            need(set(value) == {'schema', 'firstFailure', 'stage', 'operation', 'code', 'memberName',
                'observedBytes', 'maximumMemberBytesExclusive', 'errno', 'rawErrorOrRecordsRetained',
                'nativeAcceptanceClaimed'} and
                value['schema'] == 'work8-v101-evidence-handoff-first-failure-v1' and
                value['stage'] == phase and value['firstFailure'] is True and
                value['operation'] == 'SANITIZED_PRIVATE_EVIDENCE_HANDOFF' and
                value['code'] in HANDOFF_CODES and
                (member is None or isinstance(member, str) and len(member) <= 128 and
                 Path(member).name == member and exporter.stage_allowed(member)) and
                (value['observedBytes'] is None or type(value['observedBytes']) is int and 0 <= value['observedBytes'] <= 2**31-1) and
                value['maximumMemberBytesExclusive'] == MAX_FILE and
                (value['errno'] is None or type(value['errno']) is int and 0 <= value['errno'] <= 4095) and
                value['rawErrorOrRecordsRetained'] is False and value['nativeAcceptanceClaimed'] is False,
                'EXPORT_HANDOFF_DIAGNOSTIC_SCHEMA_REFUSED')
            need(not any(pattern.search(raw) for pattern in exporter.PATTERNS),
                 'EXPORT_HANDOFF_DIAGNOSTIC_SECRET_REFUSED')
            files[name] = raw
        except Exception:
            # Never import a malformed diagnostic simply because it has an
            # approved filename. The export refusal remains available.
            continue
    return files


def failure_projections(root):
    """Closed-schema cleanup and prior-cause metadata, never arbitrary errors."""
    files = {}
    cleanup_path = root/'runtime-evidence/receipt-cleanup.json'
    if cleanup_path.exists():
        projection = {'schema': 'work8-v101-cleanup-failure-projection-v1',
                      'status': 'UNAVAILABLE_OR_INVALID', 'rawOutputRetained': False,
                      'applicationAcceptance': False}
        try:
            raw = regular_bytes(cleanup_path, MAX_FAILURE)
            projection['sourceReceiptSHA256'] = sha(raw)
            value = parse(raw)
            labels = value['authorisedLabels']
            need(isinstance(labels, list) and len(labels) == 3 and
                 isinstance(labels[0], str) and re.fullmatch(r'work8-v65-a5-[0-9]{1,20}', labels[0]) is not None and
                 labels == [labels[0], labels[0]+'-preflight', labels[0]+'-full'],
                 'EXPORT_SCOPED_CLEANUP_REQUIRED')
            inventory = value['finalInventory']
            need(value['status'] in ('PASS_SCOPED_CLEANUP', 'FAIL_SCOPED_CLEANUP') and
                 isinstance(inventory, list) and len(inventory) <= 6 and
                 all(set(row) == {'type', 'label', 'remainingCount'} and row['type'] in ('container', 'network') and
                     row['label'] in labels and type(row['remainingCount']) is int and 0 <= row['remainingCount'] <= 64
                     for row in inventory) and
                 type(value['errorCount']) is int and 0 <= value['errorCount'] <= 1024 and
                 type(value['privateTemporaryDataRemoved']) is bool and
                 type(value['independentEmptyInventoryReadback']) is bool,
                 'EXPORT_SCOPED_CLEANUP_REQUIRED')
            projection.update(status=value['status'], authorisedLabels=labels, finalInventory=inventory,
                errorCount=value['errorCount'], privateTemporaryDataRemoved=value['privateTemporaryDataRemoved'],
                independentEmptyInventoryReadback=value['independentEmptyInventoryReadback'],
                arbitraryErrorDetailsRetained=False)
        except Exception:
            pass
        files['cleanup-projection.json'] = encoded(projection)
    codes = KNOWN_CODES | HANDOFF_CODES | {
        'RUNTIME_COMMAND_FAILED', 'NATIVE_CONTROLLER_FIRST_FAILURE', 'SCOPED_CLEANUP_FAILED',
        'COMMAND_DEADLINE', 'COMMAND_OUTPUT_BOUND', 'COMMAND_OS_ERROR',
        'UNCLASSIFIED_NATIVE_STARTUP_ERROR', 'LIVE_BRAIN_CAPTURE_FAILED',
        'ACTUAL_NATIVE_STARTUP_DEADLINE', 'SAFE_CAUSAL_RECEIPT_UNAVAILABLE',
    }
    for name in ('runtime-evidence/first-runtime-failure.json',
                 'runtime-evidence/first-runtime-command-failure.json',
                 'evidence/preflight/first-native-failure.json',
                 'evidence/full/first-native-failure.json'):
        if not (root/name).exists():
            continue
        projection = {'schema': 'work8-v101-prior-cause-projection-v1', 'sourcePath': name,
                      'status': 'UNAVAILABLE_OR_INVALID', 'rawOutputRetained': False,
                      'applicationAcceptance': False}
        try:
            raw = regular_bytes(root/name, MAX_FAILURE)
            projection['sourceReceiptSHA256'] = sha(raw)
            value = parse(raw)
            code = value.get('code', value.get('assertion'))
            projection.update(status='BOUNDED_CAUSAL_METADATA_ONLY',
                              code=code if code in codes else 'UNCLASSIFIED_PRIOR_CAUSE')
            stage = value.get('stage')
            if stage in ('preflight', 'full', 'native', 'cleanup', 'final-export', 'ADMISSION_FATAL_REFUSAL'):
                projection['stage'] = stage
            if type(value.get('errno')) is int and 0 <= value['errno'] <= 4095:
                projection['errno'] = value['errno']
        except Exception:
            pass
        files['prior-cause-projections/'+name.replace('/', '-')]=encoded(projection)
    return files


def finalize(root, exporter, source_check=None):
    root = Path(root)
    need(root.is_absolute() and root.resolve() == root, 'EXPORT_CANONICAL_ROOT')
    operation = 'GATHER'
    pending = root/'final-export-pending'
    final = root/'final-export'
    need(not pending.exists() and not final.exists(), 'EXPORT_FINAL_ALREADY_ATTEMPTED')
    try:
        if source_check is not None:
            operation = 'SOURCE_LINEAGE'
            try:
                source_check()
            except Exception:
                need(False, 'EXPORT_SOURCE_ADMISSION_REFUSED', operation=operation)
        operation = 'GATHER'
        # Scope changes are confined to the final collector instance. Per-file
        # limits, reviewed names, complete stage indexes and secret checks stay.
        exporter.MAX_TOTAL = MAX_TOTAL
        exporter.MAX_FILE = MAX_FILE
        exporter.STAGE_NAMES.add('first-evidence-handoff-failure')
        for phase in ('preflight', 'full'):
            name = 'evidence/'+phase+'/artifact-index.json'
            need((root/name).is_file(), 'EXPORT_REQUIRED_STAGE_INDEX_MISSING', operation='GATHER', path=name)
            index = parse(regular_bytes(root/name, MAX_FILE), name)
            need(isinstance(index, dict) and isinstance(index.get('files'), list) and
                 len(index['files']) <= 256 and all(isinstance(row, dict) and
                 set(row) == {'path', 'bytes', 'sha256'} and isinstance(row['path'], str) and
                 type(row['bytes']) is int and 0 <= row['bytes'] <= MAX_TOTAL and
                 isinstance(row['sha256'], str) and re.fullmatch('[a-f0-9]{64}', row['sha256']) is not None
                 for row in index['files']), 'EXPORT_STAGE_INDEX_MALFORMED', operation='GATHER', path=name)
        original_safe = exporter.safe_bytes
        original_regular = exporter.regular
        def regular(path):
            try:
                return original_regular(path)
            except Refusal as error:
                if str(error) == 'CANONICAL_REGULAR_FILE_REQUIRED':
                    relative = Path(path).relative_to(root).as_posix()
                    need(False, 'EXPORT_INPUT_REGULAR_FILE_REQUIRED', operation='GATHER', path=relative)
                raise
        exporter.regular = regular
        def safe_bytes(path):
            relative = Path(path).relative_to(root).as_posix()
            try:
                return original_safe(path)
            except (json.JSONDecodeError, UnicodeError, RecursionError):
                need(False, 'EXPORT_MALFORMED_JSON' if str(path).endswith('.json') else 'EXPORT_MALFORMED_TEXT',
                     operation='GATHER', path=relative)
            except Refusal as error:
                if str(error) == 'CANONICAL_REGULAR_FILE_REQUIRED':
                    need(False, 'EXPORT_INPUT_REGULAR_FILE_REQUIRED', operation='GATHER', path=relative)
                error.export_context = {'operation': 'GATHER'}
                if relative in SAFE_PATHS:
                    error.export_context['path'] = relative
                raise
        exporter.safe_bytes = safe_bytes
        files = exporter.gather(root)
        operation = 'INVENTORY'
        try:
            validation = validate_success(files)
        except (KeyError, TypeError, AttributeError):
            need(False, 'EXPORT_RECEIPT_SCHEMA_REFUSED', operation='INVENTORY')
        files['final-transport-validation.json'] = encoded(validation)
        operation = 'ARCHIVE_WRITE'
        result = write_archive(pending, files, 'final')
        operation = 'ARCHIVE_READBACK'
        verify_final_directory(pending)
        os.rename(pending, final)
        return result
    except Exception as exc:
        raw = preserve_failure(root, exc, operation)
        # A partial full archive is never selected by the upload path. Only
        # this explicitly constructed bounded metadata package is exported.
        failure_files = {'first-export-failure.json': raw, **handoff_failure_files(root, exporter),
                         **failure_projections(root)}
        write_archive(final, failure_files, 'failure', MAX_FAILURE)
        verify_final_directory(final)
        failure = Refusal(parse(raw)['code'])
        failure.export_context = parse(raw)['context']
        failure.failureExportReady = True
        raise failure from None

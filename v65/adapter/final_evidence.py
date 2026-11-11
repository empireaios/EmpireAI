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
import importlib.util
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


def archive_payloads(files, label):
    index = {'schema': 'work8-v101-final-export-index-v1', 'label': label,
             'files': [{'path': n, 'bytes': len(b), 'sha256': sha(b)} for n, b in sorted(files.items())],
             'logicalBytes': sum(map(len, files.values())), 'maximumLogicalBytes': MAX_TOTAL,
             'applicationAcceptance': False, 'privateDataIncluded': False}
    payloads = {**files, 'export-index.json': encoded(index)}
    need(index['logicalBytes'] <= MAX_TOTAL and len(payloads) <= 600,
         'EXPORT_TOTAL_BOUND', operation='ARCHIVE_WRITE')
    return payloads


def archive_stream(stream, payloads):
    # Size admission and durable writing use exactly this index/tar/gzip format.
    with gzip.GzipFile(filename='', mode='wb', fileobj=stream, mtime=0) as zipped:
        with tarfile.open(fileobj=zipped, mode='w|') as archive:
            for name, data in sorted(payloads.items()):
                info = tarfile.TarInfo(name)
                info.size = len(data)
                info.mode = 0o600
                info.uid = info.gid = info.mtime = 0
                archive.addfile(info, io.BytesIO(data))


def archive_size(files, label):
    stream = io.BytesIO()
    archive_stream(stream, archive_payloads(files, label))
    return len(stream.getvalue())


def write_archive(directory, files, label, maximum=MAX_ARCHIVE):
    directory = Path(directory)
    need(not directory.exists(), 'EXPORT_DESTINATION_ALREADY_EXISTS', operation='ARCHIVE_WRITE')
    payloads = archive_payloads(files, label)
    directory.mkdir(mode=0o700)
    target = directory/'evidence-export.tar.gz'
    with target.open('xb') as stream:
        os.chmod(target, 0o600)
        archive_stream(stream, payloads)
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


# Existing source-pinned schema; no diagnostic vocabulary is reconstructed from
# runtime strings. Preflight observations remain separate from full failures.
DIAGNOSTIC_ROOT = Path(__file__).resolve().parents[1]/'foundation/controller/scripts/work8/native-transition'
HOST_STAGES = frozenset(('actual-initialized-native-live-brain-capture', 'actual-live-brain-baseline',
    'actual-runtime-start', 'cleanup', 'drain-and-independent-readback',
    'native-preflight-application-start', 'phase-b-authorised-application-start', 'native-preflight-orderly-drain',
    'new-private-capture-exchanges-refusal-controls', 'normal-return-version', 'normal-view',
    'original-mounted-entrypoint-contract-before-startup', 'preflight', 'recovery-version',
    'retained-v98-frontend-startup-evidence', 'verify-complete-current-package-delivery'))
BROWSER_STAGES = frozenset(('START', 'NORMAL_AUTHENTICATION_BOOTSTRAP', 'NORMAL_AUTHENTICATION',
    'NORMAL_IDENTITY', 'CANONICAL_TWIN_CREATE', 'CANONICAL_TWIN_RESUME',
    'CANONICAL_LABELLED_ADMISSION', 'NATIVE_SCHEDULER_GRANT', 'REAL_TIMER_CANONICAL_PROGRESS',
    'CANONICAL_PAUSE_AND_REVOKE', 'RECOVERY_SWITCH', 'RECOVERY_WRITES_AND_AUTHORITY_REFUSED',
    'RECOVERY_AUTHENTICATED_CANONICAL_PRESENTATION', 'NORMAL_RETURN_SWITCH',
    'NORMAL_RETURN_CANONICAL_EQUALITY', 'NORMAL_RETURN_IDEMPOTENT_REPLAY'))


def diagnostic_module(name):
    spec = importlib.util.spec_from_file_location('v104_export_'+name, DIAGNOSTIC_ROOT/(name+'.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def bounded_browser(value, native):
    need(isinstance(value, dict), 'EXPORT_RECEIPT_SCHEMA_REFUSED')
    # These are literal browser assertion/mapping tokens. Unknown uppercase
    # strings are not accepted just because they look like a safe error code.
    codes = native.CODES | {'COMPONENT_VERIFIED_AVAILABILITY_BOUND_INVALID'}
    frames = value.get('sourceFrames')
    frames = frames if isinstance(frames, list) else []
    return {'stage': value.get('stage') if value.get('stage') in BROWSER_STAGES else 'UNKNOWN',
        'firstFailure': True,
        'name': value.get('name') if value.get('name') in ('Error', 'AssertionError', 'TypeError', 'TimeoutError') else 'OTHER_ERROR',
        'code': value.get('code') if isinstance(value.get('code'), str) and value['code'] in codes else 'UNCLASSIFIED_ERROR',
        'sourceFrames': [x for x in frames[:8] if isinstance(x, str) and re.fullmatch(r'browser\.mjs:[0-9]{1,6}:[0-9]{1,6}', x)],
        'browserConnected': value.get('browserConnected') if type(value.get('browserConnected')) is bool else None,
        'ownerPageClosed': value.get('ownerPageClosed') if type(value.get('ownerPageClosed')) is bool else None,
        'arbitraryErrorValuesRetained': False}


def diagnostic_bindings(root, phase):
    result = {'phase': phase, 'scope': 'PHASE_DIAGNOSTIC_NOT_ACCEPTANCE',
              'crossProducerCausalOrder': 'NOT_ESTABLISHED'}
    for name, key in (('run-contract.json', 'runContractSHA256'),
                      ('evidence/'+phase+'/stage-start.json', 'stageStartSHA256')):
        try:
            result[key] = sha(regular_bytes(root/name, MAX_FILE))
        except Exception:
            pass
    return result


def assurance_failure_binding(root, phase, source_path, raw, diagnostic, context_key='assuranceContext'):
    """Join optional bounded operands to actual indexed source and run bytes.

    A failed join is diagnostic metadata, never a replacement first cause or
    application acceptance. Do not trust a caller-provided digest by itself.
    """
    context = diagnostic.get(context_key)
    if not isinstance(context, dict):
        return None
    result = {'schema': 'work8-v110-assurance-source-binding-v1',
              'contextKind': 'RECOVERY_ACTIVITY' if context_key == 'assuranceActivityContext' else 'INCIDENT',
              'status': 'UNAVAILABLE_OR_INVALID', 'applicationAcceptance': False}
    try:
        contract_raw = regular_bytes(root/'run-contract.json', MAX_FILE)
        contract = parse(contract_raw)
        start = parse(regular_bytes(root/('evidence/'+phase+'/stage-start.json'), MAX_FILE))
        index = parse(regular_bytes(root/('evidence/'+phase+'/artifact-index.json'), MAX_FILE))
        rows = [row for row in index['files'] if row.get('path') == Path(source_path).name]
        result['stageIndexIdentity'] = 'MATCH' if len(rows) == 1 and rows[0].get('sha256') == sha(raw) and rows[0].get('bytes') == len(raw) else 'MISMATCH'
        result['runSourceIdentity'] = 'MATCH' if (start.get('stage') == phase and
            start.get('runContractSHA256') == sha(contract_raw) and
            start.get('sessionId') == contract.get('executor', {}).get('sessionId') and
            start.get('controllerManifestSHA256') == contract.get('controllerManifestSHA256')) else 'MISMATCH'
        actual_checker = sha(regular_bytes(DIAGNOSTIC_ROOT/'whole-app-readback.mjs', MAX_FILE))
        result['checkerSourceIdentity'] = 'MATCH' if context.get('checkerSha256') == actual_checker else 'MISMATCH'
        result['checkerSHA256'] = actual_checker
        manifest_raw = regular_bytes(root/'controller/scripts/work8/native-transition/controller-manifest.json', MAX_FILE)
        manifest = parse(manifest_raw)
        source_entries = {name: [row for row in manifest['files'] if row.get('path') == name]
                          for name in ('whole-app-readback.mjs', 'assurance-records.mjs')}
        result['controllerManifestIdentity'] = 'MATCH' if (sha(manifest_raw) == contract.get('controllerManifestSHA256') and
            all(len(rows) == 1 and rows[0].get('sha256') == sha(regular_bytes(DIAGNOSTIC_ROOT/name, MAX_FILE)) and
                rows[0].get('bytes') == len(regular_bytes(DIAGNOSTIC_ROOT/name, MAX_FILE))
                for name, rows in source_entries.items())) else 'MISMATCH'
        result['controllerManifestSHA256'] = sha(manifest_raw)
        result['sourceRevisions'] = {role: {k: hex_digest(contract.get('sources', {}).get(role, {}).get(k), 40)
            for k in ('commit', 'tree')} for role in ('backend', 'normal', 'recovery')}
        result['workflowCommit'] = hex_digest(contract.get('executor', {}).get('workflowCommit'), 40)
        result['status'] = 'MATCH' if (context.get('invariant') == diagnostic.get('assertion') and
            context.get('status') != 'UNAVAILABLE_OR_INVALID' and
            all(result[k] == 'MATCH' for k in ('stageIndexIdentity', 'runSourceIdentity', 'checkerSourceIdentity', 'controllerManifestIdentity'))) else 'MISMATCH'
    except Exception:
        pass
    return result


def native_failure_projections(root, exporter):
    """Retain independent producers without promoting an earlier observation
    (including a successful preflight drain diagnostic) into the fatal cause.
    """
    files = {}
    try:
        native = diagnostic_module('native_diagnostics')
    except Exception:
        native = None
    try:
        docker = diagnostic_module('docker_diagnostics')
    except Exception:
        docker = None
    names = ['evidence/'+phase+'/first-native-failure.json' for phase in ('preflight', 'full')]
    names += ['evidence/full/'+name for name in ('first-controller-failure.json',
        'runner-result.json', 'browser-stderr-sanitized.json', 'transition-browser-result.json',
        'command-first-exception.json', 'first-docker-failure.json', 'first-docker-state-error.json',
        'host-private-handoff-first-failure.json', 'private-handoff-first-failure.json')]
    names += ['controller-supervisor-full.json']
    for name in names:
        if not (root/name).exists():
            continue
        phase = 'preflight' if '/preflight/' in name else 'full'
        projection = {'schema': 'work8-v104-native-failure-projection-v1', 'sourcePath': name,
            'status': 'UNAVAILABLE_OR_INVALID', 'rawOutputRetained': False,
            'applicationAcceptance': False, **diagnostic_bindings(root, phase)}
        try:
            raw = regular_bytes(root/name, MAX_FAILURE)
            projection['sourceReceiptSHA256'] = sha(raw)
            value = parse(raw)
            need(isinstance(value, dict), 'EXPORT_RECEIPT_SCHEMA_REFUSED')
            basename = Path(name).name
            if basename == 'first-native-failure.json':
                projection['nativeDiagnostic'] = native.sanitize(value)
                projection['code'] = projection['nativeDiagnostic']['assertion']
                projection['fatalCauseAssociation'] = 'NOT_ESTABLISHED_BY_DIAGNOSTIC_ALONE'
            elif basename == 'first-controller-failure.json':
                need(value.get('schema') == 'work8-v104-controller-first-failure-v1' and
                     value.get('firstFailure') is True and value.get('phase') == phase,
                     'EXPORT_RECEIPT_SCHEMA_REFUSED')
                projection.update(operation=value.get('operation') if value.get('operation') in
                    ('EXAMINATION_ASSERTION', 'WAIT_FOR_CONTROL_MARKER', 'OBSERVE_CONTAINER_EXIT',
                     'OBSERVE_BROWSER_FAILURE', 'EXECUTE_REVIEWED_COMMAND') else 'UNKNOWN',
                    stage=value.get('stage') if value.get('stage') in HOST_STAGES else 'UNKNOWN',
                    controllerException=native.sanitize(value['safeFirstFailure']))
                markers = ('browser-complete.json', 'live-brain-captured.json', 'normal-complete.json',
                    'normal-observed.json', 'recovery-complete.json', 'replayed-observed.json',
                    'returned-observed.json', 'runtime-drained.json', 'runtime-ready.json')
                if value.get('marker') in markers:
                    projection['marker'] = value['marker']
                if value.get('role') in ('backend', 'browser'):
                    projection['role'] = value['role']
                if isinstance(value.get('browserFailure'), dict):
                    projection['browserFailure'] = bounded_browser(value['browserFailure'], native)
            elif basename == 'runner-result.json':
                projection.update(stage=value.get('failedStage') if value.get('failedStage') in HOST_STAGES else 'UNKNOWN',
                    controllerStatus=value.get('status') if value.get('status') in ('FAIL', 'PASS_AWAITING_INDEPENDENT_TECHNICAL_REVIEW') else 'UNKNOWN')
            elif basename in ('browser-stderr-sanitized.json', 'transition-browser-result.json'):
                if basename == 'browser-stderr-sanitized.json':
                    need(value.get('schema') == 'work8-browser-sanitized-stderr-v1' and
                         isinstance(value.get('diagnostics'), list) and len(value['diagnostics']) <= 1,
                         'EXPORT_RECEIPT_SCHEMA_REFUSED')
                    candidates = value['diagnostics']
                else:
                    candidates = [{**value['failure'], 'stage': value.get('failedStage')}] if isinstance(value.get('failure'), dict) else []
                projection['browserDiagnostics'] = [bounded_browser(row, native) for row in candidates]
            elif basename in ('host-private-handoff-first-failure.json', 'private-handoff-first-failure.json'):
                need(value.get('schema') in ('WORK8_HOST_PRIVATE_HANDOFF_FAILURE_V1', 'WORK8_PRIVATE_HANDOFF_FAILURE_V1'),
                     'EXPORT_RECEIPT_SCHEMA_REFUSED')
                projection.update(operation=native.token(value.get('operation')),
                    errno=value.get('errno') if value.get('errno') in native.ERRNOS else None,
                    numericErrno=native.integer(value.get('numericErrno')),
                    identity=native.identity(value.get('identity')))
            elif basename == 'command-first-exception.json':
                need(value.get('schema') == 'work8-v61-command-output-metadata-v1', 'EXPORT_RECEIPT_SCHEMA_REFUSED')
                projection.update(operation='EXECUTE_REVIEWED_COMMAND',
                    commandException=native.command_exception(value.get('exception', {})),
                    exitCode=value.get('exitCode') if type(value.get('exitCode')) is int and -255 <= value['exitCode'] <= 255 else None)
                if isinstance(value.get('safeFirstFailure'), dict):
                    projection['nativeDiagnostic'] = native.sanitize(value['safeFirstFailure'])
            elif basename.startswith('first-docker-'):
                projection['dockerDiagnostic'] = docker.validate(value)
            else:
                need(value.get('schema') == 'work8-v65-controller-supervisor-v1' and value.get('phase') == phase,
                     'EXPORT_RECEIPT_SCHEMA_REFUSED')
                projection.update(operation='SUPERVISE_NATIVE_CONTROLLER',
                    controllerExitCode=value.get('controllerExitCode') if type(value.get('controllerExitCode')) is int and -255 <= value['controllerExitCode'] <= 255 else None,
                    firstSupervisorCause=value.get('firstSupervisorCause') if value.get('firstSupervisorCause') in
                        (None, 'EXTERNAL_TERMINATION', 'CONTROLLER_STAGE_DEADLINE', 'CONTROLLER_OUTPUT_BOUND') else 'UNKNOWN',
                    firstObservedFailureKind=value.get('firstObservedFailureKind') if value.get('firstObservedFailureKind') in
                        (None, 'NATIVE_DIAGNOSTIC', 'SUPERVISOR') else 'UNKNOWN', observationOrderOnly=True)
                for key in ('nativeFailureObservationSequence', 'supervisorCauseObservationSequence'):
                    projection[key] = native.integer(value.get(key))
                if isinstance(value.get('firstNativeFailure'), dict):
                    projection['nativeDiagnostic'] = native.sanitize(value['firstNativeFailure'])
            diagnostic = projection.get('nativeDiagnostic', projection.get('controllerException'))
            if isinstance(diagnostic, dict):
                for context_key, binding_key in (('assuranceContext', 'assuranceSourceBinding'),
                                                 ('assuranceActivityContext', 'assuranceActivitySourceBinding')):
                    binding = assurance_failure_binding(root, phase, name, raw, diagnostic, context_key)
                    if binding is not None:
                        projection[binding_key] = binding
            projection['status'] = 'BOUNDED_CAUSAL_METADATA_ONLY'
            data = encoded(projection)
            need(len(data) <= MAX_FAILURE and not any(pattern.search(data) for pattern in exporter.PATTERNS),
                 'EXPORT_HANDOFF_DIAGNOSTIC_SECRET_REFUSED')
        except Exception:
            # Invalid input produces fixed metadata only, never partially
            # projected unsafe values or a replacement for another first cause.
            projection = {key: projection[key] for key in ('schema', 'sourcePath', 'rawOutputRetained',
                'applicationAcceptance', 'phase', 'scope', 'crossProducerCausalOrder', 'sourceReceiptSHA256',
                'runContractSHA256', 'stageStartSHA256') if key in projection}
            projection['status'] = 'UNAVAILABLE_OR_INVALID'
        files['prior-cause-projections/'+name.replace('/', '-')] = encoded(projection)
    return files


# Failure transport preserves the first browser comparison's bounded predicate
# evidence. Success validation and the comparator itself remain independent.
COMPARISON_FAILURES = {
    'NORMAL_REPLAY_CANONICAL_COMPARISON_FAILED': ('normal-replay', 'NORMAL_REPLAY', 'normal'),
    'RETURN_CANONICAL_RECORDS_OR_DERIVED_PRESENTATION_INVALID': ('returned', 'NORMAL_RETURN', 'returned'),
    'RETURN_REPLAY_MUTATED_CANONICAL_STATE': ('replayed', 'NORMAL_RETURN_REPLAY', 'replayed'),
    'NORMAL_INDEPENDENT_READBACK_FAILED': ('normal-replay', 'NORMAL_REPLAY', 'normal'),
    'RETURNED_INDEPENDENT_READBACK_FAILED': ('returned', 'NORMAL_RETURN', 'returned'),
    'REPLAYED_INDEPENDENT_READBACK_FAILED': ('replayed', 'NORMAL_RETURN_REPLAY', 'replayed'),
}
COMPARISON_CODES = frozenset('''UNCLASSIFIED_SCHEMA_FIELD SCHEMA_TYPE_CHANGED MANDATORY_SCHEMA_KEYS_CHANGED
VALUE_CHANGED ARRAY_LENGTH_CHANGED PERSISTENCE_INPUT_MISSING SESSION_PERSISTENCE_MISMATCH
SESSION_DIGEST_MISMATCH AUTHORITY_DIGEST_MISMATCH OWNER_WORKSPACE_NAMESPACE_MISMATCH
SESSION_CHAIN_DIGEST_INVALID AUTHORITY_CHAIN_DIGEST_INVALID INVALID_READ_INTERVAL SCHEMA_IDENTITY_CHANGED
SESSION_NOT_FROZEN AUTHORITY_NOT_REVOKED SAFETY_STATE_CHANGED ACCEPTANCE_DATASET_INCOMPLETE
UNREVIEWED_CLOCK_DEPENDENT_COMMUNICATION PREPARATION_AUTHORITY_NOT_EMPTY PERSISTED_PLAN_COUNT_MISMATCH
PERSISTED_PLAN_MISSING PLAN_SCOPE_MISMATCH PLAN_DIGEST_MISMATCH COMMITTED_EVENTS_MISMATCH
PLAN_ASSUMPTIONS_CHANGED COMMITTED_EVENT_PREFIX_MISMATCH FINANCE_COUNTS_MISMATCH CUTOFF_OUTSIDE_READ_INTERVAL
COMMITTED_EVENT_AFTER_CUTOFF UNREVIEWED_PENDING_FINANCIAL_EVENT FINANCIAL_EVENT_DIGEST_MISMATCH
INVALID_PLANNED_THRESHOLD AMBIGUOUS_STATUS_READ_INTERVAL INCORRECT_DERIVED_FINANCE_STATUS
PROBE_TIME_OUTSIDE_READ_INTERVAL INVALID_COMPARATOR_INPUT'''.split())
COMPARISON_VALUES = frozenset('''WAITING_SIMULATED_PAYOUT_OR_EVENT IN_PROGRESS COMPLETE_SIMULATION
INCOMPLETE_SIMULATION REVOKED PAUSED NOT_GRANTED LOCKED NOT_BORN SIMULATION
SIMULATION_EXCLUDED_FROM_ACTUALS SYNTHETIC SANDBOX PASS FAIL'''.split())
COMPARISON_CLASSES = frozenset('''CLOCK_DERIVED_PRESENTATION CANONICAL_PERSISTED
CANONICAL_CONTROL_OR_PERSISTED_PROJECTION DERIVED_FROM_CANONICAL_SOURCE
CANONICAL_OR_EXACT_SOURCE_BOUND_PRESENTATION UNCLASSIFIED_REJECTED'''.split())
COMPARISON_SEQUENCE = ('PAUSE_APPLIED', 'REVOKE_APPLIED', 'FROZEN_SNAPSHOT_OBSERVED',
    'PAUSE_REPLAY_IDENTICAL', 'REVOKE_REPLAY_IDENTICAL', 'NORMAL_REPLAY_SNAPSHOT_OBSERVED')


def hex_digest(value, length=64):
    return value if isinstance(value, str) and re.fullmatch('[a-f0-9]{'+str(length)+'}', value) else None


def safe_integer(value, maximum=2**53-1):
    return value if type(value) is int and 0 <= value <= maximum else None


def comparison_path(value):
    if not isinstance(value, str) or len(value) > 1024 or not value.startswith('$'):
        return None
    keys = {'canonical', 'tables', 'table', 'scopeSha256', 'count', 'rowsSha256', 'sessionDigest',
            'authorityDigest', 'plan', 'createdAt', 'sourceDigest', 'assumptions', 'events',
            'persistence', 'observation', 'length'}
    for filename in ('normal-schema.json', 'recovery-schema.json'):
        schema = parse(regular_bytes(DIAGNOSTIC_ROOT/filename, MAX_FILE))
        for path in schema['paths']:
            keys.update(k.replace('[]', '') for k in path.split('.') if
                        re.fullmatch('[A-Za-z_][A-Za-z0-9_]*', k.replace('[]', '')))
    tail = value[1:]
    while tail:
        match = re.match(r'\.([A-Za-z_][A-Za-z0-9_]*)|\[([0-9]{1,10})\]|\[key-sha256:([a-f0-9]{64})\]', tail)
        if not match or (match[1] is not None and match[1] not in keys):
            return None
        tail = tail[match.end():]
    return value


def comparison_context(value, observed_phase):
    if not isinstance(value, dict):
        return {'status': 'UNAVAILABLE_OR_INVALID'}
    try:
        need(value.get('replayScope') == 'NORMAL_BEFORE_RECOVERY', 'EXPORT_RECEIPT_SCHEMA_REFUSED')
        reads = value.get('persistenceReads', {})
        need(isinstance(reads, dict) and all(reads.get(side) in ('READ_OK', 'JSON_INVALID', 'MISSING', 'READ_FAILED')
             for side in ('expected', 'observed')), 'EXPORT_RECEIPT_SCHEMA_REFUSED')
        need(value['comparatorId'] == 'WORK8_V28_CANONICAL_COMPARISON_V1' and
             value['originalPredicate'] == 'A5-09_CANONICAL_AND_PERSISTED_STATE_PRESERVATION' and
             value['expectedPhase'] == 'NORMAL_FROZEN' and value['observedPhase'] == observed_phase,
             'EXPORT_RECEIPT_SCHEMA_REFUSED')
        result = {k: value[k] for k in ('comparatorId', 'originalPredicate', 'expectedPhase', 'observedPhase')}
        for side in ('expected', 'observed'):
            state = value[side]
            need(isinstance(state, dict) and isinstance(state.get('recordVersions'), list) and
                 len(state['recordVersions']) <= 16, 'EXPORT_RECEIPT_SCHEMA_REFUSED')
            result[side] = {k: safe_integer(state.get(k), 2**31-1) for k in ('sessionVersion', 'authorityVersion')}
            result[side].update(recordVersions=[safe_integer(x, 2**31-1) for x in state['recordVersions']],
                sessionStatus=state.get('sessionStatus') if state.get('sessionStatus') in ('PAUSED', 'UNCLASSIFIED') else 'UNCLASSIFIED',
                authorityStatus=state.get('authorityStatus') if state.get('authorityStatus') in ('REVOKED', 'UNCLASSIFIED') else 'UNCLASSIFIED')
        sequence = value['completedSequence']
        need(isinstance(sequence, list) and tuple(sequence) == COMPARISON_SEQUENCE[:len(sequence)],
             'EXPORT_RECEIPT_SCHEMA_REFUSED')
        result.update(completedSequence=sequence, replayScope='NORMAL_BEFORE_RECOVERY',
            persistenceReads={side: reads[side] for side in ('expected', 'observed')}, replayClassification=value.get('replayClassification')
            if value.get('replayClassification') in ('EXACT_DUPLICATE_RESPONSES_IDENTICAL', 'NOT_ESTABLISHED') else 'NOT_ESTABLISHED',
            status='BOUNDED_RECORDED_CONTEXT_ONLY')
        return result
    except Exception:
        return {'status': 'UNAVAILABLE_OR_INVALID'}


def project_comparison(value, observed_phase):
    need(isinstance(value, dict) and value.get('schema') == 'WORK8_V28_CANONICAL_COMPARISON_V1' and
         all(type(value.get(k)) is bool for k in ('pass', 'canonicalEqual', 'persistenceEqual', 'diagnosticsTruncated')) and
         isinstance(value.get('diagnostics'), list) and len(value['diagnostics']) <= 32 and
         isinstance(value.get('observations'), list) and len(value['observations']) <= 32 and
         safe_integer(value.get('totalIssues'), 2**31-1) is not None,
         'EXPORT_RECEIPT_SCHEMA_REFUSED')
    result = {k: value[k] for k in ('schema', 'pass', 'canonicalEqual', 'persistenceEqual', 'totalIssues', 'diagnosticsTruncated')}
    for key in ('canonicalSha256', 'observedCanonicalSha256', 'persistenceSha256',
                'observedPersistenceSha256', 'sourceIdentitySha256'):
        result[key] = hex_digest(value.get(key))
    rows = []
    for row in value['diagnostics']:
        need(isinstance(row, dict), 'EXPORT_RECEIPT_SCHEMA_REFUSED')
        path = comparison_path(row.get('path'))
        safe = {'code': row.get('code') if isinstance(row.get('code'), str) and row['code'] in COMPARISON_CODES else 'UNCLASSIFIED_COMPARATOR_CODE',
            'path': path, 'classification': row.get('classification') if isinstance(row.get('classification'), str) and row['classification'] in COMPARISON_CLASSES else 'UNCLASSIFIED_REJECTED',
            'expectedSha256': hex_digest(row.get('expectedSha256')), 'observedSha256': hex_digest(row.get('observedSha256'))}
        if path is None:
            safe['pathClassification'] = 'UNRECOGNIZED_PATH_REDACTED'
        for side in ('expectedValue', 'observedValue'):
            if isinstance(row.get(side), str) and row[side] in COMPARISON_VALUES:
                safe[side] = row[side]
        rows.append(safe)
    result['diagnostics'] = rows
    result['diagnosticOrder'] = 'ORIGINAL_RECEIPT_ARRAY_ORDER_NOT_GLOBAL_EVENT_ORDER'
    result['observations'] = []
    for row in value['observations']:
        need(isinstance(row, dict), 'EXPORT_RECEIPT_SCHEMA_REFUSED')
        safe = {'phase': row.get('phase') if row.get('phase') in ('NORMAL', 'RETURNED_NORMAL') else 'UNCLASSIFIED'}
        for key in ('recordIndex', 'requestStartedAtMs', 'financialCutoffAtMs', 'requestCompletedAtMs', 'nextPlannedEventAtMs'):
            safe[key] = safe_integer(row.get(key), 15 if key == 'recordIndex' else 2**53-1)
        for key in ('missionSha256', 'planSha256', 'committedEventsSha256', 'sourceReceiptSha256'):
            safe[key] = hex_digest(row.get(key))
        for key in ('displayedStatus', 'verifiedStatus'):
            safe[key] = row.get(key) if isinstance(row.get(key), str) and row[key] in COMPARISON_VALUES else None
        result['observations'].append(safe)
    result['comparisonContext'] = comparison_context(value.get('comparisonContext'), observed_phase)
    # The producer hashes JSON.stringify before adding the digest field.
    # Parsed property order and scalar Unicode match that representation. A
    # non-source numeric domain is unavailable, never falsely called a match.
    reported = hex_digest(value.get('receiptPayloadSha256'))
    result['payloadHashStatus'] = 'UNAVAILABLE_LEGACY_OR_INVALID'
    if reported:
        result['receiptPayloadSha256'] = reported
        try:
            payload = {k: v for k, v in value.items() if k != 'receiptPayloadSha256'}
            def source_json(item):
                if item is None or type(item) is bool:
                    return
                if type(item) is int and abs(item) <= 2**53-1:
                    return
                if isinstance(item, str):
                    item.encode('utf8')
                    return
                if isinstance(item, list):
                    for child in item:
                        source_json(child)
                    return
                if isinstance(item, dict):
                    for key, child in item.items():
                        source_json(key); source_json(child)
                    return
                raise ValueError('UNSUPPORTED_SOURCE_JSON_SCALAR')
            source_json(payload)
            actual = sha(json.dumps(payload, separators=(',', ':'), ensure_ascii=False, allow_nan=False).encode('utf8'))
            result['payloadHashStatus'] = 'MATCH' if actual == reported else 'MISMATCH'
        except (ValueError, UnicodeError, RecursionError):
            result['payloadHashStatus'] = 'UNAVAILABLE_JSON_REPRESENTATION'
    result['independentReview'] = 'REQUIRED_BEFORE_ACCEPTANCE'
    return result


def comparison_failure_projection(root, exporter):
    """Select only the receipt named by a consistent first browser failure.
    Earlier successful comparisons cannot displace that failure or overflow
    the bounded return with unrelated receipts.
    """
    name = 'prior-cause-projections/first-comparison-failure.json'
    result = {'schema': 'work8-v107-comparison-failure-projection-v1',
        'status': 'UNAVAILABLE_OR_INVALID', 'applicationAcceptance': False, 'rawOutputRetained': False,
        **diagnostic_bindings(root, 'full')}
    causes = []; associations = []; invalid = False
    for path, kind in (('evidence/full/first-controller-failure.json', 'controller'),
                       ('evidence/full/browser-stderr-sanitized.json', 'stderr'),
                       ('evidence/full/transition-browser-result.json', 'browser')):
        try:
            raw = regular_bytes(root/path, MAX_FAILURE); value = parse(raw)
            need(isinstance(value, dict), 'EXPORT_RECEIPT_SCHEMA_REFUSED')
            if kind == 'controller':
                need(value.get('schema') == 'work8-v104-controller-first-failure-v1' and
                     value.get('firstFailure') is True and value.get('phase') == 'full' and
                     value.get('operation') == 'OBSERVE_BROWSER_FAILURE', 'EXPORT_RECEIPT_SCHEMA_REFUSED')
                row = value.get('browserFailure')
                need(isinstance(row, dict) and row.get('firstFailure') is True, 'EXPORT_RECEIPT_SCHEMA_REFUSED')
            elif kind == 'stderr':
                need(value.get('schema') == 'work8-browser-sanitized-stderr-v1' and
                     value.get('stream') == 'stderr' and value.get('arbitraryStderrRetained') is False and
                     isinstance(value.get('diagnostics'), list) and len(value['diagnostics']) == 1,
                     'EXPORT_RECEIPT_SCHEMA_REFUSED')
                row = value['diagnostics'][0]
                need(isinstance(row, dict) and row.get('firstFailure') is True, 'EXPORT_RECEIPT_SCHEMA_REFUSED')
            else:
                need(value.get('schema') == 'work8-v28-canonical-business-transition-v1' and
                     value.get('status') == 'FAIL', 'EXPORT_RECEIPT_SCHEMA_REFUSED')
                row = value.get('failure')
                need(isinstance(row, dict) and value.get('failedStage') in BROWSER_STAGES, 'EXPORT_RECEIPT_SCHEMA_REFUSED')
            need(row.get('arbitraryErrorValuesRetained') is False and isinstance(row.get('code'), str),
                 'EXPORT_RECEIPT_SCHEMA_REFUSED')
            causes.append(row['code']); associations.append({'sourcePath': path, 'sourceReceiptSHA256': sha(raw)})
        except FileNotFoundError:
            pass
        except Exception:
            invalid = True
    if invalid or not causes or len(set(causes)) != 1 or causes[0] not in COMPARISON_FAILURES:
        # No comparison failure observed: avoid creating a new alleged cause.
        if not any((root/('evidence/full/'+item[0]+'-comparison.json')).exists() for item in COMPARISON_FAILURES.values()):
            return {}
        result['associationStatus'] = 'CONFLICTING_OR_UNAVAILABLE_FIRST_BROWSER_COMPARISON_CAUSE'
        return {name: encoded(result)}
    label, observed_phase, capture_phase = COMPARISON_FAILURES[causes[0]]
    relative = 'evidence/full/'+label+'-comparison.json'
    result.update(sourcePath=relative, firstBrowserAssertion=causes[0], associationStatus='MATCHED_EXISTING_FIRST_BROWSER_ASSERTION',
                  associationSources=associations, nativeFailureNotOverwritten=True)
    try:
        raw = regular_bytes(root/relative, MAX_FILE)
        result['originalReceiptSHA256'] = sha(raw)
        result['comparison'] = project_comparison(parse(raw), observed_phase)
        result['status'] = 'BOUNDED_COMPARATOR_EVIDENCE_NOT_ACCEPTANCE'
        try:
            index = parse(regular_bytes(root/'evidence/full/artifact-index.json', MAX_FILE))
            rows = [x for x in index['files'] if x.get('path') == label+'-comparison.json']
            result['stageIndexIdentity'] = 'MATCH' if len(rows) == 1 and rows[0].get('sha256') == sha(raw) and rows[0].get('bytes') == len(raw) else 'MISMATCH'
        except Exception:
            result['stageIndexIdentity'] = 'UNAVAILABLE'
        contract = parse(regular_bytes(root/'run-contract.json', MAX_FILE))
        result['sourceRevisions'] = {role: {k: hex_digest(contract.get('sources', {}).get(role, {}).get(k), 40)
            for k in ('commit', 'tree')} for role in ('backend', 'normal', 'recovery')}
        result['workflowCommit'] = hex_digest(contract.get('executor', {}).get('workflowCommit'), 40)
    except Exception:
        result.pop('comparison', None)
        result['status'] = 'UNAVAILABLE_OR_INVALID'
    # Context receipts completed before comparison. They are not promoted to
    # an earlier causal error merely because one outcome is FAIL.
    context = []
    for phase in dict.fromkeys(('normal', capture_phase)):
        for suffix in ('independent-gate', 'persistence-capture'):
            relative = 'evidence/full/'+phase+'-'+suffix+'.json'
            row = {'sourcePath': relative, 'status': 'UNAVAILABLE_OR_INVALID', 'phase': phase}
            try:
                raw = regular_bytes(root/relative, MAX_FILE); row['originalReceiptSHA256'] = sha(raw); value = parse(raw)
                need(value.get('phase') == phase, 'EXPORT_RECEIPT_SCHEMA_REFUSED')
                if suffix == 'independent-gate':
                    scripts = ('capture-canonical-persistence.mjs', 'offline-commerce-readback.mjs', 'whole-app-readback.mjs')
                    need(type(value.get('allPassed')) is bool and type(value.get('attempts')) is int and value['attempts'] == 1 and
                         set(value.get('outcomes', {})) == set(scripts) and
                         all(value['outcomes'][k] in ('PASS', 'FAIL') for k in scripts), 'EXPORT_RECEIPT_SCHEMA_REFUSED')
                    row.update(status='BOUNDED_GATE_OUTCOMES', allPassed=value['allPassed'], attempts=1,
                               outcomeConsistency=value['allPassed'] == all(value['outcomes'][k] == 'PASS' for k in scripts),
                               outcomes={k: value['outcomes'][k] for k in scripts})
                else:
                    need(value.get('schema') == 'work8-v29-private-canonical-capture-v1' and
                         value.get('status') in ('FAIL', 'PASS_PRIVATE_CANONICAL_CAPTURE') and
                         value.get('readOnlySqlite') is True and value.get('rawRecordsPublished') is False,
                         'EXPORT_RECEIPT_SCHEMA_REFUSED')
                    row.update(status=value['status'], readOnlySqlite=True, rawRecordsPublished=False,
                        readStartedAtMs=safe_integer(value.get('readStartedAtMs')), readCompletedAtMs=safe_integer(value.get('readCompletedAtMs')),
                        canonicalSha256=hex_digest(value.get('canonicalSha256')))
                    native = diagnostic_module('native_diagnostics')
                    for key in ('safeFailure', 'closeFailure'):
                        if isinstance(value.get(key), dict):
                            failure = value[key]
                            row[key] = {'operation': native.token(failure.get('operation')),
                                'errno': failure.get('errno') if failure.get('errno') in native.ERRNOS else None,
                                'rule': native.token(failure.get('rule')),
                                'classification': failure.get('classification') if failure.get('classification') == phase.upper()+'_CANONICAL_PERSISTENCE' else 'UNCLASSIFIED',
                                'rawErrorOrRecordsRetained': False}
            except Exception:
                row = {k: row[k] for k in ('sourcePath', 'originalReceiptSHA256', 'phase') if k in row}
                row['status'] = 'UNAVAILABLE_OR_INVALID'
            context.append(row)
    result['priorReadbackContext'] = context
    result['priorReadbackOrder'] = 'GATE_BEFORE_COMPARISON_SOURCE_SEQUENCE_NOT_GLOBAL_FIRST_CAUSE'
    data = encoded(result)
    # Finite rows/paths/enum fields are below this logical-only guard. The
    # unchanged 16 KiB compressed transport bound is admitted separately, with
    # explicit tail reduction that retains the first comparator diagnostic.
    if len(data) > 128*1024 or any(pattern.search(data) for pattern in exporter.PATTERNS):
        result = {k: result[k] for k in ('schema', 'sourcePath', 'originalReceiptSHA256', 'applicationAcceptance',
            'rawOutputRetained', 'phase', 'scope', 'crossProducerCausalOrder', 'runContractSHA256', 'stageStartSHA256') if k in result}
        result['status'] = 'PROJECTION_SIZE_OR_SECRET_REFUSED'
        data = encoded(result)
    return {name: data}


def fit_comparison_transport(files):
    """The new projection must never break the existing 16 KiB return.

    Reduction affects only supplemental comparison rows, in recorded order.
    Every reduction is explicit; original hashes/counts and the first diagnostic
    remain visible. The primary native, controller, cleanup and export receipts
    are untouched. Admission uses the writer's exact index/tar/gzip bytes.
    """
    name = 'prior-cause-projections/first-comparison-failure.json'
    if name not in files or archive_size(files, 'failure') <= MAX_FAILURE:
        return
    value = parse(files[name])
    comparison = value.get('comparison')
    if not isinstance(comparison, dict):
        files.pop(name)
        return
    value['transportReduction'] = {'reason': 'UNCHANGED_16_KIB_FAILURE_ARCHIVE_BOUND',
        'diagnosticRowsOmitted': 0, 'observationRowsOmitted': len(comparison.get('observations', [])),
        'originalProjectionSHA256': sha(files[name])}
    comparison['observations'] = []
    files[name] = encoded(value)
    while archive_size(files, 'failure') > MAX_FAILURE and len(comparison.get('diagnostics', [])) > 1:
        comparison['diagnostics'].pop()
        value['transportReduction']['diagnosticRowsOmitted'] += 1
        files[name] = encoded(value)
    if archive_size(files, 'failure') > MAX_FAILURE:
        for row in comparison.get('diagnostics', []):
            if row.get('path') is not None:
                row['originalPathSHA256'] = sha(row['path'].encode())
                row['path'] = None
                row['pathClassification'] = 'TRANSPORT_BOUND_PATH_HASH_ONLY'
        files[name] = encoded(value)
    # Under a pre-existing saturated producer inventory, keep a small explicit
    # unavailability record rather than allowing new detail to erase all first
    # failure evidence. This is a loss of detail, never successful acceptance.
    if archive_size(files, 'failure') > MAX_FAILURE:
        value = {key: value[key] for key in ('schema', 'sourcePath', 'originalReceiptSHA256',
            'firstBrowserAssertion', 'applicationAcceptance', 'rawOutputRetained') if key in value}
        value.update(status='COMPARISON_DETAIL_UNAVAILABLE_TRANSPORT_BOUND',
                     originalProjectionSHA256=sha(files[name]))
        files[name] = encoded(value)
    if archive_size(files, 'failure') > MAX_FAILURE:
        # Even the optional unavailability marker cannot fit. Restore the
        # exact pre-existing payload set; never sacrifice primary evidence.
        files.pop(name)


def failure_projections(root, exporter):
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
                 'runtime-evidence/first-runtime-command-failure.json'):
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
    files.update(native_failure_projections(root, exporter))
    try:
        files.update(comparison_failure_projection(root, exporter))
    except Exception:
        # Auxiliary diagnostics cannot suppress the immutable primary return.
        files['prior-cause-projections/first-comparison-failure.json'] = encoded({
            'schema': 'work8-v107-comparison-failure-projection-v1', 'status': 'UNAVAILABLE_OR_INVALID',
            'applicationAcceptance': False, 'rawOutputRetained': False})
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
                         **failure_projections(root, exporter)}
        fit_comparison_transport(failure_files)
        write_archive(final, failure_files, 'failure', MAX_FAILURE)
        verify_final_directory(final)
        failure = Refusal(parse(raw)['code'])
        failure.export_context = parse(raw)['context']
        failure.failureExportReady = True
        raise failure from None

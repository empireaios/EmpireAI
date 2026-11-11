"""Verify immutable historical evidence without re-running qualification.

These receipts prove their recorded historical scopes only. They grant neither
execution authority nor current-host or A5-08/A5-09 acceptance. The enclosing
current source manifest pins this verifier and every retained evidence byte.
"""
import ast
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import stat
import tarfile
import zipfile

HERE = Path(__file__).resolve().parent
CONTROLLER = Path('v65/foundation/controller/scripts/work8/native-transition')
MAX_BYTES = 524288
V98_COMMIT = 'fbf326f14df64c1cc3717942a490f19af4a87a89'
V98_TREE = 'dfac35790ff7af1ad6dceaa0cdf6ee1a37796aa5'
V98_ZIP = '22e9f1b1bd9ba1de469c4249b9fb933a91872b3530db78293f7648345e044238'
V98_TAR = '3bae78aee46670e2ed5aa1cded6c38e6e4267be8d5d18b04d16a918bee9ef113'
PACKAGES_SHA = 'ec74f2565b34867d6164382a666f429ad998fec2bb57a98e540d19e1b9665fa4'
INPUT_SHA = '39f904154764d2e70413045c7ebefbd4c04f38d0e09360ea19b2834fcc3ef755'
CURRENT_PACKAGES_SHA = 'e45e24497297805ad086dfff2048d9e5dc24b2c8918b55195affad217b773024'
RUNNER_SHA = '69c6e4e95d736bd1ef7706482e39ffa8876444d654f4f3f22ba7da6bff31805e'
EVIDENCE_SHA = {
    'retained-qualification/v94-checkpoint-receipt.json': '4f1e6ca26e600add12b89f4d8d2a246d0cfe946dbd9bb0ea02fd788933f19f62',
    'retained-v94/diagnostic-controls.json': '2aeaecbf74d66b1368a9b55a2e01500dbdc54bd2d8e54bd98b882e95cc8e5dbf',
    'retained-v94/diagnostic-operands.json': '07676aff5206fef606997656428a05c6b8659f98b3aa98886d974f23691c8ed4',
    'retained-v95/actual-runtime-ready.json': 'e7fba331ee2a0e6f61c9063cfb5db59a88e6d055b9e43ab7c296b6fa069dd5a6',
    'retained-v95/artifact-index.json': '187e41e4db84034f246ecee53bc4def939abcc671e0cc661fa2ec47a5d14e17d',
    'retained-v95/live-brain-ready.json': '6a4c8e293064b40a8a6e117acedff75922efff0776365402fc4915f78eec4e28',
    'retained-v95/provider-readback.json': 'd393250b29ed97f5cdc0c8646979dff4a974968495628d435b5f222441aab993',
    'retained-v96/diagnostic-test-summary.json': 'bee14b281c21466172fdd185fc340e3c76641f1c842fe189d4356a3b555c52aa',
    'retained-v96/independent-review.json': 'b8d7db387c3f848ff0302119c8798ad3c775eedcce64f9e4bc92ff8f1c6ff815',
    'retained-v98/independent-review.json': '8395ff5bc36caccfa8b665f1361bc9c7b782a0462b2996dc12a4d7a515cdc511',
    'retained-v98/native-startup.zip': V98_ZIP,
    'retained-v98/package-identities.json': PACKAGES_SHA,
    'retained-v98/provider-readback.json': 'b3a3b362a2530e6bdacdcc840ff94b41a22c3d6dd319a400e2f1352593b8e611',
}
# These new receipts attest only the reviewed diagnostic successor. The V94,
# V96 and V98 evidence and source identities above remain immutable.
# Final receipt pins are installed only after independent local review.
V111_EVIDENCE_SHA = {
    'retained-v111/diagnostic-successor.json': '70e25ead8cc45733fd96397b859432d9b8cb629bd4739182ad11df3d5efc22e5',
    'retained-v111/independent-review.json': '07c4e2f950b9e5f995a91d0744805debeffbeeca1f9473e1b8be087be00031e0',
    'retained-v111/focused-validation.json': '0902d375a16b28da2835087520c9e2c691091a1afca5b894137b5366fd4f804d',
    'retained-v111/source-review.json': 'e7f5ca7cfb8098fdebfaaa57cad63065592b6c8a1f2195ab3ffe6936280a4617',
    'retained-v111/security-review.json': '66bc4bbf25ae9d9fb58933546dda486cb047b16d5601db2425dd6d4b1f9ccc02',
    'retained-v111/v110-focused-validation.json': '3e39a53b0fb9987306e01b1588611bda483a183fa4ae30e7cdcd913ea41350a1',
    'retained-v111/v110-independent-reviews.json': '39222044ee532180f6e254f6bb60625408ca7031b8de0b144fdbe2b6a4d86aef',
}
V111_REPLACEMENTS = frozenset(('native-diagnostic.mjs', 'native_diagnostics.py', 'native-diagnostic-codes.json'))
V111_SOURCE_PATHS = frozenset(str(CONTROLLER / name) for name in (
    'native-diagnostic.mjs', 'native_diagnostics.py', 'native-diagnostic-codes.json', 'assurance-records.mjs', 'whole-app-readback.mjs')) | frozenset((
    'v65/adapter/final_evidence.py', 'v65/tests/test_assurance_records.mjs',
    'v65/tests/test_assurance_diagnostic_return.py'))
V111_CONTROLLER_FILES = frozenset(PurePosixPath(name).name for name in V111_SOURCE_PATHS
                                 if name.startswith(str(CONTROLLER) + '/'))


def require(ok, code):
    if not ok:
        raise ValueError(code)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def regular_bytes(path, maximum=MAX_BYTES):
    path = Path(path)
    info = path.lstat()
    require(stat.S_ISREG(info.st_mode) and info.st_nlink == 1
            and 0 < info.st_size <= maximum and path.resolve() == path.absolute(),
            'RETAINED_REGULAR_BOUNDED_FILE_REQUIRED')
    data = path.read_bytes()
    require(len(data) == info.st_size, 'RETAINED_FILE_CHANGED_DURING_READ')
    return data


def json_bytes(data):
    def unique(pairs):
        out = {}
        for key, value in pairs:
            require(key not in out, 'RETAINED_DUPLICATE_JSON_KEY')
            out[key] = value
        return out
    return json.loads(data, object_pairs_hook=unique)


def safe_name(name):
    path = PurePosixPath(name)
    require(bool(path.parts) and not path.is_absolute() and '..' not in path.parts
            and '\\' not in name and str(path) == name, 'RETAINED_ARCHIVE_PATH')
    return name


def read_native_archive(data):
    """Read the complete safe V98 provider artifact in memory; never extract."""
    require(len(data) == 13818 and digest(data) == V98_ZIP, 'V98_PROVIDER_ZIP_CHANGED')
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        members = archive.infolist()
        require(len(members) == 2 and {x.filename for x in members} ==
                {'export-receipt.json', 'frontend-startup-evidence.tar.gz'}, 'V98_ZIP_MEMBERS')
        require(all(not x.is_dir() and not x.flag_bits & 1 and
                    0 < x.file_size <= MAX_BYTES for x in members), 'V98_ZIP_METADATA')
        receipt = json_bytes(archive.read('export-receipt.json'))
        data = archive.read('frontend-startup-evidence.tar.gz')
    require(len(data) == receipt['bytes'] == 13242 and digest(data) == receipt['sha256'] == V98_TAR,
            'V98_INNER_ARCHIVE_CHANGED')
    require(receipt['files'] == 28 and receipt['privateDataIncluded'] is False
            and receipt['nativeAcceptanceClaimed'] is False, 'V98_EXPORT_SCOPE')
    payloads, total = {}, 0
    with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as archive:
        for member in archive:
            name = safe_name(member.name)
            require(name not in payloads and member.isfile() and not member.mode & 0o6000
                    and 0 < member.size <= MAX_BYTES, 'V98_TAR_MEMBER_REFUSED')
            total += member.size
            require(len(payloads) < 29 and total <= MAX_BYTES, 'V98_TAR_BOUND')
            payloads[name] = archive.extractfile(member).read(member.size + 1)
            require(len(payloads[name]) == member.size, 'V98_TAR_MEMBER_SIZE')
    index = json_bytes(payloads['export-index.json'])
    require(index['applicationAcceptance'] is False
            and index['independentProviderReadbackRequired'] is True, 'V98_INDEX_SCOPE')
    entries = index['files']
    require(len(entries) == len({x['path'] for x in entries}) == 28
            and set(payloads) == {x['path'] for x in entries} | {'export-index.json'},
            'V98_COMPLETE_INDEX_REQUIRED')
    for entry in entries:
        raw = payloads[safe_name(entry['path'])]
        require(len(raw) == entry['bytes'] and digest(raw) == entry['sha256'], 'V98_PAYLOAD_CHANGED')
    return payloads


def validate_native_payloads(payloads, provider, review, packages):
    """Scope and cross-bind independently read provider, native and package data."""
    docs = {name: json_bytes(data) for name, data in payloads.items()}
    run, job, artifact = provider['run'], provider['job'], provider['artifact']
    require((run['id'], job['id'], artifact['id']) ==
            (42539444860, 128910880107, 13640304481), 'V98_PROVIDER_IDS')
    require(run['head_sha'] == job['head_sha'] == artifact['workflow_run']['head_sha'] == V98_COMMIT
            and provider['tree'] == V98_TREE and job['run_id'] == artifact['workflow_run']['id'] == run['id']
            and run['status'] == job['status'] == 'completed'
            and run['conclusion'] == job['conclusion'] == 'success'
            and run['run_attempt'] == job['run_attempt'] == provider['executedJobs'] == provider['artifactCount'] == 1
            and artifact['size_in_bytes'] == 13818 and artifact['digest'] == 'sha256:' + V98_ZIP,
            'V98_PROVIDER_SOURCE_OR_TERMINAL_MISMATCH')
    require(review['provider']['independentProviderReadbackSHA256'] == provider['extractedFromSHA256']
            and review['provider']['runId'] == run['id'] and review['provider']['jobId'] == job['id']
            and review['provider']['sourceCommit'] == V98_COMMIT
            and review['provider']['sourceTree'] == V98_TREE
            and review['artifacts']['zipSHA256'] == V98_ZIP
            and review['artifacts']['allZipAndTarPayloadBytesIndependentlyVerified'] is True
            and not review['openFindings'], 'V98_INDEPENDENT_REVIEW_BINDING')
    for key in ('NORMAL_FRONTEND', 'RECOVERY_FRONTEND', 'NATIVE_SECURITY',
                'FIRST_ERROR_PRESERVATION', 'CLEANUP_AND_INDEPENDENT_READBACK'):
        require(review[key] == 'PASS', 'V98_REVIEW_NOT_PASS')
    admission, result = docs['admission.json'], docs['evidence/runner-result.json']
    require(admission['runId'] == result['runId'] == str(run['id']) and admission['jobId'] == job['id']
            and admission['sourceCommit'] == result['sourceCommit'] == V98_COMMIT
            and admission['sourceTree'] == result['sourceTree'] == V98_TREE
            and admission['packageManifestSHA256'] == PACKAGES_SHA, 'V98_NATIVE_SOURCE_BINDING')
    require(admission['A5AcceptanceAuthorized'] is False and admission['businessLifecycleAuthorized'] is False
            and result['A5_08'] == result['A5_09'] == 'NOT_EXECUTED'
            and all(result[k] is False for k in ('Q01_Q05Repeated', 'applicationAcceptance',
                    'automaticRetry', 'backendApplicationStarted', 'brainInitialized')),
            'V98_SCOPE_INFLATION')
    components = docs['evidence/package-readback.json']['components']
    require(docs['package-download.json']['artifactSHA256'] == INPUT_SHA, 'V98_INPUT_PACKAGE_IDENTITY')
    for role in ('carrier', 'normal', 'recovery'):
        pin = packages['backend'] if role == 'carrier' else packages['frontends'][role]
        actual = components[role]
        require(actual['archiveSHA256'] == pin['sha256'] and actual['source'] == pin['commit']
                and actual['tree'] == pin['tree'] and actual['packageRebuilt'] is False,
                'V98_PACKAGE_BINDING')
        if role == 'carrier':
            require(actual['image'] == pin['image'], 'V98_CARRIER_IDENTITY')
            continue
        require(actual['buildId'] == pin['buildId'] and actual['extracted'] is True, 'V98_PACKAGE_LAYOUT')
        require(result[role] == 'PASS_NATIVE_STARTUP_AND_READINESS', 'V98_ROLE_NOT_PASS')
        for phase in ('created', 'running'):
            state = docs[f'evidence/{role}-{phase}.json']
            require(state['role'] == role and state['status'] == phase
                    and state['running'] is (phase == 'running')
                    and state['image'] == packages['backend']['image']
                    and state['entrypoint'] == ['/frontend/runtime/bin/node']
                    and state['command'] == ['/frontend/app/server.js']
                    and state['uidGid'] == '65534:65534' and state['capDrop'] == ['ALL']
                    and state['readonlyRootfs'] is True and state['noNewPrivileges'] is True
                    and state['privileged'] is False and state['noPublishedPorts'] is True
                    and state['noUnreviewedMounts'] is True and state['rawInspectRetained'] is False,
                    'V98_CONTAINER_SECURITY')
            require(state['mounts'] == [
                {'destination': '/examination', 'readOnly': True, 'sourceRole': 'reviewed-controller'},
                {'destination': '/frontend', 'readOnly': True, 'sourceRole': 'frontend-package'}]
                and state['tmpfs'] == {
                    '/frontend/app/.next/cache': 'rw,noexec,nosuid,nodev,size=64m,mode=0700,uid=65534,gid=65534',
                    '/tmp': 'rw,noexec,nosuid,size=32m'}, 'V98_MOUNT_SECURITY')
            if phase == 'running':
                require(state['appArmorProfile'] == 'docker-default'
                        and state['appArmorRuntimeEnforcementVerified'] is True, 'V98_APPARMOR')
        process = docs[f'evidence/{role}-process.json']
        require(process['uid'] == process['gid'] == 65534
                and process['cache'] == {'gid': 65534, 'uid': 65534, 'mode': '0700', 'writeReadDelete': True}
                and process['readonlyErrors'] == {'controller': 'EROFS', 'frontend': 'EROFS', 'root': 'EROFS'},
                'V98_PROCESS_SECURITY')
        for principal in ('main', 'self'):
            p = process[principal]
            require(p['uids'] == p['gids'] == [65534] * 4
                    and p['noNewPrivileges'] == 1 and p['seccomp'] == 2
                    and all(p[k] == '0000000000000000' for k in ('capAmb', 'capBnd', 'capEff', 'capPrm')),
                    'V98_PRINCIPAL_SECURITY')
        require(all(process['mounts'][p]['readOnly'] is True for p in ('/', '/examination', '/frontend')),
                'V98_READONLY_ENFORCEMENT')
        ready = docs[f'evidence/{role}-readiness.json']
        removed = docs[f'evidence/{role}-removed.json']
        require(ready['role'] == role and ready['status'] == 200 and ready['ready'] is True
                and ready['path'] == '/login' and ready['bodyRetained'] is False, 'V98_READINESS')
        require(removed['independentFreshInventoryEmpty'] is True
                and removed['underlyingCacheEmptyReadonly'] is True
                and removed['postUnmountPackageReadback']['archiveSHA256'] == pin['sha256'], 'V98_ROLE_CLEANUP')
    negative = docs['evidence/negative-control.json']
    require(negative['expectedFailure'] == 'FIXED_MISSING_ENTRYPOINT'
            and negative['firstFailureImmutableAfterCleanup'] is True
            and negative['freshResourceReadbackEmpty'] is True
            and negative['containerNeverStarted'] is True
            and negative['causeOfV95Established'] is False, 'V98_FIRST_FAILURE_IMMUTABILITY')
    for name, expected in negative['diagnosticSHA256'].items():
        d = docs['evidence/negative/' + name]
        require(digest(payloads['evidence/negative/' + name]) == expected
                and d['safeErrorCode'] == 'PROCESS_EXECUTION_FAILED' and d['errno'] == 'ENOENT'
                and d['numericErrno'] == 2 and d['firstFailure'] is True
                and d['rawOutputRetained'] is False and d['argumentsOrEnvironmentRetained'] is False,
                'V98_FIRST_FAILURE_BINDING')
    cleanup = docs['evidence/cleanup-independent-readback.json']
    require(cleanup['status'] == 'PASS_INDEPENDENT_PROCESS_RESOURCE_READBACK'
            and cleanup['containers'] == cleanup['networks'] == 0
            and cleanup['sharedImagesDeleted'] is False and cleanup['sharedDaemonStopped'] is False,
            'V98_INDEPENDENT_CLEANUP')


def verify_v111_diagnostic_successor(repo, controller, historical):
    """Admit one exact reviewed successor, without extending historical proof."""
    require(all(isinstance(value, str) and len(value) == 64 and
                all(c in '0123456789abcdef' for c in value)
                for value in V111_EVIDENCE_SHA.values()), 'V111_DIAGNOSTIC_REVIEW_REQUIRED')
    raw = {name: regular_bytes(repo / 'acceptance' / name) for name in V111_EVIDENCE_SHA}
    require(all(digest(raw[name]) == expected for name, expected in V111_EVIDENCE_SHA.items()),
            'V111_DIAGNOSTIC_RECEIPT_CHANGED')
    docs = {name: json_bytes(data) for name, data in raw.items()}
    successor = docs['retained-v111/diagnostic-successor.json']
    review = docs['retained-v111/independent-review.json']
    validation = docs['retained-v111/focused-validation.json']
    require(successor.get('schema') == 'work8-v111-diagnostic-successor-v1' and
            successor.get('status') == 'LOCAL_DIAGNOSTIC_SUCCESSOR' and
            successor.get('replaces') == sorted(V111_REPLACEMENTS) and
            successor.get('historicalOperandSHA256') == {name: historical['files'][name] for name in sorted(V111_REPLACEMENTS)} and
            successor.get('historicalEvidenceSHA256') == EVIDENCE_SHA and
            successor.get('v110EvidenceSHA256') == {name: V111_EVIDENCE_SHA[name] for name in V111_EVIDENCE_SHA if '/v110-' in name},
            'V111_DIAGNOSTIC_SUCCESSOR_BINDING')
    scope = {'historicalEvidenceChanged': False, 'hostedQualificationRepeated': False,
             'frontendDiagnosticsRepeated': False, 'nativeExecution': False,
             'currentNativeAcceptance': False, 'executionAuthority': False}
    require(successor.get('scope') == scope and review.get('scope') == scope and validation.get('scope') == scope,
            'V111_DIAGNOSTIC_SCOPE_INFLATION')
    sources = successor.get('sourceSHA256', {})
    require(isinstance(sources, dict) and set(sources) == V111_SOURCE_PATHS and
            all(digest(regular_bytes(repo / name)) == expected for name, expected in sources.items()),
            'V111_DIAGNOSTIC_SOURCE_CHANGED')
    require(all(digest(regular_bytes(controller / name)) == sources[str(CONTROLLER / name)]
                for name in V111_CONTROLLER_FILES), 'V111_PREPARED_DIAGNOSTIC_SOURCE_CHANGED')
    require(review.get('schema') == 'work8-v111-independent-diagnostic-review-v1' and
            review.get('status') == 'PASS' and review.get('reviewType') == 'INDEPENDENT_LOCAL_SOURCE_AND_SECURITY' and
            review.get('successorSHA256') == V111_EVIDENCE_SHA['retained-v111/diagnostic-successor.json'] and
            review.get('validationSHA256') == V111_EVIDENCE_SHA['retained-v111/focused-validation.json'] and
            review.get('sourceSHA256') == sources and review.get('openFindings') == [],
            'V111_INDEPENDENT_DIAGNOSTIC_REVIEW_REQUIRED')
    review_evidence = {role: V111_EVIDENCE_SHA['retained-v111/'+role+'-review.json'] for role in ('source', 'security')}
    require(review.get('reviewEvidenceSHA256') == review_evidence and all(
            docs['retained-v111/'+role+'-review.json'].get('status') == 'PASS' and
            docs['retained-v111/'+role+'-review.json'].get('sourceSHA256') == sources and
            docs['retained-v111/'+role+'-review.json'].get('openFindings') == []
            for role in ('source', 'security')), 'V111_REVIEW_EVIDENCE_BINDING')
    require(validation.get('schema') == 'work8-v111-local-diagnostic-validation-v1' and
            validation.get('status') == 'PASS' and validation.get('sourceSHA256') == sources and
            type(validation.get('testsPassed')) is int and validation['testsPassed'] > 0 and
            validation.get('testsFailed') == 0 and type(validation.get('testsFailed')) is int and
            validation.get('actualCheckerThroughArchive') is True and
            validation.get('independentArchiveIntegrity') is True,
            'V111_LOCAL_DIAGNOSTIC_VALIDATION_REQUIRED')
    return {'scope': 'EXACT_LOCAL_DIAGNOSTIC_SUCCESSOR_NOT_NATIVE_ACCEPTANCE',
            'sourceSHA256': sources, 'receiptSHA256': dict(V111_EVIDENCE_SHA),
            'historicalEvidenceChanged': False, 'currentExecutionAuthority': False,
            'currentNativeLifecycleAccepted': False}


def verify_diagnostic_operands(repo, controller, records):
    """Keep V94/V96 immutable; require separate proof for changed diagnostics."""
    if controller.resolve() != (repo / CONTROLLER).resolve():
        require(all(regular_bytes(controller / name) == regular_bytes(repo / CONTROLLER / name)
                    for name in V111_CONTROLLER_FILES), 'V111_PREPARED_DIAGNOSTIC_SOURCE_CHANGED')
    historical = records['retained-v94/diagnostic-operands.json']
    successor = records['retained-v96/diagnostic-test-summary.json']
    review = records['retained-v96/independent-review.json']
    require(successor['status'] == 'PASS_LOCAL_DIAGNOSTIC_ONLY'
            and successor['focusedUnitControls'] == 18 and successor['focusedUnitFailures'] == 0
            and successor['actualDockerExecuted'] is False and successor['actualApplicationStartupProven'] is False
            and review['testSummary'] == successor and not review['unresolvedDiagnosticFindings'],
            'V96_DIAGNOSTIC_SUCCESSOR_SCOPE')
    changed = []
    for name, old_hash in historical['files'].items():
        expected = successor['sourceSHA256'][str(CONTROLLER / name)] if name == 'command_diagnostics.py' else old_hash
        if digest(regular_bytes(controller / name)) != expected:
            require(name in V111_REPLACEMENTS, 'RETAINED_DIAGNOSTIC_OPERAND_CHANGED')
            changed.append(name)
    local_successor = None
    if changed:
        require(set(changed) == V111_REPLACEMENTS, 'V111_MIXED_DIAGNOSTIC_SUCCESSOR')
        local_successor = verify_v111_diagnostic_successor(repo, controller, historical)
    for name in ('docker_diagnostics.py', 'test_docker_diagnostics.py'):
        require(digest(regular_bytes(controller / name)) == successor['sourceSHA256'][str(CONTROLLER / name)],
                'V96_DIAGNOSTIC_OPERAND_CHANGED')
    exporter = 'v65/foundation/runtime/export-evidence.py'
    require(digest(regular_bytes(repo / exporter)) == successor['sourceSHA256'][exporter],
            'V96_DIAGNOSTIC_EXPORTER_CHANGED')
    text = regular_bytes(controller / 'examine-v26.py').decode()
    functions = [n for n in ast.parse(text).body if isinstance(n, ast.FunctionDef) and n.name == 'run']
    require(len(functions) == 1 and digest(ast.get_source_segment(text, functions[0]).encode()) ==
            historical['examineRunASTSHA256'], 'RETAINED_EXAMINER_DIAGNOSTIC_INVOCATION_CHANGED')
    functions = [x for x in regular_bytes(controller / 'coordinator.mjs').decode().splitlines()
                 if x.startswith('function retainFirst(')]
    require(len(functions) == 1 and digest(functions[0].encode()) == historical['coordinatorRetainFirstSHA256'],
            'RETAINED_FIRST_CAUSE_FUNCTION_CHANGED')
    return local_successor


def package_operand_ast(text):
    tree = ast.parse(text)
    package_pins = {}
    body = []
    for node in tree.body:
        if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name) \
                and node.targets[0].id in ('BACKEND', 'FRONTENDS'):
            require(node.targets[0].id not in package_pins, 'DUPLICATE_PACKAGE_OPERAND')
            package_pins[node.targets[0].id] = ast.literal_eval(node.value)
        else:
            body.append(node)
    require(set(package_pins) == {'BACKEND', 'FRONTENDS'}, 'COMPLETE_PACKAGE_OPERANDS_REQUIRED')
    tree.body = body
    return ast.dump(tree, include_attributes=False), package_pins


def verify_retained_evidence(repo=None, controller=None):
    """Return deterministic audit proof; default inputs are the admitted checkout.

    A prepared controller may replace only the two admitted package dictionaries
    with the exact retained manifest pins. No launch, cache, isolation, extractor
    or diagnostic function changes are accepted by that adaptation.
    """
    repo = Path(repo) if repo is not None else HERE.parent
    source_controller = repo / CONTROLLER
    controller = Path(controller) if controller is not None else source_controller
    raw = {}
    for name, expected in EVIDENCE_SHA.items():
        raw[name] = regular_bytes(repo / 'acceptance' / name)
        require(digest(raw[name]) == expected, 'RETAINED_EVIDENCE_DIGEST_MISMATCH')
    records = {n: json_bytes(d) for n, d in raw.items() if n.endswith('.json')}
    local_successor = verify_diagnostic_operands(repo, controller, records)
    require(digest(regular_bytes(source_controller / 'current_packages.py')) == CURRENT_PACKAGES_SHA
            and digest(regular_bytes(repo / 'frontend_startup/runner.py')) == RUNNER_SHA,
            'V98_SHARED_STARTUP_SOURCE_CHANGED')
    packages = records['retained-v98/package-identities.json']
    if controller.resolve() != source_controller.resolve():
        source_ast, _ = package_operand_ast(regular_bytes(source_controller / 'current_packages.py').decode())
        prepared_ast, pins = package_operand_ast(regular_bytes(controller / 'current_packages.py').decode())
        require(source_ast == prepared_ast and pins['BACKEND'] == packages['backend']
                and pins['FRONTENDS'] == packages['frontends'], 'V98_PREPARED_STARTUP_CONTRACT_CHANGED')
    payloads = read_native_archive(raw['retained-v98/native-startup.zip'])
    validate_native_payloads(payloads, records['retained-v98/provider-readback.json'],
                             records['retained-v98/independent-review.json'], packages)
    q = records['retained-qualification/v94-checkpoint-receipt.json']
    h = records['retained-v94/diagnostic-operands.json']['historicalEvidence']
    execution = q['execution']
    require(q['status'] == 'PASS_Q01_Q05_QUALIFICATION_ONLY'
            and all(execution[k] == h[k] for k in ('runId', 'jobId', 'artifactId', 'artifactSHA256'))
            and q['source']['actualCommit'] == h['workflowCommit']
            and set(execution['Q01_Q05']) == {'Q01', 'Q02', 'Q03', 'Q04', 'Q05'}
            and all(x['verdict'] == 'PASS_QUALIFICATION_ONLY' for x in execution['Q01_Q05'].values())
            and execution['independentReadback'] == execution['independentAdjudication'] == 'PASS',
            'V94_QUALIFICATION_SCOPE_OR_BINDING')
    brain = records['retained-v95/live-brain-ready.json']
    runtime = records['retained-v95/actual-runtime-ready.json']
    index = records['retained-v95/artifact-index.json']['files']
    for name in ('live-brain-ready.json', 'actual-runtime-ready.json'):
        matches = [e for e in index if e['path'] == name]
        data = raw['retained-v95/' + name]
        require(len(matches) == 1 and matches[0]['sha256'] == digest(data)
                and matches[0]['bytes'] == len(data), 'V95_BRAIN_PAYLOAD_BINDING')
    require(brain['source'] == runtime['source'] == packages['backend']['commit']
            and brain['generation'] == runtime['generation'] and brain['actualApplicationInitialized'] is True
            and runtime['actualNativeApplication'] is True and runtime['syntheticOwnerOnly'] is True,
            'V95_BRAIN_INITIALIZATION_BINDING')
    return {
        'schema': 'work8-v99-retained-evidence-reuse-v1',
        'status': 'VERIFIED_HISTORICAL_EVIDENCE_ONLY',
        'qualificationRepeated': False, 'frontendDiagnosticRepeated': False,
        'currentNativeLifecycleAccepted': False, 'currentExecutionAuthority': False,
        'historicalQualification': {**h, 'scope': 'HISTORICAL_Q01_Q05_ONLY',
            'currentHostAttested': False, 'checkpointReceiptSHA256': EVIDENCE_SHA['retained-qualification/v94-checkpoint-receipt.json']},
        'historicalBrainInitialization': {
            'runId': 42493645384, 'jobId': 128771126886, 'artifactId': 13622647192,
            'artifactSHA256': records['retained-v95/provider-readback.json']['artifactSHA256'],
            'sourceCommit': '8e06e3a1637519842548d29e03a5cd38bd10f409',
            'liveBrainReadySHA256': EVIDENCE_SHA['retained-v95/live-brain-ready.json'],
            'actualRuntimeReadySHA256': EVIDENCE_SHA['retained-v95/actual-runtime-ready.json'],
            'scope': 'HISTORICAL_INITIALIZATION_ONLY_NOT_CAPTURE',
            'diskPresentAtHistoricalReady': brain['diskPresentAtReady'],
            'currentInstanceReusable': False, 'originalCaptureAccepted': False},
        'diagnosticSuccessor': {
            'scope': 'LOCAL_DIAGNOSTIC_CONTROLS_ONLY', 'focusedControls': 18,
            'actualDockerExecutedInV96': False,
            'reviewSHA256': EVIDENCE_SHA['retained-v96/independent-review.json'],
            'testSummarySHA256': EVIDENCE_SHA['retained-v96/diagnostic-test-summary.json'],
            'originalV94ReceiptChanged': False},
        'currentDiagnosticSuccessor': local_successor,
        'frontendStartup': {
            'runId': 42539444860, 'jobId': 128910880107, 'artifactId': 13640304481,
            'artifactSHA256': V98_ZIP, 'innerArchiveSHA256': V98_TAR, 'indexedPayloadsVerified': 28,
            'sourceCommit': V98_COMMIT, 'sourceTree': V98_TREE,
            'normal': 'PASS_NATIVE_STARTUP_AND_READINESS', 'recovery': 'PASS_NATIVE_STARTUP_AND_READINESS',
            'security': 'PASS', 'firstErrorPreservation': 'PASS', 'cleanupAndIndependentReadback': 'PASS',
            'reviewSHA256': EVIDENCE_SHA['retained-v98/independent-review.json'],
            'providerReadbackSHA256': EVIDENCE_SHA['retained-v98/provider-readback.json'],
            'scope': 'HISTORICAL_FRONTEND_STARTUP_SECURITY_ONLY',
            'originalA5Acceptance': False, 'historicalV95RootCause': 'NOT_PROVEN'},
        'packageIdentities': {'manifestSHA256': PACKAGES_SHA, 'artifactSHA256': INPUT_SHA,
            'artifactId': 13340201255, 'carrier': packages['backend'], **packages['frontends']},
        'compatibleSourceSHA256': {'currentPackages': CURRENT_PACKAGES_SHA, 'diagnosticRunner': RUNNER_SHA,
            'commandDiagnostics': records['retained-v96/diagnostic-test-summary.json']['sourceSHA256'][str(CONTROLLER / 'command_diagnostics.py')],
            'dockerDiagnostics': records['retained-v96/diagnostic-test-summary.json']['sourceSHA256'][str(CONTROLLER / 'docker_diagnostics.py')]},
        'remainingNativeOnly': ['CURRENT_RUNNER_SECURITY', 'SAME_INSTANCE_BRAIN_CAPTURE',
            'THIRTEEN_STORE_CONTINUITY', 'NORMAL_RECOVERY_NORMAL_RETURN',
            'AUTHENTICATED_REPLAY_AND_WRITER_DRAIN', 'INDEPENDENT_FINAL_READBACK_AND_CLEANUP'],
    }

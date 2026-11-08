#!/usr/bin/env python3
"""External, byte-bound readback of one qualification-only run.

Inputs are independently downloaded provider records, terminal log and the exact
artifact ZIP, plus the independently reviewed released checkout. No network,
credentials, native process, host-continuity probe or application is executed.
A synthetic positive fixture tests this parser; it is never runner evidence.
"""
import argparse, ast, datetime, hashlib, io, json, pathlib, re, stat, sys, zipfile
sys.dont_write_bytecode = True
HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent/'v65/adapter'))
import github_contract as guard
import compare_executor_provenance as provenance
import frontend_packages
import original_contract
import package_applicability
import backend_resolution
import qualify_only

class Refusal(ValueError): pass

def need(ok, code):
    if not ok: raise Refusal(code)

def digest(data): return hashlib.sha256(data).hexdigest()
def v_inventory_sha(rows): return package_applicability.inventory_digest(sorted(rows,key=lambda r:r['path']))
def canonical(value): return json.dumps(value, sort_keys=True, separators=(',', ':')).encode()
def unique(pairs):
    result = {}
    for key, value in pairs:
        need(key not in result, 'READBACK_DUPLICATE_JSON_KEY'); result[key] = value
    return result

def decode(data): return json.loads(data, object_pairs_hook=unique)
def read(path, maximum):
    p = pathlib.Path(path); s = p.lstat()
    need(p.is_absolute() and p.resolve() == p and stat.S_ISREG(s.st_mode) and s.st_nlink == 1 and 0 < s.st_size <= maximum, 'READBACK_REGULAR_BOUNDED_INPUT')
    with p.open('rb') as stream:
        raw = stream.read(maximum+1)
    need(len(raw) == s.st_size and len(raw) <= maximum, 'READBACK_INPUT_CHANGED')
    return raw

def epoch(value):
    result = datetime.datetime.fromisoformat(value.replace('Z', '+00:00'))
    need(result.tzinfo is not None, 'READBACK_PROVIDER_TIMEZONE')
    return result.timestamp()

def envelope(archive, artifact):
    raw = read(archive, 16*1024**2)
    need(len(raw) == artifact['size_in_bytes'] and 'sha256:'+digest(raw) == artifact['digest'], 'READBACK_SERVICE_ZIP_DIGEST')
    allowed = set(qualify_only.RECEIPT_NAMES) | {'cleanup.json', 'export-refusal.json', 'export-index.json'}
    allowed.update('prepared/'+n for n in qualify_only.PREPARED_NAMES)
    allowed.update('repeat-prepared/'+n for n in qualify_only.REPEAT_NAMES)
    # Parse the already hashed bytes, never reopen a mutable pathname.
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        names = z.namelist()
        need(0 < len(names) == len(set(names)) <= 128 and set(names) <= allowed, 'READBACK_EXACT_ALLOWLIST')
        need(sum(i.file_size for i in z.infolist()) <= 8*1024**2, 'READBACK_LOGICAL_BOUND')
        for item in z.infolist():
            mode = item.external_attr >> 16
            need(not item.is_dir() and stat.S_IFMT(mode) in (0, stat.S_IFREG) and 0 < item.file_size <= 2*1024**2 and not item.flag_bits & 1, 'READBACK_REGULAR_MEMBER_BOUND')
        need(z.testzip() is None, 'READBACK_ZIP_CRC')
        files = {n:z.read(n) for n in names}
    index = decode(files['export-index.json']); rows = index['files']
    need(index['schema'] == 'work8-v81-sanitized-qualification-export-v1' and len(rows) == len({r['path'] for r in rows}) and {r['path'] for r in rows} == set(files)-{'export-index.json'}, 'READBACK_EXACT_INDEX')
    need(all(index.get(k) is False for k in ('applicationStarted','acceptanceClaimed','privateDataIncluded','packageArchivesIncluded')), 'READBACK_EXPORT_SCOPE')
    for row in rows:
        need(row['bytes'] == len(files[row['path']]) and row['sha256'] == digest(files[row['path']]), 'READBACK_INDEX_DIGEST')
    return files

def provider_contract(provider, config, expected_commit):
    run, jobs, artifacts = provider['run'], provider['jobs'], provider['artifacts']
    need(jobs.get('total_count') == len(jobs.get('jobs', [])) == 1 and artifacts.get('total_count') == len(artifacts.get('artifacts', [])) == 1, 'READBACK_ONE_JOB_ONE_ARTIFACT')
    job, artifact = jobs['jobs'][0], artifacts['artifacts'][0]
    need(type(run['id']) is int and run['id'] > 0 and type(job['id']) is int and job['id'] > 0 and run['head_sha'] == expected_commit and run['run_attempt'] == job['run_attempt'] == 1 and job['head_sha'] == expected_commit and run['status'] == job['status'] == 'completed', 'READBACK_TERMINAL_FIRST_ATTEMPT')
    need(run['repository']['id'] == int(config['repositoryId']) and run['repository']['full_name'] == config['repository'] and run['repository'].get('private') is False, 'READBACK_PUBLIC_REPOSITORY')
    need(run['path'] == config['workflowPath'] and run['event'] == 'create' and run['head_branch'] == config['launchRef'].removeprefix('refs/heads/') and job['name'] == config['jobName'], 'READBACK_EXACT_PROVIDER_ROUTE')
    need(job['run_id'] == run['id'] and job.get('labels') == ['ubuntu-24.04'] and type(job['runner_id']) is int and job['runner_id'] > 0 and job['runner_name'] and job['runner_group_name'] == 'GitHub Actions', 'READBACK_STANDARD_RUNNER')
    need(job['run_url'] == 'https://api.github.com/repos/'+config['repository']+'/actions/runs/'+str(run['id']), 'READBACK_PROVIDER_JOB_ROUTE')
    duration = epoch(job['completed_at'])-epoch(job['started_at'])
    need(0 < duration <= config['limits']['jobTimeoutSeconds'] == 3600, 'READBACK_JOB_DURATION_BOUND')
    need(type(artifact['id']) is int and artifact['id'] > 0 and artifact.get('expired') is False and artifact['workflow_run']['id'] == run['id'] and artifact['workflow_run']['head_sha'] == expected_commit and artifact['name'] == 'v81-qualification-'+str(run['id'])+'-1', 'READBACK_CURRENT_ARTIFACT')
    created, expires = epoch(artifact['created_at']), epoch(artifact['expires_at'])
    need(epoch(job['started_at']) <= created <= epoch(job['completed_at']) and 0 < expires-created <= 25*3600, 'READBACK_ARTIFACT_RETENTION_BOUND')
    return run, job, artifact, duration

def trusted_source(source_root, expected_manifest):
    root = pathlib.Path(source_root).resolve()
    source = qualify_only.validate_source(root)
    need(source['sourceManifestSHA256'] == expected_manifest, 'READBACK_TRUSTED_SOURCE_MANIFEST')
    config = decode(read(root/'qualification/config.json', 32768))
    approval_raw = read(root/'qualification/owner-approval.json', 32768)
    authority = qualify_only.validate_authority(config, decode(approval_raw), expected_manifest)
    return root, source, config, authority, digest(approval_raw)

def source_admission(files, source, config, authority, approval_sha, commit, session):
    value = lambda n: decode(files[n])
    need(value('identity/source-admission.json') == source and value('source-inventory-final.json') == source, 'READBACK_SOURCE_ADMISSION_AND_FINAL_INVENTORY')
    admission = value('identity/authority-admission.json')
    expected = {'schema':'work8-v81-qualification-only-authority-v1','sessionId':session,'workflowCommit':commit,'maximumAttempts':1,'applicationExecutionAuthorized':False,'approvalReceiptSHA256':approval_sha,'sourceManifestSHA256':source['sourceManifestSHA256'],'authority':authority}
    need(admission == expected and files['prepared/qualification-only-authority.json'] == files['identity/authority-admission.json'], 'READBACK_AUTHORITY_ADMISSION_BINDING')

def assembled_manifest(root, packages):
    """Independently derive runner.prepare's exact authorized byte transformation."""
    directory = root/'v65/foundation/controller/scripts/work8/native-transition'
    original = decode((directory/'controller-manifest.json').read_bytes())
    contents = {row['path']:(directory/row['path']).read_bytes() for row in original['files']}
    path = 'current_packages.py'; lines = contents[path].decode().splitlines(keepends=True)
    replacements = {'BACKEND':packages['backend'], 'FRONTENDS':packages['frontends']}
    found = set()
    for node in reversed(ast.parse(contents[path]).body):
        if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name) and node.targets[0].id in replacements:
            key = node.targets[0].id; need(key not in found, 'READBACK_CONTROLLER_ASSIGNMENT_AMBIGUITY'); found.add(key)
            lines[node.lineno-1:node.end_lineno] = [key+' = '+repr(replacements[key])+'\n']
    need(found == set(replacements), 'READBACK_CONTROLLER_ASSIGNMENTS_REQUIRED')
    contents[path] = ''.join(lines).replace('Verify/import the existing V55 distributions. Never build or publish packages.', 'Verify/import independently admitted V65 source-equivalent distributions.').encode()
    path = 'examine-v26.py'; text = contents[path].decode()
    old = "assert underlying_contract==accepted_private_contract['backend'],'ACCEPTED_PRIVATE_BACKEND_CONTRACT_CHANGED'"
    need(text.count(old) == 1 and text.count("'packagesRebuilt':False") == 1, 'READBACK_EXACT_CONTROLLER_REBINDING')
    contents[path] = text.replace(old, "assert underlying_contract=={**accepted_private_contract['backend'],'image':current_packages.BACKEND['image']},'ACCEPTED_PRIVATE_BACKEND_CONTRACT_CHANGED'").encode()
    contents['execution_contract.py'] = (root/'v65/adapter/github_contract.py').read_bytes()
    rows = [{'path':p,'bytes':len(b),'sha256':digest(b)} for p,b in sorted(contents.items())]
    return {'schema':'work8-v65-execution-controller-manifest-v1','historicalControllerManifestSHA256':qualify_only.runner.CONTROLLER_SHA,'files':rows}

def handoff(files, prefix, root, packages, expected_manifest):
    value = lambda n: decode(files[prefix+'/'+n])
    result = value('reuse-evidence/sequential-handoff.json')
    need(result['schema'] == 'work8-v81-sequential-reuse-handoff-v1' and result['status'] == 'PASS_COMPLETE_RETAINED_PACKAGE_TO_CONTROLLER_PREPARATION' and result['uid'] == result['gid'] == 1001 and type(result['orchestratorPID']) is int and result['orchestratorPID'] > 0, 'READBACK_ACTUAL_PREPARATION_PRINCIPAL')
    need(result['sourceInventoryUnchanged'] is True and result['cacheFilesCreated'] == 0 and all(result[k] is False for k in ('actualProviderIdentityClaimed','originalReconstructionMainExecuted','packagesRebuilt','hostedSequenceQualified','nativeSecurityAdmissionGranted','applicationStarted','A5AcceptanceGranted','originalEightGroupsReexamined')) and result['noNewFinancialAuthority'] is True, 'READBACK_PREPARATION_SCOPE_AND_CACHE')
    source_rows = qualify_only.source_inventory(root/'v65')
    need(result['sourceFileSetSHA256'] == digest(canonical(source_rows)) and result['sourceFileCount'] == len(source_rows), 'READBACK_RECONSTRUCTION_SOURCE_INVENTORY')
    sequence = ['verify exact V75 artifact and45 indexed entries','backend reconstruction environment child','backend reconstruction environment grandchild and actual helper imports plus full OCI verification','frontend reconstruction environment child','frontend reconstruction environment grandchild and full package-member verification','actual runner.prepare CLI and exact retained driver import','bundled Node22.23.2 --version','full controller/package/driver manifests and member hashes']
    need(result['actualSequence'] == sequence, 'READBACK_COMPLETE_HANDOFF_SEQUENCE')
    origin = result['origin']
    need(origin['artifactSHA256'] == original_contract.ARTIFACT_SHA256 and origin['packageManifestSHA256'] == original_contract.PACKAGE_MANIFEST_SHA256 and origin['historicalRunId'] == 41860150363 and origin['rebuiltThisExecution'] is False and origin['applicationStarted'] is False, 'READBACK_RETAINED_ORIGIN')
    observed = value('independent-prepared-inventory.json')
    need(observed['schema'] == 'work8-v81-independent-prepared-inventory-v1' and observed['status'] == 'PASS_SECOND_FILESYSTEM_WALK' and observed['applicationStarted'] is False and observed['wholeRowAcceptanceClaimed'] is False and set(observed['observations']) == {'controller','driver'}, 'READBACK_INDEPENDENT_INVENTORIES')
    manifests = {'controller':('controller/scripts/work8/native-transition/controller-manifest.json', canonical(expected_manifest)+b'\n'), 'driver':('native-transition-driver/controller-manifest.json', (root/'v65/foundation/driver/controller-manifest.json').read_bytes())}
    for label,(path,expected_raw) in manifests.items():
        raw = files[prefix+'/'+path]; manifest = decode(raw); row = observed['observations'][label]
        need(raw == expected_raw and row['manifestSHA256'] == digest(raw) and row['inventory'] == sorted(manifest['files'],key=lambda r:r['path']) and row['filesVerified'] == len(manifest['files']) and row['cacheFilesCreated'] == row['symlinksAccepted'] == 0, 'READBACK_SOURCE_DERIVED_PREPARED_INVENTORY')
    controller_sha = digest(manifests['controller'][1])
    need(result['controller']['status'] == 'COMPLETE_CURRENT_PACKAGES_VERIFIED_AWAITING_EXTERNAL_EQUIVALENCE' and result['controller']['controllerManifestSHA256'] == controller_sha and result['controller']['packageManifestSHA256'] == original_contract.PACKAGE_MANIFEST_SHA256, 'READBACK_CONTROLLER_PREPARATION_BINDING')
    pids = {result['orchestratorPID']}
    original_rows = decode((root/'v65/foundation/controller/scripts/work8/native-transition/controller-manifest.json').read_bytes())['files']
    for role in ('backend','frontends'):
        child, grand = value('reuse-evidence/'+role+'-child.json'), value('reuse-evidence/'+role+'-grandchild.json')
        for row, suffix in ((child,'-child'),(grand,'-verification-grandchild')):
            need(row['role'] == role+suffix and row['uid'] == row['gid'] == 1001 and row['environmentBytecodeDisabled'] == '1' and row['interpreterBytecodeDisabled'] is True and row['applicationStarted'] is False and row['actualProviderIdentityClaimed'] is False and type(row['pid']) is int and row['pid'] > 0 and row['pid'] not in pids, 'READBACK_REAL_CHILD_PRINCIPAL_AND_BYTECODE'); pids.add(row['pid'])
        need(child['status'] == 'PASS_ACTUAL_REUSE_CHILD' and grand['status'] == 'PASS_ACTUAL_REUSE_CHILD_VERIFICATION' and child['ppid'] == result['orchestratorPID'] and grand['ppid'] == child['pid'] == child['grandchildPPID'] and grand['pid'] == child['grandchildPID'] and child['childPYTHONDONTWRITEBYTECODE'] == '1' and child['grandchildBytecodeDisabled'] is True, 'READBACK_REAL_DESCENDANT_CHAIN')
        need(isinstance(child['childEnvironmentKeys'], list) and 'PYTHONDONTWRITEBYTECODE' in child['childEnvironmentKeys'] and not any(k.startswith('GITHUB_') or k == 'GH_TOKEN' for k in child['childEnvironmentKeys']), 'READBACK_CHILD_CREDENTIAL_EXCLUSION')
        need(grand['controllerManifestSHA256'] == qualify_only.runner.CONTROLLER_SHA and grand['controllerFiles'] == len(original_rows)+1 and grand['controllerInventoryUnchanged'] is True and grand['cacheFilesCreated'] == 0 and grand['originalReconstructionMainExecuted'] is grand['packagesRebuilt'] is False, 'READBACK_GRANDCHILD_EXACT_CONTROLLER')
        need(set(grand['actualPackageVerification']) == ({'backend'} if role == 'backend' else {'normal','recovery'}), 'READBACK_GRANDCHILD_COMPLETE_PACKAGE_ROLES')
        for name,pin in ({'backend':packages['backend']} if role == 'backend' else packages['frontends']).items():
            operand = grand['actualPackageVerification'][name]
            need(operand['archiveSHA256'] == pin['sha256'] and operand['source'] == pin['commit'] and operand['tree'] == pin['tree'] and operand['packageRebuilt'] is operand['applicationStarted'] is False, 'READBACK_GRANDCHILD_PACKAGE_IDENTITIES')
    return result

def critical_images(value, root):
    script = root/'v65/foundation/controller/scripts/work8/native-transition'
    overlays = decode((script/'startup-overlays.json').read_bytes()); live = decode((script/'live-brain-overlay.json').read_bytes()); stores = decode((script/'store-applicability.json').read_bytes())
    pins = {r['target']:{'sha256':r['originalSha256'],'bytes':r['originalBytes']} for r in overlays['files']}
    pins[live['originalPath']] = {'sha256':live['originalSha256'],'bytes':live['originalBytes']}
    for row in stores['sourceEvidence'].values(): pins[row['imagePath']] = {**pins.get(row['imagePath'],{}),'sha256':row['sha256']}
    pins['/native/runtime-writer-isolation.so'] = {'sha256':guard.NATIVE_ISOLATION_SHA256,'bytes':15472}
    pins['/app/deployment/runtime-membership-controller.cjs'] = {'sha256':overlays['originalMembershipControllerSha256']}
    need(value['status'] == 'PASS_EXACT_CRITICAL_IMAGE_FILES' and value['applicationStarted'] is False and set(value['files']) == set(pins), 'READBACK_COMPLETE_CRITICAL_IMAGE_FILES')
    for path,pin in pins.items():
        row = value['files'][path]
        need(all(row[k] == v for k,v in pin.items()) and row['uid'] == 0 and type(row['mode']) is int and 0 <= row['mode'] <= 0o777 and not row['mode'] & 0o022 and type(row['bytes']) is int and row['bytes'] > 0, 'READBACK_CRITICAL_IMAGE_SECURITY_AND_BYTES')

def native(files, identity, observations, root, packages):
    value = lambda n: decode(files['prepared/'+n])
    q, controls, build = value('native-qualification.json'), value('runtime-evidence/guard-controls.json'), value('runtime-evidence/dumpability-observer-build.json')
    guard.validate_executor_security(q, identity, observations)
    guard.validate_qualification_evidence(q, identity, controls, build, digest((root/'v65/adapter/github_contract.py').read_bytes()))
    bindings = {'runnerIdentitySHA256':'runner-identity.json','runtimeImageProvenanceSHA256':'runtime-image-provenance.json','nativeObservationSHA256':'runtime-evidence/native-capability-observation.json','criticalImageReadbackSHA256':'critical-image-readback.json','diagnosticControlsSHA256':'diagnostic-controls/negative-control-result.json'}
    for key,path in bindings.items(): need(q['evidenceBindings'][key] == digest(files['prepared/'+path]), 'READBACK_NATIVE_OPERAND_HASH')
    for key,path in {'guardControlsSHA256':'runtime-evidence/guard-controls.json','observerBuildSHA256':'runtime-evidence/dumpability-observer-build.json','sqlJsPackagingSmokeSHA256':'sqljs-packaging-smoke.json','criticalImageReadbackSHA256':'critical-image-readback.json','diagnosticControlsSHA256':'diagnostic-controls/negative-control-result.json'}.items(): need(q[key] == digest(files['prepared/'+path]), 'READBACK_NATIVE_NAMED_OPERAND_HASH')
    need(q['nativeObservation'] == value('runtime-evidence/native-capability-observation.json') and q['diagnosticControls'] == value('diagnostic-controls/negative-control-result.json'), 'READBACK_NATIVE_RAW_OPERAND_EQUALITY')
    for path,sha in controls['sourceSHA256'].items():
        need(path in {'adapter/github_contract.py','adapter/collect_runtime_image_provenance.py','adapter/compare_executor_provenance.py','tests/run_guard_controls.py','tests/test_executor_guard.py','tests/test_metadata_guard.py','tests/test_terminal_guard.py'} and sha == digest((root/'v65'/path).read_bytes()), 'READBACK_ALL_GUARD_CONTROL_SOURCE_PINS')
    need(controls['testsRun'] == 140, 'READBACK_COMPLETE_ORIGINAL_GUARD_CONTROLS')
    need(build['runtimeHelperSHA256'] == digest((root/'v65/foundation/runtime/runtime_common.py').read_bytes()), 'READBACK_OBSERVER_RUNTIME_SOURCE')
    need(q['dockerInfo']['NCPU'] >= 4 and q['dockerInfo']['MemTotal'] >= 12*1024**3 and q['hostNodeSHA256'] == frontend_packages.NODE_SHA and q['backendImageSHA256'] == packages['backend']['image'].removeprefix('sha256:'), 'READBACK_ACTUAL_NATIVE_CAPACITY_AND_IMAGE')
    for role,pin in guard.DEPENDENCY_IMAGES.items():
        row = q['dependencyObservations'][role]
        need(row['reference'] == pin and re.fullmatch('sha256:[0-9a-f]{64}', row['imageId']) and any(x.endswith('@'+pin.split('@')[1]) for x in row['repoDigests']) and row['bytes'] > 0, 'READBACK_ACTUAL_DEPENDENCY_IMAGE_LOADING')
    critical_images(value('critical-image-readback.json'), root)
    smoke = value('sqljs-packaging-smoke.json'); policy = decode((root/'v65/foundation/controller/scripts/work8/native-transition/package-exclusions.json').read_bytes())
    need(smoke['schema'] == 'work8-v23-retained-sqljs-smoke-v1' and smoke['status'] == 'PASS' and smoke['nodeVersion'] == 'v22.23.2' and smoke['resolvedRelative'] == policy['defaultEntry'] and smoke['sourcePackageVersion'] == policy['packageVersion'] and all(smoke[k] is True for k in ('exactRetainedFileHashesVerified','removedVariantsAbsent','createInsertSelect','exportReloadReadback')) and smoke['syntheticRowCount'] == 1 and 0 < smoke['exportedBytes'] <= 1024*1024 and guard.digest_string(smoke['exportedSha256']) and all(smoke[k] is False for k in ('databaseBytesRetained','applicationAcceptance','providerAccess')), 'READBACK_ACTUAL_SQLJS_SMOKE')
    diagnostic = q['diagnosticControls']
    diagnostic_runtime(files, root, required=True)
    diagnostic_evidence(files, root, required=True)
    need(diagnostic['schema'] == 'work8-v62-first-error-negative-controls-v1' and diagnostic['node'] == 'v22.23.2' and diagnostic['nativeApplicationStarted'] is diagnostic['containerExecution'] is False and len(diagnostic['tests']) == 7, 'READBACK_ACTUAL_FIRST_ERROR_CONTROLS')
    expected_tests = {'actual-child-protected-entrypoint','timeout-with-valid-child-partial','invalid-utf8-before-valid-child-receipt','unterminated-stdout-separate-stderr-frame','real-spawn-oserror-cleanup-overwrite-refused','secret-suppression-through-coordinator','later-parent-failure-cannot-replace-child'}
    need({r['id'] for r in diagnostic['tests']} == expected_tests and all(r['status'] == 'PASS' for r in diagnostic['tests']), 'READBACK_COMPLETE_DIAGNOSTIC_NEGATIVES')
    derived_manifest = assembled_manifest(root,packages)
    diagnostic_sources = [{'file':r['path'],'bytes':r['bytes'],'sha256':r['sha256']} for r in derived_manifest['files'] if '/' not in r['path']]
    manifest_raw = canonical(derived_manifest)+b'\n'
    diagnostic_sources.append({'file':'controller-manifest.json','bytes':len(manifest_raw),'sha256':digest(manifest_raw)})
    need(diagnostic['source'] == sorted(diagnostic_sources,key=lambda r:r['file']), 'READBACK_DIAGNOSTIC_ACTUAL_CONTROLLER_SOURCE')
    imported = value('backend-image-import.json')
    need(imported['schema'] == 'work8-v81-retained-backend-import-v1' and imported['image'] == packages['backend']['image'] and imported['packageSHA256'] == packages['backend']['sha256'] and imported['rebuilt'] is imported['applicationStarted'] is False and imported['result']['image'] == packages['backend']['image'] and imported['result']['archiveSHA256'] == packages['backend']['sha256'] and imported['result']['loaded'] is True and imported['result']['source'] == packages['backend']['commit'] and imported['result']['tree'] == packages['backend']['tree'] and imported['result']['platform'] == 'linux/amd64' and type(imported['result']['layersVerified']) is int and imported['result']['layersVerified'] > 0 and imported['result']['packageRebuilt'] is imported['result']['applicationStarted'] is False, 'READBACK_ACTUAL_BACKEND_IMPORT')
    return q, build

def frontend_container(row, role, q):
    need(row['image'] == 'sha256:'+q['backendImageSHA256'] and row['user'] == '0:0' and row['entrypoint'] == ['node'] and row['exitCode'] == 0 and row['privileged'] is False and row['readonlyRootfs'] is True and row['networkMode'] == 'none' and row['pidMode'] == row['utsMode'] == row['usernsMode'] == '' and row['ipcMode'] == row['cgroupnsMode'] == 'private' and row['memory'] == 768*1024**2 and row['pidsLimit'] == 64 and any(x.startswith('no-new-privileges') for x in row['securityOpt']) and {x.removeprefix('CAP_') for x in row['capAdd']} == set(guard.CAPABILITIES) and row['capDrop'] == ['ALL'] and row['publishedPorts'] == {} and row['providerCredentialsExcluded'] is True, 'READBACK_FRONTEND_CONTAINER_RESTRICTIONS')
    r = q['executionRoot']; mounts = [('/frontend',r+'/frontend-qualification/'+role,False),('/qualification',r+'/runtime',False),('/frontend-probe.cjs',r+'/frontend-qualification/probe.cjs',False),('/control',r+'/frontend-qualification/'+role+'-control',True)]
    expected = sorted([{'type':'bind','source':s,'destination':d,'rw':w,'propagation':'rprivate'} for d,s,w in mounts],key=lambda m:m['destination'])
    need(sorted(row['mounts'],key=lambda m:m['destination']) == expected, 'READBACK_EXACT_FRONTEND_MOUNTS')

def frontends(files, packages, proof, identity, q, build):
    value = lambda n: decode(files['prepared/'+n])
    front, extraction = value('frontend-qualification.json'), value('frontend-extraction.json')
    need(front['schema'] == 'work8-v84-complete-frontends-qualification-v1' and front['status'] == 'PASS_BOTH_COMPLETE_FRONTENDS_CURRENT_RUNNER' and front['sessionId'] == identity['sessionId'] and front['workflowCommit'] == identity['workflowCommit'] and set(front['roles']) == set(extraction['roles']) == {'normal','recovery'} and front['applicationStarted'] is front['Q05EquivalenceClaimed'] is False and front['wholeRowsAccepted'] == [], 'READBACK_BOTH_COMPLETE_FRONTENDS')
    for key,path in {'nativeQualificationSHA256':'native-qualification.json','runnerIdentitySHA256':'runner-identity.json','runtimeImageProvenanceSHA256':'runtime-image-provenance.json'}.items(): need(front[key] == digest(files['prepared/'+path]), 'READBACK_FRONTEND_NATIVE_IDENTITY_BINDING')
    need(extraction['schema'] == 'work8-v84-complete-frontend-extraction-v1' and extraction['status'] == 'PASS_BOTH_COMPLETE_EXTRACTIONS' and extraction['applicationStarted'] is extraction['packageRebuilt'] is False and extraction['nativeLoading'] == 'NOT_EXECUTED', 'READBACK_COMPLETE_EXTRACTION_SCOPE')
    total = 0
    for role,pin in packages['frontends'].items():
        inventory, loading = value('frontend-'+role+'-inventory.json'), value('frontend-'+role+'-loading.json')
        source_rows = [r['new'] for r in proof['roles'][role]['differences'] if r['new'] is not None]
        expected_files = [] ; directories = {''}
        for row in source_rows:
            need(row['type'] == 'file' and not row['mode'] & 0o6000, 'READBACK_FRONTEND_REGULAR_PROOF_MEMBERS')
            name = frontend_packages.member_name(row['path'])
            expected_files.append({'path':name,'bytes':row['bytes'],'sha256':row['sha256'],'mode':0o555 if row['mode'] & 0o111 else 0o444})
            directories.update('' if p.as_posix() == '.' else p.as_posix() for p in pathlib.PurePosixPath(name).parents)
        need(v_inventory_sha(source_rows) == proof['roles'][role]['candidate']['inventorySHA256'], 'READBACK_PROOF_FULL_INVENTORY_DIGEST')
        expected_files.sort(key=lambda r:r['path']); expected_dirs = [{'path':p,'mode':0o555} for p in sorted(directories)]
        need(inventory['files'] == expected_files and inventory['directories'] == expected_dirs and inventory['fileCount'] == len(expected_files) == pin['members']+1 and inventory['directoryCount'] == len(expected_dirs) and inventory['logicalBytes'] == sum(r['bytes'] for r in expected_files), 'READBACK_COMPLETE_SOURCE_BOUND_FRONTEND_INVENTORY')
        need(inventory['schema'] == 'work8-v84-full-frontend-extracted-inventory-v1' and inventory['status'] == 'PASS_FILESYSTEM_READBACK_ONLY' and inventory['owner'] == {'uid':1001,'gid':1001} and inventory['nativeExecutionClaimed'] is inventory['applicationStarted'] is False and inventory['cacheFilesCreated'] == 0, 'READBACK_FRONTEND_OWNERSHIP_SCOPE')
        role_row, extract = front['roles'][role], extraction['roles'][role]
        extraction_result = extract['extraction']; readback = extract['originalVerifierReadback']
        need(extraction_result['role'] == role and extraction_result['archiveSHA256'] == pin['sha256'] and extraction_result['source'] == pin['commit'] and extraction_result['tree'] == pin['tree'] and extraction_result['membersVerified'] == pin['members'] and extraction_result['packageRebuilt'] is extraction_result['applicationStarted'] is False and extraction_result['extracted'] is True and extraction_result['node'] == '22.23.2' and extraction_result['artifactKind'] == 'standalone-archive' and extraction_result['buildId'] == pin['buildId'] and readback == {'role':role,'archiveSHA256':pin['sha256'],'extractedMembersVerified':pin['members']+1,'applicationStarted':False}, 'READBACK_ACTUAL_COMPLETE_EXTRACTION_AND_RECHECK')
        for row in (inventory, role_row, extract):
            need(row['archiveSHA256'] == pin['sha256'] and row['sourceCommit'] == pin['commit'] and row['sourceTree'] == pin['tree'], 'READBACK_FRONTEND_PACKAGE_SOURCE_ATTRIBUTION')
        inventory_sha = digest(canonical({'files':expected_files,'directories':expected_dirs}))
        need(inventory['inventorySHA256'] == role_row['inventorySHA256'] == extract['inventorySHA256'] == inventory_sha and extract['inventoryReceiptSHA256'] == digest(files['prepared/frontend-'+role+'-inventory.json']) and extract['fileCount'] == inventory['fileCount'] and extract['directoryCount'] == inventory['directoryCount'] and extract['logicalBytes'] == inventory['logicalBytes'] and extract['nodeSHA256'] == frontend_packages.NODE_SHA, 'READBACK_FRONTEND_INVENTORY_AND_EXTRACTION_BINDING')
        need(role_row['status'] == 'PASS_COMPLETE_FRONTEND_EXTRACTION_AND_PROTECTED_LOADING' and role_row['extractedPackageUnchanged'] is True and role_row['dockerEngineId'] == q['dockerEngineId'] and role_row['applicationStarted'] is False, 'READBACK_ACTUAL_FRONTEND_REPEATED_INVENTORY')
        frontend_packages.validate_loading_observation(loading, role, pin, build['binarySHA256'])
        need(all(loading['writer']['namespaces'][k] != q['hostNamespaces'][k] for k in ('pid','mnt','net')), 'READBACK_FRONTEND_NATIVE_NAMESPACE_ISOLATION')
        need(role_row['loadingReceiptSHA256'] == digest(files['prepared/frontend-'+role+'-loading.json']), 'READBACK_FRONTEND_LOADING_BINDING')
        frontend_container(role_row['containerObservation'], role, q)
        private = role_row['privateResponseObservation']
        need(private['uid'] == private['gid'] == 1001 and private['mode'] == 0o600 and private['nlink'] == 1 and 0 < private['bytes'] <= 32768 and guard.digest_string(private['receiptSHA256']) and private['nonceExported'] is False, 'READBACK_PROTECTED_FRONTEND_EXCHANGE')
        total += inventory['logicalBytes']
    capacity = q['storageCapacity']; floor = max(6*1024**3,2*total+(128+1920)*1024**2+2*1024**3)
    need(capacity['measuredFrontendLogicalBytes'] == total and capacity['requiredRemainingBytes'] == floor and capacity['actualFreeBytes'] >= floor and capacity['privateStoreReserveBytes'] == 1024**3, 'READBACK_POST_PULL_NATIVE_STORAGE_CAPACITY')
    for role in ('normal','recovery'):
        storage = extraction['storageBeforeExtraction']
        need(storage['frontendLogicalBytes'] == total and storage['preservedNativeFloorBytes'] == floor and storage['requiredFreeBytes'] == floor+total and storage['freeBytes'] >= floor+total and storage['postPullMeasurementStillRequired'] is True, 'READBACK_EXTRACTION_STORAGE_CAPACITY')

def backend_alias(files, root, proof, q, identity):
    value = lambda name: decode(files['prepared/'+name])
    spec_raw = read(root/'qualification/backend-alias-probe-spec.json',32768)
    spec = decode(spec_raw); spec_sha = digest(spec_raw)
    need(proof['requiredNativeProbeSpec'] == {'path':'backend-alias-probe-spec.json','sha256':spec_sha} and spec_sha == backend_resolution.SPEC_SHA256, 'READBACK_REVIEWED_BACKEND_PROBE_SPEC')
    row, observation = value('backend-resolution.json'), value('backend-resolution-observation.json')
    need(row['schema'] == 'work8-v84-backend-alias-qualification-v1' and row['status'] == 'PASS_PROTECTED_BACKEND_ALIAS_RESOLUTION' and row['metadataOnly'] is True and row['probeSpecSHA256'] == row['specSHA256'] == spec_sha and row['archiveSHA256'] == row['candidateArchiveSHA256'] == spec['candidateArchiveSHA256'] == proof['roles']['backend']['candidate']['sha256'] and row['candidateImage'] == spec['candidateImage'] == 'sha256:'+q['backendImageSHA256'] and row['sourceCommit'] == spec['sourceCommit'] and row['sourceTree'] == spec['sourceTree'] and row['sessionId'] == identity['sessionId'] and row['workflowCommit'] == identity['workflowCommit'] and row['dockerEngineId'] == q['dockerEngineId'] and row['applicationImported'] is row['applicationStarted'] is False and row['wholeRowsAccepted'] == [], 'READBACK_BACKEND_ALIAS_SCOPE_AND_ATTRIBUTION')
    for key,path in {'observationSHA256':'backend-resolution-observation.json','nativeQualificationSHA256':'native-qualification.json','runnerIdentitySHA256':'runner-identity.json','runtimeImageProvenanceSHA256':'runtime-image-provenance.json'}.items():
        need(row[key] == digest(files['prepared/'+path]), 'READBACK_BACKEND_ALIAS_NATIVE_OPERAND_HASH')
    observer = value('runtime-evidence/dumpability-observer-build.json')['binarySHA256']
    backend_resolution.validate_observation(observation,spec,observer,q['hostNamespaces'])
    container = row['containerObservation']
    need(container['image'] == spec['candidateImage'] and container['user'] == '0:0' and container['entrypoint'] == ['node'] and container['exitCode'] == 0 and container['privileged'] is False and container['readonlyRootfs'] is True and container['networkMode'] == 'none' and container['pidMode'] == container['utsMode'] == container['usernsMode'] == '' and container['ipcMode'] == container['cgroupnsMode'] == 'private' and container['memory'] == 256*1024**2 and container['pidsLimit'] == 32 and any(x.startswith('no-new-privileges') for x in container['securityOpt']) and {x.removeprefix('CAP_') for x in container['capAdd']} == set(guard.CAPABILITIES) and container['capDrop'] == ['ALL'] and container['publishedPorts'] == {} and container['providerCredentialsExcluded'] is True, 'READBACK_BACKEND_ALIAS_CONTAINER_RESTRICTIONS')
    mounts = container['mounts']; specs = [m for m in mounts if m['destination'] == '/backend-alias-spec.json']
    need(len(specs) == 1, 'READBACK_BACKEND_SPEC_MOUNT')
    source_spec = pathlib.PurePosixPath(specs[0]['source'])
    need(source_spec.is_absolute() and source_spec.as_posix() == specs[0]['source'] and '..' not in source_spec.parts and str(source_spec).endswith('/qualification/backend-alias-probe-spec.json'), 'READBACK_BACKEND_SOURCE_SPEC_MOUNT')
    remote = q['executionRoot']; expected = [('/qualification',remote+'/runtime',False),('/backend-alias-probe.cjs',remote+'/backend-resolution-private/probe.cjs',False),('/backend-alias-spec.json',str(source_spec),False),('/control',remote+'/backend-resolution-private/control',True)]
    expected = sorted([{'type':'bind','source':s,'destination':d,'rw':w,'propagation':'rprivate'} for d,s,w in expected],key=lambda m:m['destination'])
    need(sorted(mounts,key=lambda m:m['destination']) == expected, 'READBACK_BACKEND_EXACT_MOUNTS')
    private = row['privateResponseObservation']
    need(private['uid'] == private['gid'] == 1001 and private['mode'] == 0o600 and private['nlink'] == 1 and 0 < private['bytes'] <= 16384 and guard.digest_string(private['sha256']) and private['nonceExported'] is False, 'READBACK_BACKEND_PROTECTED_PRIVATE_EXCHANGE')
    cleanup = value('backend-resolution-cleanup.json')
    need(cleanup['schema'] == 'work8-v84-backend-alias-cleanup-v1' and cleanup['status'] == 'PASS' and cleanup['errors'] == [] and cleanup['primaryFailurePreserved'] is cleanup['applicationStarted'] is False, 'READBACK_BACKEND_ALIAS_CLEANUP')
    need(value('package-applicability-static.json')['requiredNativeChecks'] == ['PROTECTED_BACKEND_ALIAS_RESOLUTION'], 'READBACK_BACKEND_REQUIRED_NATIVE_GATE')

def diagnostic_runtime(files, root, required=False, expected_principal=(1001,1001)):
    """Join the materialized controller to exact source/package bytes.

    The real hosted verifier always uses UID/GID1001. A local read-only witness
    may supply its measured principal without claiming hosted qualification.
    """
    name = 'prepared/diagnostic-runtime.json'
    if name not in files:
        need(not required, 'READBACK_DIAGNOSTIC_RUNTIME_REQUIRED')
        return {'status':'NOT_EXECUTED'}
    root = pathlib.Path(root).resolve(); row = decode(files[name])
    need(set(row) == {'schema','status','membership','runtimeFiles','verificationBoundary','applicationStarted','hostedPrincipalClaimed','packageManifestSHA256','backendArchiveSHA256','backendImage'}, 'READBACK_DIAGNOSTIC_RUNTIME_FIELDS')
    need(row['schema'] == 'work8-v87-diagnostic-runtime-materialization-v1' and row['status'] == 'PASS_EXACT_CONTROLLER_AND_COMPLETE_RUNTIME_COPY' and row['verificationBoundary'] == 'COMPLETE_FRESH_RUNTIME_COPY_BEFORE_DIAGNOSTIC_EXECUTION' and row['applicationStarted'] is row['hostedPrincipalClaimed'] is False, 'READBACK_DIAGNOSTIC_RUNTIME_SCOPE')
    package_raw = files['prepared/v65-packages.json']; packages = decode(package_raw)
    need(digest(package_raw) == row['packageManifestSHA256'] == original_contract.PACKAGE_MANIFEST_SHA256 and row['backendArchiveSHA256'] == packages['backend']['sha256'] and row['backendImage'] == packages['backend']['image'], 'READBACK_DIAGNOSTIC_RUNTIME_PACKAGE_BINDING')
    uid,gid = expected_principal
    need(type(uid) is type(gid) is int and uid >= 0 and gid >= 0, 'READBACK_DIAGNOSTIC_EXPECTED_PRINCIPAL')
    runtime = root/'v65/foundation/runtime'; expected=[]
    for path in sorted(runtime.iterdir(),key=lambda p:p.name):
        need(not path.is_symlink() and path.is_file() and stat.S_ISREG(path.lstat().st_mode) and path.stat().st_nlink == 1, 'READBACK_DIAGNOSTIC_SOURCE_RUNTIME_REGULAR')
        raw = path.read_bytes()
        expected.append({'path':path.name,'bytes':len(raw),'sha256':digest(raw),'uid':uid,'gid':gid,'mode':stat.S_IMODE(path.stat().st_mode),'nlink':1})
    need(row['runtimeFiles'] == expected, 'READBACK_DIAGNOSTIC_COMPLETE_RUNTIME_COPY')
    operand = next(item for item in expected if item['path'] == 'runtime-membership-controller.cjs')
    need(operand['bytes'] == 20923 and operand['sha256'] == '59e7ea679ad41cd8663d80c1e98364242fcec00c98744e77f682814a8d124f1b' and operand['mode'] == 0o644, 'READBACK_DIAGNOSTIC_EXACT_CONTROLLER_OPERAND')
    manifest_raw = (root/'v65/foundation/controller/scripts/work8/native-transition/startup-overlays.json').read_bytes()
    pin = decode(manifest_raw)['originalMembershipControllerSha256']
    need(row['membership'] == {'source':operand,'prepared':operand,'fixturePinSHA256':pin,'fixtureManifestSHA256':digest(manifest_raw)} and pin == operand['sha256'], 'READBACK_DIAGNOSTIC_FIXTURE_CONTROLLER_JOIN')
    return {'status':'PASS_EXACT_SOURCE_AND_PACKAGE_BOUND_RUNTIME','filesVerified':len(expected),'membershipSHA256':pin,'uid':uid,'gid':gid,'hostedPrincipalClaimed':False}

def diagnostic_evidence(files, root, required=False):
    """Independently join every sanitized control receipt, also on failed runs.

    Exported raw stderr, arbitrary exception text, unknown case paths and
    first-error replacements are never accepted as diagnostic evidence.
    """
    root = pathlib.Path(root).resolve()
    prefix = 'prepared/diagnostic-controls/'
    summary_name = prefix+'negative-control-result.json'
    ids = {'actual-child-protected-entrypoint','timeout-with-valid-child-partial',
           'invalid-utf8-before-valid-child-receipt','unterminated-stdout-separate-stderr-frame',
           'real-spawn-oserror-cleanup-overwrite-refused','secret-suppression-through-coordinator',
           'later-parent-failure-cannot-replace-child'}
    present = {name for name in files if name.startswith(prefix)}
    if summary_name not in files:
        need(not required and not present, 'READBACK_DIAGNOSTIC_SUMMARY_REQUIRED')
        return {'status':'NOT_EXECUTED','casesVerified':0}
    diagnostic = decode(files[summary_name])
    need(set(diagnostic) == {'schema','status','testsRun','testsPassed','testsFailed','node','actualCoordinatorFunctionSource','actualControllerInvocation','nativeApplicationStarted','containerExecution','uploadAndIndependentReadback','tests','caseEvidenceSchema','firstFailedControl','source'}, 'READBACK_DIAGNOSTIC_SUMMARY_FIELDS')
    need(diagnostic['schema'] == 'work8-v62-first-error-negative-controls-v1' and diagnostic['caseEvidenceSchema'] == 'work8-v87-diagnostic-control-case-v1', 'READBACK_DIAGNOSTIC_EVIDENCE_SCHEMA')
    need(diagnostic['node'] == 'v22.23.2' and diagnostic['nativeApplicationStarted'] is diagnostic['containerExecution'] is False, 'READBACK_DIAGNOSTIC_EXECUTION_SCOPE')
    tests = diagnostic['tests']
    need(isinstance(tests,list) and 0 < len(tests) == diagnostic['testsRun'] <= 7 and len({r['id'] for r in tests}) == len(tests) and {r['id'] for r in tests} <= ids, 'READBACK_DIAGNOSTIC_EXACT_CONTROL_SET')
    need([r['sequence'] for r in tests] == list(range(1,len(tests)+1)) and all(set(r) == {'id','status','sequence','files','cleanup'} and r['status'] in ('PASS','FAIL') for r in tests), 'READBACK_DIAGNOSTIC_CONTROL_ORDER')
    passed = sum(row['status'] == 'PASS' for row in tests)
    need(diagnostic['testsPassed'] == passed and diagnostic['testsFailed'] == len(tests)-passed and diagnostic['status'] == ('PASS' if passed == len(tests) == 7 else 'FAIL'), 'READBACK_DIAGNOSTIC_EXACT_RESULT_COUNTS')
    controller = root/'v65/foundation/controller/scripts/work8/native-transition'
    source = controller/'test_command_diagnostics.py'
    source_sha = digest(source.read_bytes()); source_lines = len(source.read_text().splitlines())
    native_diagnostics = qualify_only.runner.load_module('v87_independent_safe_diagnostic', controller/'native_diagnostics.py')
    expected = {summary_name}
    expected_assertions = {name:'ENOENT' for name in ids}
    expected_assertions.update({'actual-child-protected-entrypoint':'OPERATOR_PATH_NOT_PROTECTED','secret-suppression-through-coordinator':'UNCLASSIFIED_NATIVE_STARTUP_ERROR','real-spawn-oserror-cleanup-overwrite-refused':'UNKNOWN'})
    for row in tests:
        name = prefix+'cases/'+row['id']+'.json'; expected.add(name)
        need(name in files and len(row['files']) == 1, 'READBACK_DIAGNOSTIC_CASE_REQUIRED')
        descriptor = row['files'][0]
        need(descriptor == {'path':'cases/'+row['id']+'.json','bytes':len(files[name]),'sha256':digest(files[name])}, 'READBACK_DIAGNOSTIC_CASE_BYTE_JOIN')
        cleanup = row['cleanup']
        need(set(cleanup) == {'status','privateTemporaryDirectoryRemoved','caseSHA256BeforeCleanup','caseSHA256AfterCleanup'}, 'READBACK_DIAGNOSTIC_CLEANUP_FIELDS')
        need(cleanup['status'] in ('PASS','FAIL','NOT_CREATED') and type(cleanup['privateTemporaryDirectoryRemoved']) is bool, 'READBACK_DIAGNOSTIC_CLEANUP_RESULT')
        if cleanup['status'] == 'PASS':
            need(cleanup['privateTemporaryDirectoryRemoved'] is True and cleanup['caseSHA256BeforeCleanup'] == cleanup['caseSHA256AfterCleanup'] == descriptor['sha256'], 'READBACK_DIAGNOSTIC_CUSTODY_SURVIVES_CLEANUP')
        else:
            need(row['status'] == 'FAIL', 'READBACK_DIAGNOSTIC_FAILED_CLEANUP_NOT_PASS')
            if cleanup['status'] == 'NOT_CREATED':
                need(cleanup['privateTemporaryDirectoryRemoved'] is True and cleanup['caseSHA256BeforeCleanup'] is cleanup['caseSHA256AfterCleanup'] is None, 'READBACK_DIAGNOSTIC_SETUP_FAILURE_SCOPE')
        case = decode(files[name])
        need(set(case) == {'schema','id','sequence','firstError','firstErrorSHA256','controlSourceSHA256','capturedBeforeTeardown','rawOutputRetained','applicationStarted'}, 'READBACK_DIAGNOSTIC_CASE_FIELDS')
        need(case['schema'] == 'work8-v87-diagnostic-control-case-v1' and case['id'] == row['id'] and case['sequence'] == row['sequence'] and case['controlSourceSHA256'] == source_sha and case['capturedBeforeTeardown'] is True and case['rawOutputRetained'] is case['applicationStarted'] is False, 'READBACK_DIAGNOSTIC_CASE_SOURCE_CUSTODY')
        first = case['firstError']
        if first is None:
            need(row['status'] == 'FAIL' and case['firstErrorSHA256'] is None, 'READBACK_DIAGNOSTIC_FIRST_ERROR_REQUIRED')
        else:
            need(isinstance(first,dict) and native_diagnostics.sanitize(first) == first and case['firstErrorSHA256'] == digest(canonical(first)+b'\n'), 'READBACK_DIAGNOSTIC_SANITIZED_FIRST_ERROR')
            if row['status'] == 'PASS':
                need(first['assertion'] == expected_assertions[row['id']], 'READBACK_DIAGNOSTIC_EXPECTED_FIRST_ASSERTION')
                need(first['operation'] == ('EXECUTE_REVIEWED_COMMAND' if row['id'] == 'real-spawn-oserror-cleanup-overwrite-refused' else 'OBSERVE_ORIGINAL_CHILD_FAILURE'), 'READBACK_DIAGNOSTIC_EXPECTED_OPERATION')
                need(first['errno'] == (None if row['id'] in ('actual-child-protected-entrypoint','secret-suppression-through-coordinator') else 'ENOENT'), 'READBACK_DIAGNOSTIC_EXPECTED_ERRNO')
            need(first['rawErrorOrRecordsRetained'] is False, 'READBACK_DIAGNOSTIC_RAW_OUTPUT_REFUSED')
    failure_pointer = diagnostic['firstFailedControl']
    if passed != len(tests):
        name = prefix+'first-failed-control.json'; expected.add(name)
        need(name in files and failure_pointer == {'path':'first-failed-control.json','bytes':len(files[name]),'sha256':digest(files[name])}, 'READBACK_DIAGNOSTIC_FIRST_FAILED_CONTROL_JOIN')
        failed = decode(files[name]); first_row = next(row for row in tests if row['status'] == 'FAIL')
        need(set(failed) == {'schema','id','sequence','caseReceipt','controlFailure','capturedBeforeTeardown','applicationStarted'}, 'READBACK_DIAGNOSTIC_FAILED_CONTROL_FIELDS')
        need(failed['schema'] == 'work8-v87-first-failed-diagnostic-control-v1' and failed['id'] == first_row['id'] and failed['sequence'] == first_row['sequence'] and failed['caseReceipt'] == first_row['files'][0] and type(failed['capturedBeforeTeardown']) is bool and (failed['capturedBeforeTeardown'] is True or first_row['cleanup']['status'] == 'FAIL') and failed['applicationStarted'] is False, 'READBACK_DIAGNOSTIC_FIRST_FAILURE_ORDER')
        failure = failed['controlFailure']
        need(set(failure) == {'exceptionClass','operation','errno','sourceFrames','rawErrorRetained'} and failure['exceptionClass'] in ('AssertionError','OSError','ValueError','RuntimeError','KeyError','TypeError','OTHER') and failure['operation'] == 'ASSERT_DIAGNOSTIC_CONTROL' and (failure['errno'] is None or failure['errno'] in native_diagnostics.ERRNOS) and failure['rawErrorRetained'] is False, 'READBACK_DIAGNOSTIC_FAILURE_SANITIZED')
        frames = failure['sourceFrames']
        need(isinstance(frames,list) and 1 <= len(frames) <= 8 and all(isinstance(frame,str) and re.fullmatch(r'test_command_diagnostics\.py:[1-9][0-9]{0,5}:0',frame) and int(frame.split(':')[1]) <= source_lines for frame in frames), 'READBACK_DIAGNOSTIC_FAILURE_SOURCE_FRAME_BOUND')
    else:
        need(failure_pointer is None, 'READBACK_DIAGNOSTIC_UNEXPECTED_FAILED_CONTROL')
    need(present == expected, 'READBACK_DIAGNOSTIC_NO_MISSING_OR_EXTRA_CASES')
    if required:
        need(diagnostic['status'] == 'PASS' and passed == 7 and {row['id'] for row in tests} == ids, 'READBACK_DIAGNOSTIC_ALL_SEVEN_REQUIRED')
    return {'status':diagnostic['status'],'casesVerified':len(tests),'testsPassed':passed,'testsFailed':len(tests)-passed,'firstFailedControl':None if failure_pointer is None else first_row['id'],'beforeTeardownCustodyVerified':True}

def cleanup_positive(files):
    value = lambda n: decode(files[n])
    cleanup = value('cleanup.json')
    need(cleanup['schema'] == 'work8-v81-qualification-cleanup-v1' and cleanup['status'] == 'PASS' and cleanup['errors'] == [] and cleanup['firstCausalFailurePreserved'] is False and cleanup['firstFailureBeforeCleanupSHA256'] is cleanup['firstFailureAtCleanupSHA256'] is None and cleanup['admissionFailureOnly'] is False and cleanup['nativeCleanupAttempted'] is True and cleanup['remainingScopedContainers'] == cleanup['remainingScopedNetworks'] == [] and cleanup['frontendScopeRemoved'] is cleanup['privateExchangeRemoved'] is cleanup['backendResolutionScopeRemoved'] is True and cleanup['applicationStarted'] is False, 'READBACK_COMPLETE_ZERO_RESOURCE_CLEANUP')
    for name in ('prepared/frontend-normal-cleanup.json','prepared/frontend-recovery-cleanup.json','prepared/runtime-evidence/qualification-cleanup.json'):
        row = value(name); need(row['status'] == 'PASS' and row['errors'] == [] and row['primaryFailurePreserved'] is False and row['applicationStarted'] is False, 'READBACK_ROLE_CLEANUP')
    scope = value('prepared/frontend-scope-cleanup.json'); runner = value('prepared/runtime-evidence/receipt-cleanup.json')
    need(scope['status'] == 'PASS_SCOPED_EXTRACTIONS_REMOVED' and scope['remainingFrontendScope'] is scope['applicationStarted'] is False and runner['status'] == 'PASS_SCOPED_CLEANUP' and runner['privateTemporaryDataRemoved'] is True and runner['sharedDockerDaemonStopped'] is runner['applicationAcceptance'] is False, 'READBACK_PRIVATE_SCOPE_REMOVAL')
    need(all(re.fullmatch('[a-f0-9]{12,64}', item) for field in ('containersRemoved','networksRemoved') for item in runner[field]), 'READBACK_SCOPED_RESOURCE_IDS')

def verify(archive, provider, log_bytes, expected_commit, expected_source_manifest, source_root=None):
    need(re.fullmatch('[a-f0-9]{40}', expected_commit or '') and guard.digest_string(expected_source_manifest), 'READBACK_EXPECTED_SOURCE_REQUIRED')
    root, source, config, authority, approval_sha = trusted_source(source_root or HERE.parent, expected_source_manifest)
    run, job, artifact, duration = provider_contract(provider, config, expected_commit)
    files = envelope(archive, artifact); value = lambda n: decode(files[n])
    diagnostic_runtime_custody = diagnostic_runtime(files, root)
    diagnostic_custody = diagnostic_evidence(files, root)
    common = {'runId':run['id'],'jobId':job['id'],'workflowCommit':expected_commit,'artifactId':artifact['id'],'artifactSHA256':artifact['digest'].removeprefix('sha256:'),'filesVerified':len(files),'jobDurationSeconds':duration,'sourceManifestSHA256':expected_source_manifest,'applicationAcceptance':False,'A5':'PENDING','A5-08':'NOT_EXECUTED','A5-09':'NOT_EXECUTED','actualProviderChargeUSD':None,'financialAuthority':authority,'fullA5AuthorityGranted':False}
    if 'first-failure.json' in files:
        failure = value('first-failure.json')
        need(failure['schema'] == 'work8-v81-qualification-first-failure-v1' and failure['stage'] in qualify_only.STAGES and re.fullmatch('[A-Z0-9_]{1,100}', failure.get('code','')) and failure['rawOutputRetained'] is failure['applicationStarted'] is failure['applicationExecutionAuthorized'] is False, 'READBACK_SANITIZED_FIRST_FAILURE')
        need(set(failure) <= {'schema','stage','code','errno','rawOutputRetained','applicationStarted','applicationExecutionAuthorized','firstObservedChildCause','interruptionCauseKnown'}, 'READBACK_FAILURE_FIELDS_SANITIZED')
        child = failure.get('firstObservedChildCause')
        if 'interruptionCauseKnown' in failure:
            need(type(failure['interruptionCauseKnown']) is bool and failure['interruptionCauseKnown'] == (child is not None), 'READBACK_INTERRUPTION_CAUSE_STATE')
        if child is not None:
            need(set(child) == {'code','sourceReceipt','sourceReceiptSHA256'} and child['code'] == failure['code'] and child['sourceReceipt'] in files and child['sourceReceiptSHA256'] == digest(files[child['sourceReceipt']]) and qualify_only.child_cause(value(child['sourceReceipt'])) == failure['code'], 'READBACK_FIRST_CHILD_CAUSE_CUSTODY')
        cleanup = value('cleanup.json')
        first_sha = digest(files['first-failure.json'])
        need(cleanup.get('firstFailureBeforeCleanupSHA256') in (None,first_sha) and cleanup.get('firstFailureAtCleanupSHA256') in (None,first_sha), 'READBACK_FIRST_CAUSE_CLEANUP_DIGEST')
        if cleanup.get('firstCausalFailurePreserved') is True:
            need(cleanup.get('firstFailureAtCleanupSHA256') == first_sha, 'READBACK_FIRST_CAUSE_PRESERVATION_DIGEST')
        need(cleanup.get('firstCausalFailurePreserved') is True or failure['stage'] in {'export','artifact-check'}, 'READBACK_FAILURE_CUSTODY')
        prior = value('qualification-result.json') if 'qualification-result.json' in files else None
        if prior is not None:
            need(prior.get('applicationStarted') is prior.get('applicationExecutionAuthorized') is False and prior.get('wholeRowsAccepted') == [] and prior.get('A5') == 'PENDING' and prior.get('A5-08') == prior.get('A5-09') == 'NOT_EXECUTED', 'READBACK_PARTIAL_RESULT_SCOPE')
        # Incomplete operands remain unavailable; a failed attempt never inherits
        # a technical PASS merely because service attribution and ZIP are valid.
        return {'schema':'work8-v84-outside-qualification-readback-v1','status':'FAIL_HOSTED_QUALIFICATION','firstCausalFailure':failure,'cleanup':cleanup,'cleanupResult':cleanup.get('status','INCOMPLETE'),'qualificationStageEvidence':'RETAINED_NOT_INDEPENDENTLY_ADJUDICATED' if prior is not None else 'NOT_EXECUTED_OR_INCOMPLETE','nativeQualification':'OBSERVATION_RETAINED_NOT_ADJUDICATED' if 'prepared/native-qualification.json' in files else 'NOT_EXECUTED_OR_INCOMPLETE','completeSequentialHandoff':'OBSERVATION_RETAINED_NOT_ADJUDICATED' if 'prepared/reuse-evidence/sequential-handoff.json' in files else 'NOT_EXECUTED_OR_INCOMPLETE','Q01_Q05':'INCOMPLETE_OVERALL_QUALIFICATION_FAILED','diagnosticEvidence':diagnostic_custody,'diagnosticRuntime':diagnostic_runtime_custody,**common}
    need(not any('first-runtime-' in n or 'first-reuse-' in n or n == 'export-refusal.json' for n in files), 'READBACK_NO_HIDDEN_CAUSAL_FAILURE')
    need(run['conclusion'] == job['conclusion'] == 'success', 'READBACK_SUCCESSFUL_TERMINAL_RESULT')
    identity, observations = value('identity/runner-identity.json'), value('identity/runtime-image-provenance.json')
    terminal = provenance.compare(log_bytes, identity, observations, provider, run_id=run['id'], job_id=job['id'], source_sha=expected_commit, workflow_path=config['workflowPath'])
    need(identity['hostUid'] == identity['hostGid'] == 1001 and identity['jobKey'] == 'qualification' and identity['jobStartedAtEpoch'] == epoch(job['started_at']) and identity['timeoutSeconds'] == 3600 and identity['expiresAtEpoch'] == identity['jobStartedAtEpoch']+3600 and identity['applicationStarted'] is False, 'READBACK_ACTUAL_HOST_PRINCIPAL_AND_DEADLINE')
    need(observations['runtimeIdentityReceipt']['bytes'] == len(files['identity/runner-identity.json']) and files['prepared/runner-identity.json'] == files['identity/runner-identity.json'] and files['prepared/runtime-image-provenance.json'] == files['identity/runtime-image-provenance.json'] and observations['runtimeIdentityReceipt']['sha256'] == digest(files['identity/runner-identity.json']), 'READBACK_IDENTITY_HANDOFF_BYTES')
    source_admission(files, source, config, authority, approval_sha, expected_commit, identity['sessionId'])
    final = value('qualification-result.json')
    need(final['schema'] == 'work8-v84-hosted-qualification-only-result-v1' and final['status'] == 'COMPLETE_PACKAGE_HANDOFF_AND_NATIVE_CAPABILITY_OBSERVED_INDEPENDENT_REVIEW_REQUIRED' and final['workflowCommit'] == expected_commit and final['sourceManifestSHA256'] == expected_source_manifest and final['sessionId'] == identity['sessionId'], 'READBACK_COMPLETE_POSITIVE_SEQUENCE')
    need(final['applicationStarted'] is final['applicationExecutionAuthorized'] is False and final['wholeRowsAccepted'] == [], 'READBACK_SCOPE')
    expected_scope = {'A5':'PENDING','A5-08':'NOT_EXECUTED','A5-09':'NOT_EXECUTED','packagesRebuilt':False,'packagesReuploaded':False,'currentRunnerOnly':True,'futureRunnerRequalificationRequired':True,'Q01':'SOURCE_RECONSTRUCTION_ATTRIBUTION_REUSED','Q02':'CURRENT_LOCK_AND_PINNED_BUILD_INPUT_BYTES_VERIFIED','Q03':'ACCEPTED_HISTORICAL_REMEDY_AND_CURRENT_ISOLATED_LOADING_OBSERVED','Q04':'COMPLETE_CURRENT_EXTRACTIONS_IMAGE_LOAD_AND_SECURITY_OBSERVED','Q05':'COMPLETE_STATIC_AND_REQUIRED_NATIVE_APPLICABILITY_VERIFIED'}
    need(all(final.get(k) == value for k,value in expected_scope.items()), 'READBACK_EXACT_FINAL_QUALIFICATION_SCOPE')
    bindings = {'sequentialHandoffSHA256':'reuse-evidence/sequential-handoff.json','originalContractInputsSHA256':'original-contract-q01-q03.json','packageApplicabilitySHA256':'package-applicability.json','frontendExtractionSHA256':'frontend-extraction.json','frontendQualificationSHA256':'frontend-qualification.json','nativeQualificationSHA256':'native-qualification.json','backendResolutionSHA256':'backend-resolution.json'}
    for key,name in bindings.items(): need(final[key] == digest(files['prepared/'+name]), 'READBACK_RESULT_BINDING')
    need(digest(files['prepared/v65-packages.json']) == original_contract.PACKAGE_MANIFEST_SHA256, 'READBACK_EXACT_PACKAGE_MANIFEST')
    packages = value('prepared/v65-packages.json')
    for role,pin in {'backend':packages['backend'],**packages['frontends']}.items(): need({k:pin[k] for k in ('commit','tree')} == guard.SOURCES[role], 'READBACK_EXACT_PACKAGE_SOURCE_PINS')
    expected_manifest = assembled_manifest(root, packages)
    first = handoff(files, 'prepared', root, packages, expected_manifest); second = handoff(files, 'repeat-prepared', root, packages, expected_manifest)
    repeat = value('repeated-preparation.json')
    need(repeat['schema'] == 'work8-v81-successful-preparation-repeat-v1' and repeat['status'] == 'PASS_TWO_FRESH_REAL_PREPARATIONS' and repeat['firstReceiptSHA256'] == digest(files['prepared/reuse-evidence/sequential-handoff.json']) and repeat['repeatReceiptSHA256'] == digest(files['repeat-prepared/reuse-evidence/sequential-handoff.json']) and repeat['controller'] == first['controller'] == second['controller'] and repeat['sourceFileSetSHA256'] == first['sourceFileSetSHA256'] == second['sourceFileSetSHA256'] and repeat['filesystemDrift'] is repeat['applicationStarted'] is False, 'READBACK_REPEATED_PREPARATION')
    negatives = value('manifest-negative-controls.json')['controls']
    need(len(negatives) == 4 and {r['defect'] for r in negatives} == {'missing','extra','modified','symlink'}, 'READBACK_ALL_MANIFEST_NEGATIVES')
    for row in negatives:
        diag = row['diagnostic']; field = {'missing':'missingFiles','extra':'extraFiles','modified':'modifiedFiles','symlink':'symlinks'}[row['defect']]
        need(row['refused'] is True and diag['schema'] == 'work8-manifest-failure-diagnostic-v2' and type(diag[field]) is int and diag[field] > 0 and diag['rawContentsExported'] is diag['unknownRawPathsExported'] is False, 'READBACK_DEFECT_SPECIFIC_SANITIZED_NEGATIVE')
    need(value('prepared/original-contract-q01-q03.json') == decode(read(root/'qualification/expected-reconstruction-inputs.json', 1024**2)), 'READBACK_EXACT_ORIGINAL_RECONSTRUCTION_OPERANDS')
    proof_path = root/'qualification/package-applicability-proof.json'
    if not proof_path.exists(): proof_path = root/'qualification/package-applicability-proof.json.gz'
    proof = package_applicability.read_static_proof(proof_path, config['packageApplicabilityProofSHA256']); count = package_applicability.require_complete(proof)
    applicability = value('prepared/package-applicability-static.json')
    need(applicability['schema'] == 'work8-v84-q05-current-readback-v1' and applicability['status'] == 'PASS_COMPLETE_REVIEWED_DIFFERENCES_AND_CURRENT_BYTES' and applicability['proofSHA256'] == config['packageApplicabilityProofSHA256'] and applicability['dispositionsVerified'] == count and set(applicability['roles']) == {'backend','normal','recovery'} and all(applicability[k] is False for k in ('finalQualificationGranted','nativeQualificationClaimed','applicationStarted','A5AcceptanceClaimed')), 'READBACK_SOURCE_BOUND_COMPLETE_Q05')
    for role,pin in {'backend':packages['backend'],**packages['frontends']}.items():
        entry = proof['roles'][role]; candidate = entry['candidate']; row = applicability['roles'][role]
        need(all(candidate[k] == pin[k] for k in ('sha256','bytes')) and row == {'archiveSHA256':pin['sha256'],'inventorySHA256':candidate['inventorySHA256'],'objectsVerified':entry['newFiles']}, 'READBACK_Q05_ACTUAL_ROLE_INVENTORIES')
    need(applicability['requiredNativeChecks'] == proof['roles']['backend'].get('requiredNativeChecks', []) and applicability.get('requiredNativeProbeSpecSHA256') == proof.get('requiredNativeProbeSpec', {}).get('sha256'), 'READBACK_Q05_NATIVE_CONDITION_BINDING')
    q, build = native(files, identity, observations, root, packages)
    frontends(files, packages, proof, identity, q, build)
    # Native Q05 aliases require their dedicated protected result; parent adds
    # the source-bound pure validator when that module is frozen.
    if applicability['requiredNativeChecks']:
        backend_alias(files, root, proof, q, identity)
    alias_receipt = value('prepared/backend-resolution.json') if applicability['requiredNativeChecks'] else None
    expected_final = package_applicability.finalize_applicability(applicability, alias_receipt, digest((root/'qualification/backend-alias-probe-spec.json').read_bytes()))
    need(value('prepared/package-applicability.json') == expected_final, 'READBACK_COMPLETE_STATIC_NATIVE_Q05_JOIN')
    cleanup_positive(files)
    return {'schema':'work8-v84-outside-qualification-readback-v1','status':'PASS_QUALIFICATION_ONLY_INDEPENDENT_ADJUDICATION_REQUIRED','terminalRunnerComparison':terminal,'Q01_Q05':'COMPLETE_EXECUTION_RECEIPTS_READ_BACK',**common}

def main():
    parser = argparse.ArgumentParser()
    for option in ('archive','provider-json','job-log','expected-commit','expected-source-manifest'): parser.add_argument('--'+option, required=True)
    parser.add_argument('--source-root'); args = parser.parse_args()
    try:
        result = verify(args.archive, decode(read(args.provider_json, 4*1024**2)), read(args.job_log, 4*1024**2), args.expected_commit, args.expected_source_manifest, args.source_root)
        print(json.dumps(result, sort_keys=True)); return 0 if result['status'].startswith('PASS_') else 23
    except Exception as exc:
        typed = (Refusal, guard.Refusal, frontend_packages.Refusal, provenance.Refusal, qualify_only.Refusal, original_contract.Refusal, package_applicability.Refusal, backend_resolution.Refusal)
        code = str(exc) if isinstance(exc, typed) and re.fullmatch('[A-Z0-9_]{1,100}', str(exc)) else 'READBACK_INCOMPLETE_OR_INVALID'
        print(json.dumps({'status':'FAIL_READBACK','code':code,'rawOutputRetained':False,'applicationAcceptance':False})); return 23
if __name__ == '__main__': raise SystemExit(main())

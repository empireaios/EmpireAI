"""Private-input scan, safe metadata only. No credentials or raw snippets leave here."""
import hashlib, json, pathlib, re, subprocess
from urllib.parse import urlsplit
import candidate_packages

FROZEN_SCANNER_SHA256 = '5d297cb6e28ca84a9294e9cd7cc80218a0f17d77b736a5fa208e57edc3003560'
MAX_FINDINGS = 2048
MAX_REPORT_BYTES = 2 * 1024**2
CHUNK = 1024 * 1024
TAIL = 8192
RULES = candidate_packages.PATTERNS

def file_sha(path):
    with pathlib.Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

def safe_text(value, maximum=240):
    if not isinstance(value, str) or not value or len(value) > maximum:
        return '[OMITTED]'
    data = value.encode('utf8')
    if any(pattern.search(data) for _, pattern in RULES):
        return '[DETECTOR_SHAPED_COMPONENT_OMITTED]'
    if not re.fullmatch(r'[A-Za-z0-9_@.+() -]+', value):
        return '[UNSAFE_COMPONENT_OMITTED]'
    return value

def safe_path(relative):
    path = pathlib.PurePosixPath(str(relative))
    if path.is_absolute() or '..' in path.parts:
        return '[UNSAFE_RELATIVE_PATH_OMITTED]'
    return '/'.join(safe_text(part) for part in path.parts)

def safe_package(value):
    if not isinstance(value, str) or len(value) > 214:
        return None
    if not re.fullmatch(r'(?:@[a-z0-9_.-]+/)?[a-z0-9_.-]+', value):
        return None
    if any(pattern.search(value.encode()) for _, pattern in RULES):
        return None
    return value

def safe_version(value):
    return value if isinstance(value, str) and re.fullmatch(r'[0-9][0-9A-Za-z.+_-]{0,127}', value) and not any(p.search(value.encode()) for _, p in RULES) else None

def safe_upstream(value):
    if isinstance(value, dict):
        value = value.get('url')
    if not isinstance(value, str) or len(value) > 512:
        return None
    if value.startswith('git+'):
        value = value[4:]
    try:
        parsed = urlsplit(value)
        if parsed.scheme not in {'https', 'git'} or parsed.hostname not in {'github.com', 'registry.npmjs.org'} or parsed.username or parsed.password or parsed.query or parsed.fragment or parsed.port:
            return None
        if not re.fullmatch(r'/[A-Za-z0-9_@./+-]+', parsed.path) or '..' in parsed.path.split('/'):
            return None
        if any(p.search(value.encode()) for _, p in RULES):
            return None
        return {'host': parsed.hostname, 'path': parsed.path, 'scheme': parsed.scheme}
    except (ValueError, UnicodeError):
        return None

def package_provenance(path, context):
    if 'node_modules' not in path.relative_to(context).parts:
        return None
    parent = path.parent
    while parent.is_relative_to(context):
        candidate = parent / 'package.json'
        if candidate.is_file() and candidate.stat().st_size < 1024**2:
            try:
                data = json.loads(candidate.read_text())
                name, version = safe_package(data.get('name')), safe_version(data.get('version'))
                if name and version:
                    return {'name': name, 'version': version, 'packageJsonPath': safe_path(candidate.relative_to(context)), 'packageJsonSha256': file_sha(candidate), 'upstreamRepository': safe_upstream(data.get('repository'))}
            except (ValueError, UnicodeError, OSError):
                pass
        if parent == context:
            break
        parent = parent.parent
    return None

def lockfiles_for(source, role):
    paths = ['backend/package-lock.json', 'pillow/package-lock.json'] if role == 'backend' else ['empireai-web/package-lock.json']
    result = []
    for relative in paths:
        path = source / relative
        if not path.is_file():
            raise RuntimeError('EXACT_DEPENDENCY_LOCKFILE_MISSING')
        result.append({'path': relative, 'sha256': file_sha(path), 'bytes': path.stat().st_size})
    return result

def lock_binding(source, role, package):
    if not package:
        return []
    bindings = []
    for entry in lockfiles_for(source, role):
        data = json.loads((source / entry['path']).read_text())
        suffix = 'node_modules/' + package['name']
        for key, value in data.get('packages', {}).items():
            if (key == suffix or key.endswith('/' + suffix)) and value.get('version') == package['version']:
                integrity = value.get('integrity')
                bindings.append({'lockfilePath': entry['path'], 'lockfileSha256': entry['sha256'], 'packageKey': safe_path(key), 'version': package['version'], 'registryArtifact': safe_upstream(value.get('resolved')), 'integrityIdentitySha256': hashlib.sha256(integrity.encode()).hexdigest() if isinstance(integrity, str) else None})
    return bindings

def source_binding(path, context, source, role, manifest):
    relative = path.relative_to(context)
    if 'node_modules' in relative.parts:
        package = package_provenance(path, context)
        return {'classification': 'DEPENDENCY', 'package': package, 'lockBindings': lock_binding(source, role, package), 'classificationIsSecretVerdict': False}
    source_relative = relative if role == 'backend' else pathlib.Path('empireai-web') / pathlib.Path(*relative.parts[1:])
    try:
        # Only hashes from git are output. Raw blob bytes stay inside this process.
        proc = subprocess.run(['git', 'rev-parse', 'HEAD:' + source_relative.as_posix()], cwd=source, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=10)
        blob = proc.stdout.decode().strip()
        if proc.returncode == 0 and re.fullmatch(r'[a-f0-9]{40}', blob):
            blob_data = subprocess.check_output(['git', 'cat-file', 'blob', blob], cwd=source, stderr=subprocess.DEVNULL, timeout=10)
            if hashlib.sha256(blob_data).hexdigest() == file_sha(path):
                return {'classification': 'SOURCE', 'commit': manifest[role]['commit'], 'gitBlob': blob, 'sourcePath': safe_path(source_relative), 'classificationIsSecretVerdict': False}
    except (OSError, ValueError, subprocess.SubprocessError):
        pass
    return {'classification': 'GENERATED_BUILD_INPUT', 'sourceCommit': manifest[role]['commit'], 'sourceTree': manifest[role]['tree'], 'classificationIsSecretVerdict': False}

def locate(path, offsets):
    offsets = sorted(set(offsets)); positions = {}; at = 0; line_count = 0; last_newline = -1; pending = 0
    with path.open('rb') as stream:
        while chunk := stream.read(CHUNK):
            end = at + len(chunk)
            while pending < len(offsets) and offsets[pending] < end:
                offset = offsets[pending]; prefix = chunk[:offset-at]; last = prefix.rfind(b'\n')
                positions[offset] = {'line': 1 + line_count + prefix.count(b'\n'), 'column': offset - (at + last if last >= 0 else last_newline), 'byteOffset': offset}
                pending += 1
            line_count += chunk.count(b'\n')
            last = chunk.rfind(b'\n')
            if last >= 0:
                last_newline = at + last
            at = end
    return positions

def scan_file(path):
    findings = set(); at = 0; tail = b''; digest = hashlib.sha256(); overflow = False
    with path.open('rb') as stream:
        while chunk := stream.read(CHUNK):
            digest.update(chunk); sample = tail + chunk; sample_start = at - len(tail)
            for rule, pattern in RULES:
                for match in pattern.finditer(sample):
                    if len(findings) >= MAX_FINDINGS and (rule, sample_start + match.start()) not in findings:
                        overflow = True
                        continue
                    findings.add((rule, sample_start + match.start()))
            at += len(chunk); tail = sample[-TAIL:]
    return sorted(findings, key=lambda item: (item[1], item[0])), digest.hexdigest(), at, overflow

def scan_all(contexts, sources, manifest, output):
    original = pathlib.Path(candidate_packages.__file__)
    if file_sha(original) != FROZEN_SCANNER_SHA256:
        raise RuntimeError('ORIGINAL_SCANNER_IDENTITY_MISMATCH')
    if set(contexts) != {'backend', 'normal', 'recovery'} or set(sources) != set(contexts):
        raise RuntimeError('EXACT_THREE_CONTEXTS_REQUIRED')
    report = {'schema': 'work8-v23-safe-scan-diagnostic-v1', 'status': 'BLOCKED_PENDING_INDEPENDENT_CLASSIFICATION', 'originalScanner': {'controllerCommit': '56009e665de3ba38da0db83e4db5c2c5ab10584b', 'path': 'scripts/work8/native-transition/candidate_packages.py', 'sha256': FROZEN_SCANNER_SHA256, 'rules': [name for name, _ in RULES]}, 'diagnosticScannerSha256': file_sha(pathlib.Path(__file__)), 'inputScope': 'All regular files in three contexts reconstructed using the failed examination source pins, lockfiles and assembly recipe; no image-layer assertion', 'historicalGeneratedBytesRetained': False, 'currentWholeFileIdentitiesProveHistoricalByteEquality': False, 'applicationRuntimeStarted': False, 'candidatePackagesUploaded': False, 'matchedValuesRecorded': False, 'rawSnippetsRecorded': False, 'complete': True, 'contexts': {}, 'findings': [], 'structuralFindings': []}
    for role in ('backend', 'normal', 'recovery'):
        context, source = pathlib.Path(contexts[role]), pathlib.Path(sources[role])
        for expression, expected in [('HEAD', manifest[role]['commit']), ('HEAD^{tree}', manifest[role]['tree'])]:
            actual = subprocess.check_output(['git', 'rev-parse', expression], cwd=source, stderr=subprocess.DEVNULL, timeout=10).decode().strip()
            if actual != expected:
                raise RuntimeError('EXACT_SOURCE_IDENTITY_MISMATCH')
        inventory = hashlib.sha256(); files = 0; byte_count = 0
        for path in sorted(context.rglob('*')):
            relative = path.relative_to(context)
            if path.is_symlink():
                if not path.resolve().is_relative_to(context.resolve()):
                    report['structuralFindings'].append({'role': role, 'path': safe_path(relative), 'rule': 'escaping-symlink'})
                continue
            if not path.is_file():
                continue
            if '.git' in relative.parts or path.name == '.env':
                report['structuralFindings'].append({'role': role, 'path': safe_path(relative), 'rule': 'git-metadata' if '.git' in relative.parts else 'runtime-env-file'})
            if path.suffix.lower() in {'.db', '.sqlite', '.sqlite3', '.db-wal', '.db-shm'} and not any(part in {'test', 'tests', 'fixtures', '__fixtures__', 'examples'} for part in relative.parts[:-1]):
                report['structuralFindings'].append({'role': role, 'path': safe_path(relative), 'rule': 'nonfixture-database'})
            found, digest, size, overflow = scan_file(path); files += 1; byte_count += size
            inventory.update(relative.as_posix().encode() + b'\0' + str(size).encode() + b'\0' + digest.encode() + b'\n')
            report['complete'] = report['complete'] and not overflow
            if found:
                positions = locate(path, [offset for _, offset in found]); provenance = source_binding(path, context, source, role, manifest)
                for rule, offset in found:
                    if len(report['findings']) >= MAX_FINDINGS:
                        report['complete'] = False
                        continue
                    path_hints = {'documentationFilename': path.suffix.lower() in {'.md', '.mdx', '.rst'} or path.name.upper().startswith(('README', 'CHANGELOG', 'HISTORY')), 'testExamplePath': any(part.lower() in {'test', 'tests', 'fixtures', '__fixtures__', 'examples', 'docs', 'documentation'} for part in relative.parts[:-1]), 'pathHintsAreNotSecretClassification': True}
                    report['findings'].append({'role': role, 'rule': rule, 'relativePath': safe_path(relative), **positions[offset], 'wholeFileSha256': digest, 'wholeFileBytes': size, 'pathHints': path_hints, 'provenance': provenance, 'secretClassification': 'UNCLASSIFIED_REQUIRES_INDEPENDENT_REVIEW'})
        report['contexts'][role] = {'sourceCommit': manifest[role]['commit'], 'sourceTree': manifest[role]['tree'], 'filesScanned': files, 'bytesScanned': byte_count, 'completeInventorySha256': inventory.hexdigest(), 'lockfiles': lockfiles_for(source, role)}
    if not report['findings'] and not report['structuralFindings'] and report['complete']:
        report['status'] = 'NO_PATTERN_FINDINGS_IN_REPRODUCED_CONTEXTS_NOT_RUNTIME_ACCEPTANCE'
    if not report['complete']:
        report['status'] = 'BLOCKED_DIAGNOSTIC_FINDING_LIMIT_INCOMPLETE'
    encoded = (json.dumps(report, indent=2) + '\n').encode()
    if len(encoded) > MAX_REPORT_BYTES:
        raise RuntimeError('SAFE_METADATA_ARTIFACT_BOUND_EXCEEDED')
    # This final barrier covers filenames, package metadata and upstream fields.
    if any(pattern.search(encoded) for _, pattern in RULES):
        raise RuntimeError('SAFE_METADATA_SECRET_PATTERN_REFUSED')
    pathlib.Path(output).write_bytes(encoded)
    return report

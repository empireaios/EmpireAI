#!/usr/bin/env python3
"""Q05 complete-input comparison and fail-closed immutable-evidence admission.

This module never starts package code, builds an image, or accepts a successful
build as equivalence. Every current and retained member is accounted for. A
real runtime-affecting difference without a checked disposition stays refused.
The offline comparison and later current-run archive readback are separate
operations; neither is native security or application acceptance.
"""
import argparse
import hashlib
import gzip
import io
import json
import os
import posixpath
from pathlib import Path, PurePosixPath
import re
import stat
import tarfile
import base64
from urllib.parse import quote

SCHEMA = 'work8-v84-complete-package-applicability-v1'
MAX_ARCHIVE = 512 * 1024 ** 2
MAX_LOGICAL = 8 * 1024 ** 3
MAX_MEMBERS = 150000
MAX_SMALL = 16 * 1024 ** 2
MAX_PROOF = 128 * 1024 ** 2
ROLES = ('backend', 'normal', 'recovery')
SHA = re.compile(r'[0-9a-f]{64}')
FROZEN_DISPOSITIONS_SHA256 = '7c4031965b02e1a16716cb681eb6b947328ca0f602def2e01c7415fc321970c3'  # Exact actual comparison index; independent review remains mandatory.
_DISPOSITIONS = None


class Refusal(ValueError):
    pass


def need(ok, code):
    if not ok:
        raise Refusal(code)


def digest_bytes(data):
    return hashlib.sha256(data).hexdigest()


def digest_file(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def canonical_name(name):
    need(isinstance(name, str) and 0 < len(name.encode()) <= 4096, 'Q05_PATH_BOUND')
    p = PurePosixPath(name)
    need(not p.is_absolute() and str(p) == name and not any(x in ('', '.', '..') for x in p.parts)
         and '\\' not in name and '\x00' not in name, 'Q05_NONCANONICAL_PATH')
    return name


def file_identity(path, expected=None):
    path = Path(path)
    s = path.lstat()
    need(path.is_absolute() and path.resolve() == path and stat.S_ISREG(s.st_mode) and s.st_nlink == 1,
         'Q05_REGULAR_CANONICAL_ARCHIVE_REQUIRED')
    need(0 < s.st_size <= MAX_ARCHIVE, 'Q05_ARCHIVE_BOUND')
    identity = {'bytes': s.st_size, 'sha256': digest_file(path)}
    if expected is not None:
        need(identity == {k: expected[k] for k in ('bytes', 'sha256')}, 'Q05_ARCHIVE_IDENTITY')
    return identity


def canonical_json(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()


def inventory_digest(rows):
    return digest_bytes(canonical_json(rows))


class FrontendArchive:
    def __init__(self, path, expected=None):
        self.path = Path(path)
        self.identity = file_identity(self.path, expected)
        self.archive = tarfile.open(self.path, 'r:gz')
        self.members = self.archive.getmembers()
        need(0 < len(self.members) <= MAX_MEMBERS, 'Q05_MEMBER_COUNT_BOUND')
        names = [canonical_name(m.name) for m in self.members]
        need(len(set(names)) == len(names), 'Q05_DUPLICATE_MEMBER')
        need(all(m.isfile() and not m.mode & 0o6000 for m in self.members), 'Q05_FRONTEND_NONREGULAR_OR_SETID')
        need(sum(m.size for m in self.members) <= MAX_LOGICAL, 'Q05_LOGICAL_BYTES_BOUND')
        self.small = {}
        self.rows = {}
        for m in self.members:
            with self.archive.extractfile(m) as stream:
                if m.size <= MAX_SMALL:
                    data = stream.read(); self.small[m.name] = data; h = digest_bytes(data)
                else:
                    h = hashlib.file_digest(stream, 'sha256').hexdigest()
            self.rows[m.name] = {'path': m.name, 'type': 'file', 'bytes': m.size, 'sha256': h,
                                 'mode': m.mode & 0o777, 'extractedMode': 0o555 if m.mode & 0o111 else 0o444}
        index_raw = self.read('MEMBERS.json')
        index = json.loads(index_raw)
        need(index.get('schema') == 'EMPIREAI_RELEASE_MEMBERS_V1' and index.get('selfExcluded') == 'MEMBERS.json', 'Q05_MEMBER_INDEX_SCHEMA')
        rows = index['members']
        indexed = {canonical_name(r['path']): r for r in rows}
        need(len(indexed) == len(rows) and set(indexed) | {'MEMBERS.json'} == set(names), 'Q05_COMPLETE_FRONTEND_INDEX')
        for name, row in self.rows.items():
            if name != 'MEMBERS.json':
                need(indexed[name]['bytes'] == row['bytes'] and indexed[name]['sha256'] == row['sha256'], 'Q05_MEMBER_BYTES_OR_HASH')
        self.release = json.loads(self.read('release.json'))
        self.build_id = self.release['nextBuildId']
        need(isinstance(self.build_id, str) and re.fullmatch(r'[A-Za-z0-9_-]{8,128}', self.build_id), 'Q05_BUILD_ID_SHAPE')
        need(self.read('app/.next/BUILD_ID').decode().strip() == self.build_id, 'Q05_BUILD_ID_BINDING')
        self.identity.update(membersSHA256=digest_bytes(index_raw), members=len(rows),
                             inventorySHA256=inventory_digest([self.rows[n] for n in sorted(self.rows)]))

    def read(self, name):
        if hasattr(self, 'small') and name in self.small:
            return self.small[name]
        m = self.archive.getmember(name)
        need(m.isfile() and 0 <= m.size <= MAX_SMALL, 'Q05_METADATA_MEMBER_BOUND')
        return self.archive.extractfile(m).read()

    def close(self):
        self.archive.close()


def _source_equal(old, new, role):
    need(old.release.get('component') == new.release.get('component') == role.upper(), 'Q05_ROLE_BINDING')
    need(old.release.get('source') == new.release.get('source'), 'Q05_SOURCE_MAPPING_DISAGREEMENT')
    need(old.release.get('ownerDataIncluded') is False and new.release.get('ownerDataIncluded') is False
         and old.release.get('ownerCredentialsIncluded') is False and new.release.get('ownerCredentialsIncluded') is False,
         'Q05_OWNER_DATA_REFUSED')


def _json_reference_normalizer(javascript, build_id, build_root, side):
    """Only source-bound emitted filenames, exact build ID and build root.

    This is for generated JSON data, never arbitrary program expressions.
    Numeric values, application strings and array ordering stay unchanged.
    """
    mapping = {build_id: '<NEXT_BUILD_ID>', build_root: '<SOURCE_BUILD_ROOT>'}
    for row in javascript.get('filePairs', []):
        path = row[side + 'Path']
        if path.startswith('app/.next/'):
            short = path.removeprefix('app/.next/')
            canonical = '<JS:' + row['oldPath'] + '>'
            mapping[short] = canonical
            mapping[quote(short, safe='/')] = canonical
    pattern = re.compile('|'.join(re.escape(x) for x in sorted(mapping, key=len, reverse=True)))
    def transform(value):
        if isinstance(value, str): return pattern.sub(lambda m: mapping[m[0]], value)
        if isinstance(value, list): return [transform(x) for x in value]
        if isinstance(value, dict):
            result = {transform(k): transform(v) for k, v in value.items()}
            need(len(result) == len(value), 'Q05_JSON_REFERENCE_KEY_COLLISION')
            return result
        return value
    return transform


def _config_build_fields(config, root):
    """Remove only three observed build-host fields; runtime config is exact.

    experimental.cpus is Next's captured build worker-count default. The
    standalone dependency tree contains its schema/default, not a reader of
    config.experimental.cpus. Its immutable source-reference witness accompanies
    the proof. This does not change any process/security resource bound.
    """
    value = json.loads(json.dumps(config))
    need(value.get('outputFileTracingRoot') == root and value.get('turbopack', {}).get('root') == root,
         'Q05_CONFIG_BUILD_ROOT')
    cpus = value.get('experimental', {}).get('cpus')
    need(type(cpus) is int and cpus in (3, 8), 'Q05_CONFIG_UNREVIEWED_CPU_DEFAULT')
    value['outputFileTracingRoot'] = '<SOURCE_BUILD_ROOT>'
    value['turbopack']['root'] = '<SOURCE_BUILD_ROOT>'
    value['experimental']['cpus'] = '<BUILD_WORKER_DEFAULT>'
    return value


def _frontend_generated_json(path, aa, bb, old, new, role, javascript):
    oldroot = '/workspace/scratch/6e69b109d829/v55/' + role + '/empireai-web'
    newroot = '/home/runner/work/_temp/v65-build/frontend-build/' + role + '/empireai-web'
    def unique(pairs):
        result = {}
        for key, value in pairs:
            need(key not in result, 'Q05_DUPLICATE_JSON_KEY')
            result[key] = value
        return result
    a, b = json.loads(aa, object_pairs_hook=unique), json.loads(bb, object_pairs_hook=unique)
    details = {'policy': 'TYPED_NEXT_GENERATED_JSON_V1'}
    if path.endswith('.nft.json'):
        for value, archive, side in ((a, old, 'old'), (b, new, 'new')):
            need(set(value) == {'version', 'files'} and value['version'] == 1 and isinstance(value['files'], list)
                 and all(isinstance(x, str) for x in value['files']) and len(value['files']) == len(set(value['files'])), 'Q05_TRACE_MANIFEST_SHAPE')
            resolved = [posixpath.normpath(posixpath.join(posixpath.dirname(path), x)) for x in value['files']]
            need(all(x.startswith('app/') and '..' not in x.split('/') and x in archive.rows for x in resolved), 'Q05_TRACE_MISSING_OR_ESCAPING_DEPENDENCY')
            need(len(resolved) == len(set(resolved)), 'Q05_TRACE_NORMALIZED_DUPLICATE')
            file_map = {r[side + 'Path']: '<JS:' + r['oldPath'] + '>' for r in javascript['filePairs']}
            value['files'] = sorted(file_map.get(x, x) for x in resolved)
        if a != b: return None
        return {'policy': 'TYPED_NEXT_GENERATED_JSON_V1', 'traceFilesSemantics': 'COMPLETE_UNIQUE_DEPENDENCY_SET',
                'traceTargetsExist': True, 'traceReferences': len(a['files']), 'normalizedSHA256': digest_bytes(canonical_json(a))}
    if path == 'app/.next/required-server-files.json':
        need(a.get('appDir') == oldroot and b.get('appDir') == newroot, 'Q05_CONFIG_APP_ROOT')
        a['config'] = _config_build_fields(a['config'], oldroot)
        b['config'] = _config_build_fields(b['config'], newroot)
        details['buildDefaults'] = {'oldCPUs': 8, 'newCPUs': 3, 'runtimeResourceBoundChanged': False}
    if path == 'app/.next/prerender-manifest.json':
        # These are artifact-generated preview keys, not owner credentials.
        # Their exact bytes are archive-pinned and cross-bound to middleware.
        for value in (a, b):
            preview = value.get('preview', {})
            need(set(preview) == {'previewModeId', 'previewModeSigningKey', 'previewModeEncryptionKey'}, 'Q05_PREVIEW_FIELDS')
            need(all(isinstance(v, str) and re.fullmatch('[0-9a-f]{' + str(32 if k == 'previewModeId' else 64) + '}', v) for k, v in preview.items()), 'Q05_PREVIEW_KEY_FORMAT')
            value['preview'] = {k: '<ARTIFACT_GENERATED_' + k + '>' for k in preview}
        details['previewRotation'] = 'ARTIFACT_LOCAL_EXACT_SHAPE_AND_MIDDLEWARE_BINDING'
    if path == 'app/.next/server/server-reference-manifest.json':
        for value in (a, b):
            need(set(value) == {'node', 'edge', 'encryptionKey'} and value['node'] == value['edge'] == {}, 'Q05_NONEMPTY_SERVER_ACTIONS_REQUIRE_REVIEW')
            need(len(base64.b64decode(value['encryptionKey'], validate=True)) == 32, 'Q05_ACTION_KEY_FORMAT')
            value['encryptionKey'] = '<UNUSED_EMPTY_ACTION_MAP_GENERATED_KEY>'
        details['actionKeyRotation'] = 'BOTH_SERVER_ACTION_MAPS_EMPTY'
    if path == 'app/.next/server/middleware-manifest.json':
        for value, archive in ((a, old), (b, new)):
            preview = json.loads(archive.read('app/.next/prerender-manifest.json'))['preview']
            expected = {'__NEXT_PREVIEW_MODE_ID': 'previewModeId', '__NEXT_PREVIEW_MODE_SIGNING_KEY': 'previewModeSigningKey', '__NEXT_PREVIEW_MODE_ENCRYPTION_KEY': 'previewModeEncryptionKey'}
            for middle in value.get('middleware', {}).values():
                env = middle.get('env', {})
                if 'NEXT_SERVER_ACTIONS_ENCRYPTION_KEY' in env:
                    actions = json.loads(archive.read('app/.next/server/server-reference-manifest.json'))
                    need(actions.get('node') == actions.get('edge') == {} and env['NEXT_SERVER_ACTIONS_ENCRYPTION_KEY'] == actions['encryptionKey'],
                         'Q05_MIDDLEWARE_EMPTY_ACTION_KEY_BINDING')
                    env['NEXT_SERVER_ACTIONS_ENCRYPTION_KEY'] = '<UNUSED_EMPTY_ACTION_MAP_GENERATED_KEY>'
                if '__NEXT_BUILD_ID' in env:
                    need(env['__NEXT_BUILD_ID'] == archive.build_id, 'Q05_MIDDLEWARE_BUILD_ID_BINDING')
                for key, preview_key in expected.items():
                    if key in env:
                        need(env[key] == preview[preview_key], 'Q05_MIDDLEWARE_PREVIEW_BINDING')
                        env[key] = '<ARTIFACT_GENERATED_' + preview_key + '>'
        details['previewRotation'] = 'ARTIFACT_LOCAL_EXACT_SHAPE_AND_MIDDLEWARE_BINDING'
    an = _json_reference_normalizer(javascript, old.build_id, oldroot, 'old')(a)
    bn = _json_reference_normalizer(javascript, new.build_id, newroot, 'new')(b)
    if an != bn: return None
    details['normalizedSHA256'] = digest_bytes(canonical_json(an))
    return details


def _server_template(aa, bb, role):
    marker = b'const nextConfig = '
    def split(data, root):
        start = data.index(marker) + len(marker)
        raw, length = json.JSONDecoder().raw_decode(data[start:].decode())
        # JSON generated by Next is ASCII, therefore its decoded span is bytes.
        need(data[start:start+length].isascii(), 'Q05_CONFIG_JSON_ENCODING')
        return data[:start], _config_build_fields(raw, root), data[start+length:]
    a = split(aa, '/workspace/scratch/6e69b109d829/v55/' + role + '/empireai-web')
    b = split(bb, '/home/runner/work/_temp/v65-build/frontend-build/' + role + '/empireai-web')
    if a != b: return None
    return {'policy': 'EXACT_STANDALONE_TEMPLATE_BUILD_FIELDS_V1', 'normalizedSHA256': digest_bytes(a[0] + canonical_json(a[1]) + a[2]),
            'oldCPUs': 8, 'newCPUs': 3, 'runtimeResourceBoundChanged': False}


def _release_metadata(old, new):
    a, b = json.loads(json.dumps(old.release)), json.loads(json.dumps(new.release))
    for archive, value in ((old, a), (new, b)):
        need(value.get('build', {}).get('exitCode') == 0 and SHA.fullmatch(value['build'].get('logSHA256', '')), 'Q05_BUILD_RECEIPT_SHAPE')
        value.pop('build'); value.pop('nextBuildId')
        value.pop('acceptanceScope')
        value['platform']['buildHostGlibc'] = value['platform']['buildHostGlibc'].removeprefix('glibc ')
    need(a.pop('backendImageRequired') == 'sha256:65382b8f19482851212fe7a21746ca7ad7bf5af5708fec8f083165ac42e61573'
         and b.pop('backendImageRequired') == 'sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0', 'Q05_RELEASE_BACKEND_BINDING')
    need(b.pop('reconstruction', {}) == {'campaign': 'V65', 'historicalBytesClaimed': False, 'independentQualification': 'PENDING'}, 'Q05_RECONSTRUCTION_STATUS')
    need(a == b, 'Q05_RELEASE_UNEXPLAINED_FIELD')
    return {'policy': 'RECONSTRUCTION_PROVENANCE_FIELDS_V1', 'normalizedSHA256': digest_bytes(canonical_json(a)),
            'sourceIdentical': True, 'toolchainIdentical': True, 'backendBindingsRequireBackendRoleProof': True}


def compare_frontends(old_path, new_path, role, old_expected=None, new_expected=None, javascript=None):
    need(role in ('normal', 'recovery'), 'Q05_FRONTEND_ROLE')
    old = FrontendArchive(old_path, old_expected)
    new = FrontendArchive(new_path, new_expected)
    try:
        _source_equal(old, new, role)
        def paths(archive):
            result = {n.replace('/' + archive.build_id + '/', '/<NEXT_BUILD_ID>/'): n for n in archive.rows}
            need(len(result) == len(archive.rows), 'Q05_BUILD_ID_PATH_COLLISION')
            return result
        a, b = paths(old), paths(new)
        js_pairs = {}
        if javascript is not None:
            need(javascript.get('status') == 'PASS_GLOBAL_JS_GRAPH_AND_FULL_AST', 'Q05_JS_GRAPH_NOT_COMPLETE')
            for row in javascript.get('filePairs', []):
                need(row['oldPath'] not in js_pairs, 'Q05_JS_PAIR_DUPLICATE')
                js_pairs[row['oldPath']] = row
        mapped_new_paths = {p['newPath'] for p in js_pairs.values()}
        javascript_sha = digest_bytes(canonical_json(javascript)) if javascript is not None else None
        metadata_paths = {'README.txt', 'provenance/build-preflight.json', 'provenance/build-inputs.json',
                          'provenance/build.log', 'provenance/identity-test.log', 'provenance/sharp-remedy.log',
                          'provenance/sharp-versions.log', 'provenance/toolchain-acquisition.json',
                          'provenance/candidate-secret-scan.json'}
        metadata_checked = False
        if javascript is not None:
            old_tools = json.loads(old.read('provenance/toolchain-acquisition.json'))
            inputs = json.loads(new.read('provenance/build-inputs.json'))
            need(inputs['source'] == old.release['source'] and inputs['toolchain'] == old_tools
                 and inputs['build'] == new.release['build'], 'Q05_RECONSTRUCTION_PROVENANCE_BINDING')
            preflight = json.loads(old.read('provenance/build-preflight.json'))
            need(old.release['source'] in preflight['components'], 'Q05_RETAINED_PROVENANCE_BINDING')
            metadata_checked = True
        disposition = []
        covered_new = set()
        for normalized in sorted(set(a) | set(b)):
            na, nb = a.get(normalized), b.get(normalized)
            if na is None and nb in mapped_new_paths:
                continue
            if nb in covered_new:
                continue
            ra, rb = old.rows.get(na), new.rows.get(nb)
            rule = 'UNCLASSIFIED_RUNTIME_AFFECTING_DIFFERENCE'
            witness = None
            if (na or nb) in metadata_paths and metadata_checked:
                need(not na or old.rows[na]['mode'] & 0o111 == 0, 'Q05_EXECUTABLE_PROVENANCE_REFUSED')
                need(not nb or new.rows[nb]['mode'] & 0o111 == 0, 'Q05_EXECUTABLE_PROVENANCE_REFUSED')
                rule = 'NONRUNTIME_BUILD_EVIDENCE_ATTRIBUTED'
                witness = {'policy': 'FINITE_OUTSIDE_APP_PROVENANCE_V1', 'sourceSHA256': digest_bytes(canonical_json(old.release['source'])),
                           'toolchainSHA256': digest_bytes(canonical_json(old_tools)), 'runtimePath': False}
            elif na in js_pairs:
                pair = js_pairs[na]
                nb = pair['newPath']; rb = new.rows.get(nb)
                need(rb is not None and pair.get('oldSHA256') == ra['sha256'] and pair.get('newSHA256') == rb['sha256'], 'Q05_JS_ARCHIVE_BINDING')
                need(pair.get('normalizedOldSHA256') == pair.get('normalizedNewSHA256') and SHA.fullmatch(pair.get('normalizedOldSHA256', '')), 'Q05_JS_FULL_AST_WITNESS')
                rule = 'GLOBAL_JS_GRAPH_AND_FULL_AST_EQUAL'
                witness = {'graphSHA256': javascript_sha, 'normalizedASTSHA256': pair['normalizedOldSHA256']}
            elif javascript is not None and na == nb and na and na.startswith('app/.next/') and na.endswith(('.rsc', '.html')):
                from frontend_semantics import compare_generated
                witness = compare_generated(na, old.read(na), new.read(nb), javascript, old.build_id, new.build_id)
                if witness: rule = 'TYPED_FLIGHT_OR_HTML_REFERENCE_EQUALITY'
            elif javascript is not None and na == nb and na and na.startswith('app/.next/') and na.endswith('.nft.json'):
                witness = _frontend_generated_json(na, old.read(na), new.read(nb), old, new, role, javascript)
                if witness: rule = 'TYPED_GENERATED_JSON_REFERENCE_EQUALITY'
            elif ra and rb:
                if na == nb == 'MEMBERS.json':
                    rule = 'SELF_INDEX_RECOMPUTED_FROM_COMPLETE_VERIFIED_MEMBERS'
                elif ra['sha256'] == rb['sha256'] and ra['bytes'] == rb['bytes']:
                    rule = 'EXACT_BYTES_EQUAL'
                elif ra['bytes'] <= MAX_SMALL and rb['bytes'] <= MAX_SMALL:
                    aa, bb = old.read(na), new.read(nb)
                    an = aa.replace(old.build_id.encode(), b'<NEXT_BUILD_ID>')
                    bn = bb.replace(new.build_id.encode(), b'<NEXT_BUILD_ID>')
                    if an == bn and na.startswith('app/.next/'):
                        rule = 'EXACT_OBSERVED_BUILD_ID_SUBSTITUTION'
                        witness = {'normalizedSHA256': digest_bytes(an)}
                    elif na.endswith('.json') and nb.endswith('.json'):
                        try:
                            aj, bj = json.loads(aa), json.loads(bb)
                            if aj == bj:
                                rule = 'JSON_OBJECT_SERIALIZATION_ONLY'
                                witness = {'canonicalSHA256': digest_bytes(canonical_json(aj))}
                        except (ValueError, UnicodeError):
                            pass
                    if rule.startswith('UNCLASSIFIED') and javascript is not None:
                        if na == nb == 'release.json':
                            witness = _release_metadata(old, new)
                            rule = 'SOURCE_BOUND_RECONSTRUCTION_RELEASE_METADATA'
                        elif na == nb == 'app/server.js':
                            witness = _server_template(aa, bb, role)
                            if witness: rule = 'EXACT_STANDALONE_TEMPLATE_WITH_TYPED_BUILD_FIELDS'
                        elif na == nb == 'launch.sh':
                            old_script = '#!/bin/sh\nset -eu\n: "${BRAIN_API_URL:?Set BRAIN_API_URL to the authorised isolated backend before starting}"\nPACKAGE_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)\nexport NODE_ENV=production NEXT_TELEMETRY_DISABLED=1\nexport HOSTNAME="${HOSTNAME:-127.0.0.1}"\nexport PORT="${PORT:-3000}"\ncd "$PACKAGE_ROOT/app"\nexec "$PACKAGE_ROOT/runtime/bin/node" server.js\n'
                            new_script = old_script.replace('Set BRAIN_API_URL to the authorised isolated backend before starting', 'authorised isolated backend required').replace('"\nexport PORT=', '" PORT=')
                            if aa == old_script.encode() and bb == new_script.encode():
                                rule = 'EXACT_LAUNCHER_DIAGNOSTIC_AND_EXPORT_GROUPING'
                                witness = {'policy': 'FINITE_POSIX_EXPORT_AND_REQUIRED_PARAMETER_V1', 'normalizedSHA256': digest_bytes(old_script.encode())}
                        elif na == nb and na.startswith('app/.next/') and na.endswith('.json'):
                            witness = _frontend_generated_json(na, aa, bb, old, new, role, javascript)
                            if witness: rule = 'TYPED_GENERATED_JSON_REFERENCE_EQUALITY'
                        elif na == nb and na.startswith('app/.next/') and na.endswith(('.rsc', '.html')):
                            from frontend_semantics import compare_generated
                            witness = compare_generated(na, aa, bb, javascript, old.build_id, new.build_id)
                            if witness: rule = 'TYPED_FLIGHT_OR_HTML_REFERENCE_EQUALITY'
                if ra['extractedMode'] != rb['extractedMode']:
                    rule = 'UNCLASSIFIED_EXECUTABLE_MODE_DIFFERENCE'; witness = None
            if nb:
                covered_new.add(nb)
            disposition.append({'oldPath': na, 'newPath': nb, 'old': ra, 'new': rb, 'rule': rule, 'witness': witness})
        need({r['oldPath'] for r in disposition if r['oldPath']} == set(old.rows), 'Q05_OLD_COVERAGE_GAP')
        need({r['newPath'] for r in disposition if r['newPath']} == set(new.rows), 'Q05_NEW_COVERAGE_GAP')
        remaining = [r for r in disposition if r['rule'].startswith('UNCLASSIFIED')]
        return {'role': role, 'retained': old.identity, 'candidate': new.identity, 'source': old.release['source'],
                'oldFiles': len(old.rows), 'newFiles': len(new.rows), 'differences': disposition,
                'unclassifiedCount': len(remaining), 'complete': not remaining,
                'globalJavascriptProofPresent': javascript is not None,
                'javascriptProof': javascript,
                'buildIds': {'old': old.build_id, 'new': new.build_id},
                'nativeLoadingClaimed': False, 'applicationStarted': False}
    finally:
        old.close(); new.close()


def backend_inventory(path, expected=None):
    identity = file_identity(path, expected)
    fs = {}
    with tarfile.open(path, 'r:gz') as outer:
        outer_members = outer.getmembers()
        need(0 < len(outer_members) <= 128 and len({canonical_name(x.name) for x in outer_members}) == len(outer_members)
             and all(x.isfile() for x in outer_members), 'Q05_BACKEND_OUTER_INVENTORY')
        outer_hashes = {}
        for m in outer_members:
            need(m.size <= MAX_LOGICAL, 'Q05_BACKEND_LAYER_BOUND')
            h = hashlib.file_digest(outer.extractfile(m), 'sha256').hexdigest()
            if m.name.startswith('blobs/sha256/'):
                need(m.name.removeprefix('blobs/sha256/') == h, 'Q05_BACKEND_BLOB_DIGEST')
            outer_hashes[m.name] = h
        manifest = json.load(outer.extractfile('manifest.json'))
        need(len(manifest) == 1, 'Q05_SINGLE_BACKEND_IMAGE')
        item = manifest[0]
        config_name = canonical_name(item['Config'])
        config = json.load(outer.extractfile(config_name))
        need(config.get('architecture') == 'amd64' and config.get('os') == 'linux', 'Q05_BACKEND_PLATFORM')
        layers = item['Layers']
        need(0 < len(layers) <= 64 and len(layers) == len(config['rootfs']['diff_ids']), 'Q05_BACKEND_LAYER_CHAIN')
        seen_members = logical = 0
        for layer_name, diff_id in zip(layers, config['rootfs']['diff_ids']):
            canonical_name(layer_name)
            need('sha256:' + outer_hashes[layer_name] == diff_id, 'Q05_BACKEND_DIFF_ID')
            # OCI whiteouts address the lower-layer view, never new siblings
            # already encountered in this same tar stream. Collect first.
            layer_rows, whiteouts, layer_names = [], [], set()
            with tarfile.open(fileobj=outer.extractfile(layer_name), mode='r|*') as layer:
                for member in layer:
                    name = member.name.rstrip('/')
                    if name == '.':
                        continue
                    if name.startswith('./'):
                        name = name[2:]
                    canonical_name(name)
                    need(name not in layer_names, 'Q05_BACKEND_DUPLICATE_LAYER_MEMBER')
                    layer_names.add(name)
                    seen_members += 1; logical += member.size
                    need(seen_members <= MAX_MEMBERS and logical <= MAX_LOGICAL, 'Q05_BACKEND_EXPANDED_BOUND')
                    parent, _, basename = name.rpartition('/')
                    prefix = parent + '/' if parent else ''
                    if basename == '.wh..wh..opq':
                        whiteouts.append(('opaque', parent))
                        continue
                    if basename.startswith('.wh.'):
                        target = prefix + basename[4:]
                        whiteouts.append(('remove', target))
                        continue
                    row = {'path': name, 'mode': member.mode & 0o7777, 'uid': member.uid, 'gid': member.gid}
                    if member.isfile():
                        row.update(type='file', bytes=member.size,
                                   sha256=hashlib.file_digest(layer.extractfile(member), 'sha256').hexdigest())
                    elif member.isdir(): row.update(type='directory')
                    elif member.issym() or member.islnk():
                        need(isinstance(member.linkname, str) and '\x00' not in member.linkname and len(member.linkname) <= 4096, 'Q05_LINK_TARGET_BOUND')
                        row.update(type='symlink' if member.issym() else 'hardlink', target=member.linkname)
                    else: raise Refusal('Q05_BACKEND_SPECIAL_MEMBER')
                    layer_rows.append(row)
            for kind, target in whiteouts:
                prefix = target + '/' if target else ''
                for p in list(fs):
                    if (kind == 'remove' and p == target) or (p.startswith(prefix) and p != target):
                        del fs[p]
            descendant_parents = set()
            for existing in fs:
                parts = existing.split('/')
                descendant_parents.update('/'.join(parts[:i]) for i in range(1, len(parts)))
            for row in layer_rows:
                name = row['path']
                if row['type'] != 'directory' and name in descendant_parents:
                    for p in list(fs):
                        if p.startswith(name + '/'):
                            del fs[p]
                fs[name] = row
                parts = name.split('/')
                descendant_parents.update('/'.join(parts[:i]) for i in range(1, len(parts)))
        rows = [fs[n] for n in sorted(fs)]
        identity.update(image='sha256:' + outer_hashes[config_name], inventorySHA256=inventory_digest(rows), files=len(rows))
        return {'identity': identity, 'config': config, 'layers': config['rootfs']['diff_ids'], 'members': rows}


def resolve_object(objects, name):
    """Resolve a complete image path lexically, never through the host FS."""
    canonical_name(name)
    current, chain, seen = name, [], set()
    for _ in range(40):
        need(current not in seen, 'Q05_IMAGE_ALIAS_CYCLE')
        seen.add(current)
        parts = current.split('/')
        for index in range(1, len(parts) + 1):
            prefix = '/'.join(parts[:index]); row = objects.get(prefix)
            if row is not None and row['type'] in ('symlink', 'hardlink'):
                target = row['target']
                base = '' if target.startswith('/') or row['type'] == 'hardlink' else posixpath.dirname(prefix)
                resolved = posixpath.normpath(posixpath.join(base, target.lstrip('/')))
                need(resolved not in ('', '.', '..') and not resolved.startswith('../'), 'Q05_IMAGE_ALIAS_ESCAPES_ROOT')
                canonical_name(resolved)
                chain.append({'path': prefix, 'type': row['type'], 'target': target, 'resolved': resolved})
                current = posixpath.join(resolved, *parts[index:])
                break
        else:
            return objects.get(current), chain
    raise Refusal('Q05_IMAGE_ALIAS_DEPTH')


def same_object(a, b):
    return a is not None and b is not None and {k:v for k,v in a.items() if k != 'path'} == {k:v for k,v in b.items() if k != 'path'}


def classify_backend_views(old, new):
    a = {r['path']: r for r in old['members']}; b = {r['path']: r for r in new['members']}
    changes = []
    for name in sorted(set(a) | set(b)):
        ra, rb = a.get(name), b.get(name)
        rule = 'EXACT_FILESYSTEM_OBJECT_EQUAL' if ra == rb else 'UNCLASSIFIED_BACKEND_OBJECT_DIFFERENCE'
        witness = None
        if ra is not None and ra != rb:
            resolved, chain = resolve_object(b, name)
            if chain and same_object(ra, resolved):
                rule = 'ROOT_CONTAINED_IDENTICAL_OBJECT_ALIAS_REQUIRES_NATIVE_RESOLUTION'
                witness = {'targetPath': resolved['path'], 'chain': chain,
                           'targetObjectSHA256': digest_bytes(canonical_json(resolved)),
                           'requiredNativeProbe': 'PROTECTED_BACKEND_ALIAS_RESOLUTION'}
        changes.append({'oldPath': name if ra else None, 'newPath': name if rb else None,
                        'old': ra, 'new': rb, 'rule': rule, 'witness': witness})
    ca, cb = old['config'].get('config', {}), new['config'].get('config', {})
    runtime_keys = ('Entrypoint', 'Cmd', 'Env', 'User', 'WorkingDir', 'Volumes', 'ExposedPorts', 'Healthcheck', 'StopSignal', 'Labels')
    config_differences = [{'key': k, 'retainedSHA256': digest_bytes(canonical_json(ca.get(k))),
                           'candidateSHA256': digest_bytes(canonical_json(cb.get(k)))} for k in runtime_keys if ca.get(k) != cb.get(k)]
    residual = sum(r['rule'].startswith('UNCLASSIFIED') for r in changes) + len(config_differences)
    return {'role': 'backend', 'retained': old['identity'], 'candidate': new['identity'],
            'oldFiles': len(a), 'newFiles': len(b), 'differences': changes, 'configDifferences': config_differences,
            'unclassifiedCount': residual, 'complete': residual == 0,
            'requiredNativeChecks': ['PROTECTED_BACKEND_ALIAS_RESOLUTION'] if any(x['rule'].startswith('ROOT_CONTAINED') for x in changes) else [],
            'nativeLoadingClaimed': False, 'applicationStarted': False}


def compare_backends(old_path, new_path, old_expected=None, new_expected=None):
    old = backend_inventory(old_path, old_expected); new = backend_inventory(new_path, new_expected)
    return classify_backend_views(old, new)


def summarize(roles):
    need(set(roles) == set(ROLES), 'Q05_ALL_THREE_PACKAGES_REQUIRED')
    return {'schema': SCHEMA, 'complete': all(roles[r]['complete'] for r in ROLES),
            'roles': roles, 'unclassifiedCount': sum(roles[r]['unclassifiedCount'] for r in ROLES),
            'method': 'Actual complete retained/current archive and final filesystem comparison; exact typed dispositions only.',
            'applicationStarted': False, 'nativeQualificationClaimed': False, 'A5AcceptanceClaimed': False}


ACCEPTED_RULES = {'EXACT_BYTES_EQUAL', 'EXACT_OBSERVED_BUILD_ID_SUBSTITUTION', 'JSON_OBJECT_SERIALIZATION_ONLY',
                  'GLOBAL_JS_GRAPH_AND_FULL_AST_EQUAL', 'SELF_INDEX_RECOMPUTED_FROM_COMPLETE_VERIFIED_MEMBERS',
                  'EXACT_FILESYSTEM_OBJECT_EQUAL', 'ROOT_CONTAINED_IDENTICAL_OBJECT_ALIAS_REQUIRES_NATIVE_RESOLUTION',
                  'NONRUNTIME_BUILD_EVIDENCE_ATTRIBUTED', 'SOURCE_BOUND_RECONSTRUCTION_RELEASE_METADATA',
                  'EXACT_STANDALONE_TEMPLATE_WITH_TYPED_BUILD_FIELDS', 'EXACT_LAUNCHER_DIAGNOSTIC_AND_EXPORT_GROUPING',
                  'TYPED_GENERATED_JSON_REFERENCE_EQUALITY', 'TYPED_FLIGHT_OR_HTML_REFERENCE_EQUALITY',
                  'EXACT_BUILD_RECIPE_EXCLUDED_FROM_RUNTIME_CONTEXT'}


def _typed_witness(x, r, javascript_sha=None, javascript_pairs=None):
    rule, w = x['rule'], x.get('witness')
    need(isinstance(w, dict), 'Q05_TYPED_WITNESS_REQUIRED')
    path = x.get('oldPath') or x.get('newPath')
    if rule == 'GLOBAL_JS_GRAPH_AND_FULL_AST_EQUAL':
        js = r.get('javascriptProof', {})
        need(js.get('status') == 'PASS_GLOBAL_JS_GRAPH_AND_FULL_AST'
             and w.get('graphSHA256') == javascript_sha, 'Q05_JS_PROOF_BINDING')
        pairs = [javascript_pairs[x['oldPath']]] if x['oldPath'] in javascript_pairs else []
        need(len(pairs) == 1, 'Q05_JS_PAIR_REQUIRED')
        p = pairs[0]
        need(p.get('newPath') == x['newPath'] and p.get('oldSHA256') == x['old']['sha256'] and p.get('newSHA256') == x['new']['sha256']
             and p.get('normalizedOldSHA256') == p.get('normalizedNewSHA256') == w.get('normalizedASTSHA256')
             and SHA.fullmatch(w.get('normalizedASTSHA256', '')), 'Q05_JS_PAIR_CONTENT_BINDING')
        return
    if rule == 'EXACT_OBSERVED_BUILD_ID_SUBSTITUTION':
        need(path.startswith('app/.next/') and set(w) == {'normalizedSHA256'}
             and set(r.get('buildIds', {})) == {'old', 'new'}, 'Q05_BUILD_ID_WITNESS')
    elif rule == 'JSON_OBJECT_SERIALIZATION_ONLY':
        need(path.endswith('.json') and set(w) == {'canonicalSHA256'}, 'Q05_JSON_SERIALIZATION_WITNESS')
    elif rule == 'NONRUNTIME_BUILD_EVIDENCE_ATTRIBUTED':
        allowed = {'README.txt', 'provenance/build-preflight.json', 'provenance/build-inputs.json', 'provenance/build.log',
                   'provenance/identity-test.log', 'provenance/sharp-remedy.log', 'provenance/sharp-versions.log',
                   'provenance/toolchain-acquisition.json', 'provenance/candidate-secret-scan.json'}
        need(path in allowed and w.get('policy') == 'FINITE_OUTSIDE_APP_PROVENANCE_V1' and w.get('runtimePath') is False
             and w.get('sourceSHA256') == digest_bytes(canonical_json(r['source']))
             and SHA.fullmatch(w.get('toolchainSHA256', '')), 'Q05_NONRUNTIME_PROVENANCE_WITNESS')
        need(all(row is None or row['type'] == 'file' and row['mode'] & 0o111 == 0 for row in (x['old'], x['new'])), 'Q05_EXECUTABLE_PROVENANCE_REFUSED')
        return
    elif rule == 'SOURCE_BOUND_RECONSTRUCTION_RELEASE_METADATA':
        need(path == 'release.json' and w.get('policy') == 'RECONSTRUCTION_PROVENANCE_FIELDS_V1'
             and all(w.get(k) is True for k in ('sourceIdentical', 'toolchainIdentical', 'backendBindingsRequireBackendRoleProof')), 'Q05_RELEASE_METADATA_WITNESS')
    elif rule == 'EXACT_STANDALONE_TEMPLATE_WITH_TYPED_BUILD_FIELDS':
        need(path == 'app/server.js' and w.get('policy') == 'EXACT_STANDALONE_TEMPLATE_BUILD_FIELDS_V1'
             and w.get('oldCPUs') == 8 and w.get('newCPUs') == 3 and w.get('runtimeResourceBoundChanged') is False, 'Q05_STANDALONE_CONFIG_WITNESS')
    elif rule == 'EXACT_LAUNCHER_DIAGNOSTIC_AND_EXPORT_GROUPING':
        need(path == 'launch.sh' and w.get('policy') == 'FINITE_POSIX_EXPORT_AND_REQUIRED_PARAMETER_V1', 'Q05_LAUNCHER_WITNESS')
    elif rule == 'TYPED_GENERATED_JSON_REFERENCE_EQUALITY':
        need(path.startswith('app/.next/') and path.endswith('.json') and w.get('policy') == 'TYPED_NEXT_GENERATED_JSON_V1', 'Q05_GENERATED_JSON_WITNESS')
        if path.endswith('.nft.json'):
            need(w.get('traceFilesSemantics') == 'COMPLETE_UNIQUE_DEPENDENCY_SET' and w.get('traceTargetsExist') is True
                 and type(w.get('traceReferences')) is int and w['traceReferences'] >= 0, 'Q05_TRACE_SET_WITNESS')
        if path.endswith('prerender-manifest.json') or path.endswith('middleware-manifest.json'):
            need(w.get('previewRotation') == 'ARTIFACT_LOCAL_EXACT_SHAPE_AND_MIDDLEWARE_BINDING', 'Q05_PREVIEW_WITNESS')
        if path.endswith('server-reference-manifest.json'): need(w.get('actionKeyRotation') == 'BOTH_SERVER_ACTION_MAPS_EMPTY', 'Q05_ACTION_MAP_WITNESS')
    elif rule == 'TYPED_FLIGHT_OR_HTML_REFERENCE_EQUALITY':
        need(path.startswith('app/.next/') and path.endswith(('.rsc', '.html')), 'Q05_FLIGHT_PATH_WITNESS')
        from frontend_semantics import validate_witness
        need(validate_witness(w, path, x['old']['sha256'], x['new']['sha256'], r['javascriptProof']), 'Q05_FLIGHT_TYPED_WITNESS')
        return
    else: raise Refusal('Q05_TYPED_RULE_UNKNOWN')
    key = 'canonicalSHA256' if rule == 'JSON_OBJECT_SERIALIZATION_ONLY' else 'normalizedSHA256'
    need(SHA.fullmatch(w.get(key, '')), 'Q05_NORMALIZED_CONTENT_DIGEST_REQUIRED')


def _frozen_disposition(x, role):
    """Bind non-byte-equality policy results to exact reviewed actual inputs.

    A digest-shaped assertion is not a reproducible comparison. This index was
    generated by the complete retained/current comparison and is source-pinned;
    it admits only its exact role/path/input/output/witness record. The current
    runner separately rehashes every candidate object before admission.
    """
    global _DISPOSITIONS
    if _DISPOSITIONS is None:
        path = Path(__file__).resolve().parent / 'frontend-disposition-index.json'
        need(SHA.fullmatch(FROZEN_DISPOSITIONS_SHA256 or '') and path.is_file() and not path.is_symlink()
             and path.stat().st_size <= 2 * 1024 ** 2 and digest_file(path) == FROZEN_DISPOSITIONS_SHA256,
             'Q05_REVIEWED_DISPOSITION_INDEX_REQUIRED')
        data = json.loads(path.read_bytes())
        need(data.get('schema') == 'work8-v84-frontend-disposition-index-v1' and set(data.get('roles', {})) == {'normal', 'recovery'},
             'Q05_DISPOSITION_INDEX_SCHEMA')
        _DISPOSITIONS = data['roles']
    key = digest_bytes(canonical_json([x['oldPath'], x['newPath']]))
    need(_DISPOSITIONS.get(role, {}).get(key) == digest_bytes(canonical_json(x)), 'Q05_UNREVIEWED_DISPOSITION_BYTES_OR_WITNESS')


def require_complete(proof):
    """Validate full typed coverage, not a caller's boolean PASS assertion."""
    need(proof.get('schema') == SCHEMA and set(proof.get('roles', {})) == set(ROLES), 'Q05_COMPLETE_PROOF_SCHEMA')
    total = 0
    for role in ROLES:
        r = proof['roles'][role]
        need(r.get('role') == role and r.get('complete') is True and r.get('unclassifiedCount') == 0, 'Q05_UNCLASSIFIED_PACKAGE_DIFFERENCE')
        need(not r.get('configDifferences'), 'Q05_BACKEND_CONFIG_DIFFERENCE')
        rows = r.get('differences', [])
        old_paths = [x['oldPath'] for x in rows if x.get('oldPath')]
        new_paths = [x['newPath'] for x in rows if x.get('newPath')]
        need(len(old_paths) == len(set(old_paths)) == r['oldFiles'] and len(new_paths) == len(set(new_paths)) == r['newFiles'], 'Q05_DIFFERENCE_COVERAGE')
        objects = {x['new']['path']: x['new'] for x in rows if x.get('new') is not None}
        js = r.get('javascriptProof')
        js_sha = digest_bytes(canonical_json(js)) if js else None
        js_pairs = {p['oldPath']: p for p in js.get('filePairs', [])} if js else {}
        if role == 'backend' and r.get('requiredNativeChecks'):
            alias = r.get('aliasSourceWitness', {})
            need(alias.get('schema') == 'work8-v84-independent-alias-import-relocation-closure-v1'
                 and alias.get('status') == 'PASS_SCOPED_ALIAS_IMPORT_AND_RELOCATION_CLOSURE'
                 and alias.get('retainedArchiveSHA256') == r['retained']['sha256']
                 and alias.get('candidateArchiveSHA256') == r['candidate']['sha256']
                 and alias.get('retainedInventorySHA256') == r['retained']['inventorySHA256']
                 and alias.get('candidateInventorySHA256') == r['candidate']['inventorySHA256']
                 and alias.get('sameProcessMixedAliasIdentity') is False
                 and alias.get('relocationSensitiveApplicationUse') is False
                 and alias.get('unresolvedDependencyFallback') is False
                 and alias.get('applicationExecuted') is False
                 and alias.get('requiredNativeProbe') == 'PROTECTED_BACKEND_ALIAS_RESOLUTION',
                 'Q05_ALIAS_IMPORT_AND_RELOCATION_CLOSURE_REQUIRED')
            need(SHA.fullmatch(r.get('aliasSourceWitnessSHA256', ''))
                 and digest_bytes(canonical_json(alias)) == r['aliasSourceWitnessSHA256'], 'Q05_ALIAS_SOURCE_WITNESS_BINDING')
            coverage = alias.get('sourceCoverage', {})
            need(coverage.get('parseFailures') == 0 and coverage.get('allInputBytesHashChecked') is True
                 and coverage.get('pillowCompiledFiles') == 7849 and coverage.get('reachableApplicationAndOperatorFiles') == 9872
                 and coverage.get('reachableInternalEdges') == 21186 and coverage.get('reachableBarePillowImports') == 336
                 and coverage.get('directCanonicalPillowImportsInReviewedGraph') == 0
                 and len(alias.get('toolAliases', [])) == 17
                 and all(x.get('executionClaimed') is False and x.get('universalCliSemanticsClaimed') is False for x in alias['toolAliases']),
                 'Q05_FINITE_ALIAS_GRAPH_AND_TOOLING_SCOPE_REQUIRED')
        if js is not None:
            pairs = js.get('filePairs', [])
            need(js.get('status') == 'PASS_GLOBAL_JS_GRAPH_AND_FULL_AST'
                 and len({p['oldPath'] for p in pairs}) == len({p['newPath'] for p in pairs}) == len(pairs), 'Q05_JS_FULL_FILE_BIJECTION')
            mappings = js.get('mapping', [])
            need(len({p['old'] for p in mappings}) == len({p['new'] for p in mappings}) == len(mappings), 'Q05_JS_GLOBAL_REFERENCE_BIJECTION')
        for x in rows:
            need(x.get('rule') in ACCEPTED_RULES, 'Q05_UNSUPPORTED_DISPOSITION')
            if js is not None and x.get('oldPath', '') and x['oldPath'].endswith('.nft.json'):
                need(x['rule'] == 'TYPED_GENERATED_JSON_REFERENCE_EQUALITY', 'Q05_ALL_TRACE_REFERENCE_CLOSURE_REQUIRED')
            if js is not None and x.get('oldPath', '') and x['oldPath'].startswith('app/.next/') and x['oldPath'].endswith(('.rsc', '.html')):
                need(x['rule'] == 'TYPED_FLIGHT_OR_HTML_REFERENCE_EQUALITY', 'Q05_ALL_FLIGHT_REFERENCE_CLOSURE_REQUIRED')
            need(x.get('old') is not None or x['rule'] == 'NONRUNTIME_BUILD_EVIDENCE_ATTRIBUTED', 'Q05_OLD_MEMBER_REQUIRED')
            if x['rule'] == 'NONRUNTIME_BUILD_EVIDENCE_ATTRIBUTED':
                _typed_witness(x, r, js_sha, js_pairs); _frozen_disposition(x, role); continue
            if x['rule'] == 'EXACT_BUILD_RECIPE_EXCLUDED_FROM_RUNTIME_CONTEXT':
                w = r.get('buildRecipeWitness', {})
                removed = w.get('removedObject', {})
                need(role == 'backend' and x['oldPath'] == 'app/Dockerfile' and x['new'] is None
                     and x['newPath'] is None and x['old']['sha256'] == removed.get('sha256')
                     and x['old']['bytes'] == removed.get('bytes') == 1077
                     and x['old']['mode'] == removed.get('mode') == 420 and x['old']['uid'] == x['old']['gid'] == 0,
                     'Q05_BUILD_RECIPE_EXACT_OBJECT')
                need(w.get('schema') == 'work8-v84-removed-backend-build-recipe-witness-v1'
                     and w.get('status') == 'PASS_SCOPED_BUILD_ONLY_REMOVAL_CLASSIFICATION'
                     and w.get('candidateObjectAbsent') is True and w.get('sourceProvenance', {}).get('exactByteMatch') is True
                     and w['sourceProvenance'].get('renderedSHA256') == removed['sha256']
                     and w['candidateArchive']['sha256'] == r['candidate']['sha256']
                     and w['retainedArchive']['sha256'] == r['retained']['sha256']
                     and x.get('witness', {}).get('independentWitnessSHA256') == digest_bytes(canonical_json(w)),
                     'Q05_BUILD_RECIPE_SOURCE_WITNESS')
                continue
            if x['rule'] == 'ROOT_CONTAINED_IDENTICAL_OBJECT_ALIAS_REQUIRES_NATIVE_RESOLUTION':
                need(role == 'backend' and 'PROTECTED_BACKEND_ALIAS_RESOLUTION' in r.get('requiredNativeChecks', []), 'Q05_ALIAS_NATIVE_CONDITION_REQUIRED')
                resolved, chain = resolve_object(objects, x['oldPath'])
                w = x.get('witness', {})
                need(same_object(x['old'], resolved) and chain == w.get('chain') and resolved['path'] == w.get('targetPath')
                     and digest_bytes(canonical_json(resolved)) == w.get('targetObjectSHA256')
                     and w.get('requiredNativeProbe') == 'PROTECTED_BACKEND_ALIAS_RESOLUTION', 'Q05_ALIAS_OBJECT_WITNESS_INVALID')
                continue
            need(x.get('new') is not None, 'Q05_NEW_MEMBER_REQUIRED')
            if x['rule'] == 'SELF_INDEX_RECOMPUTED_FROM_COMPLETE_VERIFIED_MEMBERS':
                need(role != 'backend' and x['oldPath'] == x['newPath'] == 'MEMBERS.json', 'Q05_INDEX_DISPOSITION_PATH')
            if x['rule'] == 'EXACT_FILESYSTEM_OBJECT_EQUAL': need(x['old'] == x['new'], 'Q05_FALSE_OBJECT_EQUALITY')
            if x['rule'] == 'EXACT_BYTES_EQUAL':
                need(x['old']['sha256'] == x['new']['sha256'] and x['old']['bytes'] == x['new']['bytes'], 'Q05_FALSE_BYTE_EQUALITY')
            if x['rule'] not in ('EXACT_FILESYSTEM_OBJECT_EQUAL', 'EXACT_BYTES_EQUAL', 'SELF_INDEX_RECOMPUTED_FROM_COMPLETE_VERIFIED_MEMBERS'):
                _typed_witness(x, r, js_sha, js_pairs)
                if js is not None and x['rule'] not in ('GLOBAL_JS_GRAPH_AND_FULL_AST_EQUAL', 'TYPED_FLIGHT_OR_HTML_REFERENCE_EQUALITY'):
                    _frozen_disposition(x, role)
            if role != 'backend':
                need(x['old']['extractedMode'] == x['new']['extractedMode'], 'Q05_FRONTEND_EXECUTABLE_MODE_CHANGED')
                if x['rule'] != 'GLOBAL_JS_GRAPH_AND_FULL_AST_EQUAL':
                    old_path = x['oldPath'].replace('/' + r['buildIds']['old'] + '/', '/<NEXT_BUILD_ID>/')
                    new_path = x['newPath'].replace('/' + r['buildIds']['new'] + '/', '/<NEXT_BUILD_ID>/')
                    need(old_path == new_path, 'Q05_UNPROVED_FILE_RELOCATION')
        for side in ('old', 'new'):
            inventory = sorted((x[side] for x in rows if x[side] is not None), key=lambda x:x['path'])
            expected = r['retained' if side == 'old' else 'candidate']['inventorySHA256']
            need(inventory_digest(inventory) == expected, 'Q05_COMPLETE_INVENTORY_DIGEST')
        total += len(rows)
    need(proof.get('complete') is True and proof.get('unclassifiedCount') == 0, 'Q05_COMPLETE_STATUS_REQUIRED')
    return total


def read_static_proof(proof_path, expected_proof_sha):
    """Pre-provider admission of immutable, complete, independently reviewed Q05 evidence."""
    need(SHA.fullmatch(expected_proof_sha or '') is not None, 'Q05_REVIEWED_PROOF_PIN_REQUIRED')
    p = Path(proof_path)
    need(p.is_absolute() and p.resolve() == p and p.is_file() and not p.is_symlink() and p.stat().st_size <= MAX_PROOF, 'Q05_PROOF_FILE_BOUND')
    need(digest_file(p) == expected_proof_sha, 'Q05_PROOF_DIGEST')
    if p.name.endswith('.json.gz'):
        with gzip.open(p, 'rb') as stream:
            data = stream.read(MAX_PROOF + 1)
        need(len(data) <= MAX_PROOF, 'Q05_PROOF_EXPANSION_BOUND')
    else:
        data = p.read_bytes()
    proof = json.loads(data)
    require_complete(proof)
    if any(proof['roles'][r].get('javascriptProof') is not None for r in ('normal', 'recovery')):
        checkers = proof.get('comparisonCheckers', {})
        need(set(checkers) == {'package_applicability.py', 'frontend_semantics.py', 'q05_js_semantics.cjs', 'q05-acorn.js',
                              'frontend-generated-witness-index.json', 'frontend-disposition-index.json'},
             'Q05_COMPLETE_COMPARISON_CHECKERS_REQUIRED')
        for name, sha in checkers.items():
            code = p.parent / name
            need(SHA.fullmatch(sha or '') and code.is_file() and not code.is_symlink()
                 and code.stat().st_size <= 2 * 1024 ** 2 and digest_file(code) == sha, 'Q05_COMPARISON_CHECKER_CHANGED')
        for role in ('normal', 'recovery'):
            js = proof['roles'][role]['javascriptProof']
            need(js.get('analyzerSHA256') == checkers['q05_js_semantics.cjs'] and js.get('parserSHA256') == checkers['q05-acorn.js'], 'Q05_JS_ANALYZER_SOURCE_BINDING')
    checks = proof['roles']['backend'].get('requiredNativeChecks', [])
    need(set(checks) <= {'PROTECTED_BACKEND_ALIAS_RESOLUTION'}, 'Q05_UNKNOWN_NATIVE_CONDITION')
    if checks:
        witness = proof['roles']['backend']['aliasSourceWitness']
        source_root = p.parent.parent
        bindings = witness.get('qualificationSourceBindings', [])
        need(len(bindings) >= 7, 'Q05_REVIEWED_COMMAND_SOURCE_BINDINGS_REQUIRED')
        for binding in bindings:
            name = canonical_name(binding['path'])
            need(name.startswith('v84/source/'), 'Q05_REVIEWED_COMMAND_SOURCE_PATH')
            source_file = source_root / name.removeprefix('v84/source/')
            need(source_file.resolve() == source_file and source_file.is_file() and not source_file.is_symlink()
                 and source_file.stat().st_size == binding['bytes'] and digest_file(source_file) == binding['sha256'],
                 'Q05_REVIEWED_QUALIFICATION_COMMAND_CHANGED')
        spec = proof.get('requiredNativeProbeSpec', {})
        need(spec.get('path') == 'backend-alias-probe-spec.json' and SHA.fullmatch(spec.get('sha256','')), 'Q05_NATIVE_PROBE_SPEC_REQUIRED')
        sp = p.parent / spec['path']
        need(sp.is_file() and not sp.is_symlink() and sp.stat().st_size <= 32768 and digest_file(sp) == spec['sha256'], 'Q05_NATIVE_PROBE_SPEC_PIN_CHANGED')
        observed = json.loads(sp.read_bytes())
        need(observed.get('schema') == 'work8-v84-backend-alias-probe-spec-v1'
             and observed.get('candidateArchiveSHA256') == proof['roles']['backend']['candidate']['sha256']
             and observed.get('candidateImage') == proof['roles']['backend']['candidate']['image']
             and observed.get('applicationImportAllowed') is False and observed.get('providerCredentialsAllowed') is False,
             'Q05_NATIVE_PROBE_CANDIDATE_BINDING')
    return proof


def admit_applicability(prepared, proof_path, expected_proof_sha):
    """Current-run readback of every candidate member against frozen comparison.

    The expected digest must come from independently reviewed immutable source,
    not from an untrusted downloaded proof alongside the artifacts. A missing or
    incomplete offline comparison refuses before native/application admission.
    """
    proof = read_static_proof(proof_path, expected_proof_sha); count = require_complete(proof)
    if isinstance(prepared, dict):
        # Pure local fixtures may supply exact paths directly. Production uses
        # the prepared root and its already bound candidate manifest below.
        archives = prepared
    else:
        root = Path(prepared)
        need(root.is_absolute() and root.resolve() == root and root.is_dir() and not root.is_symlink(), 'Q05_PREPARED_ROOT_REQUIRED')
        mp = root / 'v65-packages.json'
        need(mp.is_file() and not mp.is_symlink() and mp.stat().st_size <= 1024 * 1024, 'Q05_PREPARED_MANIFEST_REQUIRED')
        manifest = json.loads(mp.read_bytes())
        pins = {'backend': manifest['backend'], **manifest['frontends']}
        need(set(pins) == set(ROLES), 'Q05_MANIFEST_ROLES')
        archives = {}
        for role, pin in pins.items():
            name = canonical_name(pin['file'])
            need('/' not in name and {k:pin[k] for k in ('bytes','sha256')} == {k:proof['roles'][role]['candidate'][k] for k in ('bytes','sha256')}, 'Q05_MANIFEST_PROOF_BINDING')
            archives[role] = root / 'artifacts' / name
    need(set(archives) == set(ROLES), 'Q05_CURRENT_ARCHIVES_REQUIRED')
    readback = {}
    for role in ROLES:
        entry = proof['roles'][role]
        if role == 'backend':
            actual = backend_inventory(archives[role], entry['candidate'])
            identity, rows = actual['identity'], actual['members']
        else:
            current = FrontendArchive(archives[role], entry['candidate'])
            try: identity, rows = current.identity, [current.rows[n] for n in sorted(current.rows)]
            finally: current.close()
        expected_rows = sorted((r['new'] for r in entry['differences'] if r['new'] is not None), key=lambda r:r['path'])
        need(rows == expected_rows and identity == entry['candidate'], 'Q05_CURRENT_PACKAGE_INVENTORY_CHANGED')
        readback[role] = {'archiveSHA256': identity['sha256'], 'inventorySHA256': identity['inventorySHA256'], 'objectsVerified': len(rows)}
    return {'schema': 'work8-v84-q05-current-readback-v1', 'status': 'PASS_COMPLETE_REVIEWED_DIFFERENCES_AND_CURRENT_BYTES',
            'proofSHA256': expected_proof_sha, 'dispositionsVerified': count, 'roles': readback,
            'requiredNativeChecks': proof['roles']['backend'].get('requiredNativeChecks', []),
            'requiredNativeProbeSpecSHA256': proof.get('requiredNativeProbeSpec', {}).get('sha256'),
            'finalQualificationGranted': False,
            'nativeQualificationClaimed': False, 'applicationStarted': False, 'A5AcceptanceClaimed': False}


def finalize_applicability(static, alias_receipt, probe_spec_sha):
    """Join the source-bound static comparison to the actual restricted probe."""
    need(static.get('status') == 'PASS_COMPLETE_REVIEWED_DIFFERENCES_AND_CURRENT_BYTES', 'Q05_STATIC_ADMISSION_REQUIRED')
    checks = static.get('requiredNativeChecks', [])
    need(set(checks) <= {'PROTECTED_BACKEND_ALIAS_RESOLUTION'}, 'Q05_UNKNOWN_NATIVE_CONDITION')
    if checks:
        need(isinstance(alias_receipt, dict) and alias_receipt.get('status') == 'PASS_PROTECTED_BACKEND_ALIAS_RESOLUTION'
             and alias_receipt.get('schema') == 'work8-v84-backend-alias-qualification-v1'
             and probe_spec_sha == static.get('requiredNativeProbeSpecSHA256')
             and alias_receipt.get('probeSpecSHA256') == probe_spec_sha
             and alias_receipt.get('archiveSHA256') == static['roles']['backend']['archiveSHA256']
             and alias_receipt.get('applicationStarted') is False and alias_receipt.get('applicationImported') is False
             and alias_receipt.get('metadataOnly') is True and alias_receipt.get('wholeRowsAccepted') == [], 'Q05_ACTUAL_ALIAS_OBSERVATION_REQUIRED')
        need(all(SHA.fullmatch(alias_receipt.get(k, '')) for k in ('observationSHA256', 'nativeQualificationSHA256',
                 'runtimeImageProvenanceSHA256', 'runnerIdentitySHA256')),
             'Q05_NATIVE_SECURITY_RECEIPT_CHAIN_REQUIRED')
    return {'schema':'work8-v84-q05-final-admission-v1', 'status':'PASS_COMPLETE_STATIC_AND_REQUIRED_NATIVE_APPLICABILITY',
            'proofSHA256':static['proofSHA256'], 'roles':static['roles'], 'requiredNativeChecks':checks,
            'backendAliasReceiptSHA256':digest_bytes(canonical_json(alias_receipt)) if checks else None,
            'applicationStarted':False,'A5AcceptanceClaimed':False}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--inputs', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    config = json.loads(args.inputs.read_text())
    roles = {}
    for role in ROLES:
        i = config[role]
        print(json.dumps({'stage': role, 'status': 'STARTED', 'applicationStarted': False}), flush=True)
        if role == 'backend': roles[role] = compare_backends(Path(i['retained']), Path(i['candidate']), i.get('retainedIdentity'), i.get('candidateIdentity'))
        else: roles[role] = compare_frontends(Path(i['retained']), Path(i['candidate']), role, i.get('retainedIdentity'), i.get('candidateIdentity'), json.loads(Path(i['javascript']).read_text()) if i.get('javascript') else None)
        print(json.dumps({'stage': role, 'status': 'COMPARISON_COMPLETE', 'unclassifiedCount': roles[role]['unclassifiedCount'], 'applicationStarted': False}), flush=True)
    result = summarize(roles)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'complete': result['complete'], 'unclassifiedCount': result['unclassifiedCount'], 'roleCounts': {k:v['unclassifiedCount'] for k,v in roles.items()}, 'applicationStarted': False}))
    return 0 if result['complete'] else 2


if __name__ == '__main__':
    raise SystemExit(main())

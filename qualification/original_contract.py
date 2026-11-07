#!/usr/bin/env python3
"""Re-admit the exact completed reconstruction evidence, without rebuilding.

This verifier supplies Q01-Q03 operands to the complete qualification sequence.
It does not grant Q04/Q05, native-security, Brain, or application acceptance.
The historical source observations retain their historical run/commit identity.
Current package provenance and every immutable lock are read from actual bytes.
"""
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import stat
import sys
import tarfile

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent
BUILD = SOURCE / 'v65/build'
ARTIFACT_SHA256 = '39f904154764d2e70413045c7ebefbd4c04f38d0e09360ea19b2834fcc3ef755'
PACKAGE_MANIFEST_SHA256 = 'ec74f2565b34867d6164382a666f429ad998fec2bb57a98e540d19e1b9665fa4'
HISTORICAL_WORKFLOW_COMMIT = '87428f7fd4977a0669e8cff90242a784e9947a34'
HISTORICAL_RUN_ID = 41860150363
HISTORICAL_JOB_ID = 126679410501
HISTORICAL_RECIPE_SHA256 = {
 'v65/build/reconstruct-backend.py':'3ba7911d5cb5fe89d76bcd48adc0ca5c35e0e19814eed1de89275a21c432087e',
 'v65/build/reconstruct_frontends.py':'095d2239a83aaf8054e3df5589aeef9d5de69b2526606a3592ebbba8655e9cb3',
 'v65/build/reconstruct_all.py':'09aed1f149aff6aed1e4758919283486c6c11eed1927c80dbb9ff53cd647bf01',
 'v65/build/component_checkpoints.py':'cbd24d856919a1779d9668f97358b79535e1d422f4eb3d308fb2c9eac76a9dbb',
}
FRONTEND_LOCK_BLOB = 'da23c5f7d5e54174f467a2090078ee2cd141b6e1'
FRONTEND_LOCK_SHA256 = '84f99595b7564d9196b0eeb25c054b290801bfe2e3a148f61ab2c9c2871d37b4'
BACKEND_ROOT_LOCK = {'path':'package-lock.json','bytes':68427,'gitBlob':'fbd0c81a86377a4209e45a60ffac5590aed2dd3b','sha256':'29750bccbf14c72b9bdccfe03a041a525c7e84f32005a973b5bd3bf16c4ab04d'}
SOURCES = {
 'backend': {'commit':'6c1e63ba20619ee480742fd87dc810ca93152e22','tree':'a78aa0e0a91c1e765afb23e70fe05c75cddc836e'},
 'normal': {'commit':'750483b3152f2c9c65a65b6381c8c94f081b9eb1','tree':'f589a8f0f94fbcdf113f162abac11d03c19acc25'},
 'recovery': {'commit':'94d34cab7b0739849839ea3c66e50c8fdd3a2b27','tree':'5da61811a035b9504d74f699df8b164cc7f9f0ac'},
}
PROBES = {'sharp-native-load':'0.34.5','node-runtime-version':'v22.23.2','next-package-version':'16.2.9','sharp-binary-package-version':'0.34.5','libvips-package-version':'1.2.4'}
# Populated from the already independently verified exact V75 45-file export.
# The source manifest binds this complete constant, not a mutable caller index.
EXPECTED_METADATA = {'component-checkpoint-summary.json': {'bytes': 6759, 'sha256': 'e9dcdedc3a87e1b082d36e734ef6127579bf19f974181bb30c1e0bcb3cab7006'}, 'components/backend/checkpoint.json': {'bytes': 1208, 'sha256': '9a278911ce6a231bbc76b5a2867da699818a42dd1b85f06ac9caeefaca056d5b'}, 'components/backend/receipts/backend-build-result.json': {'bytes': 8362, 'sha256': '02a3b878cf6ec0f47b2d8b06724201abb92388accdb7f0f911472bf8fae1f477'}, 'components/backend/receipts/backend-manifest.json': {'bytes': 531, 'sha256': 'f5474546c205b9bf7dd3302b571c616926f02098b31d2db0d51959c63a553d95'}, 'components/backend/receipts/backend-packaging-removal.json': {'bytes': 2492, 'sha256': '5367c9e49a4cedb1f47530f9703b34afa9e3de7e41f353c51e0d64b730b4fdec'}, 'components/backend/scan.json': {'bytes': 1734, 'sha256': '84751ba614ac76fcd9fb8b0da2ef73d83512a0239d032bc6969605cae28ebaa1'}, 'components/normal/checkpoint.json': {'bytes': 2774, 'sha256': 'bdceadd7b1652d6af3823951a1ad667aabab315087b5e92a22fbe70b4fac2bc6'}, 'components/normal/receipts/normal-component-build.json': {'bytes': 4260, 'sha256': 'fdaf219eeeb18ff80b067ae1e06e209bee6dae65d5143cf3596ef9d9da60f73d'}, 'components/normal/receipts/normal-libvips-package-version-0.json': {'bytes': 565, 'sha256': 'c2169d002f760353376eda1a490165e24560c37837db51b00df534f8b69c2203'}, 'components/normal/receipts/normal-next-package-version-0.json': {'bytes': 561, 'sha256': '7583c43c4fbd5f2fa4e6799b542ce10b383bfd4a64b2ec9878bfc5e21b3f2800'}, 'components/normal/receipts/normal-node-runtime-version-0.json': {'bytes': 562, 'sha256': 'a55a8474b0567537a53e136b91be7fd26441633c194f9a01c7a947f5f2744771'}, 'components/normal/receipts/normal-sharp-binary-package-version-0.json': {'bytes': 570, 'sha256': '048e6380b7de8e8e333e48d59187e604196fa23f945abe2002295ff8c3b70b15'}, 'components/normal/receipts/normal-sharp-native-load-0.json': {'bytes': 559, 'sha256': 'a7985d7f1cefaef5fbf0be191fa54de3ee0ea50f563f995fc7a0d54589c28888'}, 'components/normal/receipts/normal-source-clean-0.json': {'bytes': 553, 'sha256': 'f8af1ca2ad31386c0227b0e9fd1f689577fc30a3e1c67e68f348057f80d1bf74'}, 'components/normal/receipts/normal-source-clean-1.json': {'bytes': 553, 'sha256': '3a9b9ca42dc58ae1a2caa7d5ebc26748f7e934cdf7cedf78c28ca9e69684f6ac'}, 'components/normal/receipts/normal-source-clean-2.json': {'bytes': 553, 'sha256': '13ffae331ab669779b0254f004e4fec83238b68a4ca358f4287a77928a80b93a'}, 'components/normal/receipts/normal-source-commit-0.json': {'bytes': 555, 'sha256': 'b28a3910843c73472b4078c627ece78f2896195b848376695ebca5b68e7fa7d5'}, 'components/normal/receipts/normal-source-commit-1.json': {'bytes': 555, 'sha256': 'b28a3910843c73472b4078c627ece78f2896195b848376695ebca5b68e7fa7d5'}, 'components/normal/receipts/normal-source-commit-2.json': {'bytes': 555, 'sha256': 'b28a3910843c73472b4078c627ece78f2896195b848376695ebca5b68e7fa7d5'}, 'components/normal/receipts/normal-source-tree-0.json': {'bytes': 553, 'sha256': '120d68b5380c174baa7c8bb4b8b09d1c8030adbf24ac036f521d77dfb4fd3da9'}, 'components/normal/receipts/normal-source-tree-1.json': {'bytes': 553, 'sha256': '120d68b5380c174baa7c8bb4b8b09d1c8030adbf24ac036f521d77dfb4fd3da9'}, 'components/normal/receipts/normal-source-tree-2.json': {'bytes': 553, 'sha256': '120d68b5380c174baa7c8bb4b8b09d1c8030adbf24ac036f521d77dfb4fd3da9'}, 'components/normal/scan.json': {'bytes': 1348, 'sha256': 'd15aafd412ce27767755949c8ba2132c9151c086cc75fa6839dd4438d0cfa247'}, 'components/recovery/checkpoint.json': {'bytes': 2808, 'sha256': '685dc5a4e09662ca719cb1c9b46af9a0c6c93e392036e1bdea8d1e01fba867db'}, 'components/recovery/receipts/recovery-component-build.json': {'bytes': 6124, 'sha256': '9e1b4897bbdbfdb82700012f4030def74b0a7887841d4a199cfb338b25f88bc7'}, 'components/recovery/receipts/recovery-libvips-package-version-0.json': {'bytes': 567, 'sha256': '2f900941590e5411ab2a25bf9a71416d4c3453c69ef3a3c91143703dbc41183b'}, 'components/recovery/receipts/recovery-next-package-version-0.json': {'bytes': 564, 'sha256': '829e0194d0fd7a02bb5fd0fb4ca76cb109daeb5fa5ae4101314ac5a455cf7b73'}, 'components/recovery/receipts/recovery-node-runtime-version-0.json': {'bytes': 564, 'sha256': '28dcfa34bee1a5e4511699d63e13f875311e357fdaa557c806b13b43af88d733'}, 'components/recovery/receipts/recovery-sharp-binary-package-version-0.json': {'bytes': 572, 'sha256': '10fa6a819cd4010b7ffc54cae54baee6db7d02e6d421d09d42c9db17cefac31b'}, 'components/recovery/receipts/recovery-sharp-native-load-0.json': {'bytes': 561, 'sha256': 'c5550ce3e15665a4f5c0abe80ce0e08ef74fac0f19b1989f0404b7fb41ef5687'}, 'components/recovery/receipts/recovery-source-clean-0.json': {'bytes': 554, 'sha256': '1a78260795fce557242dcdaa0b98ce7785fa1c12fc22c58ba85d0a0d8c5ea4f9'}, 'components/recovery/receipts/recovery-source-clean-1.json': {'bytes': 555, 'sha256': '58dd9fe3a8d00ab1bdebcd1fdc96ae724b4a501d06844c43a03e047d4858355e'}, 'components/recovery/receipts/recovery-source-clean-2.json': {'bytes': 554, 'sha256': 'eb0ae702ea1ef4eed873d46873ec9094ffbf42c9d1d44639b78b4240d46dcd92'}, 'components/recovery/receipts/recovery-source-commit-0.json': {'bytes': 557, 'sha256': '3455f7f9d676d7c82169403ea9fbf33bc9ea20d3755fb52501c006375ea0b564'}, 'components/recovery/receipts/recovery-source-commit-1.json': {'bytes': 557, 'sha256': '3455f7f9d676d7c82169403ea9fbf33bc9ea20d3755fb52501c006375ea0b564'}, 'components/recovery/receipts/recovery-source-commit-2.json': {'bytes': 557, 'sha256': '3455f7f9d676d7c82169403ea9fbf33bc9ea20d3755fb52501c006375ea0b564'}, 'components/recovery/receipts/recovery-source-tree-0.json': {'bytes': 555, 'sha256': '9f046685aebedb70e8e6033ff9eba8c272496b08857c5746221510976ba3b1b4'}, 'components/recovery/receipts/recovery-source-tree-1.json': {'bytes': 555, 'sha256': '9f046685aebedb70e8e6033ff9eba8c272496b08857c5746221510976ba3b1b4'}, 'components/recovery/receipts/recovery-source-tree-2.json': {'bytes': 555, 'sha256': '9f046685aebedb70e8e6033ff9eba8c272496b08857c5746221510976ba3b1b4'}, 'components/recovery/scan.json': {'bytes': 1350, 'sha256': '4435b6a5ea5e43707a383425b1aa3e5b0608faef6c46c3f2613583f56867c418'}, 'package-source-scan.json': {'bytes': 4077, 'sha256': '1c817c2aecfe2cf3cd476a05b1ee099e1c967d85dc3e817cc4520039e94ce805'}}


class Refusal(ValueError):
    pass


def require(ok, code):
    if not ok:
        raise Refusal(code)


def sha_bytes(data):
    return hashlib.sha256(data).hexdigest()


def git_blob(data):
    return hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()


def file_sha(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def canonical_regular(path, maximum=1024*1024):
    path = Path(path)
    s = path.lstat()
    require(path.is_absolute() and path.resolve() == path and stat.S_ISREG(s.st_mode) and s.st_nlink == 1, 'CONTRACT_REGULAR_CANONICAL_FILE_REQUIRED')
    require(0 <= s.st_size <= maximum, 'CONTRACT_FILE_SIZE_BOUND')
    return path


def read_json(path):
    return json.loads(canonical_regular(path).read_bytes())


def exact_manifest(path):
    p = canonical_regular(path)
    require(file_sha(p) == PACKAGE_MANIFEST_SHA256, 'CONTRACT_CANDIDATE_MANIFEST_CHANGED')
    c = read_json(p)
    require(c.get('schema') == 'work8-v65-source-reconstructed-packages-v1' and set(c.get('frontends', {})) == {'normal','recovery'}, 'CONTRACT_THREE_COMPONENTS_REQUIRED')
    for role, pin in [('backend',c['backend']),*c['frontends'].items()]:
        require({k:pin.get(k) for k in ('commit','tree')} == SOURCES[role], 'CONTRACT_SOURCE_IDENTITY_MISMATCH')
    return c


def verify_capture(value, label, output):
    require(value.get('schema') == 'work8-v65-bounded-capture-v1' and value.get('commandLabel') == label, 'CONTRACT_CAPTURE_IDENTITY')
    require(value.get('status') == 'PASS_CAPTURE_ONLY' and value.get('exitCode') == 0 and value.get('streamComplete') is True and value.get('stopCause') is None, 'CONTRACT_CAPTURE_INCOMPLETE')
    require(value.get('stdoutBytes') == len(output) and value.get('stdoutSHA256') == sha_bytes(output), 'CONTRACT_CAPTURE_RESULT_MISMATCH')
    require(value.get('stderrBytes') == 0 and value.get('stderrSHA256') == sha_bytes(b''), 'CONTRACT_CAPTURE_STDERR')
    require(value.get('rawOutputExported') is False and value.get('applicationAcceptance') is False, 'CONTRACT_CAPTURE_SCOPE')


def verify_metadata(metadata_root, candidate):
    """Pure metadata verifier; local use establishes historical evidence only."""
    root = Path(metadata_root)
    require(root.is_absolute() and root.resolve() == root and root.is_dir(), 'CONTRACT_METADATA_ROOT')
    actual = set()
    for p in root.rglob('*'):
        s = p.lstat()
        require(not stat.S_ISLNK(s.st_mode), 'CONTRACT_METADATA_SYMLINK')
        if stat.S_ISDIR(s.st_mode):
            continue
        require(stat.S_ISREG(s.st_mode) and s.st_nlink == 1, 'CONTRACT_METADATA_NONREGULAR')
        actual.add(p.relative_to(root).as_posix())
    require(actual == set(EXPECTED_METADATA), 'CONTRACT_EXACT_METADATA_INVENTORY')
    for name, pin in EXPECTED_METADATA.items():
        p = canonical_regular(root/name)
        require(p.stat().st_size == pin['bytes'] and file_sha(p) == pin['sha256'], 'CONTRACT_HISTORICAL_METADATA_CHANGED')
    summary = read_json(root/'component-checkpoint-summary.json')
    require(summary.get('status') == 'COMPLETE_COMPONENT_CANDIDATES_UNQUALIFIED' and set(summary.get('components',{})) == set(SOURCES) and summary.get('missingComponents') == [], 'CONTRACT_COMPLETE_HISTORICAL_COMPONENTS')
    observations = {}
    specs = {r['name']:r for r in read_json(BUILD/'build-preflight.json')['components']}
    for role in SOURCES:
        component = root/'components'/role
        checkpoint = read_json(component/'checkpoint.json')
        pin = candidate['backend'] if role == 'backend' else candidate['frontends'][role]
        require(checkpoint.get('package') == pin and checkpoint.get('role') == role and checkpoint.get('completeArchiveVerified') is True and checkpoint.get('applicationAcceptance') is False, 'CONTRACT_CHECKPOINT_PACKAGE_BINDING')
        require(summary['components'][role]['checkpointSHA256'] == file_sha(component/'checkpoint.json'), 'CONTRACT_SUMMARY_CHECKPOINT_BINDING')
        for row in checkpoint['sourceReceiptFiles']:
            p = canonical_regular(component/row['file'])
            require(p.stat().st_size == row['bytes'] and file_sha(p) == row['sha256'], 'CONTRACT_COMPONENT_RECEIPT_BINDING')
        if role == 'backend':
            build = read_json(component/'receipts/backend-build-result.json')
            require(build.get('schema') == 'WORK8_V65_BACKEND_RECONSTRUCTION_V1' and build.get('status') == 'BUILT_SOURCE_EQUIVALENCE_CANDIDATE_REQUIRES_INDEPENDENT_RUNTIME_QUALIFICATION', 'CONTRACT_BACKEND_BUILD_RECEIPT')
            require(build.get('package') == pin and {k:build.get(k) for k in ('commit','tree')} == SOURCES[role], 'CONTRACT_BACKEND_BUILD_SOURCE')
            require(build.get('verifiedInputs') == read_json(BUILD/'backend-immutable-inputs/source-metadata.json'), 'CONTRACT_BACKEND_INPUTS_CHANGED')
            require(build.get('baseImage') == 'node:22.23.2-bookworm-slim@sha256:48e4b67d85f87bd551df43704e24d252f56cc5f8e9718841aace50f19948f0f9', 'CONTRACT_BACKEND_BASE_IDENTITY')
            require(build.get('applicationRuntimeStarted') is False and build.get('acceptanceGranted') is False and build.get('automaticRetry') is False, 'CONTRACT_BACKEND_SCOPE')
            observations[role] = {'source':SOURCES[role],'archiveSHA256':pin['sha256'],'buildReceiptSHA256':file_sha(component/'receipts/backend-build-result.json'),'verifiedImmutableInputCount':len(build['verifiedInputs']),'baseImage':build['baseImage'],'freshGitCheckoutClaimed':False}
            continue
        build = read_json(component/f'receipts/{role}-component-build.json')
        require(build.get('schema') == 'work8-v65-frontend-component-build-v1' and build.get('role') == role and build.get('package') == pin and build.get('source') == specs[role], 'CONTRACT_FRONTEND_BUILD_SOURCE')
        require(build.get('applicationRuntimeStarted') is False and build.get('applicationAcceptance') is False, 'CONTRACT_FRONTEND_SCOPE')
        command_rows = {r['step']:r for r in build['commands'] if r['step'].startswith(role+'-')}
        require(set(command_rows) == {role+'-'+suffix for suffix in ('dependencies','sharp-remedy','identity','build')} and all(r.get('exitCode') == 0 for r in command_rows.values()), 'CONTRACT_RECONSTRUCTION_COMMAND_CHAIN')
        for kind, expected in [('source-commit',(SOURCES[role]['commit']+'\n').encode()),('source-tree',(SOURCES[role]['tree']+'\n').encode()),('source-clean',b'')]:
            for n in range(3):
                verify_capture(read_json(component/f'receipts/{role}-{kind}-{n}.json'),role+'-'+kind,expected)
        for name, expected in PROBES.items():
            output=(json.dumps({'value':expected},separators=(',',':'))+'\n').encode()
            verify_capture(read_json(component/f'receipts/{role}-{name}-0.json'),role+'-'+name,output)
        observations[role]={'source':SOURCES[role],'archiveSHA256':pin['sha256'],'buildReceiptSHA256':file_sha(component/f'receipts/{role}-component-build.json'),'sourceCaptureChecks':9,'runtimeCaptureChecks':5,'historicalObservedValues':PROBES,'freshNativeLoadClaimed':False}
    return {'status':'PASS_EXACT_HISTORICAL_RECONSTRUCTION_EVIDENCE','metadataFilesVerified':len(actual),'historicalRunId':HISTORICAL_RUN_ID,'historicalJobId':HISTORICAL_JOB_ID,'historicalWorkflowCommit':HISTORICAL_WORKFLOW_COMMIT,'historicalBuildRecipesSHA256':HISTORICAL_RECIPE_SHA256,'repository':'empireaios/EmpireAI','components':observations,'freshNativeQualificationClaimed':False,'originalReconstructionMainReexecuted':False}


def verify_lock(data, pin):
    require(len(data) == pin.get('bytes',len(data)) and sha_bytes(data) == pin['sha256'] and git_blob(data) == pin['gitBlob'], 'CONTRACT_IMMUTABLE_LOCK_MISMATCH')
    lock = json.loads(data)
    require(isinstance(lock.get('packages'), dict) and lock.get('lockfileVersion') in (2,3), 'CONTRACT_LOCK_FORMAT')
    return {'sha256':sha_bytes(data),'gitBlob':git_blob(data),'bytes':len(data),'lockfileVersion':lock['lockfileVersion'],'lockedPackageEntries':len(lock['packages']),'resolvedIntegrityEntries':sum('integrity' in p for p in lock['packages'].values()),'sourceLockChanged':False}


def read_tar_member(archive, name, maximum=1024*1024):
    rows = [m for m in archive.getmembers() if m.name == name]
    require(len(rows) == 1 and rows[0].isfile() and not rows[0].mode & 0o6000 and 0 <= rows[0].size <= maximum, 'CONTRACT_ARCHIVE_METADATA_MEMBER')
    data = archive.extractfile(rows[0]).read(maximum+1)
    require(len(data) == rows[0].size, 'CONTRACT_ARCHIVE_METADATA_SIZE')
    return data


def verify_frontend_provenance(archive_path, role, pin):
    """Read actual immutable lock/provenance bytes; never execute a package."""
    path = canonical_regular(archive_path,128*1024**2)
    require(path.stat().st_size == pin['bytes'] and file_sha(path) == pin['sha256'], 'CONTRACT_FRONTEND_ARCHIVE_IDENTITY')
    spec = next(r for r in read_json(BUILD/'build-preflight.json')['components'] if r['name'] == role)
    with tarfile.open(path,'r:gz') as archive:
        release = json.loads(read_tar_member(archive,'release.json'))
        inputs = json.loads(read_tar_member(archive,'provenance/build-inputs.json'))
        require(release.get('source') == spec and inputs.get('source') == spec, 'CONTRACT_FRONTEND_PROVENANCE_SOURCE')
        require(inputs.get('toolchain') == read_json(BUILD/'toolchain-acquisition.json'), 'CONTRACT_FRONTEND_TOOLCHAIN_IDENTITY')
        require(inputs.get('build') == release.get('build') and release['build'].get('step') == role+'-build' and release['build'].get('exitCode') == 0, 'CONTRACT_FRONTEND_BUILD_CHAIN')
        require(release.get('nodeVersion') == '22.23.2' and release.get('npmBuildVersion') == '10.9.8', 'CONTRACT_FRONTEND_TOOLCHAIN_VERSION')
        require(release.get('platform') == {'os':'linux','arch':'x64','libc':'glibc','buildHostGlibc':'glibc 2.39'}, 'CONTRACT_FRONTEND_BUILD_PLATFORM')
        require(release.get('component') == role.upper() and release.get('backendImageRequired') == 'sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0', 'CONTRACT_FRONTEND_PACKAGE_ROLE')
        lock_bytes=read_tar_member(archive,'provenance/package-lock.json')
        lock=verify_lock(lock_bytes,{'sha256':FRONTEND_LOCK_SHA256,'gitBlob':FRONTEND_LOCK_BLOB})
        locked=json.loads(lock_bytes)['packages']
        installed=[]
        for member in archive.getmembers():
            name=member.name
            if not name.startswith('app/node_modules/') or not name.endswith('/package.json'):
                continue
            package_path=name[len('app/'):-len('/package.json')]
            tail=package_path.rsplit('node_modules/',1)[-1].split('/')
            if len(tail)!=(2 if tail[0].startswith('@') else 1):
                continue  # Next's vendored compiled manifests are not install roots.
            package=json.loads(read_tar_member(archive,name))
            require(package_path in locked and package.get('version') == locked[package_path].get('version'), 'CONTRACT_FRONTEND_RESOLVED_PACKAGE_VERSION')
            installed.append({'path':package_path,'version':package['version'],'lockIntegrity':locked[package_path].get('integrity')})
        require({'node_modules/next','node_modules/sharp','node_modules/@img/sharp-linux-x64','node_modules/@img/sharp-libvips-linux-x64'} <= {r['path'] for r in installed}, 'CONTRACT_FRONTEND_NATIVE_DEPENDENCIES_REQUIRED')
        contracts=[]
        for item in spec['contracts']:
            data=read_tar_member(archive,'provenance/contracts/'+item['path'])
            require(sha_bytes(data) == item['sha256'], 'CONTRACT_FRONTEND_CAUSAL_SOURCE_CHANGED')
            contracts.append({'path':item['path'],'sha256':sha_bytes(data)})
    return {'role':role,'archiveSHA256':pin['sha256'],'source':SOURCES[role],'lock':lock,'toolchainIdentityVerified':True,'sourceContracts':contracts,'installedPackageVersions':installed,'applicationExecuted':False,'freshLoad':'NOT_EXECUTED_BY_THIS_STATIC_OPERAND'}


def layer_name(value):
    while value.startswith('./'):
        value=value[2:]
    parts=PurePosixPath(value).parts
    require(value and not value.startswith('/') and '..' not in parts and '\\' not in value, 'CONTRACT_BACKEND_LAYER_PATH')
    return value.rstrip('/')


def verify_backend_inputs(archive_path, pin):
    """Resolve immutable source/lock bytes through every ordered OCI layer.

    No image extraction or code execution. Whiteouts and ancestor links refuse
    ambiguous final readback of these required immutable regular files.
    """
    path=canonical_regular(archive_path,512*1024**2)
    require(path.stat().st_size == pin['bytes'] and file_sha(path) == pin['sha256'], 'CONTRACT_BACKEND_ARCHIVE_IDENTITY')
    inputs=read_json(BUILD/'backend-immutable-inputs/source-metadata.json')+[BACKEND_ROOT_LOCK]
    expected={'app/'+row['path']:row for row in inputs}
    values={}
    with tarfile.open(path,'r:gz') as archive:
        manifest=json.loads(read_tar_member(archive,'manifest.json'))
        require(isinstance(manifest,list) and len(manifest)==1,'CONTRACT_SINGLE_BACKEND_IMAGE')
        image=manifest[0]
        config_bytes=read_tar_member(archive,image['Config'])
        require('sha256:'+sha_bytes(config_bytes)==pin['image'],'CONTRACT_BACKEND_CONFIG_IDENTITY')
        config=json.loads(config_bytes)
        require(config.get('os')=='linux' and config.get('architecture')=='amd64','CONTRACT_BACKEND_PLATFORM')
        require(config['config'].get('Labels',{}).get('org.opencontainers.image.revision')==pin['commit'] and config['config'].get('Labels',{}).get('io.empireai.source-tree')==pin['tree'],'CONTRACT_BACKEND_IMAGE_SOURCE')
        require(config['config'].get('Entrypoint')==['node','/app/deployment/locked-runtime.cjs'] and config['config'].get('User')=='0:0' and 'NODE_VERSION=22.23.2' in config['config'].get('Env',[]),'CONTRACT_BACKEND_RUNTIME_CONFIG')
        require(len(image['Layers'])<=32 and len(image['Layers'])==len(set(image['Layers'])),'CONTRACT_BACKEND_LAYERS_BOUND')
        for layer in image['Layers']:
            matches=[m for m in archive.getmembers() if m.name==layer]
            require(len(matches)==1 and matches[0].isfile(),'CONTRACT_BACKEND_LAYER_REQUIRED')
            with tarfile.open(fileobj=archive.extractfile(matches[0]),mode='r|*') as contents:
                for member in contents:
                    if member.isdir() and member.name in ('.','./'):
                        continue
                    name=layer_name(member.name)
                    pp=PurePosixPath(name)
                    if pp.name.startswith('.wh.'):
                        erased=str(pp.parent/pp.name[4:])
                        if pp.name=='.wh..wh..opq':
                            prefix=str(pp.parent)+'/'
                            for key in list(values):
                                if key.startswith(prefix):values.pop(key)
                        else:
                            for key in list(values):
                                if key==erased or key.startswith(erased+'/'):values.pop(key)
                        continue
                    if member.issym() or member.islnk():
                        require(not any(key==name or key.startswith(name+'/') for key in expected),'CONTRACT_BACKEND_REQUIRED_PATH_LINK')
                    if name not in expected:
                        continue
                    require(member.isfile() and not member.mode & 0o6000 and member.size<=1024*1024,'CONTRACT_BACKEND_REQUIRED_REGULAR_INPUT')
                    data=contents.extractfile(member).read(1024*1024+1)
                    require(len(data)==member.size,'CONTRACT_BACKEND_INPUT_SIZE')
                    values[name]=data
    require(set(values)==set(expected),'CONTRACT_BACKEND_INPUT_MISSING')
    receipts=[]
    for name,pin_input in expected.items():
        data=values[name]
        require(len(data)==pin_input['bytes'] and sha_bytes(data)==pin_input['sha256'] and git_blob(data)==pin_input['gitBlob'],'CONTRACT_BACKEND_IMMUTABLE_INPUT_CHANGED')
        row={'path':name,'bytes':len(data),'sha256':sha_bytes(data),'gitBlob':git_blob(data)}
        if name.endswith('package-lock.json'):row['lock']=verify_lock(data,pin_input)
        receipts.append(row)
    return {'archiveSHA256':pin['sha256'],'source':SOURCES['backend'],'image':pin['image'],'immutableFilesReadBack':receipts,'allThreeDependencyLocksVerified':True,'imagePlatform':'linux/amd64','loadedImageClaimed':False}


def verify_reused_reconstruction(prepared_root):
    """Actual-sequence gate. Requires original host principal; no local bypass."""
    root=Path(prepared_root)
    require(os.getuid()==os.geteuid()==os.getgid()==os.getegid()==1001,'CONTRACT_ORIGINAL_HOST_PRINCIPAL')
    s=root.lstat()
    require(root.is_absolute() and root.resolve()==root and stat.S_ISDIR(s.st_mode) and s.st_uid==s.st_gid==1001 and stat.S_IMODE(s.st_mode)==0o700,'CONTRACT_PRIVATE_PREPARED_ROOT')
    origin=read_json(root/'package-origin.json')
    require(origin.get('artifactSHA256')==ARTIFACT_SHA256 and origin.get('historicalRunId')==HISTORICAL_RUN_ID and origin.get('historicalJobId')==HISTORICAL_JOB_ID and origin.get('all45CheckpointEntriesVerified') is True and origin.get('rebuiltThisExecution') is False,'CONTRACT_EXACT_RECONSTRUCTION_ORIGIN')
    candidate=exact_manifest(root/'v65-packages.json')
    historical=verify_metadata(root/'retained-component-evidence',candidate)
    frontend={role:verify_frontend_provenance(root/'artifacts'/pin['file'],role,pin) for role,pin in candidate['frontends'].items()}
    backend=verify_backend_inputs(root/'artifacts'/candidate['backend']['file'],candidate['backend'])
    result={'schema':'work8-v84-original-contract-q01-q03-operands-v1','status':'PASS_RETAINED_RECONSTRUCTION_AND_CURRENT_PACKAGE_INPUTS','artifactSHA256':ARTIFACT_SHA256,'packageManifestSHA256':PACKAGE_MANIFEST_SHA256,'historicalReconstruction':historical,'currentFrontendInputs':frontend,'currentBackendInputs':backend,'Q01':'PASS_SOURCE_RECONSTRUCTION_ATTRIBUTION_REUSED','Q02':'PASS_CURRENT_LOCK_AND_PINNED_BUILD_INPUT_BYTES','Q03':'HISTORICAL_REMEDY_PROVEN_FRESH_ISOLATED_LOADING_STILL_REQUIRED','Q04':'REQUIRES_COMPLETE_CURRENT_EXTRACTION_LOADING','Q05':'REQUIRES_COMPLETE_DIFFERENCE_ADJUDICATION','originalReconstructionMainReexecuted':False,'packagesRebuilt':False,'wholeRowAcceptanceClaimed':False,'applicationStarted':False}
    data=(json.dumps(result,sort_keys=True,separators=(',',':'))+'\n').encode()
    require(len(data)<=32768,'CONTRACT_RECEIPT_BOUND')
    target=root/'original-contract-q01-q03.json'
    fd=os.open(target,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600)
    with os.fdopen(fd,'wb') as out:out.write(data);out.flush();os.fsync(out.fileno())
    return result

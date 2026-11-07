#!/usr/bin/env python3
"""Bounded source-equivalent backend candidate build; never grants A5 acceptance.

Uses the recovered native-transition assembly, not backend/Dockerfile. A failed
compiler, changed lock, unmatched preserved executable, or image error stops this
single attempt. Raw build logs stay private. No application process is launched.
"""
import argparse, base64, gzip, hashlib, importlib.util, io, json, os, pathlib, shutil
import subprocess, tarfile, time, re, sys
sys.dont_write_bytecode=True
from capture_diagnostics import capture, CaptureFailure, failure_fields

HERE = pathlib.Path(__file__).resolve().parent
COMMIT = '6c1e63ba20619ee480742fd87dc810ca93152e22'
TREE = 'a78aa0e0a91c1e765afb23e70fe05c75cddc836e'
NODE = 'node:22.23.2-bookworm-slim@sha256:48e4b67d85f87bd551df43704e24d252f56cc5f8e9718841aace50f19948f0f9'

def sha(p):
    with p.open('rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()

def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

def reconstruction_env():
    env = {k:v for k,v in os.environ.items() if k in {'PATH','HOME','TMPDIR','LANG','LC_ALL'}}
    env.update(PYTHONDONTWRITEBYTECODE='1', RAILWAY_GIT_COMMIT_SHA=COMMIT, CI='true', NPM_CONFIG_AUDIT='false', NPM_CONFIG_FUND='false')
    return env

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--source', type=pathlib.Path, required=True)
    ap.add_argument('--controller', type=pathlib.Path, required=True)
    ap.add_argument('--output', type=pathlib.Path, required=True)
    ap.add_argument('--artifacts', type=pathlib.Path)
    ap.add_argument('--manifest', type=pathlib.Path)
    ap.add_argument('--max-seconds', type=int, default=1200)
    ap.add_argument('--check-inputs-only', action='store_true')
    args = ap.parse_args()
    assert 60 <= args.max_seconds <= 1800, 'BUILD_DEADLINE_BOUND'
    os.umask(0o077)
    src, ctl, out = args.source.resolve(), args.controller.resolve(), args.output.resolve()
    assert not out.exists(), 'NEW_PRIVATE_OUTPUT_REQUIRED'
    out.mkdir(parents=True, mode=0o700)
    evidence = out / 'evidence'; evidence.mkdir()
    logs = out / 'private-logs'; logs.mkdir()
    deadline = time.monotonic() + args.max_seconds
    stage = 'input-validation'
    receipt = {'schema':'WORK8_V65_BACKEND_RECONSTRUCTION_V1', 'status':'FAIL',
               'commit':COMMIT, 'tree':TREE, 'baseImage':NODE,
               'applicationRuntimeStarted':False, 'acceptanceGranted':False,
               'rawLogsPublic':False, 'automaticRetry':False}
    env = reconstruction_env()

    def run(cmd, cwd=src, maximum=300, label=None):
        remaining = deadline - time.monotonic()
        assert remaining > 0, 'BACKEND_BUILD_DEADLINE'
        command_label=label or stage+'-'+pathlib.Path(cmd[0]).name
        assert re.fullmatch('[a-z0-9-]{1,100}',command_label), 'BUILD_COMMAND_LABEL'
        # Use the same bounded capture and process-group termination as the
        # reviewed probes. Git's public source archive has a distinct finite
        # byte bound; compiler/registry diagnostics never accumulate unbounded.
        maximum_bytes=128*1024**2 if cmd==['git','archive','HEAD'] else 4*1024**2
        try:
            return capture(cmd,cwd,env,label=command_label,receipts=out/'capture-receipts',
                           seconds=min(maximum,remaining),maximum_seconds=1800,
                           maximum_stream_bytes=maximum_bytes,plain_diagnostic_codes=True)
        except CaptureFailure as exc:
            receipt['commandFailure']={'code':exc.receipt['code'],**failure_fields(exc),'rawOutputsExported':False}
            raise

    try:
        assert run(['git','rev-parse','HEAD']).decode().strip() == COMMIT, 'BACKEND_COMMIT_MISMATCH'
        assert run(['git','rev-parse','HEAD^{tree}']).decode().strip() == TREE, 'BACKEND_TREE_MISMATCH'
        assert not run(['git','status','--porcelain']).strip(), 'BACKEND_SOURCE_NOT_CLEAN'
        inputs = json.loads((HERE / 'backend-immutable-inputs/source-metadata.json').read_text())
        for item in inputs:
            p = src / item['path']
            assert p.is_file() and not p.is_symlink(), 'BACKEND_INPUT_MISSING'
            assert sha(p) == item['sha256'], 'BACKEND_INPUT_HASH_MISMATCH'
        assert run(['node','--version']).decode().strip() == 'v22.23.2', 'NODE_VERSION_MISMATCH'
        assert run(['npm','--version']).decode().strip() == '10.9.8', 'NPM_VERSION_MISMATCH'
        receipt['verifiedInputs'] = inputs
        if args.check_inputs_only:
            receipt['status'] = 'PASS_SOURCE_AND_TOOLCHAIN_INPUTS_ONLY'
            return
        stage = 'locked-dependencies-and-typechecked-build'
        for label,cmd in [
            ('pillow-locked-dependencies',['npm','ci','--prefix','pillow','--no-audit','--no-fund']),
            ('backend-locked-dependencies',['npm','ci','--prefix','backend','--no-audit','--no-fund']),
            ('sync-pillow-governance',['node','scripts/sync-pillow-governance.mjs']),
            ('pillow-typechecked-build',['npm','run','build','--prefix','pillow']),
            ('backend-typechecked-build',['npm','run','build','--prefix','backend'])]:
            stage=label;run(cmd,label=label)
        assert json.loads((src/'backend/node_modules/typescript/package.json').read_text())['version']=='5.9.3', 'TYPESCRIPT_VERSION_MISMATCH'
        for item in inputs:
            assert sha(src/item['path']) == item['sha256'], 'BUILD_MUTATED_REVIEWED_INPUT'
        stage = 'reviewed-assembly'
        context = out/'context'; context.mkdir()
        archived = run(['git','archive','HEAD'])
        with tarfile.open(fileobj=io.BytesIO(archived)) as tf:
            tf.extractall(context, filter='data')
        for package in ['backend','pillow']:
            for directory in ['dist','node_modules']:
                shutil.copytree(src/package/directory, context/package/directory, symlinks=True)
        # Reproduce the three accepted changed-only TS outputs exactly. The later
        # 6c source commit changes interpreted files, not these compiled modules.
        plan = json.loads((ctl/'v26-build-plan.json').read_text())
        plan['backendOverlay']=[x for x in plan['backendOverlay'] if x['path'].endswith('.ts')]
        overlay=out/'reviewed-overlay'; (overlay/'app').mkdir(parents=True)
        for item in plan['backendOverlay']:
            target=overlay/'app'/item['path']; target.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(src/item['path'],target)
        (overlay/'plan.json').write_text(json.dumps(plan))
        run(['node',str(ctl/'compile-overlay.cjs'),str(src),str(overlay),str(overlay/'plan.json')])
        shutil.copytree(overlay/'app/backend/dist',context/'backend/dist',dirs_exist_ok=True)
        preserved=json.loads((HERE/'backend-preserved-file-inventory.json').read_text())
        missing=[]; different=[]
        for item in preserved['files']:
            p=context/item['path']
            if not p.is_file(): missing.append(item['path'])
            elif sha(p)!=item['sha256']: different.append(item['path'])
        receipt['preservedFileComparison']={'inventorySha256':sha(HERE/'backend-preserved-file-inventory.json'),
                                           'checked':len(preserved['files']), 'missing':missing,'different':different,
                                           'coverage':preserved['coverage']}
        assert not missing and not different, 'PRESERVED_APPLICATION_FILE_MISMATCH'
        correction=load_module('a5_backend_packaging',ctl/'packaging_corrections.py')
        correction.apply_exact_omission(context,evidence)
        scanner=load_module('a5_backend_scanner',ctl/'candidate_packages.py')
        receipt['contextScan']=scanner.scan_context(context)
        (context/'.dockerignore').write_text('.git\n.env\n**/.env\n')
        admitted=HERE/'backend-native'
        native_bytes=base64.b64decode((admitted/'runtime-writer-isolation.so.b64').read_text().strip(),validate=True)
        assert hashlib.sha256(native_bytes).hexdigest()=='5048f19ec38c708dd1b139f7a3f60cb8eb5e9146cd4fdb6e978caffbcac87a1b', 'ADMITTED_NATIVE_BINARY_MISMATCH'
        assert sha(admitted/'native.sha256')=='b4cd3d8d8d0cc7928c6585967475ea9a260f6a9484e64bc21d9525abe3829661', 'ADMITTED_NATIVE_DIGEST_FILE_MISMATCH'
        dockercontext=out/'docker-context';dockercontext.mkdir()
        context.rename(dockercontext/'app');context=dockercontext/'app'
        (dockercontext/'native-input').mkdir()
        (dockercontext/'native-input/runtime-writer-isolation.so').write_bytes(native_bytes)
        shutil.copy2(admitted/'native.sha256',dockercontext/'native-input/native.sha256')
        dockerfile=f'''FROM {NODE}
WORKDIR /app
COPY --chown=0:0 app/ /app
COPY --chown=0:0 native-input/runtime-writer-isolation.so /native/runtime-writer-isolation.so
COPY --chown=0:0 native-input/native.sha256 /native/native.sha256
RUN chmod -R a+rX,go-w /app && chmod 0444 /native/runtime-writer-isolation.so /native/native.sha256 && mkdir -p /data/work8-exam && chmod 0755 /data /data/work8-exam
LABEL org.opencontainers.image.revision="{COMMIT}" io.empireai.source-tree="{TREE}"
USER 0:0
ENTRYPOINT ["node","/app/deployment/locked-runtime.cjs"]
'''
        (dockercontext/'Dockerfile').write_text(dockerfile)
        receipt['dockerfileSha256']=sha(dockercontext/'Dockerfile')
        receipt['publicApplicationModePolicy']={'operation':'chmod -R a+rX,go-w /app','purpose':'Compiled immutable public application modules and directories must be readable/traversable by writer65534; all /app objects remain root-owned and group/other nonwritable. Native library remains0444. Private runtime mounts are created separately and unchanged.','applicationBytesChanged':False}
        receipt['nativeBinaryReuse']=json.loads((admitted/'provenance.json').read_text())
        stage='candidate-image-build'
        run(['docker','build','--iidfile',str(out/'backend.image-id'),str(dockercontext)],maximum=600)
        iid=(out/'backend.image-id').read_text().strip()
        info=json.loads(run(['docker','image','inspect',iid]))[0]
        assert info['Id']==iid and info['Os']=='linux' and info['Architecture']=='amd64', 'BACKEND_IMAGE_PLATFORM_MISMATCH'
        assert info['Config']['Entrypoint']==['node','/app/deployment/locked-runtime.cjs'], 'BACKEND_ENTRYPOINT_MISMATCH'
        receipt['image']={'id':iid,'os':info['Os'],'architecture':info['Architecture'],
                          'size':info['Size'],'labels':info['Config']['Labels'],'entrypoint':info['Config']['Entrypoint']}
        stage='bounded-image-archive'
        rawsave=out/'private-docker-save.tar'
        run(['docker','save','--output',str(rawsave),iid],maximum=180)
        assert rawsave.stat().st_size<=2*1024**3, 'RAW_IMAGE_ARCHIVE_BOUND'
        artifacts=args.artifacts.resolve() if args.artifacts else out/'artifacts'
        artifacts.mkdir(parents=True,exist_ok=True,mode=0o700)
        target=artifacts/'backend-v65-source-equivalent.tar.gz'
        assert not target.exists() and not target.with_suffix('.partial').exists(), 'BACKEND_ARCHIVE_EXISTS'
        partial=target.with_suffix('.partial')
        with tarfile.open(rawsave,'r:') as saved:
            dm=json.load(saved.extractfile('manifest.json'));assert len(dm)==1, 'SINGLE_IMAGE_REQUIRED'
            row=dm[0];cfg=saved.extractfile(row['Config']).read()
            config=json.loads(cfg);assert 'sha256:'+hashlib.sha256(cfg).hexdigest()==iid, 'SAVED_CONFIG_ID_MISMATCH'
            source_members=[saved.getmember(row['Config'])]+[saved.getmember(n) for n in row['Layers']]
            records=[]
            for member in source_members:
                assert member.isfile(), 'SAVED_IMAGE_MEMBER_TYPE'
                digest=hashlib.file_digest(saved.extractfile(member),'sha256').hexdigest()
                records.append({'name':member.name,'sha256':digest,'bytes':member.size})
                assert time.monotonic()<deadline, 'BACKEND_BUILD_DEADLINE'
            assert ['sha256:'+x['sha256'] for x in records[1:]]==config['rootfs']['diff_ids'], 'SAVED_LAYER_CHAIN_MISMATCH'
            om={'schemaVersion':2,'mediaType':'application/vnd.oci.image.manifest.v1+json',
                'config':{'mediaType':'application/vnd.oci.image.config.v1+json','digest':iid,'size':len(cfg)},
                'layers':[{'mediaType':'application/vnd.oci.image.layer.v1.tar','digest':'sha256:'+x['sha256'],'size':x['bytes']} for x in records[1:]]}
            omb=json.dumps(om,separators=(',',':')).encode();omh=hashlib.sha256(omb).hexdigest()
            metadata={'blobs/sha256/'+omh:omb,
                      'oci-layout':b'{"imageLayoutVersion":"1.0.0"}',
                      'index.json':json.dumps({'schemaVersion':2,'manifests':[{'mediaType':om['mediaType'],'digest':'sha256:'+omh,'size':len(omb)}]},separators=(',',':')).encode(),
                      'manifest.json':json.dumps([{'Config':'blobs/sha256/'+records[0]['sha256'],'RepoTags':[],
                                                  'Layers':['blobs/sha256/'+x['sha256'] for x in records[1:]]}],separators=(',',':')).encode()}
            with partial.open('xb') as raw:
                with gzip.GzipFile(filename='',fileobj=scanner.BoundedCompressedWriter(raw,400*1024**2),mode='wb',mtime=0) as gz:
                    with tarfile.open(fileobj=gz,mode='w|',format=tarfile.PAX_FORMAT) as dest:
                        emitted=set()
                        for record in records:
                            if record['sha256'] in emitted:continue
                            emitted.add(record['sha256'])
                            member=tarfile.TarInfo('blobs/sha256/'+record['sha256']);member.size=record['bytes'];member.mode=0o444
                            dest.addfile(member,saved.extractfile(record['name']))
                            assert time.monotonic()<deadline, 'BACKEND_BUILD_DEADLINE'
                        for name,b in metadata.items():
                            member=tarfile.TarInfo(name);member.size=len(b);member.mode=0o444;dest.addfile(member,io.BytesIO(b))
        partial.replace(target);rawsave.unlink()
        package={'commit':COMMIT,'tree':TREE,'file':target.name,'bytes':target.stat().st_size,'sha256':sha(target),
                 'image':iid,'manifest':'sha256:'+omh,'ociManifestSHA256':omh}
        manifest=args.manifest.resolve() if args.manifest else out/'backend-manifest.json'
        assert not manifest.exists(), 'BACKEND_MANIFEST_EXISTS'
        manifest.write_text(json.dumps(package,indent=2)+'\n');receipt['package']=package
        receipt['status']='BUILT_SOURCE_EQUIVALENCE_CANDIDATE_REQUIRES_INDEPENDENT_RUNTIME_QUALIFICATION'
        receipt['remaining']=['Independently read back admitted native binary and compiled security/store hashes from built image',
                              'Independently qualify unchanged native isolation under exact controller security flags',
                              'Run SQL.js packaging smoke and native initialized-Brain preflight',
                              'Complete original A5-08/A5-09 lifecycle and independent whole-row review']
    except Exception as exc:
        receipt['firstError']={'stage':stage,'class':type(exc).__name__,
                               'code':str(exc) if isinstance(exc,(AssertionError,CaptureFailure)) else 'BOUNDED_BUILD_OPERATION_FAILED'}
        receipt['firstError'].update(receipt.get('commandFailure',{}))
        raise
    finally:
        (evidence/'backend-build-result.json').write_text(json.dumps(receipt,indent=2)+'\n')

if __name__=='__main__':
    main()

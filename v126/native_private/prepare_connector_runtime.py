#!/usr/bin/env python3
"""Admit newly built frontend, exact compiled overlays and retained source input bytes."""
import hashlib,json,os,pathlib,shutil,stat,subprocess,sys
CONTROL=pathlib.Path(__file__).resolve().parent
BROWSER_DIGEST='mcr.microsoft.com/playwright@sha256:c091b21d9fae78c76e85cd4356431e9b018402f172a214fc7d7a5e9a7e29d8ac'
BROWSER_IMAGE='sha256:fee853fafa59550d162cef52bca02d907694b44ebf6ef9fb075bcc0c65d8dedb'
def sha(path):
    with pathlib.Path(path).open('rb')as f:return hashlib.file_digest(f,'sha256').hexdigest()
def save(root,name,value):
    with(root/'evidence'/name).open('x')as f:json.dump(value,f,indent=2);f.write('\n');f.flush();os.fsync(f.fileno())
def verify_and_freeze(folder,rows):
    assert folder.resolve(strict=True)==folder and not folder.is_symlink()
    expected={r['path']:r for r in rows};assert len(expected)==len(rows)
    actual={p.relative_to(folder).as_posix()for p in folder.rglob('*')if p.is_file()or p.is_symlink()}
    assert actual==set(expected),'COMPLETE_BUILD_FILE_SET_MISMATCH'
    for name,row in expected.items():
        rel=pathlib.PurePosixPath(name);assert not rel.is_absolute()and'..'not in rel.parts and'.'not in rel.parts
        p=folder/name;s=p.lstat()
        if row['type']=='symlink':
            assert stat.S_ISLNK(s.st_mode)and os.readlink(p)==row['target']and not row['target'].startswith('/')
            assert p.resolve(strict=True).is_relative_to(folder)
        else:
            assert row['type']=='file'and stat.S_ISREG(s.st_mode)and s.st_nlink==1
            assert s.st_size==row['bytes']and sha(p)==row['sha256'];p.chmod(0o555 if s.st_mode&0o111 else 0o444)
    for p in sorted(folder.rglob('*'),key=lambda p:len(p.parts),reverse=True):
        if p.is_dir()and not p.is_symlink():p.chmod(0o555)
    folder.chmod(0o555)
    return len(expected)
def main():
    assert os.getuid()==0 and len(sys.argv)==2
    root=pathlib.Path(sys.argv[1]);assert root.is_absolute()and root.resolve(strict=True)==root
    assert not(root.parent/'private').exists(),'NO_OWNER_CREDENTIALS_DURING_PREPARATION'
    phase='verify-complete-frontend-build'
    try:
        receipt_path=root/'evidence/connector-frontend-build.json';assert receipt_path.stat().st_size<4194304
        receipt=json.loads(receipt_path.read_text());assert receipt['status']=='BUILT_FROM_PINNED_FULL_SOURCE'
        assert receipt['nativeApplicationStarted']is False and receipt['ownerCredentialsPresent']is False
        assert receipt['applicationCommit']=='6c1e63ba20619ee480742fd87dc810ca93152e22'
        assert receipt['frontendBaseCommit']=='750483b3152f2c9c65a65b6381c8c94f081b9eb1'
        assert receipt['sourcePublicationCommit']==os.environ['GITHUB_SHA']
        assert receipt['sourceInputManifestSHA256']==sha(CONTROL/'frontend-build-inputs.json')
        front_count=verify_and_freeze(root/'connector-frontend',receipt['frontendFiles'])
        browser_count=verify_and_freeze(root/'browser-deps',receipt['browserDependencyFiles'])
        archive=receipt['frontendArchive'];assert archive['path']=='connector-frontend.tar.gz'
        ap=root/archive['path'];assert ap.is_file()and not ap.is_symlink()and ap.stat().st_nlink==1
        assert ap.stat().st_size==archive['bytes']<=209715200 and sha(ap)==archive['sha256']and archive['allMembersReadBack']is True
        ap.chmod(0o444)
        phase='admit-exact-compiled-backend-overlays'
        build=json.loads((CONTROL/'connector-build-manifest.json').read_text())
        for pin in build['backendOverlays']:
            assert pathlib.Path(pin['sourceFile']).name==pin['sourceFile']
            p=CONTROL/pin['sourceFile'];assert p.is_file()and not p.is_symlink()
            assert p.stat().st_size==pin['bytes']and sha(p)==pin['sha256']
        assert sha(CONTROL/'connector-backend-build.json')==build['backendBuildReceiptSHA256']
        phase='stage-authenticated-source-receipts-read-only'
        inputs=root/'connector-inputs';assert not inputs.exists();inputs.mkdir(mode=0o700)
        pins=[('connector-cj-readback.json','cj-full-product-detail-readback.json','49a84a8c0d78aa4fefe5fad51f28d80d2e51c9f86e74c6ec1fe37f632e69be78'),
          ('connector-cj-review.json','independent-cj-source-review.json','7b88b56f5eb8d2e2edb32220614271abb9bd95bb228e41dac1b02f541c84fe63')]
        for source,target,digest in pins:
            assert sha(CONTROL/source)==digest
            out=inputs/target
            with out.open('xb')as f:f.write((CONTROL/source).read_bytes())
            out.chmod(0o444);assert sha(out)==digest and out.stat().st_nlink==1
        inputs.chmod(0o555)
        phase='recover-exact-retained-browser-image'
        p=subprocess.run(['docker','pull',BROWSER_DIGEST],stdin=subprocess.DEVNULL,capture_output=True,timeout=300)
        assert len(p.stdout)+len(p.stderr)<=1048576,'BROWSER_PULL_OUTPUT_BOUND'
        assert p.returncode==0,'EXACT_BROWSER_IMAGE_PULL_FAILED_'+hashlib.sha256(p.stderr).hexdigest()
        image=json.loads(subprocess.check_output(['docker','image','inspect',BROWSER_DIGEST],timeout=30))[0]
        assert image['Id']==BROWSER_IMAGE and image['Os']=='linux'and image['Architecture']=='amd64'
        assert BROWSER_DIGEST in image['RepoDigests']
        save(root,'connector-runtime-prepared.json',{'schema':'v128-connector-runtime-prepared-v1',
          'status':'PASS_EXACT_NEW_BUILD_AND_RETAINED_SOURCE_PREPARATION',
          'buildManifestSHA256':sha(CONTROL/'connector-build-manifest.json'),
          'frontendBuildReceiptSHA256':sha(receipt_path),'frontendFilesIndependentlyReadBack':front_count,
          'browserDependencyFilesIndependentlyReadBack':browser_count,'frontendArchive':archive,
          'backendOverlays':build['backendOverlays'],'sourceReceiptsReadOnly':True,
          'browserImage':BROWSER_IMAGE,'browserImageDigest':BROWSER_DIGEST,
          'nativeApplicationStarted':False,'ownerCredentialsPresent':False,'wholeRowAccepted':False})
    except BaseException as error:
        save(root,'connector-runtime-preparation-first-failure.json',{'schema':'v128-connector-runtime-preparation-first-failure-v1',
          'phase':phase,'errorClass':type(error).__name__,'message':str(error)[:400],
          'nativeApplicationStarted':False,'ownerCredentialsPresent':False,'wholeRowAccepted':False})
        raise
if __name__=='__main__':main()

#!/usr/bin/env python3
"""Public Stage A runtime build using the frozen V134 application pipeline.

This entrypoint never calls V134 private admission, restore, transport, launch or
acceptance logic. It reconstructs only public executable bytes, then removes
inactive private-review controls and installs the separately admitted Stage A.
"""
import hashlib,importlib.util,json,os,pathlib,re,shutil,stat,subprocess,sys,time,zipfile

REPO=pathlib.Path('/repo'); WORK=pathlib.Path('/work'); OUTPUT=pathlib.Path('/output')
BASE_COMMIT='348174a4a80fc1bd822fb9ffe7575eba0dc265c7'
BASE_TREE='0711297c097680051b68f4716bbb70b13b3eb4aa'
BASE_SOURCE='8e256e063ccd2e7d3f200406e4ccef047b1dbd542e62fbd6baa3da06f16fa35e'
OPERATION='V135-A10-DELIVERY-QUALIFICATION-A02-20261114'
BRANCH='work8/v135-delivery-qualification-20261114-a01'
BASE_IMAGE='sha256:e8c69d86735f6df3efa06b324694fe51f0422785f83a3bd463052636c2421944'
NODE_SHA='3517c2df0b2f8cd7f422b4b8450ef81c6889f08eb03e281d6de9079b15e6a327'
BACKEND_ARCHIVE='archives/backend-v65-source-equivalent.tar.gz'
BACKEND_BYTES=207560277
BACKEND_SHA='b99d11a65d40d6a6a197da6ba805e72a72ac55d4551ad13f31930ec5eeadbcb6'
OLD_SERVICES={'99a5c033-ad1c-46e8-80a8-4c82b968f322','df5d6c1f-178f-41b6-8eb5-c7870f9f06d2','d1536bae-0d47-4e39-b3eb-aeefc2e70fd4'}
RUNTIME_CONTROLS=('qualification_entry.py','qualification_supervisor.py','qualification_backend.mjs','qualification_ingress.mjs','qualification-recipient-public.pem','qualification-config.json','qualification-authority.json','qualification-reservation.json','source-manifest.json')
RUNTIME_SCRIPTS=frozenset(('qualification_entry.py','qualification_supervisor.py','qualification_backend.mjs','qualification_ingress.mjs'))
def control_source(name):return ('runtime/'+name)if name in RUNTIME_SCRIPTS else name

def require(ok,code):
    if not ok:raise ValueError(code)
def sha(path):
    with pathlib.Path(path).open('rb')as f:return hashlib.file_digest(f,'sha256').hexdigest()
def load(path):return json.loads(pathlib.Path(path).read_bytes())
def canonical(value):return json.dumps(value,sort_keys=True,separators=(',',':')).encode()
def desc(path,name):return {'path':name,'bytes':path.stat().st_size,'sha256':sha(path)}
def write_new(path,value):
    with path.open('xb')as f:f.write(canonical(value)+b'\n')
    path.chmod(0o444)

def validate_admission(authority,reservation,config,manifest):
    operation=authority.get('operationIdentity')
    require(operation==OPERATION,'EXACT_STAGE_A_OPERATION')
    require(authority.get('schema')=='V135_STAGE_A_TECHNICAL_AUTHORITY_V1'and authority.get('ownerDirective')=='V135'and authority.get('stage')=='A','FRESH_STAGE_A_AUTHORITY_REQUIRED')
    for name,value in {'maximumRuntimeSeconds':1800,'killGraceSeconds':5,'maximumLaunches':1,'maximumPrivateTransfers':0,'automaticRetries':0,'leaseExtensions':0,'privateDataTransferAuthorized':False,'nativeOwnerDecisionAuthorized':False,'productionPermission':False}.items():
        require(type(authority.get(name))is type(value)and authority[name]==value,'STAGE_A_AUTHORITY_'+name.upper())
    dest=authority.get('destination');require(isinstance(dest,dict)and set(dest)=={'projectId','environmentId','serviceId','origin'},'EXACT_DESTINATION_FIELDS')
    for name in ['projectId','environmentId','serviceId']:require(isinstance(dest[name],str)and re.fullmatch('[a-f0-9-]{36}',dest[name]),'DESTINATION_ID')
    require(dest['serviceId']not in OLD_SERVICES,'PRIOR_SERVICE_REUSE_FORBIDDEN')
    require(re.fullmatch(r'https://[a-z0-9-]+\.up\.railway\.app',dest['origin'])is not None,'EXACT_HTTPS_ORIGIN')
    require(reservation.get('schema')=='V135_STAGE_A_RESERVATION_V1'and reservation.get('status')=='RESERVED_IN_CANONICAL_LEDGER','SAVED_RESERVATION_REQUIRED')
    require(reservation.get('operationIdentity')==operation and reservation.get('cumulativeCeilingUSD')==1000,'EXACT_FINANCIAL_SCOPE')
    require(type(reservation.get('savedLedgerVersion'))is int and reservation['savedLedgerVersion']>=96,'POST_A01_LEDGER_REQUIRED')
    require(re.fullmatch('[a-f0-9]{64}',str(reservation.get('savedLedgerSHA256','')))is not None and reservation.get('independentReadbackSHA256')==reservation['savedLedgerSHA256'],'INDEPENDENT_LEDGER_READBACK')
    for name,value in {'executionAttempt':1,'buildAttempt':1,'maximumLaunches':1,'maximumPrivateTransfers':0,'automaticRetries':0,'leaseExtensions':0,'maximumRuntimeSeconds':1800,'killGraceSeconds':5,'replicas':1,'vCPUs':1,'memoryGB':2,'restartPolicyType':'NEVER'}.items():
        require(type(reservation.get(name))is type(value)and reservation[name]==value,'EXACT_FINANCIAL_LIMIT_'+name.upper())
    require(isinstance(reservation.get('financialReservationId'),str)and reservation['financialReservationId'],'RESERVATION_ID')
    require(config.get('schema')=='V135_STAGE_A_RUNTIME_CONFIG_V1'and config.get('operationIdentity')==operation and all(config.get(k)==v for k,v in dest.items()),'CONFIG_SCOPE')
    require(config.get('privateDataIncluded')is False and config.get('ownerDecisionPermitted')is False and config.get('ownerReviewClockStarted')is False and config.get('maximumRuntimeSeconds')==1800 and config.get('killGraceSeconds')==5,'NO_PRIVATE_ACTIVATION')
    require(manifest.get('schema')=='V135_STAGE_A_SOURCE_MANIFEST_V1'and manifest.get('operationIdentity')==operation and manifest.get('basePublicationCommit')==BASE_COMMIT and manifest.get('baseTree')==BASE_TREE and manifest.get('baseSourceManifestSHA256')==BASE_SOURCE,'SOURCE_ANCESTRY')
    require(manifest.get('selfExcluded')is True and manifest.get('privateInputsIncluded')is False,'PUBLIC_SOURCE_ONLY')
    require(reservation.get('gitPublicationIdentity')==manifest.get('branch')==BRANCH,'EXACT_STAGE_A_BRANCH')
    return operation,dest

def verify_source(repo=REPO):
    q=repo/'v135/qualification';a=load(q/'qualification-authority.json');r=load(q/'qualification-reservation.json');c=load(q/'qualification-config.json');m=load(q/'source-manifest.json')
    operation,dest=validate_admission(a,r,c,m)
    original=repo/'v128/owner_review/source-manifest.json';require(sha(original)==BASE_SOURCE,'ORIGINAL_V134_MANIFEST_UNCHANGED');base=load(original)
    require(len(base['files'])==85,'ORIGINAL_V134_85_PINS')
    rows=m.get('files');require(isinstance(rows,list)and 85<len(rows)<=300,'SOURCE_FILE_BOUND');seen={};total=0;base_paths={row['path']for row in base['files']}
    for row in rows:
        name=row.get('path');rel=pathlib.PurePosixPath(name)if isinstance(name,str)else None
        require(rel is not None and not rel.is_absolute()and rel.as_posix()==name and '..'not in rel.parts and '.git'not in rel.parts and name not in seen and name!='v135/qualification/source-manifest.json','SOURCE_PATH')
        p=repo/name;s=p.lstat();require(p.resolve()==p and stat.S_ISREG(s.st_mode)and s.st_nlink==1,'REGULAR_SOURCE_ONLY')
        require(type(row.get('bytes'))is int and row['bytes']==s.st_size and sha(p)==row.get('sha256'),'SOURCE_BYTES_PIN')
        require(s.st_size<=32*1024*1024 and not name.endswith(('.sqlite','.sqlite3','.db','.jpg','.png','.jpeg')),'PRIVATE_INPUT_SOURCE_FORBIDDEN')
        if name not in base_paths:
            require(name=='v128/owner_review/source-manifest.json'or(name.startswith('v135/qualification/')and '/private/'not in name and 'private-key'not in name),'NARROW_QUALIFICATION_SOURCE_SCOPE')
        require(re.search(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\r\n]+[A-Za-z0-9+/=]{32,}',p.read_bytes())is None,'PRIVATE_KEY_SOURCE_FORBIDDEN')
        total+=s.st_size;require(total<=1024*1024*1024,'SOURCE_AGGREGATE_BOUND');seen[name]=row
    allowed_delta={'vercel.json','empireai-web/vercel.json'}
    for row in base['files']:
        require(row['path']in seen,'REUSED_SOURCE_PIN_REQUIRED')
        if row['path']not in allowed_delta:require(seen[row['path']]==row,'PRIVATE_AND_NATIVE_SOURCE_UNCHANGED')
    for name in allowed_delta:
        deployment=load(repo/name)['git']['deploymentEnabled'];require(deployment.get(m['branch'])is False and deployment.get('work8/v133-media-owner-review-20261114-a01')is False,'VERCEL_STAGE_A_DISABLED')
    required=['v135/qualification/'+control_source(x) for x in RUNTIME_CONTROLS if x!='source-manifest.json']+['v128/owner_review/source-manifest.json','v135/qualification/build/build_stage_a.py','v135/qualification/build/Dockerfile','v135/qualification/build/Dockerfile.dockerignore']
    require(all(x in seen for x in required),'QUALIFICATION_CONTROLS_PINNED')
    require(sha(q/'qualification-authority.json')==c.get('authoritySHA256')and sha(q/'qualification-reservation.json')==c.get('reservationSHA256'),'CONFIG_ADMISSION_HASHES')
    require(sha(q/'qualification-recipient-public.pem')==c.get('recipientPublicPEMSHA256'),'FRESH_RECIPIENT_PUBLIC_KEY')
    return {'authority':a,'reservation':r,'config':c,'manifest':m,'operation':operation,'destination':dest,'sourceManifestSHA256':sha(q/'source-manifest.json'),'sourceFileCount':len(rows),'sourceFileAggregateBytes':total}

def qualify_output(repo,output,meta,admission,publication,receipts):
    q=repo/'v135/qualification';old=output/'control/owner_review';keep={path:old/path for path in ['native-tier0-session-routes.mjs','host/process_graph.py','host/portfolio-query.mjs']};saved={name:p.read_bytes()for name,p in keep.items()}
    shutil.rmtree(old);old.mkdir(mode=0o755)
    for name,data in saved.items():p=old/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data);p.chmod(0o444)
    target=output/'control/qualification';require(not target.exists(),'FRESH_CONTROL_DIRECTORY');target.mkdir(mode=0o755)
    for name in RUNTIME_CONTROLS:
        data=(q/control_source(name)).read_bytes();require(re.search(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\r\n]+[A-Za-z0-9+/=]{32,}',data)is None,'PRIVATE_KEY_IN_SOURCE')
        p=target/name;p.write_bytes(data);p.chmod(0o444)
    require(sha(output/'usr/local/bin/node')==NODE_SHA,'EXACT_NATIVE_NODE')
    frontend=load(meta/'frontend-build-receipt.json');inputs=load(meta/'frontend-build-inputs.json');extract=load(meta/'extracted/extraction-receipt.json');base_manifest=admission['manifest']
    require(frontend['status']=='PASS'and frontend['sourceFiles']==inputs['changedSourceFileCount']==962,'COMPLETE_NATIVE_FRONTEND')
    require(frontend['sourceTreeSHA256']==inputs['changedSourceTreeSHA256']==base_manifest['completeFrontendSourceSHA256'],'EXACT_FRONTEND_SOURCE')
    require(frontend['packageLockSHA256']==inputs['packageLockSHA256']and frontend['nodeSHA256']==NODE_SHA,'UNCHANGED_NATIVE_DEPENDENCIES')
    require(extract['status']=='PASS'and extract['applicationCommit']=='6c1e63ba20619ee480742fd87dc810ca93152e22'and extract['archiveSHA256']==BACKEND_SHA,'RETAINED_PUBLIC_APPLICATION_IDENTITY')
    overlay=load(repo/'v128/owner_review/backend-overlays.json')
    for row in overlay['files']:
        p=output/row['destination'].lstrip('/');require(p.stat().st_size==row['bytes']and sha(p)==row['sha256'],'UNCHANGED_NATIVE_OVERLAYS')
    for row in frontend['frontendFiles']:
        p=output/'frontend/app'/row['path'];require(row['type']=='file'and p.stat().st_size==row['bytes']and sha(p)==row['sha256'],'ACTUAL_FRONTEND_BYTES')
    static=['/_next/static/'+p.relative_to(output/'frontend/app/.next/static').as_posix()for p in sorted((output/'frontend/app/.next/static').rglob('*'))if p.is_file()]
    require(0<len(static)<=4096,'STATIC_INVENTORY')
    provenance={'schema':'V135_STAGE_A_BUILD_PROVENANCE_V1','operationIdentity':admission['operation'],'publicationCommit':publication,'sourceManifestSHA256':admission['sourceManifestSHA256'],'basePublicationCommit':BASE_COMMIT,'baseTree':BASE_TREE,'baseSourceManifestSHA256':BASE_SOURCE,'applicationCommit':extract['applicationCommit'],'retainedArchiveSHA256':BACKEND_SHA,'officialPythonBaseLinuxAMD64ManifestDigest':BASE_IMAGE,'nativeNodeSHA256':NODE_SHA,'backendOverlayManifestSHA256':sha(repo/'v128/owner_review/backend-overlays.json'),'backendOverlayCount':len(overlay['files']),'completeFrontendSourceSHA256':frontend['sourceTreeSHA256'],'completeFrontendSourceFiles':962,'actualFrontendBuildID':frontend['buildID'],'actualFrontendTreeSHA256':frontend['frontendTreeSHA256'],'actualFrontendFileCount':frontend['frontendFileCount'],'savedFinancialLedgerVersion':admission['reservation']['savedLedgerVersion'],'savedFinancialLedgerSHA256':admission['reservation']['savedLedgerSHA256'],'financialReservationId':admission['reservation']['financialReservationId'],'privateGrantReused':False,'privateInputsIncluded':False,'nativeOwnerReviewPerformed':False,'nativeApplicationStartedAtBuild':False,'originalPrivateEntryControlsRemoved':True,'reusedReviewedNativeControls':sorted(saved),'stages':receipts}
    write_new(target/'build-provenance.json',provenance)
    rows=[]
    for p in sorted(output.rglob('*')):
        mode=p.lstat().st_mode
        require(not stat.S_ISLNK(mode),'NO_RUNTIME_SYMLINK')
        if stat.S_ISDIR(mode):continue
        require(stat.S_ISREG(mode)and not(mode&0o022),'SAFE_RUNTIME_FILE')
        name='/'+p.relative_to(output).as_posix();require(not name.startswith(('/private/','/inputs/','/state/','/evidence/'))and not name.endswith(('.sqlite','.sqlite3','.db')),'NO_PRIVATE_RUNTIME_INPUT')
        rows.append(desc(p,name))
    require(0<len(rows)<=100000 and sum(x['bytes']for x in rows)<=1073741824,'RUNTIME_BOUND')
    runtime={'schema':'V135_STAGE_A_RUNTIME_MANIFEST_V1','operationIdentity':admission['operation'],'sourceCommit':publication,'publicationCommit':publication,'sourceManifestSHA256':admission['sourceManifestSHA256'],'basePublicationCommit':BASE_COMMIT,'applicationCommit':extract['applicationCommit'],'nodeVersion':'v22.23.2','nodeSHA256':NODE_SHA,'staticAssetPaths':static,'files':rows,'privateDataIncluded':False,'privateIngressAvailable':False,'ownerReviewClockStarted':False,'maximumRuntimeSeconds':1800,'killGraceSeconds':5}
    write_new(target/'runtime-manifest.json',runtime)
    return {'schema':'V135_STAGE_A_PUBLIC_RUNTIME_BUILD_COMPLETE_V1','status':'PASS_PUBLIC_RUNTIME_BUILT_REQUIRES_PROVIDER_QUALIFICATION','publicationCommit':publication,'operationIdentity':admission['operation'],'sourceManifestSHA256':admission['sourceManifestSHA256'],'runtimeManifestSHA256':sha(target/'runtime-manifest.json'),'buildProvenanceSHA256':sha(target/'build-provenance.json'),'runtimeFileCount':len(rows),'staticAssetPathCount':len(static),'nativeApplicationStarted':False,'privateDataTransferred':False,'ownerReviewPerformed':False}

def main():
    require(os.geteuid()==0 and pathlib.Path(__file__).resolve()==REPO/'v135/qualification/build/build_stage_a.py','EXACT_BUILD_CONTEXT')
    publication=os.environ.get('A10_QUALIFICATION_SOURCE_COMMIT_SHA','');require(re.fullmatch('[a-f0-9]{40}',publication)is not None,'SOURCE_PUBLICATION_COMMIT')
    actual=os.environ.get('RAILWAY_GIT_COMMIT_SHA');require(not actual or actual==publication,'PROVIDER_SOURCE_COMMIT')
    admission=verify_source();require(not OUTPUT.exists(),'FRESH_BUILD_OUTPUT')
    original=REPO/'v128/owner_review/portable';spec=importlib.util.spec_from_file_location('accepted_public_build_steps',original/'build_image.py');pipeline=importlib.util.module_from_spec(spec);spec.loader.exec_module(pipeline)
    run=pipeline.run;native=REPO/'v126/native_private';receipts=[];started=time.monotonic();retained=WORK/'retained.zip'
    receipts.append(run('stage-a-public-retained-transport',[sys.executable,'-B',str(native/'fetch_retained_raw.py'),str(retained)],310))
    backend=WORK/'backend.tar.gz'
    with zipfile.ZipFile(retained)as archive:
        require(archive.namelist().count(BACKEND_ARCHIVE)==1,'EXACT_RETAINED_MEMBER');info=archive.getinfo(BACKEND_ARCHIVE);require(info.file_size==BACKEND_BYTES and stat.S_IFMT(info.external_attr>>16)in(0,stat.S_IFREG),'PUBLIC_ARCHIVE_BOUND');received=0
        with archive.open(info)as src,backend.open('xb')as dst:
            while block:=src.read(1024*1024):received+=len(block);require(received<=BACKEND_BYTES,'PUBLIC_ARCHIVE_BOUND');dst.write(block)
        require(received==BACKEND_BYTES and sha(backend)==BACKEND_SHA,'EXACT_PUBLIC_ARCHIVE')
    receipts.append(run('stage-a-retained-runtime-extraction',[sys.executable,'-B',str(original/'extract_portable_runtime.py'),'--backend-archive',str(backend),'--output',str(original/'extracted'),'--controls',str(native)],120))
    receipts.append(run('stage-a-pinned-redis-package-data',[sys.executable,'-B',str(native/'fetch-redis-dependencies.py'),str(original/'redis-packages')],210))
    receipts.append(run('stage-a-exact-frontend-source',[sys.executable,'-B',str(original/'prepare_frontend_source.py'),str(REPO),str(original/'extracted')],90))
    receipts.append(run('stage-a-actual-next-build',[sys.executable,'-B',str(original/'build_frontend_portable.py'),str(original/'frontend-source'),str(original/'extracted'),str(original/'frontend-build-inputs.json')],790))
    receipts.append(run('stage-a-public-runtime-assembly',[sys.executable,'-B',str(original/'assemble_portable_runtime.py'),'--retained',str(original/'extracted'),'--frontend',str(original/'frontend-runtime'),'--repository',str(REPO),'--output',str(OUTPUT),'--base-root','/'],180))
    result=qualify_output(REPO,OUTPUT,original,admission,publication,receipts);result['elapsedSeconds']=round(time.monotonic()-started,3);print(json.dumps(result),flush=True)

if __name__=='__main__':main()

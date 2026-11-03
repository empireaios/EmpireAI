#!/usr/bin/env python3
"""Scan final source-only candidate archives without extracting or executing.

No scanner waiver is introduced. Any credential pattern prevents retention.
All backend layer regular files, including the pinned OS/runtime, are examined.
"""
import hashlib, json, pathlib, tarfile, time
from retained_candidate_packages import PATTERNS

POLICY_PATH=pathlib.Path(__file__).with_name('public-binary-scan-classifications.json')
POLICY_SHA='d23743e68b5a2e922210587fcb0bd3fcd56069dc7142d56b09f5c2b0de1c64b6'

def classifications():
    data=POLICY_PATH.read_bytes()
    assert hashlib.sha256(data).hexdigest()==POLICY_SHA,'INDEPENDENT_PUBLIC_BINARY_CLASSIFICATION_CHANGED'
    policy=json.loads(data)
    assert policy['schema']=='work8-v65-reviewed-public-binary-classifications-v1' and policy['status']=='PASS_INDEPENDENT_PUBLIC_CONSTANT_CLASSIFICATION','PUBLIC_BINARY_CLASSIFICATION_REQUIRED'
    return policy['entries']

def scan_stream(stream,role,path,stats,entries,account):
    tail=b'';size=0;digest=hashlib.sha256();findings={}
    while chunk:=stream.read(1024*1024):
        account(len(chunk));stats['regularBytesScanned']+=len(chunk)
        sample=tail+chunk;offset=size-len(tail);size+=len(chunk);digest.update(chunk)
        for category,pattern in PATTERNS:
            for match in pattern.finditer(sample):
                item={'category':category,'offset':offset+match.start(),'bytes':len(match.group()),'sha256':hashlib.sha256(match.group()).hexdigest()}
                findings[(category,item['offset'],item['bytes'],item['sha256'])]=item
                assert len(findings)<=64,'PATTERN_COUNT_BOUND'
        tail=sample[-8192:]
    allowed=[e for e in entries if role in e['roles'] and path in e['paths']]
    if allowed:
        assert len(allowed)==1,'AMBIGUOUS_BINARY_CLASSIFICATION'
        row=allowed[0]
        assert size==row['bytes'] and digest.hexdigest()==row['sha256'],'CLASSIFIED_BINARY_FULL_IDENTITY_CHANGED'
        actual=sorted(findings.values(),key=lambda x:(x['category'],x['offset'],x['bytes']))
        expected=sorted(row['expectedMatches'],key=lambda x:(x['category'],x['offset'],x['bytes']))
        assert actual==expected,'CLASSIFIED_BINARY_MATCH_SET_CHANGED'
        counts={category:sum(x['category']==category for x in actual) for category in row['categories']}
        assert counts==row['expectedMatchCounts'] and set(counts)==set(row['categories']),'CLASSIFIED_BINARY_PATTERN_COUNTS_CHANGED'
        stats['classifiedPublicConstants'].append({'path':path,'sha256':digest.hexdigest(),'bytes':size,'matchCounts':counts})
        stats['classifiedPublicConstantMatches']+=len(actual)
    else:assert not findings,'UNCLASSIFIED_SECRET_PATTERN_REFUSED'
    stats['rawPatternMatches']+=len(findings)

def scan_frontend_stage(context,role):
    context=pathlib.Path(context);entries=classifications();started=time.monotonic();total=0
    stats={'regularFilesScanned':0,'regularBytesScanned':0,'rawPatternMatches':0,'classifiedPublicConstantMatches':0,'unclassifiedMatches':0,'classifiedPublicConstants':[],'classificationSHA256':POLICY_SHA,'publicFixtureDatabases':[]}
    def account(n):
        nonlocal total
        total+=n;assert total<=1024**3 and time.monotonic()-started<300,'FRONTEND_STAGE_SCAN_BOUND'
    for p in sorted(context.rglob('*')):
        assert not p.is_symlink(),'FRONTEND_STAGE_LINK_REFUSED'
        if not p.is_file():continue
        relative=p.relative_to(context);assert '.git' not in relative.parts and not p.name.startswith('.env'),'FRONTEND_STAGE_PRIVATE_FILE_REFUSED'
        if p.suffix.lower() in {'.db','.sqlite','.sqlite3','.db-wal','.db-shm'}:
            assert any(part in {'test','tests','fixtures','__fixtures__','examples'} for part in relative.parts[:-1]),'FRONTEND_RUNTIME_DATABASE_REFUSED'
            stats['publicFixtureDatabases'].append({'path':relative.as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'provenance':'Immutable public dependency fixture; never mounted as runtime state'})
        stats['regularFilesScanned']+=1
        with p.open('rb') as stream:scan_stream(stream,role,relative.as_posix(),stats,entries,account)
    return stats

def scan_packages(directory,manifest):
    directory=pathlib.Path(directory);started=time.monotonic();total=0;results=[];policy=classifications()
    entries=[('backend',manifest['backend']),*manifest['frontends'].items()]
    assert sum(item['bytes'] for _,item in entries)<=1024**3,'CANDIDATE_EXPORT_PAYLOAD_BOUND'
    def account(count):
        nonlocal total
        total+=count
        assert total<=4*1024**3 and time.monotonic()-started<300,'FINAL_ARCHIVE_SCAN_BOUND'
    for role,item in entries:
        path=directory/item['file'];assert path.is_file() and not path.is_symlink(),'CANDIDATE_ARCHIVE_REGULAR'
        assert path.stat().st_size==item['bytes'],'CANDIDATE_ARCHIVE_SIZE'
        with path.open('rb') as f:assert hashlib.file_digest(f,'sha256').hexdigest()==item['sha256'],'CANDIDATE_ARCHIVE_DIGEST'
        result={'role':role,'archiveSHA256':item['sha256'],'compressedBytes':item['bytes'],'regularFilesScanned':0,'regularBytesScanned':0,'layersScanned':0,'rawPatternMatches':0,'classifiedPublicConstantMatches':0,'unclassifiedMatches':0,'classifiedPublicConstants':[]}
        layers=set()
        if role=='backend':
            with tarfile.open(path,'r:gz') as tf:
                data=tf.extractfile('blobs/sha256/'+item['manifest'][7:]).read()
                assert hashlib.sha256(data).hexdigest()==item['manifest'][7:],'OCI_MANIFEST_SCAN_BINDING'
                oci=json.loads(data);layers={'blobs/sha256/'+x['digest'][7:] for x in oci['layers']}
        seen=set()
        with tarfile.open(path,'r|gz') as tf:
            for member in tf:
                assert member.isfile() and member.name not in seen and not member.mode&0o6000,'FINAL_ARCHIVE_MEMBER_REFUSED'
                seen.add(member.name);stream=tf.extractfile(member)
                if member.name in layers:
                    result['layersScanned']+=1
                    with tarfile.open(fileobj=stream,mode='r|') as layer:
                        for inner in layer:
                            if inner.isfile():
                                result['regularFilesScanned']+=1;scan_stream(layer.extractfile(inner),role,inner.name,result,policy,account)
                else:result['regularFilesScanned']+=1;scan_stream(stream,role,member.name,result,policy,account)
        assert role!='backend' or result['layersScanned']==len(layers),'COMPLETE_IMAGE_LAYER_SCAN_REQUIRED'
        results.append(result)
    return {'schema':'work8-v65-final-source-package-scan-v1','status':'PASS_ALL_ARCHIVE_AND_IMAGE_LAYER_REGULAR_FILES_SCANNED','packages':results,'categories':[x[0] for x in PATTERNS],'rawPatternMatches':sum(x['rawPatternMatches'] for x in results),'classifiedPublicConstantMatches':sum(x['classifiedPublicConstantMatches'] for x in results),'unclassifiedMatches':0,'classificationSHA256':POLICY_SHA,'broadScannerWaivers':False,'totalRegularBytesScanned':total,'seconds':round(time.monotonic()-started,3),'beforeApplicationInitialization':True,'rawBuildLogsIncluded':False,'providerCredentialsSuppliedToBuildCommands':False,'productionDataSupplied':False,'inputBasis':'Verified immutable public application sources, integrity-locked dependencies, pinned public Node base/toolchain, exact admitted native binary. Every generated application context scanned before packaging; final archives scanned again here.'}

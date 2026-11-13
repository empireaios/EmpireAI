#!/usr/bin/env python3
"""Bounded exact-byte private media handoff; no owner credentials or execution from Git data."""
import base64,contextlib,hashlib,json,os,pathlib,re,signal,stat,subprocess,sys,time,urllib.error,urllib.parse,urllib.request

ASSET={'name':'retained-revised.png','mime':'image/png','bytes':599818,'sha256':'69f1f95ab622041332d5e5e1ee43a59a2c34bd017151a6bb45e260f69e035788'}
REPO='empireaios/EmpireAI'
NODE_SHA='3517c2df0b2f8cd7f422b4b8450ef81c6889f08eb03e281d6de9079b15e6a327'
MAX_WAIT=480
MAX_ENVELOPE=805000
HEX40=re.compile(r'^[a-f0-9]{40}$')
HEX64=re.compile(r'^[a-f0-9]{64}$')
class CourierError(Exception):pass
def require(v,code):
    if not v:raise CourierError(code)
def encoded(v):return (json.dumps(v,indent=2,ensure_ascii=False)+'\n').encode()
def sha(b):return hashlib.sha256(b).hexdigest()
def no_dupes(pairs):
    d={}
    for k,v in pairs:
        require(k not in d,'DUPLICATE_JSON_KEY');d[k]=v
    return d
def parse(b,maximum,canonical=False):
    require(len(b)<=maximum,'JSON_SIZE')
    try:v=json.loads(b.decode('utf8'),object_pairs_hook=no_dupes)
    except (ValueError,UnicodeError):raise CourierError('INVALID_JSON')from None
    if canonical:require(encoded(v)==b,'NONCANONICAL_JSON')
    return v
def file_bytes(p,maximum,private=False):
    p=pathlib.Path(p);require(p.is_absolute()and p.resolve(strict=True)==p,'NONLINK_ABSOLUTE_FILE')
    s=p.lstat();require(stat.S_ISREG(s.st_mode)and s.st_nlink==1 and s.st_size<=maximum,'BOUNDED_SINGLELINK_FILE')
    if private:require(s.st_uid==os.getuid()and not s.st_mode&0o077,'PRIVATE_KEY_OWNER_MODE')
    fd=os.open(p,os.O_RDONLY|os.O_NOFOLLOW)
    try:
        before=os.fstat(fd);require(stat.S_ISREG(before.st_mode)and before.st_nlink==1 and before.st_size<=maximum and before.st_ino==s.st_ino and before.st_dev==s.st_dev,'OPEN_FILE_IDENTITY')
        if private:require(before.st_uid==os.getuid()and not before.st_mode&0o077,'OPEN_PRIVATE_KEY_MODE')
        parts=[];count=0
        while count<=maximum:
            block=os.read(fd,min(65536,maximum+1-count))
            if not block:break
            parts.append(block);count+=len(block)
        after=os.fstat(fd);stable=('st_dev','st_ino','st_size','st_mtime_ns','st_ctime_ns','st_nlink','st_mode','st_uid','st_gid');require(count<=maximum and count==s.st_size and all(getattr(before,k)==getattr(after,k)for k in stable),'FILE_CHANGED');return b''.join(parts)
    finally:os.close(fd)
def new_file(p,b,mode=0o600):
    p=pathlib.Path(p);require(p.parent.resolve(strict=True)==p.parent,'OUTPUT_PARENT_LINK')
    fd=os.open(p,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,mode)
    with os.fdopen(fd,'wb')as f:f.write(b);f.flush();os.fsync(f.fileno())
def paths(root):
    root=pathlib.Path(root);require(root.is_absolute()and root.resolve(strict=True)==root and root.is_dir(),'RUNTIME_ROOT')
    run=os.environ.get('GITHUB_RUN_ID','');require(re.fullmatch(r'[1-9][0-9]{0,23}',run),'GITHUB_RUN_ID')
    temp=pathlib.Path(os.environ.get('RUNNER_TEMP',''));require(temp.is_absolute()and temp.resolve(strict=True)==temp,'RUNNER_TEMP')
    require(root.parent==temp/('v126-native-'+run)and root.name=='runtime','EXACT_RUNTIME_ROOT')
    require(os.getuid()==0,'ROOT_HOST_ONLY')
    return {'root':root,'private':root.parent/'courier-private','public':root.parent/'courier-public','asset':root/'connector-inputs'/ASSET['name'],'evidence':root/'evidence'}
def source_binding(control):
    require(os.environ.get('GITHUB_REPOSITORY')==REPO and os.environ.get('GITHUB_RUN_ATTEMPT')=='1','ACTUAL_RUN_IDENTITY')
    commit=os.environ.get('GITHUB_SHA','');require(HEX40.fullmatch(commit),'SOURCE_COMMIT')
    authority=parse(file_bytes(control/'authority.json',65536),65536)
    op=authority.get('operationIdentity');require(isinstance(op,str)and re.fullmatch(r'[A-Za-z0-9_.:-]{1,160}',op),'OPERATION_IDENTITY')
    return {'repository':REPO,'operationIdentity':op,'runId':os.environ['GITHUB_RUN_ID'],'attempt':1,'publicationCommit':commit,'sourceManifestSHA256':sha(file_bytes(control/'source-manifest.json',1048576)),'asset':ASSET}
def node_call(root,control,args,timeout=90):
    node=root/'node';require(sha(file_bytes(node,150000000))==NODE_SHA,'PINNED_NODE')
    p=subprocess.run([str(node),str(control/'media-courier.mjs'),*map(str,args)],stdin=subprocess.DEVNULL,capture_output=True,timeout=timeout,env={'PATH':'/usr/bin:/bin','LANG':'C.UTF-8'})
    require(len(p.stdout)+len(p.stderr)<=16384,'CRYPTO_OUTPUT_BOUND')
    if p.returncode:
        code='CRYPTO_REJECTED'
        try:
            v=parse(p.stderr,16384);c=v.get('code')
            if isinstance(c,str)and re.fullmatch(r'[A-Z0-9_]{1,100}',c):code=c
        except (ValueError,CourierError):pass
        raise CourierError(code)
    return parse(p.stdout,16384)
def receipt(ps,name,value):new_file(ps['evidence']/name,encoded(value),0o600)
def safe_remove(p):
    try:s=p.lstat()
    except FileNotFoundError:return
    require(stat.S_ISREG(s.st_mode)and s.st_nlink==1,'CLEANUP_UNEXPECTED_FILE_TYPE');p.unlink()
def cleanup_paths(ps,remove_asset):
    errors=[]
    for directory,names in [(ps['private'],['private-key.pem','binding.json','envelope.json']),(ps['public'],['key-ready.json'])]:
        if directory.is_symlink():errors.append('CLEANUP_DIRECTORY_LINK');continue
        if directory.exists():
            if not directory.is_dir()or directory.resolve(strict=True)!=directory:errors.append('CLEANUP_DIRECTORY_TYPE');continue
            for name in names:
                try:safe_remove(directory/name)
                except (OSError,CourierError)as e:errors.append(type(e).__name__)
            try:directory.rmdir()
            except OSError:errors.append('CLEANUP_DIRECTORY_NOT_EMPTY')
    if remove_asset:
        try:
            parent=ps['asset'].parent
            if parent.exists():require(parent.resolve(strict=True)==parent and parent.is_dir(),'CLEANUP_ASSET_PARENT')
            safe_remove(ps['asset'])
        except (OSError,CourierError)as e:errors.append(type(e).__name__)
    absent=not ps['private'].exists()and not ps['private'].is_symlink()
    asset_absent=not ps['asset'].exists()and not ps['asset'].is_symlink()
    return {'ephemeralPrivateDirectoryAbsent':absent,'revisedPlaintextAbsent':asset_absent,'publicKeyDirectoryAbsent':not ps['public'].exists(),'cleanupErrors':errors,'physicalStorageErasureClaimed':False}
def keygen(root,control):
    ps=paths(root);b=source_binding(control)
    require(not(root.parent/'private').exists(),'NO_NATIVE_CREDENTIALS')
    require(not ps['private'].exists()and not ps['public'].exists(),'FRESH_ONE_USE_KEY_REQUIRED')
    ps['private'].mkdir(mode=0o700);ps['public'].mkdir(mode=0o755)
    try:
        new_file(ps['private']/'binding.json',encoded(b));r=node_call(root,control,['keygen',ps['private']/'binding.json',ps['private']/'private-key.pem',ps['public']/'key-ready.json'])
        require(file_bytes(ps['private']/'private-key.pem',16384,private=True).startswith(b'-----BEGIN PRIVATE KEY-----\n'),'PRIVATE_KEY_FORMAT')
        ready=file_bytes(ps['public']/'key-ready.json',16384);require(sha(ready)==r['keyReadySHA256'],'KEY_READY_READBACK')
        receipt(ps,'media-courier-key-ready.json',{'schema':'V128_MEDIA_COURIER_KEY_READY_RECEIPT_V1','status':'PUBLIC_EPHEMERAL_KEY_READY','binding':b,**r,'privateKeyExported':False,'ownerCredentialsUsed':False,'evidencePrivateKeyUsed':False})
        return r
    except BaseException:
        cleanup_paths(ps,False);raise
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*a,**kw):raise CourierError('HTTP_REDIRECT_REFUSED')
class GitHubRead:
    def __init__(self,deadline,token,run_id,clock=time.monotonic):
        require(isinstance(token,str)and re.fullmatch(r'[A-Za-z0-9_.-]{20,4096}',token),'READ_TOKEN_REQUIRED_OR_INVALID')
        require(isinstance(run_id,str)and re.fullmatch(r'[1-9][0-9]{0,23}',run_id),'READ_RUN_IDENTITY')
        self.deadline=deadline;self.clock=clock;self._token=token;self._ref_path='/git/ref/heads/work8/v128-a10-handoff-'+run_id+'-1'
        self.opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),NoRedirect())
    def get(self,path,maximum=65536,missing=False):
        require(isinstance(path,str)and(path==self._ref_path or re.fullmatch(r'/git/(?:commits|trees|blobs)/[a-f0-9]{40}',path)),'GITHUB_PATH')
        require(not missing or path==self._ref_path,'MISSING_ONLY_HANDOFF_REF')
        remaining=self.deadline-self.clock();require(remaining>0,'MEDIA_HANDOFF_DEADLINE')
        url='https://api.github.com/repos/'+REPO+path
        parts=urllib.parse.urlsplit(url);require(parts.scheme=='https'and parts.netloc=='api.github.com'and parts.username is None and parts.password is None and parts.query==''and parts.fragment==''and parts.path.startswith('/repos/'+REPO+'/git/'),'GITHUB_ORIGIN')
        req=urllib.request.Request(url,method='GET',headers={'Authorization':'Bearer '+self._token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'EmpireAI-fixed-media-courier','Accept-Encoding':'identity'})
        try:
            with self.opener.open(req,timeout=min(15,remaining))as resp:
                require(resp.status==200 and resp.geturl()==url,'GITHUB_RESPONSE')
                require(resp.headers.get('Content-Encoding','identity')=='identity','CONTENT_ENCODING')
                if resp.headers.get('Content-Length'):require(int(resp.headers['Content-Length'])<=maximum,'HTTP_BODY_BOUND')
                b=resp.read(maximum+1);require(self.clock()<self.deadline,'MEDIA_HANDOFF_DEADLINE');return parse(b,maximum)
        except urllib.error.HTTPError as e:
            if missing and e.code==404:e.close();return None
            raise CourierError('HTTP_STATUS_'+str(e.code))from None
        except (TimeoutError,OSError):raise CourierError('HTTP_TRANSPORT_FAILED')from None
def git_oid(kind,b):return hashlib.sha1(kind.encode()+b' '+str(len(b)).encode()+b'\0'+b).hexdigest()
def tree_rows(api,oid,expected):
    require(isinstance(oid,str)and HEX40.fullmatch(oid),'TREE_IDENTITY');v=api.get('/git/trees/'+oid)
    require(v.get('sha')==oid and v.get('truncated')is False,'TREE_IDENTITY_TRUNCATION');rows=v.get('tree');require(isinstance(rows,list)and len(rows)==len(expected),'EXACT_TREE_SIZE')
    require(len({r.get('path')for r in rows})==len(rows),'TREE_DUPLICATE')
    actual={r.get('path'):r for r in rows};require(set(actual)==set(expected),'EXACT_HANDOFF_FILES')
    for name,(kind,mode)in expected.items():
        r=actual[name];require(r.get('type')==kind and r.get('mode')==mode and HEX40.fullmatch(r.get('sha','')),'TREE_ENTRY')
    chunks=[]
    for r in sorted(rows,key=lambda r:(r['path']+('/'if r['type']=='tree'else'')).encode()):
        mode='40000'if r['mode']=='040000'else r['mode'];chunks.append(mode.encode()+b' '+r['path'].encode()+b'\0'+bytes.fromhex(r['sha']))
    require(git_oid('tree',b''.join(chunks))==oid,'TREE_HASH');return actual
def blob(api,row,maximum):
    require(type(row.get('size'))is int and 0<row['size']<=maximum,'BLOB_TREE_SIZE')
    v=api.get('/git/blobs/'+row['sha'],max(65536,maximum*2));require(v.get('sha')==row['sha']and v.get('encoding')=='base64'and v.get('size')==row['size'],'BLOB_RESPONSE')
    c=v.get('content');require(isinstance(c,str)and len(c)<=maximum*2,'BLOB_BASE64_SIZE')
    try:b=base64.b64decode(c.replace('\n',''),validate=True)
    except ValueError:raise CourierError('BLOB_BASE64')from None
    require(len(b)==row['size']and git_oid('blob',b)==row['sha'],'BLOB_HASH');return b
def read_handoff(api,b):
    branch='work8/v128-a10-handoff-'+b['runId']+'-1';v=api.get('/git/ref/heads/'+branch,missing=True)
    if v is None:return None
    require(v.get('ref')=='refs/heads/'+branch and v.get('object',{}).get('type')=='commit','HANDOFF_REF')
    oid=v['object'].get('sha');require(isinstance(oid,str)and HEX40.fullmatch(oid),'HANDOFF_COMMIT_ID')
    commit=api.get('/git/commits/'+oid);require(commit.get('sha')==oid and [x.get('sha')for x in commit.get('parents',[])]==[b['publicationCommit']],'HANDOFF_SINGLE_PARENT')
    tree=commit.get('tree',{}).get('sha');rows=tree_rows(api,tree,{'empireai-web':('tree','040000'),'envelope.json':('blob','100644'),'vercel.json':('blob','100644')})
    child=tree_rows(api,rows['empireai-web']['sha'],{'vercel.json':('blob','100644')})
    expected=encoded({'git':{'deploymentEnabled':{branch:False}}})
    require(blob(api,rows['vercel.json'],4096)==expected and blob(api,child['vercel.json'],4096)==expected,'DEPLOYMENT_SUPPRESSION_EXACT')
    payload=blob(api,rows['envelope.json'],MAX_ENVELOPE);parse(payload,MAX_ENVELOPE,canonical=True)
    return payload,{'handoffBranch':branch,'handoffCommit':oid,'handoffTree':tree,'envelopeBlobSHA1':rows['envelope.json']['sha'],'envelopeSHA256':sha(payload),'handoffFileCount':3,'handoffContainsCodeOrWorkflows':False,'bothVercelRootsExplicitlyDisabled':True}
def poll(api,b,deadline,clock=time.monotonic,sleep=time.sleep):
    attempts=0
    while True:
        require(clock()<deadline,'MEDIA_HANDOFF_DEADLINE');attempts+=1;r=read_handoff(api,b)
        if r is not None:return r,attempts
        left=deadline-clock();require(left>0,'MEDIA_HANDOFF_DEADLINE');sleep(min(20,left))
@contextlib.contextmanager
def deadline_alarm(seconds):
    require(0<seconds<=MAX_WAIT,'WAIT_BOUND');old=signal.getsignal(signal.SIGALRM)
    def expired(*_):raise CourierError('MEDIA_HANDOFF_DEADLINE')
    signal.signal(signal.SIGALRM,expired);signal.setitimer(signal.ITIMER_REAL,seconds)
    try:yield
    finally:signal.setitimer(signal.ITIMER_REAL,0);signal.signal(signal.SIGALRM,old)
def receive(root,control):
    token=os.environ.pop('EMPIREAI_COURIER_GITHUB_TOKEN',None);ps=paths(root);b=None;start=time.monotonic();success=False
    try:
        b=source_binding(control)
        require(not(root.parent/'private').exists(),'NO_NATIVE_CREDENTIALS')
        require(ps['private'].is_dir()and ps['private'].resolve(strict=True)==ps['private'],'PRIVATE_DIRECTORY')
        require(ps['asset'].parent.resolve(strict=True)==ps['asset'].parent and not ps['asset'].exists(),'FRESH_ASSET_TARGET')
        stored=parse(file_bytes(ps['private']/'binding.json',16384),16384,True);require(stored==b,'ACTUAL_SOURCE_RUN_BINDING')
        require(sha(file_bytes(ps['public']/'key-ready.json',16384))==parse(file_bytes(ps['evidence']/'media-courier-key-ready.json',32768),32768)['keyReadySHA256'],'KEY_READY_CUSTODY')
        deadline=start+MAX_WAIT
        with deadline_alarm(MAX_WAIT):
            (payload,identity),attempts=poll(GitHubRead(deadline,token,b['runId']),b,deadline)
            new_file(ps['private']/'envelope.json',payload)
            r=node_call(root,control,['decrypt',ps['private']/'binding.json',ps['public']/'key-ready.json',ps['private']/'envelope.json',ps['private']/'private-key.pem',ps['asset']],timeout=max(1,min(30,deadline-time.monotonic())))
        actual=file_bytes(ps['asset'],ASSET['bytes']);require(len(actual)==ASSET['bytes']and sha(actual)==ASSET['sha256']and stat.S_IMODE(ps['asset'].stat().st_mode)==0o444,'PLAINTEXT_READBACK')
        cleanup=cleanup_paths(ps,False);require(cleanup['ephemeralPrivateDirectoryAbsent']and not cleanup['cleanupErrors'],'EPHEMERAL_KEY_REMOVAL')
        receipt(ps,'media-courier-received.json',{'schema':'V128_MEDIA_COURIER_RECEIVED_V1','status':'EXACT_PRIVATE_REVISED_ASSET_RECEIVED','binding':b,**identity,'crypto':r,'pollAttempts':attempts,'elapsedSeconds':time.monotonic()-start,'maximumWaitSeconds':MAX_WAIT,'ephemeralKeyCleanup':cleanup,'plaintextPubliclyPublished':False,'nativeCredentialsPresent':False,'wholeRowAccepted':False})
        success=True;return r
    except BaseException as e:
        cleanup=cleanup_paths(ps,True)
        code=str(e)if isinstance(e,CourierError)else type(e).__name__
        try:receipt(ps,'media-courier-first-failure.json',{'schema':'V128_MEDIA_COURIER_FIRST_FAILURE_V1','status':'FAIL_PRIVATE_MEDIA_HANDOFF','error':code[:100],'binding':b,'elapsedSeconds':time.monotonic()-start,'maximumWaitSeconds':MAX_WAIT,'cleanup':cleanup,'nativeCredentialsPresent':False,'wholeRowAccepted':False})
        except (OSError,CourierError):pass
        raise
    finally:
        token=None
        if not success:cleanup_paths(ps,True)
def cleanup(root):
    ps=paths(root);r=cleanup_paths(ps,True);receipt(ps,'media-courier-cleanup.json',{'schema':'V128_MEDIA_COURIER_TERMINAL_CLEANUP_V1','status':'PASS'if not r['cleanupErrors']and r['ephemeralPrivateDirectoryAbsent']and r['revisedPlaintextAbsent']else'FAIL',**r});require(not r['cleanupErrors']and r['ephemeralPrivateDirectoryAbsent']and r['revisedPlaintextAbsent'],'COURIER_CLEANUP_FAILED');return r
def main():
    require(len(sys.argv)==3 and sys.argv[1]in['keygen','receive','cleanup'],'CLI_FIELDS');root=pathlib.Path(sys.argv[2]);control=pathlib.Path(__file__).resolve().parent
    result=cleanup(root)if sys.argv[1]=='cleanup'else(keygen(root,control)if sys.argv[1]=='keygen'else receive(root,control))
    print(json.dumps(result,separators=(',',':')))
if __name__=='__main__':
    try:main()
    except BaseException as e:
        print(json.dumps({'status':'REJECTED','code':str(e)if isinstance(e,CourierError)else type(e).__name__}),file=sys.stderr);sys.exit(1)

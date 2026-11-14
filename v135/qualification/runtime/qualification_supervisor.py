#!/usr/bin/python3
"""Run public-data Stage A only; independent PID1 timeout enforces termination."""
import datetime,hashlib,importlib.util,json,os,pathlib,re,signal,socket,stat,subprocess,time
CONTROL=pathlib.Path('/control/qualification');STATE=pathlib.Path('/state/qualification')
children={};stop=False

def require(ok,code):
    if not ok:raise ValueError(code)
def sha(path):
    with path.open('rb')as f:return hashlib.file_digest(f,'sha256').hexdigest()
def emit(schema,**fields):print(json.dumps({'schema':schema,**fields},separators=(',',':')),flush=True)
def signal_stop(*args):
    global stop;stop=True
def child_exit_codes():
    # Fixed child names and numeric status only; never expose process output or environment.
    return {name:child.poll()for name,child in children.items()}
def require_children_running():
    require(all(code is None for code in child_exit_codes().values()),'MANAGED_CHILD_EXITED')
def create_synthetic_owner_policy(cfg):
    """Mount finite synthetic commissioning policy beneath outer write deny."""
    require(os.geteuid()==0,'ROOT_SYNTHETIC_POLICY_REQUIRED')
    authority_path=CONTROL/'qualification-authority.json'
    require(sha(authority_path)==cfg['authoritySHA256'],'EXACT_SYNTHETIC_AUTHORITY')
    authority=json.loads(authority_path.read_bytes())
    require(authority.get('operationIdentity')==cfg['operationIdentity']=='V135-A10-DELIVERY-QUALIFICATION-A04-20261114'and authority.get('stage')=='A','EXACT_SYNTHETIC_OPERATION')
    scope=authority.get('syntheticOperatorPolicyScope',{})
    for name,value in {'permitted':True,'mustBindExactAuthoritySHA256':True,'mustExpireAtImmutableRuntimeDeadline':True,'mustPreserveNativeGuard':True,'mustPreserveExternalWriteDeny':True,'privateA08Permitted':False,'ownerMediaDecisionPermitted':False,'productionMutationPermitted':False,'commerceActivationPermitted':False}.items():
        require(scope.get(name)is value,'EXACT_SYNTHETIC_POLICY_SCOPE')
    require(authority.get('privateDataTransferAuthorized')is False and authority.get('nativeOwnerDecisionAuthorized')is False and authority.get('productionPermission')is False,'NO_PRIVATE_POLICY_AUTHORITY')
    require(cfg['privateDataIncluded']is False and cfg['ownerDecisionPermitted']is False,'SYNTHETIC_POLICY_ONLY')
    require(type(cfg['startedAtMs'])is int and type(cfg['qualificationExpiresAtMs'])is int and 0<cfg['qualificationExpiresAtMs']-cfg['startedAtMs']<=1800000 and cfg['qualificationExpiresAtMs']>time.time_ns()//1000000,'FINITE_SYNTHETIC_POLICY')
    directory=STATE.lstat()
    require(stat.S_ISDIR(directory.st_mode)and not STATE.is_symlink()and directory.st_uid==0 and directory.st_gid==1001 and stat.S_IMODE(directory.st_mode)==0o1770,'PROTECTED_SYNTHETIC_POLICY_DIRECTORY')
    policy={'schema':1,'mode':'RELEASED','approvalSha256':cfg['authoritySHA256'],'expiresAt':datetime.datetime.fromtimestamp(cfg['qualificationExpiresAtMs']/1000,datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z')}
    target=STATE/'synthetic-owner-read-policy.json'
    fd=os.open(target,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o400)
    with os.fdopen(fd,'w')as stream:
        json.dump(policy,stream,separators=(',',':'));stream.write('\n');stream.flush();os.fsync(stream.fileno())
    os.chown(target,0,1001);target.chmod(0o440)
    return str(target)
def read_startup_failure():
    """Return only a fixed native startup predicate code, never child output."""
    try:
        fd=os.open(STATE/'startup-smoke-failure.json',os.O_RDONLY|os.O_NOFOLLOW|os.O_NONBLOCK)
        with os.fdopen(fd,'rb')as stream:
            info=os.fstat(stream.fileno())
            require(stat.S_ISREG(info.st_mode)and info.st_nlink==1 and info.st_uid==1001 and stat.S_IMODE(info.st_mode)==0o400 and 0<info.st_size<=1024,'INVALID_STARTUP_DIAGNOSTIC')
            data=json.loads(stream.read(1025))
        codes={'NATIVE_STARTUP_JSON','NATIVE_STARTUP_LOGIN','NATIVE_STARTUP_COOKIE','NATIVE_STARTUP_PRINCIPAL','NATIVE_STARTUP_PORTFOLIO','NATIVE_STARTUP_EMPTY_MEDIA','NATIVE_STARTUP_COMPARABLES','NATIVE_STARTUP_WRITE_DENY','NATIVE_STARTUP_LOGOUT','NATIVE_STARTUP_REVOCATION'}
        require(set(data)=={'schema','code'}and data['schema']=='V135_STAGE_A_NATIVE_STARTUP_FAILURE_V1'and data['code']in codes,'INVALID_STARTUP_DIAGNOSTIC')
        return {'status':'VALIDATED','code':data['code']}
    except FileNotFoundError:return {'status':'NOT_RECORDED'}
    except Exception:return {'status':'INVALID_OR_UNREADABLE'}
def read_ingress_seal():
    """Allowlist bounded numeric diagnostics only; never relay child output."""
    path=STATE/'ingress-seal.json'
    try:
        fd=os.open(path,os.O_RDONLY|os.O_NOFOLLOW|os.O_NONBLOCK)
        with os.fdopen(fd,'rb')as f:
            info=os.fstat(f.fileno())
            require(stat.S_ISREG(info.st_mode)and info.st_nlink==1 and info.st_uid==1001 and info.st_size<=4096,'INVALID_SEAL_DIAGNOSTIC')
            data=json.loads(f.read(4097))
        reasons={'HTTP_RESPONSE_BYTE_BUDGET','REQUEST_BUDGET','ABSOLUTE_EXPIRY','UPSTREAM_RESPONSE_LIMIT','REQUEST_BODY_LIMIT','CONNECTION_BUDGET'}
        require(data.get('schema')=='V135_STAGE_A_INGRESS_SEAL_V1'and data.get('reason')in reasons,'INVALID_SEAL_DIAGNOSTIC')
        fields=['atMs','responseBytes','requests','connections','peakConcurrentRequests','peakQueuedRequests','rejectedTransientRequests','rejectedTransientConnections']
        require(all(type(data.get(k))is int and 0<=data[k]<=2**53-1 for k in fields),'INVALID_SEAL_DIAGNOSTIC')
        return {'status':'VALIDATED','reason':data['reason'],**{k:data[k]for k in fields}}
    except FileNotFoundError:return {'status':'NOT_RECORDED'}
    except Exception:return {'status':'INVALID_OR_UNREADABLE'}

def main():
    global stop
    require(os.geteuid()==0,'ROOT_SUPERVISOR_REQUIRED')
    cfg=json.loads((STATE/'root-clock.json').read_bytes());manifest=json.loads((CONTROL/'runtime-manifest.json').read_bytes())
    require(cfg['qualificationExpiresAtMs']>time.time_ns()//1000000 and cfg['qualificationExpiresAtMs']-cfg['startedAtMs']==1800000,'FIXED_TECHNICAL_CLOCK')
    require(cfg['privateDataIncluded'] is False and cfg['ownerDecisionPermitted'] is False,'NONOWNER_QUALIFICATION_ONLY')
    require(sha(CONTROL/'runtime-manifest.json')==cfg['runtimeManifestSHA256'],'EXACT_RUNTIME_MANIFEST')
    require(manifest['sourceCommit']==cfg['sourceCommit'],'EXACT_RUNTIME_SOURCE')
    # Verify actual executable contents before starting even the harmless account.
    seen=set()
    for row in manifest['files']:
        path=pathlib.Path(row['path']);require(path.is_absolute() and path.resolve()==path and row['path']not in seen,'PINNED_RUNTIME_PATH');seen.add(row['path'])
        info=path.lstat();require(stat.S_ISREG(info.st_mode)and info.st_uid==0 and not info.st_mode&0o022,'PINNED_RUNTIME_PERMISSIONS')
        require(info.st_size==row['bytes']and sha(path)==row['sha256'],'PINNED_RUNTIME_BYTES')
    process_path=pathlib.Path('/control/owner_review/host/process_graph.py');require(str(process_path)in seen,'PINNED_PROCESS_GRAPH')
    spec=importlib.util.spec_from_file_location('stage_a_process_graph',process_path);graph=importlib.util.module_from_spec(spec);spec.loader.exec_module(graph)
    capability=graph.enable_subreaper()
    for sig in (signal.SIGTERM,signal.SIGINT):signal.signal(sig,signal_stop)
    env={'PATH':'/usr/local/bin:/usr/bin:/bin','HOME':'/tmp','LANG':'C.UTF-8','TZ':'UTC','NODE_ENV':'production','PYTHONDONTWRITEBYTECODE':'1'}
    def spawn(name,argv,extra=None,cwd='/'):
        require(not stop,'STOP_REQUESTED')
        child=subprocess.Popen(['/usr/bin/setpriv','--reuid=1001','--regid=1001','--init-groups','--no-new-privs','--bounding-set=-all','--inh-caps=-all','--ambient-caps=-all',*argv],cwd=cwd,env={**env,**(extra or{})},stdin=subprocess.DEVNULL,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,start_new_session=True)
        children[name]=child;return child
    def ready(port,seconds):
        deadline=min(time.monotonic()+seconds,time.monotonic()+max(0,(cfg['qualificationExpiresAtMs']-time.time_ns()//1000000)/1000))
        while time.monotonic()<deadline and not stop:
            require_children_running()
            try:
                with socket.create_connection(('127.0.0.1',port),timeout=.15):return
            except OSError:time.sleep(.05)
        raise ValueError('READINESS_DEADLINE')
    outcome='NOT_STARTED';stage='SYNTHETIC_POLICY';cleanup_errors=[];removed=0;failure_class=None;failure_child_codes=None
    try:
        policy_path=create_synthetic_owner_policy(cfg)
        stage='REDIS'
        spawn('redis',['/usr/bin/redis-server','--bind','127.0.0.1','--port','46379','--save','','--appendonly','no','--protected-mode','yes','--maxmemory','33554432','--maxmemory-policy','noeviction']);ready(46379,15)
        stage='BACKEND';spawn('backend',['/usr/local/bin/node','--max-old-space-size=512',str(CONTROL/'qualification_backend.mjs')],{'EMPIRE_OWNER_WRITE_POLICY':policy_path});ready(4000,30)
        for name in ['encrypted-credentials.json','public-status.json','startup-smoke.json']:
            p=STATE/name;info=p.lstat();require(p.resolve()==p and stat.S_ISREG(info.st_mode)and info.st_nlink==1 and info.st_size<=16384,'BOUNDED_PUBLIC_METADATA')
            os.chown(p,0,1001);p.chmod(0o440)
        smoke=json.loads((STATE/'startup-smoke.json').read_bytes())
        require(smoke.get('schema')=='V135_STAGE_A_NATIVE_STARTUP_SMOKE_V1'and smoke.get('status')=='PASS'and smoke.get('operationIdentity')==cfg['operationIdentity']and smoke.get('sourceCommit')==cfg['sourceCommit']and smoke.get('authoritySHA256')==cfg['authoritySHA256'],'NATIVE_STARTUP_SMOKE_BINDING')
        require(all(smoke.get(key)is True for key in ['nativeLoginVerified','nativePrincipalVerified','nativePortfolioVerified','emptyMediaVerified','nativeComparablesUnavailableVerified','commerceWriteDenied','nativeLogoutVerified','revocationVerified']),'NATIVE_STARTUP_SMOKE_FAILED')
        require(smoke.get('nativeComparablesStatusCode')==503 and smoke.get('nativeComparablesError')=='COMPARABLE_SOURCE_UNAVAILABLE','EXPECTED_DISABLED_COMPARABLES')
        require(smoke.get('buildOnly')is False and smoke.get('privateDataIncluded')is False and smoke.get('ownerDecisionPerformed')is False,'NATIVE_STARTUP_SMOKE_SCOPE')
        stage='FRONTEND';spawn('frontend',['/usr/local/bin/node','--max-old-space-size=768','/frontend/app/server.js'],{'HOSTNAME':'127.0.0.1','PORT':'43117','BRAIN_API_URL':'http://127.0.0.1:4000','NEXT_TELEMETRY_DISABLED':'1'},'/frontend/app');ready(43117,45)
        stage='INGRESS';spawn('ingress',['/usr/local/bin/node','--max-old-space-size=128',str(CONTROL/'qualification_ingress.mjs')]);ready(8080,15)
        stage='READY';outcome='TECHNICAL_RUNTIME_READY'
        emit('V135_STAGE_A_RUNTIME_READY_V1',operationIdentity=cfg['operationIdentity'],sourceCommit=cfg['sourceCommit'],deploymentId=cfg['deploymentId'],runtimeManifestSHA256=cfg['runtimeManifestSHA256'],nativeStartupSmokeSHA256=sha(STATE/'startup-smoke.json'),qualificationExpiresAtMs=cfg['qualificationExpiresAtMs'],privateDataIncluded=False,ownerDecisionPermitted=False,genuineOwnerReviewClockStarted=False,**capability)
        while not stop and time.time_ns()//1000000<cfg['qualificationExpiresAtMs']:
            require_children_running();time.sleep(.05)
        outcome='FIXED_QUALIFICATION_TERMINATION'
    except Exception as error:
        outcome=str(error)if type(error)is ValueError and re.fullmatch('[A-Z_]+',str(error))else 'QUALIFICATION_RUNTIME_FAILURE'
        failure_class=type(error).__name__;failure_child_codes=child_exit_codes()
    finally:
        for child in reversed(tuple(children.values())):
            if child.poll()is None:
                try:child.terminate()
                except ProcessLookupError:pass
        time.sleep(.2)
        stopped=graph.stop_descendants(children,time.monotonic()+2.0)
        ingress_seal=read_ingress_seal()
        startup_failure=read_startup_failure()
        if stopped:
            # Unlink only this fresh operation directory. Never follow a symlink.
            for base,dirs,files in os.walk(STATE,topdown=False,followlinks=False):
                for name in files:
                    p=pathlib.Path(base)/name
                    try:p.unlink();removed+=1
                    except OSError:cleanup_errors.append('FILE_UNLINK_FAILED')
                for name in dirs:
                    p=pathlib.Path(base)/name
                    try:
                        if p.is_symlink():p.unlink();removed+=1
                        else:p.rmdir()
                    except OSError:cleanup_errors.append('DIRECTORY_REMOVE_FAILED')
            try:STATE.rmdir()
            except OSError:cleanup_errors.append('ROOT_DIRECTORY_REMOVE_FAILED')
        else:cleanup_errors.append('PROCESS_GRAPH_STOP_UNPROVEN')
        emit('V135_STAGE_A_TERMINAL_V1',operationIdentity=cfg['operationIdentity'],deploymentId=cfg['deploymentId'],stage=stage,outcome=outcome,failureClass=failure_class,childExitCodesAtFailure=failure_child_codes,childExitCodesAfterCleanup=child_exit_codes(),ingressSeal=ingress_seal,nativeStartupFailure=startup_failure,processGraph=graph.last_stop_report,logicalCleanup='COMPLETE'if stopped and not cleanup_errors else 'INCOMPLETE',removedFiles=removed,cleanupErrors=cleanup_errors,providerErasureClaimed=False,ownerDecisionPerformed=False)
        return 0 if stopped and not cleanup_errors and outcome=='FIXED_QUALIFICATION_TERMINATION'else 1
if __name__=='__main__':
    try:raise SystemExit(main())
    except Exception as error:
        code=str(error)if type(error)is ValueError and re.fullmatch('[A-Z_]+',str(error))else 'QUALIFICATION_SUPERVISOR_REFUSED'
        emit('V135_STAGE_A_SUPERVISOR_REFUSED_V1',code=code,privateActivation=False);raise SystemExit(78)

#!/usr/bin/python3
"""Start ONLY the public-data Stage A qualification beneath a fixed hard timeout."""
import hashlib,json,os,pathlib,re,resource,stat,time
CONTROL=pathlib.Path('/control/qualification')
RUNTIME=pathlib.Path('/state/qualification')
OP='V135-A10-DELIVERY-QUALIFICATION-A03-20261114'
def require(ok,code):
    if not ok:raise ValueError(code)
def main():
    require(os.geteuid()==0 and os.getpid()==1,'ROOT_PID1_REQUIRED')
    resource.setrlimit(resource.RLIMIT_CORE,(0,0));os.umask(0o077)
    cfg=json.loads((CONTROL/'qualification-config.json').read_bytes())
    manifest=json.loads((CONTROL/'runtime-manifest.json').read_bytes())
    require(cfg['schema']=='V135_STAGE_A_RUNTIME_CONFIG_V1' and cfg['operationIdentity']==OP,'EXACT_QUALIFICATION_SCOPE')
    require(cfg['privateDataIncluded'] is False and cfg['ownerDecisionPermitted'] is False,'NO_PRIVATE_ACTIVATION')
    require(cfg['maximumRuntimeSeconds']==1800 and cfg['killGraceSeconds']==5,'FIXED_30_MINUTE_LIMIT')
    require(manifest['schema']=='V135_STAGE_A_RUNTIME_MANIFEST_V1','ACTUAL_RUNTIME_MANIFEST')
    require(manifest['sourceCommit']==os.environ.get('A10_QUALIFICATION_SOURCE_COMMIT_SHA')==os.environ.get('RAILWAY_GIT_COMMIT_SHA'),'EXACT_PUBLICATION')
    for field,var in [('projectId','RAILWAY_PROJECT_ID'),('environmentId','RAILWAY_ENVIRONMENT_ID'),('serviceId','RAILWAY_SERVICE_ID')]:
        require(cfg[field]==os.environ.get(var),'EXACT_DESTINATION_'+field.upper())
    deployment=os.environ.get('RAILWAY_DEPLOYMENT_ID','');require(re.fullmatch('[a-f0-9-]{36}',deployment),'ACTUAL_DEPLOYMENT_REQUIRED')
    require(cfg['origin']==os.environ.get('A10_QUALIFICATION_ORIGIN'),'EXACT_ORIGIN')
    now=time.time_ns()//1000000
    start=int(os.environ.get('A10_QUALIFICATION_START_NOT_BEFORE_MS','0'));last=int(os.environ.get('A10_QUALIFICATION_START_NOT_AFTER_MS','0'))
    require(0<last-start<=900000 and start<=now<=last,'BOUNDED_START_WINDOW')
    if not RUNTIME.parent.exists():
        RUNTIME.parent.mkdir(mode=0o755);RUNTIME.parent.chmod(0o755)
    state_info=RUNTIME.parent.lstat()
    require(stat.S_ISDIR(state_info.st_mode)and not RUNTIME.parent.is_symlink()and state_info.st_uid==0 and stat.S_IMODE(state_info.st_mode)==0o755,'ROOT_STATE_DIRECTORY_REQUIRED')
    require(not RUNTIME.exists()and not RUNTIME.is_symlink(),'FRESH_RUNTIME_REQUIRED')
    RUNTIME.mkdir(mode=0o1770);os.chown(RUNTIME,0,1001);RUNTIME.chmod(0o1770)
    public={**cfg,'qualificationSourceManifestSHA256':manifest['sourceManifestSHA256'],'sourceCommit':manifest['sourceCommit'],'deploymentId':deployment,'runtimeManifestSHA256':hashlib.sha256((CONTROL/'runtime-manifest.json').read_bytes()).hexdigest(),'startedAtMs':now,'qualificationExpiresAtMs':now+1800000,'genuineOwnerReviewClockStarted':False}
    clock=RUNTIME/'root-clock.json'
    with clock.open('x')as f:json.dump(public,f,separators=(',',':'));f.write('\n');f.flush();os.fsync(f.fileno())
    os.chown(clock,0,1001);clock.chmod(0o440)
    for key in list(os.environ):
        if key not in ['PATH','LANG','TZ']:os.environ.pop(key,None)
    os.environ.update(PATH='/usr/local/bin:/usr/bin:/bin',LANG='C.UTF-8',TZ='UTC')
    remaining=(public['qualificationExpiresAtMs']-time.time_ns()//1000000)/1000
    require(0<remaining<=1800,'FIXED_DEADLINE')
    os.execv('/usr/bin/timeout',['/usr/bin/timeout','--signal=TERM','--kill-after=5s',f'{remaining:.3f}s','/usr/bin/python3','-I','-B',str(CONTROL/'qualification_supervisor.py')])
if __name__=='__main__':
    try:main()
    except Exception as error:
        code=str(error)if type(error)is ValueError and re.fullmatch('[A-Z_]+',str(error))else 'QUALIFICATION_ENTRY_REFUSED'
        print(json.dumps({'schema':'V135_STAGE_A_START_REFUSED_V1','code':code,'privateActivation':False}),flush=True);raise SystemExit(78)

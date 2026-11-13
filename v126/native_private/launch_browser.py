#!/usr/bin/env python3
"""Run the exact retained browser as an independently bounded private namespace peer."""
import hashlib,json,os,pathlib,subprocess,sys,time
CONTROL=pathlib.Path(__file__).resolve().parent
NATIVE_IMAGE='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0'
BROWSER_IMAGE='sha256:fee853fafa59550d162cef52bca02d907694b44ebf6ef9fb075bcc0c65d8dedb'
BROWSER_DIGEST='mcr.microsoft.com/playwright@sha256:c091b21d9fae78c76e85cd4356431e9b018402f172a214fc7d7a5e9a7e29d8ac'
NODE_SHA='3517c2df0b2f8cd7f422b4b8450ef81c6889f08eb03e281d6de9079b15e6a327'
def command(argv,seconds=30):
    p=subprocess.run(argv,stdin=subprocess.DEVNULL,capture_output=True,timeout=seconds)
    assert len(p.stdout)+len(p.stderr)<=1048576,'BROWSER_COMMAND_OUTPUT_BOUND'
    if p.returncode:raise RuntimeError('BROWSER_PROVIDER_COMMAND_FAILED_'+str(p.returncode)+'_'+hashlib.sha256(p.stderr).hexdigest())
    return p.stdout
def docker(args,seconds=30):return command(['docker']+args,seconds)
def inspect(name):return json.loads(docker(['inspect',name]))[0]
def inventory():return [json.loads(line)for line in docker(['ps','-a','--format','{{json .}}']).decode().splitlines()if line.strip()]
def save(root,name,value):
    with(root/'evidence'/name).open('x')as f:json.dump(value,f,indent=2);f.write('\n')
def main():
    assert os.getuid()==0 and len(sys.argv)==4
    root=pathlib.Path(sys.argv[1]);private=pathlib.Path(sys.argv[2]);native=sys.argv[3]
    assert native.startswith('work8-v126-native-gh-')and native[len('work8-v126-native-gh-'):].isdigit()
    name='work8-v128-connector-browser-'+native.split('-')[-1]
    for p in [root,private,CONTROL]:assert p.is_absolute()and p.resolve(strict=True)==p and p.is_dir()and','not in str(p)
    n=inspect(native);assert n['Image']==NATIVE_IMAGE and n['State']['Running']
    assert n['Config']['Labels'].get('empireai.v126.native')==native and n['HostConfig']['NetworkMode']=='none'
    image=json.loads(docker(['image','inspect',BROWSER_DIGEST]))[0]
    assert image['Id']==BROWSER_IMAGE and image['Os']=='linux'and image['Architecture']=='amd64'
    assert BROWSER_DIGEST in image['RepoDigests']
    assert not any(r['Names']==name for r in inventory()),'EXISTING_BROWSER_REQUIRES_RECONCILIATION'
    assert hashlib.sha256((root/'node').read_bytes()).hexdigest()==NODE_SHA
    output=root/'browser-output';assert not output.exists();output.mkdir(mode=0o700)
    binds={CONTROL:'/control',private:'/private',root/'browser-deps':'/browser-deps',root/'node':'/node'}
    label='empireai.v128.connector.browser='+name
    argv=['create','--name',name,'--label',label,'--pull','never','--network','container:'+n['Id'],
      '--user','0:0','--cap-drop','ALL','--security-opt','no-new-privileges','--read-only',
      '--memory','2147483648','--memory-swap','2147483648','--cpus','2','--pids-limit','256',
      '--ipc','private','--shm-size','268435456','--restart','no','--ulimit','core=0:0',
      '--ulimit','fsize=33554432:33554432','--log-driver','none','--entrypoint','/node',
      '--env','HOME=/tmp','--env','LANG=C.UTF-8','--env','TZ=UTC','--env','PLAYWRIGHT_BROWSERS_PATH=/ms-playwright']
    for source,dest in binds.items():argv+=['--mount','type=bind,src='+str(source)+',dst='+dest+',readonly']
    argv+=['--mount','type=bind,src='+str(output)+',dst=/evidence',
      '--tmpfs','/tmp:rw,noexec,nosuid,nodev,size=268435456,mode=1777',BROWSER_IMAGE,
      '--max-old-space-size=256','/control/connector-browser.mjs']
    created=False;started=False;first=None
    try:
        docker(argv);created=True;x=inspect(name);h=x['HostConfig']
        assert x['Image']==BROWSER_IMAGE and x['State']['Pid']==0 and x['State']['Status']=='created'
        assert h['NetworkMode']=='container:'+n['Id']and h['ReadonlyRootfs']and h['CapDrop']==['ALL']
        assert not h['Privileged']and not h['PortBindings']and h['SecurityOpt']==['no-new-privileges']
        assert h['Memory']==h['MemorySwap']==2147483648 and h['NanoCpus']==2000000000 and h['PidsLimit']==256
        assert h['IpcMode']=='private'and h['ShmSize']==268435456 and h['RestartPolicy']['Name']=='no'
        expected={dest:(str(source),False)for source,dest in binds.items()};expected['/evidence']=(str(output),True)
        assert {m['Destination']:(m['Source'],m['RW'])for m in x['Mounts']if m['Type']=='bind'}==expected
        assert all(m['Type']in ['bind','tmpfs']for m in x['Mounts'])
        save(root,'connector-browser-containment.json',{'schema':'v128-connector-private-browser-containment-v1',
          'name':name,'containerId':x['Id'],'image':BROWSER_IMAGE,'imageDigest':BROWSER_DIGEST,
          'nativeContainerId':n['Id'],'networkMode':h['NetworkMode'],'nativeNetworkMode':'none',
          'noPublishedPorts':True,'readOnlyRoot':True,'capDropAll':True,'noNewPrivileges':True,
          'memoryBytes':2147483648,'nanoCPUs':2000000000,'pidsLimit':256,'shmBytes':268435456,
          'privateInputsReadOnly':True,'nativeCanonicalEvidenceNotMounted':True,'nodeSHA256':NODE_SHA})
        docker(['start',name]);started=True
        exitcode=int(docker(['wait',name],180).strip());x=inspect(name)
        assert not x['State']['Running']and x['Image']==BROWSER_IMAGE
        if exitcode:raise RuntimeError('CONNECTOR_BROWSER_EXIT_'+str(exitcode))
        assert (output/'connector-browser-result.json').is_file(),'BROWSER_FINAL_RESULT_MISSING'
    except BaseException as error:
        first=error
        save(root,'connector-browser-first-failure.json',{'schema':'v128-connector-browser-first-failure-v1',
          'errorClass':type(error).__name__,'message':str(error)[:400],'ownerActionObserved':False})
        raise
    finally:
        if created:
            try:
                x=inspect(name);assert x['Image']==BROWSER_IMAGE and x['Config']['Labels'].get('empireai.v128.connector.browser')==name
                if x['State']['Running']:docker(['stop','--time','8',name])
                x=inspect(name);assert not x['State']['Running'];docker(['rm',name])
                assert not any(r['Names']==name for r in inventory())
                save(root,'connector-browser-termination.json',{'schema':'v128-connector-browser-termination-v1',
                  'name':name,'image':BROWSER_IMAGE,'started':started,'exitCode':x['State']['ExitCode'],
                  'containerAbsent':True,'earliestFailurePreserved':first is not None})
            except BaseException as cleanup:
                save(root,'connector-browser-cleanup-failure.json',{'errorClass':type(cleanup).__name__,
                  'message':str(cleanup)[:200],'earliestFailurePreserved':first is not None})
                if first is None:raise
if __name__=='__main__':main()

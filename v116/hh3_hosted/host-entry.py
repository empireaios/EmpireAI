#!/usr/bin/env python3
"""Run inside the exact bounded transient service, then enter private namespaces."""
import hashlib,json,os,pathlib,re,subprocess,sys
assert os.getuid()==0 and len(sys.argv)==5
run_id,publication,host_net,stage_arg=sys.argv[1:]
assert re.fullmatch('[0-9]+',run_id) and re.fullmatch('[a-f0-9]{40}',publication) and re.fullmatch(r'net:\[\d+\]',host_net)
stage=pathlib.Path('/var/tmp').resolve(strict=True)/('v116-hh3-'+run_id)
assert str(stage)==stage_arg and stage.resolve(strict=True)==stage and stage.lstat().st_uid==0
unit='v116-hh3-'+run_id+'.service';expected='/system.slice/'+unit
lines=pathlib.Path('/proc/self/cgroup').read_text().splitlines();assert lines==['0::'+expected]
cgroup=pathlib.Path('/sys/fs/cgroup'+expected);assert cgroup.resolve(strict=True)==cgroup
info=cgroup.stat();assert info.st_ino>0
limits={n:(cgroup/n).read_text().strip() for n in ['memory.max','memory.swap.max','pids.max','cpu.max']}
assert limits['memory.max']=='3221225472' and limits['memory.swap.max']=='0' and limits['pids.max']=='256'
q,p=map(int,limits['cpu.max'].split());assert 0<q/p<=2
properties=subprocess.check_output(['systemctl','show',unit,'--property=RuntimeMaxUSec,TimeoutStopUSec,KillMode,ControlGroup,MemoryMax,MemorySwapMax,TasksMax,CPUQuotaPerSecUSec,SendSIGKILL,Restart'],text=True)
props=dict(line.split('=',1)for line in properties.splitlines())
assert props['ControlGroup']==expected and props['KillMode']=='control-group'
assert props['SendSIGKILL']=='yes' and props['Restart']=='no'
assert props['RuntimeMaxUSec']=='10min' and props['TimeoutStopUSec']=='10s'
assert props['MemoryMax']=='3221225472' and props['MemorySwapMax']=='0' and props['TasksMax']=='256'
host_cgroup_ns=os.readlink('/proc/self/ns/cgroup')
assert re.fullmatch(r'cgroup:\[\d+\]',host_cgroup_ns)
receipt={'hostCgroupNamespace':host_cgroup_ns,'unit':unit,'membership':lines,'actualCgroup':expected,'cgroupDevice':info.st_dev,'cgroupInode':info.st_ino,'kernelLimits':limits,'systemdProperties':props,'publication':publication,'hostNet':host_net}
(stage/'evidence/host-service-controls.json').write_text(json.dumps(receipt,indent=2)+'\n')
namespace_admission="import json,os,pathlib,sys; own=os.readlink('/proc/self/ns/cgroup'); assert own!=sys.argv[1]; pathlib.Path('/evidence/cgroup-namespace.json').write_text(json.dumps({'host':sys.argv[1],'private':own,'different':True},indent=2)+'\\n'); os.execv('/usr/bin/python3',['/usr/bin/python3','-B','/control/isolated-entry.py',*sys.argv[2:]])"
args=['/usr/bin/bwrap','--unshare-all','--unshare-cgroup','--die-with-parent','--new-session','--cap-drop','ALL','--clearenv','--setenv','PATH','/node/bin:/usr/bin:/bin','--setenv','LANG','C.UTF-8','--setenv','PYTHONDONTWRITEBYTECODE','1','--ro-bind','/usr','/usr','--ro-bind','/bin','/bin','--ro-bind','/lib','/lib','--ro-bind','/lib64','/lib64','--dir','/etc','--ro-bind','/etc/ld.so.cache','/etc/ld.so.cache','--proc','/proc','--dev','/dev','--size','536870912','--tmpfs','/tmp','--ro-bind',str(stage/'app'),'/app','--ro-bind',str(stage/'control'),'/control','--ro-bind',str(stage/'node'),'/node','--ro-bind',str(cgroup),'/limits','--bind',str(stage/'evidence'),'/evidence','--chdir','/app','/usr/bin/setpriv','--no-new-privs','/usr/bin/python3','-B','-c',namespace_admission,host_cgroup_ns,host_net,publication,expected,str(info.st_dev),str(info.st_ino)]
(stage/'evidence/namespace-command.json').write_text(json.dumps({'argv':args,'applicationReadOnly':True,'productionMounted':False},indent=2)+'\n')
os.execv(args[0],args)

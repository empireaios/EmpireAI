#!/usr/bin/env python3
import json,sys,pathlib
c=json.load(open(sys.argv[1]))[0];workspace=pathlib.Path(sys.argv[2]).resolve()
h=c['HostConfig'];cfg=c['Config']
assert h['NetworkMode']=='none' and set(c['NetworkSettings']['Networks'])=={'none'}
assert not h['Privileged'] and h['ReadonlyRootfs'] and not h['PortBindings']
assert h['PidMode']=='' and h['IpcMode']=='private'
assert h['CapDrop']==['ALL'] and h['CapAdd']==['CAP_CHOWN']
assert 'no-new-privileges' in h['SecurityOpt']
assert h['Memory']==256*1024**2 and h['NanoCpus']==10**9 and h['PidsLimit']==32
assert cfg['Image']=='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0'
assert cfg['Entrypoint']==['node'] and cfg['Cmd']==['/control/prepare.mjs']
assert cfg['User']=='0:0' and cfg['WorkingDir']=='/app'
env=dict(x.split('=',1) for x in cfg['Env'])
assert set(env)=={'PATH','NODE_VERSION','YARN_VERSION','WORK8_SOURCE_SHA','PILLOW_BIRTH_STATE','COMMERCE_STATE'}
assert env['NODE_VERSION']=='22.23.2' and env['WORK8_SOURCE_SHA']=='6c1e63ba20619ee480742fd87dc810ca93152e22'
assert env['PILLOW_BIRTH_STATE']=='NOT_BORN' and env['COMMERCE_STATE']=='LOCKED'
expected={'/root':'rw,noexec,nosuid,nodev,mode=0700,size=16m','/data':'rw,noexec,nosuid,nodev,mode=0755,size=16m','/tmp':'rw,noexec,nosuid,nodev,mode=1777,size=16m'}
assert h['Tmpfs']==expected
binds=[m for m in c['Mounts'] if m['Type']=='bind']
assert len(binds)==2 and len(c['Mounts'])==2
for name in ['prepare.mjs','application-inputs.json']:
 m=next(x for x in binds if x['Destination']=='/control/'+name)
 assert m['RW'] is False and pathlib.Path(m['Source'])==workspace/'v116/q4_redis_hosted'/name
assert c['State']['Status']=='created' and c['State']['Pid']==0

#!/usr/bin/env python3
import json,sys
c=json.load(open(sys.argv[1]))[0];n=json.load(open(sys.argv[2]))[0]
assert n['Internal'] is True
assert list(c['NetworkSettings']['Networks'])==[n['Name']]
assert c['HostConfig']['NetworkMode']==n['Name']
assert not c['HostConfig']['Privileged'] and c['HostConfig']['ReadonlyRootfs']
assert not c['HostConfig']['PortBindings']
assert c['HostConfig']['PidMode']=='' and c['HostConfig']['IpcMode']=='private'
assert not any(m['Type']=='volume' for m in c['Mounts'])
assert c['Config']['Image']=='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0'
assert c['Config']['Entrypoint']==['sh'] and c['Config']['User']=='0:0'
assert c['HostConfig']['Memory']==512*1024**2 and c['HostConfig']['NanoCpus']==2*10**9 and c['HostConfig']['PidsLimit']==128
assert c['HostConfig']['CapDrop']==['ALL']
assert set(c['HostConfig']['CapAdd'])=={'CAP_SETUID','CAP_SETGID','CAP_CHOWN','CAP_DAC_OVERRIDE','CAP_KILL','CAP_SYS_PTRACE'}
assert 'no-new-privileges' in c['HostConfig']['SecurityOpt']
env=dict(item.split('=',1) for item in c['Config']['Env'])
assert set(env)=={'PATH','NODE_VERSION','YARN_VERSION','WORK8_SOURCE_SHA','WORK8_MEMBERSHIP_REDIS_URL','WORK8_EVIDENCE_DIR','PILLOW_BIRTH_STATE','COMMERCE_STATE'}
assert env['WORK8_SOURCE_SHA']=='6c1e63ba20619ee480742fd87dc810ca93152e22'
assert env['WORK8_MEMBERSHIP_REDIS_URL']=='redis://journal-redis:6379/0'
assert env['WORK8_EVIDENCE_DIR']=='/evidence' and env['PILLOW_BIRTH_STATE']=='NOT_BORN' and env['COMMERCE_STATE']=='LOCKED'
binds=[m for m in c['Mounts'] if m['Type']=='bind']
assert {m['Destination'] for m in binds}=={'/evidence','/control/prepare.mjs','/control/application-inputs.json'}
assert all(m['RW']==(m['Destination']=='/evidence') for m in binds)
assert c['State']['Status']=='created' and c['State']['Pid']==0

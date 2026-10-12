#!/usr/bin/env python3
import json,pathlib,sys
p=pathlib.Path(sys.argv[1]);r=json.loads((p/'receipt.json').read_text())
assert r['source']=='d69fe8aaa2bb1801aa3561e9db4beabc8eb614b5'
for mode in ['observers','launcher-guard']:
 q=p/mode;a=json.loads((q/'receipt.json').read_text());events=[json.loads(x) for x in (q/'events.jsonl').read_text().splitlines()]
 assert a['status']=='PASS_SCOPED_MONITORING_CONTAINMENT' and not a['productionTimersOverridden']
 assert a['boundary']['NetworkMode']=='none' and a['boundary']['Memory']==2147483648 and a['boundary']['PidsLimit']==256
 if mode=='observers':
  kills=[x for x in events if x['kind']=='BOTH_OBSERVERS_SIGKILL'];assert len(kills)==6
  assert len(set(pid for x in kills for pid in x['pids']))==12
  quarantine=[x for x in events if x.get('event')=='assurance_restart_quarantined'];assert {x['component'] for x in quarantine}=={'permanent-worker.mjs','permanent-inspector.mjs'}
  assert all(x['attempts']==6 for x in quarantine)
  containment=[x for x in events if x.get('event')=='assurance_coverage_containment'];assert len(containment)==1 and containment[0]['auditPersisted']
  assert any(x['kind']=='WRITER_STOP' for x in events)
  stored=[json.loads(x) for x in (q/'commissioning/assurance-containment.jsonl').read_text().splitlines()]
  assert any(x['event']=='assurance_coverage_containment' and x['recoveryVerified']==False for x in stored)
 else:
  assert len([x for x in events if x['kind']=='LAUNCHER_GUARD_SIGKILL'])==1
  assert a['writesAfterContainment']==0 and a['writerHistoryPreserved'] and a['externalControllerRequired']
print(json.dumps({'status':'PASS_INDEPENDENT_SCOPED_MONITORING_ORACLE','requirement30Closed':False,'ownerAlertDelivered':'UNVERIFIED','productionExternalMonitor':'UNVERIFIED'}))

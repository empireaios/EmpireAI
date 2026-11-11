#!/usr/bin/env python3
import json,re,pathlib,sys
p=pathlib.Path(sys.argv[1]);source=sys.argv[2]
r=json.loads((p/'writer-graph-examination.json').read_text());tap=(p/'tests.tap').read_text()
assert r['source']==source and r['scope']=='ACTUAL_CONTROL_MODULES_SYNTHETIC_APPLICATION_ENTRIES'
assert r['originalFiveRoleSemanticsPreserved'] is True and r['currentRequiredRoles']==7 and r['executedScenarios']==['clean']
assert r['productionGraphIntegrated'] is False and r['operatingRecoveryCertified'] is False and r['acceptedRows']==[]
assert r['originalCleanCaptureReleaseEstablished'] is True and r['completeOriginalTwoArmCommandAccepted'] is False and r['priorPrimaryDeathExecuted'] is False
assert len(r['receipts'])==1
receipt=r['receipts'][0];assert receipt['scenario']=='clean' and receipt['source']==source
required={'actualControlModules','syntheticApplicationOnly','demotedRuntime','descendantSpawnRefused','journalMutationRefused','guardGenerationLease','captureCensusBound','cleanDrainOrIndependentContainment'}
assert set(receipt['assertions'])==required and all(receipt['assertions'].values())
roles={'primary','brain-worker','assurance-worker','assurance-inspector','containment-guard','native-mission-lock-holder','work8-domain-lock-holder'}
members=receipt['members'];assert len(members)==7 and {m['role'] for m in members}==roles
for m in members:
 assert m['source']==source and m['generation']==receipt['generation']
 assert m['uid']==m['gid']==(0 if m['role']=='containment-guard' else 65534)
for role in ['native-mission-lock-holder','work8-domain-lock-holder']:assert next(m for m in members if m['role']==role)['state']=='HELD'
clean=receipt['cleanRelease'];assert clean['primaryReleaseAcknowledged'] is True and clean['releaseMarker']=='1'
assert clean['emergencyAbsentAtRelease'] is True and clean['emergencyAbsentAfterDrain'] is True
assert clean['childExitCode']==0 and clean['childSignal'] is None and clean['allCapturedIdentitiesGone'] is True
events=clean['nativeReleaseEvents'];assert len(events)==2
assert [clean['roleById'][e['member']] for e in events]==['work8-domain-lock-holder','native-mission-lock-holder']
assert len({e['payload']['capture'] for e in events})==1 and all(e['event']=='READY' and e['payload']['basis']=='DECLARED_PARTICIPANT_RELEASE_ACK' for e in events)
assert all(next(m for m in clean['membersAtRelease'] if m['role']==role)['state']=='READY' for role in ['native-mission-lock-holder','work8-domain-lock-holder'])
assert all(m['state']=='TERMINATED' for m in clean['membersAfterDrain'] if m['role']!='containment-guard')
assert any(m['role']=='startup-readback' and m['state']=='TERMINATED' for m in clean['membersAfterDrain'])
for key,value in [('tests',1),('pass',1),('fail',0),('cancelled',0),('skipped',0),('todo',0)]:assert re.findall(r'^# '+key+r' (\d+)$',tap,re.M)==[str(value)]
assert not re.search(r'^not ok|# SKIP|# TODO',tap,re.M)
assert (p/'graph-clean.log').is_file() and not (p/'graph-primary-death.log').exists()
(p/'verified-original-clean-result.json').write_text(json.dumps({'status':'PASS_ORIGINAL_CLEAN_CAPTURE_RELEASE_CURRENT7_ROLE_GRAPH_ONLY','applicationSource':source,'selectedScenario':'clean','originalAssertions':sorted(required),'actualRoles':sorted(roles),'originalCleanCaptureReleaseEstablished':True,'previousPrimaryDeathRepeated':False,'completeOriginalTwoArmCommandAccepted':False,'wholeRowAccepted':False,'genuineOwnerAcceptance':False},indent=2)+'\n')

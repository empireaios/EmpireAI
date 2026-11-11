#!/usr/bin/env python3
import json,re,pathlib,sys
p=pathlib.Path(sys.argv[1]);source=sys.argv[2];r=json.loads((p/'writer-graph-examination.json').read_text());tap=(p/'tests.tap').read_text()
assert r['source']==source and r['scope']=='ACTUAL_CONTROL_MODULES_SYNTHETIC_APPLICATION_ENTRIES'
assert r['originalFiveRoleSemanticsPreserved'] is True and r['currentRequiredRoles']==7 and r['executedScenarios']==['primary-death']
assert r['productionGraphIntegrated'] is False and r['operatingRecoveryCertified'] is False and r['acceptedRows']==[]
assert r['originalCleanCaptureReleaseEstablished'] is False and r['completeOriginalTwoArmCommandAccepted'] is False
assert len(r['receipts'])==1
receipt=r['receipts'][0];assert receipt['scenario']=='primary-death' and receipt['source']==source
required={'actualControlModules','syntheticApplicationOnly','demotedRuntime','descendantSpawnRefused','journalMutationRefused','guardGenerationLease','captureCensusBound','cleanDrainOrIndependentContainment'}
assert set(receipt['assertions'])==required and all(receipt['assertions'].values())
roles={'primary','brain-worker','assurance-worker','assurance-inspector','containment-guard','native-mission-lock-holder','work8-domain-lock-holder'}
assert len(receipt['members'])==7 and {m['role'] for m in receipt['members']}==roles
assert all(m['uid']==(0 if m['role']=='containment-guard' else 65534) for m in receipt['members'])
for role in ['native-mission-lock-holder','work8-domain-lock-holder']:assert next(m for m in receipt['members'] if m['role']==role)['state']=='HELD'
for key,value in [('tests',1),('pass',1),('fail',0),('cancelled',0),('skipped',0),('todo',0)]:assert re.findall(r'^# '+key+r' (\d+)$',tap,re.M)==[str(value)]
assert not re.search(r'^not ok|# SKIP|# TODO',tap,re.M)
assert (p/'graph-primary-death.log').is_file()
(p/'verified-original-fault-result.json').write_text(json.dumps({'status':'PASS_ORIGINAL_FAULT_SEMANTICS_CURRENT7_ROLE_GRAPH_ONLY','applicationSource':source,'selectedScenario':'primary-death','originalAssertions':sorted(required),'actualRoles':sorted(roles),'cleanDrainReusedNotRerun':True,'originalCleanCaptureReleaseEstablished':False,'completeOriginalTwoArmCommandAccepted':False,'wholeRowAccepted':False,'genuineOwnerAcceptance':False},indent=2)+'\n')

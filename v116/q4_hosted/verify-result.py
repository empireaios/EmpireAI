#!/usr/bin/env python3
import json,pathlib,re,sys
out=pathlib.Path(sys.argv[1]);text=(out/'tests.tap').read_text()
expected={'tests':1,'pass':1,'fail':0,'cancelled':0,'skipped':0,'todo':0}
for label,value in expected.items():
 found=re.findall(r'^# '+label+r' (\d+)\s*$',text,re.M)
 assert found==[str(value)],(label,found)
assert not re.search(r'\b(?:SKIP|TODO)\b',text)
receipt=json.loads((out/'journal-examination.json').read_text())
assert receipt['source']==sys.argv[2]
assert receipt['operatorUid']==0 and receipt['runtimeUids']==[65534]
assert receipt['node']=='22.23.2' and receipt['externalEffects']==0
assert receipt['scope']=='DECLARED_SYNTHETIC_COHORT_ONLY'
assert receipt['productionGraphIntegrated'] is False and receipt['operatingRecoveryCertified'] is False and receipt['acceptedRows']==[]
required=['identitySeparation','journalProtection','durableAdmission','currentPriorCensus','staleGenerationRefusal','competingAdmission','crashRestart','captureExclusion','incompleteMembershipRefusal','scopeBinding','secretFreeReadback']
assert set(receipt['assertions'])==set(required) and all(receipt['assertions'][x] is True for x in required)
(out/'terminal-verification.json').write_text(json.dumps({'status':'PASS_CURRENT_SOURCE_Q4_SCOPED_JOURNAL','source':sys.argv[2],'tap':expected,'assertions':required,'wholeRequirementAcceptance':False},indent=2)+'\n')

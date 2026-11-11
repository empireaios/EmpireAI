#!/usr/bin/env python3
import json,re,sys,pathlib
p=pathlib.Path(sys.argv[1]);r=json.loads((p/'result.json').read_text());m=json.loads((p/'preflight.json').read_text());tap=(p/'tests.tap').read_text()
assert r['exitCode']==0 and r['signal'] is None and r['error'] is None
assert r['source']=='6c1e63ba20619ee480742fd87dc810ca93152e22' and r['node']=='22.23.2'
assert r['originalAssertionsChanged'] is False and r['wholeRowAccepted'] is False
assert m['uid']==0 and m['gid']==0 and m['actualMappedFileOwnerControl']==65534 and m['capEff']=='0000000000000001'
assert m['ipv4Routes']==[] and m['ipv6OnlyLoopback'] is True
names=['exact binding accepted']+['refuse '+k for k in ['source','captureDigest','sourceRunId','targetRunId','host','port','db','mode','expiresAt','targetGeneration']]+['refuse source target alias','refuse oversized lifetime','actual immutable root file accepted and chmod rejected','actual writable ancestry rejected','actual symlink and hardlink rejected','actual runtime-owned file rejected','actual exclusive durable consume rejects replay','expired proof creates no consumed marker','actual SQLite generation and lineage mismatch rejection']
assert len(names)==20
assert re.findall(r'^# Subtest: (.+)$',tap,re.M)==names
for key,expected in [('tests',20),('pass',20),('fail',0),('cancelled',0),('skipped',0),('todo',0)]:
 assert re.findall(r'^# '+key+r' (\d+)$',tap,re.M)==[str(expected)]
assert not re.search(r'^not ok|# SKIP|# TODO',tap,re.M)
(p/'verified-original-results.json').write_text(json.dumps({'status':'PASS_ORIGINAL_REDIS_CAPABILITY20_ONLY','originalTestFile':'backend/src/runtime/work8-isolated-redis-capability.test.mjs','applicationSource':r['source'],'assertionNames':names,'tests':20,'pass':20,'fail':0,'skip':0,'wholeRowAccepted':False,'genuineOwnerAcceptance':False},indent=2)+'\n')

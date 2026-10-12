import json,pathlib,sys,hashlib
root=pathlib.Path(sys.argv[1]);r=json.loads((root/'receipt.json').read_text());assert r['status']=='PASS_OPERATING_COMMERCE_ROLLBACK';rows=[json.loads((root/'rollback/data'/f'{x}.json').read_text()) for x in ['old','new','rollback']]
assert [x['source'] for x in rows]==['04c8621ae23f554fe27bee10306905321b027af8','d69fe8aaa2bb1801aa3561e9db4beabc8eb614b5','04c8621ae23f554fe27bee10306905321b027af8']
for a,b in zip(rows,rows[1:]):assert a['afterDigest']==b['beforeDigest'] and a['after']==b['before']
for x in rows:
 assert all(b['elapsedMs']-a['elapsedMs']>=4900 for a,b in zip(x['ticks'],x['ticks'][1:]))
 for kind in ['receipts','finance']:assert all(y in x['after'][kind] for y in x['before'][kind])
 assert not x['productionTimersChanged'] and x['externalEffects']==x['paidInference']==0
assert len(rows[-1]['tasks'])==6 and all(x['status']=='COMPLETE' for x in rows[-1]['tasks'])
assert len(rows[-1]['after']['finance'])>len(rows[0]['after']['finance'])>0
print(json.dumps({'status':'PASS_RETAINED_OPERATING_ROLLBACK_ORACLE','tasksComplete':6,'receipts':len(rows[-1]['after']['receipts']),'financeEvents':len(rows[-1]['after']['finance']),'scope':'Actual old/new/old canonical worker advancement with ongoing finance; not full application deployment or protected custody','humanGovernanceAcceptance':False}))

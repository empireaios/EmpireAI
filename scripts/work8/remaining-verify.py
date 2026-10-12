import json,pathlib,sqlite3,sys
p=pathlib.Path(sys.argv[1]);r=json.loads((p/'run/receipt.json').read_text());h=json.loads((p/'HOST-RECEIPT.json').read_text())
assert h['exitCode']==0 and r['status']=='PASS_SCOPED_COMBINED_FOUR_FAULTS'
active=[x for x in r['events'] if x['kind']=='COMBINED_FAULTS_ACTIVE'];assert len(active)==1 and active[0]['observerState']=='T'
assert 5000<=active[0]['elapsedMs']<60000 and r['elapsedMs']<120000
assert active[0]['gapCursor']==4 and active[0]['gapReceipts']==5 and active[0]['supplierOutcome']=='UNKNOWN'
assert active[0]['refundDetector']=='FINANCE_CANONICAL_AMOUNT_MISMATCH'
assert len(r['recoveries'])==1 and len(r['incidents'])==4
assert sum(i['status']=='RECOVERED' for i in r['incidents'])==1
assert sum(i['status']=='UNRESOLVED' for i in r['incidents'])==3
assert len(r['gapPrefix'])==5 and r['gapTask']['cursor']==5
assert r['supplierHistory'][-1]['state']['orders']['order-fixture']['outcome']=='UNKNOWN'
assert r['refundInput']['minor']==1 and r['externalEffects']==r['paidInference']==0
# Read durable records independently of the receipt object.
c=sqlite3.connect('file:'+str(p/'run/commerce.sqlite')+'?mode=ro',uri=True)
assert c.execute('PRAGMA quick_check').fetchone()[0]=='ok'
tasks=[json.loads(x[0]) for x in c.execute('SELECT record FROM commerce_runtime_tasks')]
assert len(tasks)==2 and next(t for t in tasks if t['id']=='gap-8027')['cursor']==5
assert next(t for t in tasks if t['id']=='unknown-8027')['cursor']==7
c.close()
print(json.dumps({'status':'PASS_INDEPENDENT_SCOPED_COMBINED_ORACLE','mandatoryAutomaticMonitorDetection':'UNVERIFIED','requirement34Closed':False}))

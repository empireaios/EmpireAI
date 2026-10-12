import hashlib,json,pathlib,sqlite3,sys
root=pathlib.Path(sys.argv[1]);r=json.loads((root/'receipt.json').read_text());assert r['status']=='PASS_SCOPED_AUTOMATIC_PID1_CONTAINMENT';assert r['exitCode']==137 and r['sixSecondNoWriteObservation'];assert not r['manualContainmentAfterInjection'] and not r['timersChanged'];assert r['before']==r['after'];h=r['after']['history'];assert len(h)>=2 and len({x['id'] for x in h})==len(h);assert r['paidInference']==r['externalCommerce']==0
# SQLite is inspected on a copy so the original WAL/SHM bytes remain sealed.
import tempfile,shutil
with tempfile.TemporaryDirectory() as tmp:
 for p in root.glob('commerce.sqlite*'):shutil.copyfile(p,pathlib.Path(tmp)/p.name)
 db=sqlite3.connect('file:'+str(pathlib.Path(tmp)/'commerce.sqlite')+'?mode=ro',uri=True);assert db.execute('PRAGMA quick_check').fetchone()[0]=='ok';n=db.execute('select count(*) from commerce_runtime_receipts').fetchone()[0];assert n==len(h);db.close()
print(json.dumps({'status':'PASS_SEPARATE_RETAINED_ORACLE','canonicalReceipts':n,'receiptSHA256':hashlib.sha256((root/'receipt.json').read_bytes()).hexdigest(),'humanGovernanceAcceptance':False}))

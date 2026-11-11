#!/usr/bin/env python3
"""After verified container absence, export only bounded nonsecret receipts."""
import hashlib,json,os,pathlib,stat,subprocess,sys
ALLOWED=['browser-preflight-telemetry.json','browser-capability.json','native-input-state.json','backend-ready.json','backend-result.json','native-final.json','browser-result.json','browser-complete.json','native-projections.json','supervisor-result.json','historical-products-before-reload.png','historical-products-after-reload.png','historical-finance-after-reload.png','first-failure-browser.png']
def publish(out,name,b,uploader_uid):
 p=out/name;assert p.name==name and not p.exists()and len(b)<=2097152
 fd=os.open(p,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600)
 try:os.write(fd,b);os.fsync(fd);os.fchown(fd,uploader_uid,uploader_uid)
 finally:os.close(fd)
def regular(p,cap):
 s=p.lstat();assert stat.S_ISREG(s.st_mode)and s.st_nlink==1 and s.st_uid==0 and s.st_size<=cap and p.resolve(strict=True)==p;return s
def collect_private(private,out,uploader_uid):
 assert os.getuid()==0 and out.resolve(strict=True)==out and out.stat().st_uid==uploader_uid
 receipt={'schema':'v116-native-browser-bounded-private-custody-v1','privateVolumePublished':False,'privateLogsPublished':False,'credentialsPublished':False,'copied':[],'privateLogDigests':[],'missing':[],'rejected':[]}
 if private.exists():
  assert private.resolve(strict=True)==private and private.stat().st_uid==0 and stat.S_IMODE(private.stat().st_mode)==0o700
  for n in ['browser-capability.json','browser-result.json','backend-result.json','supervisor-result.json']:
   p=private/n
   if p.exists():
    try:
     regular(p,2097152);v=json.loads(p.read_text());print(json.dumps({'receipt':n,'status':v.get('status'),'firstFailure':v.get('firstFailure'),'cleanupFailures':v.get('cleanupFailures')}))
    except BaseException as e:receipt['rejected'].append({'path':n,'stage':'diagnostic','errorClass':type(e).__name__})
  total=0
  for n in ALLOWED:
   p=private/n
   if not p.exists():receipt['missing'].append(n);continue
   try:
    regular(p,262144 if n=='browser-preflight-telemetry.json' else 2097152);b=p.read_bytes();total+=len(b);assert total<=12582912
    if n.endswith('.json'):json.loads(b)
    else:assert b.startswith(b'\x89PNG\r\n\x1a\n')
    publish(out,n,b,uploader_uid);receipt['copied'].append({'path':n,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
   except BaseException as e:receipt['rejected'].append({'path':n,'errorClass':type(e).__name__})
  # This exact stream belongs only to the pre-native AF_UNIX/about:blank probe.
  # Its closed source runs before Redis/backend/auth and receives no credentials.
  p=private/'browser-preflight.private.log'
  if p.exists():
   try:
    regular(p,1048576);b=p.read_bytes();total+=len(b);assert total<=12582912
    name='browser-preflight-diagnostics.log';publish(out,name,b,uploader_uid)
    receipt['copied'].append({'path':name,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'classification':'PRE_NATIVE_BROWSER_ONLY_NO_OWNER_DATA'})
    receipt['preNativeBrowserDiagnosticsPublished']=True
   except BaseException as e:receipt['rejected'].append({'path':p.name,'stage':'bounded-pre-native-diagnostics','errorClass':type(e).__name__})
  for n in ['redis.private.log','backend.private.log','frontend.private.log','browser.private.log']:
   p=private/n
   if p.exists():
    try:regular(p,1048576);b=p.read_bytes();receipt['privateLogDigests'].append({'path':n,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'contentPublished':False})
    except BaseException as e:receipt['rejected'].append({'path':n,'stage':'private-log-digest','errorClass':type(e).__name__})
  for n in ['private-login.json','owner-policy.json']:
   p=private/n
   if p.exists():
    try:regular(p,65536);p.unlink()
    except BaseException as e:receipt['rejected'].append({'path':n,'stage':'private-credential-removal','errorClass':type(e).__name__})
  receipt['credentialsRemoved']=not(private/'private-login.json').exists();receipt['policyRemoved']=not(private/'owner-policy.json').exists()
 else:receipt['privateOutputNeverCreated']=True
 receipt['status']='PASS_BOUNDED_PRIVATE_EVIDENCE_CUSTODY'if not receipt['rejected']else'FAIL_OPTIONAL_OR_REQUIRED_PAYLOAD_REFUSAL'
 return receipt
def main():
 assert os.getuid()==0
 root=pathlib.Path(sys.argv[1]);run=sys.argv[2];assert run.isdigit()and root.name=='v116-session-browser-'+run and root.is_absolute()and root.resolve(strict=True)==root
 assert root.stat().st_uid==1001;out=root/'evidence';private=root/'private-output';assert out.resolve(strict=True)==out and out.stat().st_uid==1001
 label='empireai.v116.session-browser='+run;env={'PATH':'/usr/bin:/bin','HOME':'/tmp','LANG':'C.UTF-8'}
 p=subprocess.run(['/usr/bin/docker','ps','-aq','--filter','label='+label],env=env,capture_output=True,timeout=10);assert p.returncode==0 and not p.stdout.strip()
 for suffix in ['carrier','exam']:
  p=subprocess.run(['/usr/bin/docker','inspect','work8-v116-session-browser-'+run+'-'+suffix],env=env,capture_output=True,timeout=10);assert p.returncode!=0 and b'No such object'in p.stderr
 receipt=collect_private(private,out,1001);receipt['containersAbsent']=True
 publish(out,'private-custody.json',(json.dumps(receipt,indent=2)+'\n').encode(),1001)
if __name__=='__main__':main()

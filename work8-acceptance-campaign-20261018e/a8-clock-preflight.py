import subprocess,tempfile,pathlib,time,json,urllib.request,urllib.error,os,shutil
base=pathlib.Path('/workspace/scratch/7952261165b1');main=base/'EmpireAI';work=base/'a8-clock-elapsed';out=base/'acceptance-campaign-20261018e';root=pathlib.Path(tempfile.mkdtemp(prefix='a8-preflight-'));ready=root/'ready.json';node='/tmp/work8-runtime/node-v22.23.2-linux-x64/bin/node';log=open(out/'a8-clock-preflight-server.log','w');p=subprocess.Popen(['python3',str(main/'scripts/work8/incoming-only-exec.py'),node,'--import',str(main/'backend/node_modules/tsx/dist/loader.mjs'),str(work/'empireai-web/e2e/work8-source-context-backend.mts'),str(main/'backend'),str(root),str(ready)],stdout=log,stderr=log,env={'PATH':os.environ['PATH']})
try:
 deadline=time.time()+90
 while not ready.exists():
  if p.poll() is not None:raise Exception('fixture exited '+str(p.returncode))
  if time.time()>deadline:raise Exception('fixture startup timeout')
  time.sleep(.25)
 fixture=json.loads(ready.read_text())
 def req(path,body=None,who='owner'):
  r=urllib.request.Request('http://127.0.0.1:3148'+path,data=json.dumps(body).encode() if body is not None else None,headers={'Authorization':'Bearer '+fixture['tokens'][who],'Content-Type':'application/json'})
  try:
   with urllib.request.urlopen(r,timeout=30) as v:return v.status,json.loads(v.read())
  except urllib.error.HTTPError as e:return e.code,json.loads(e.read())
 receipts=[]
 for i in range(4):
  status,body=req('/api/pillow/session',{})
  receipts.append({'attempt':i+1,'status':status,'body':body if status!=201 else {'sessionId':body['session']['sessionId']}})
 assert receipts[-1]['status']==503,receipts
 assert 'rate limit' in receipts[-1]['body']['admission']['reason'],receipts
 time.sleep(11)
 status,body=req('/api/pillow/session',{})
 receipts.append({'afterReal11Seconds':True,'status':status,'body':body if status!=201 else {'sessionId':body['session']['sessionId']}})
 if os.environ.get('EXPECT_FROZEN')=='1':
  assert status==503,(status,body)
  (out/'a8-frozen-clock-reproduction.json').write_text(json.dumps(receipts,indent=2))
 else:
  assert status==201,(status,body)
  sid=body['session']['sessionId'];refs=[]
  for candidate in fixture['candidateIds']:
   status,body=req('/api/owner/commerce/twin/context?kind=SOURCE_DOSSIER&candidateId='+candidate);assert status==200,(status,body)
   refs.append(body.get('context',body)['reference'])
  for ref in refs:
   status,body=req('/api/pillow/chat',{'message':'Retained product switch without inference','sessionId':sid,'workspaceContext':{'productContext':ref}});assert status==423,(status,body)
  status,hist=req('/api/pillow/history?sessionId='+sid);assert status==200,(status,hist)
  assert all(any(t.get('productContext',{}).get('reference')==ref for t in hist['history']) for ref in refs),hist
  original=hist['history']
  archived={'role':'user','content':'Unverified browser cache','timestamp':'2026-10-18T00:00:00Z'}
  status,body=req('/api/pillow/session',{'historicalBrowserTurns':[archived]});assert status==201 and body['historicalArchiveAccepted'],(status,body)
  status,hist=req('/api/pillow/history?sessionId='+sid);assert status==200 and hist['history']==original,(status,hist)
  assert req('/api/pillow/history?sessionId='+sid,who='foreign')[0]==403
  receipts.append({'twoProductSwitches':True,'archiveAccepted':True,'exactRestoredCanonicalHistory':True,'foreignRejected':True,'actualAdmission':json.loads((root/'actual-tier0-admission.json').read_text())})
  (out/'a8-elapsed-clock-preflight.json').write_text(json.dumps(receipts,indent=2))
 print('PASS',flush=True)

finally:
 p.terminate()
 try:p.wait(timeout=8)
 except subprocess.TimeoutExpired:p.kill();p.wait(timeout=5)
 log.close()
 shutil.rmtree(root)

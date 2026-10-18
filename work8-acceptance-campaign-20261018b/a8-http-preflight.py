import subprocess,tempfile,pathlib,time,json,urllib.request,urllib.error,os,shutil
base=pathlib.Path('/workspace/scratch/7952261165b1');main=base/'EmpireAI';work=base/'a8-cold-history';out=base/'acceptance-campaign-20261018b';root=pathlib.Path(tempfile.mkdtemp(prefix='a8-preflight-'));ready=root/'ready.json';node='/tmp/work8-runtime/node-v22.23.2-linux-x64/bin/node';log=open(out/'a8-http-preflight.log','w');p=subprocess.Popen(['python3',str(main/'scripts/work8/incoming-only-exec.py'),node,'--import',str(main/'backend/node_modules/tsx/dist/loader.mjs'),str(work/'empireai-web/e2e/work8-source-context-backend.mts'),str(main/'backend'),str(root),str(ready)],stdout=log,stderr=log,env={'PATH':os.environ['PATH']})
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
 s,session=req('/api/pillow/session',{});assert s==200,(s,session)
 h,hist=req('/api/pillow/history?sessionId='+session['session']['sessionId']);assert h==200 and hist['history']==[],(h,hist)
 c,context=req('/api/owner/commerce/twin/context?kind=SOURCE_DOSSIER&candidateId='+fixture['candidateIds'][0]);assert c==200,(c,context)
 (out/'a8-http-preflight-initial.json').write_text(json.dumps({'session':session,'history':hist,'context':context},indent=2))
 print(json.dumps({'root':str(root),'session':s,'initialHistory':h,'context':c,'contextKeys':list(context)}),flush=True)
 ref=context.get('context',context)['reference']
 status,body=req('/api/pillow/chat',{'message':'Inspect exact retained variant with intercepted transport','sessionId':session['session']['sessionId'],'workspaceContext':{'productContext':ref}})
 assert status==423,(status,body)
 h,hist=req('/api/pillow/history?sessionId='+session['session']['sessionId']);assert h==200,(h,hist);assert any(t.get('productContext',{}).get('reference')==ref for t in hist['history']),hist
 foreign,_=req('/api/pillow/history?sessionId='+session['session']['sessionId'],who='foreign');assert foreign==403,foreign
 receipt={'status':'PASS_SCOPED_ACTUAL_HTTP_PREFLIGHT','initialHistory':200,'interceptedChat':status,'coldHistory':h,'foreignHistory':foreign,'history':hist,'actualAdmission':json.loads((root/'actual-tier0-admission.json').read_text()),'scope':'Actual isolated authenticated backend, canonical empty session then cold reload and intercepted actual host persistence; no native browser or paid inference claim.'};(out/'a8-http-preflight-result.json').write_text(json.dumps(receipt,indent=2));print('PASS',flush=True)
finally:
 p.terminate()
 try:p.wait(timeout=8)
 except subprocess.TimeoutExpired:p.kill();p.wait(timeout=5)
 log.close()
 shutil.rmtree(root)

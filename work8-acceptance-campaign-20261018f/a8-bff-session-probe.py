import subprocess,tempfile,pathlib,time,json,urllib.request,urllib.error,os,shutil
base=pathlib.Path('/workspace/scratch/7952261165b1');main=base/'EmpireAI';work=main;out=base/'acceptance-campaign-20261018f';root=pathlib.Path(tempfile.mkdtemp(prefix='a8-preflight-'));ready=root/'ready.json';node='/tmp/work8-runtime/node-v22.23.2-linux-x64/bin/node';log=open(out/'a8-bff-session-probe-server.log','w');p=subprocess.Popen(['python3',str(main/'scripts/work8/incoming-only-exec.py'),node,'--import',str(main/'backend/node_modules/tsx/dist/loader.mjs'),str(work/'empireai-web/e2e/work8-source-context-backend.mts'),str(main/'backend'),str(root),str(ready)],stdout=log,stderr=log,env={'PATH':os.environ['PATH']})
nextlog=open(out/'a8-bff-session-probe-next.log','w');n=subprocess.Popen([node,str(main/'empireai-web/node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port','3128'],cwd=main/'empireai-web',stdout=nextlog,stderr=nextlog,env={'PATH':os.environ['PATH'],'NODE_ENV':'production','BRAIN_API_URL':'http://127.0.0.1:3148','NEXT_TELEMETRY_DISABLED':'1'})
try:
 deadline=time.time()+90
 while not ready.exists():
  if p.poll() is not None:raise Exception('fixture exited '+str(p.returncode))
  if time.time()>deadline:raise Exception('fixture startup timeout')
  time.sleep(.25)
 fixture=json.loads(ready.read_text())
 def req(path,body=None,who='owner'):
  r=urllib.request.Request('http://127.0.0.1:3128'+path,data=json.dumps(body).encode() if body is not None else None,headers={'Cookie':'empireai_session='+fixture['tokens'][who],'Content-Type':'application/json'})
  try:
   with urllib.request.urlopen(r,timeout=30) as v:return v.status,json.loads(v.read())
  except urllib.error.HTTPError as e:return e.code,json.loads(e.read())
 receipts=[]
 start=time.monotonic()
 for i in range(12):
  payload={} if i<4 else {'workspaceId':'ws_empire_1','historicalBrowserTurns':[{'role':'user','content':'Compare these retained variants without inference.','timestamp':'2026-10-18T10:00:00Z'},{'role':'assistant','content':'Pillow unavailable.','timestamp':'2026-10-18T10:00:01Z'}]}
  status,body=req('/api/pillow/session',payload)
  receipts.append({'attempt':i+1,'elapsed':round(time.monotonic()-start,2),'status':status,'body':body if status!=201 else {'sessionId':body['session']['sessionId']}})
  (out/'a8-bff-session-probe.json').write_text(json.dumps(receipts,indent=2))
  if i>=3:time.sleep(2)
 print(json.dumps(receipts),flush=True)

finally:
 n.terminate();n.wait(timeout=15);nextlog.close()
 p.terminate()
 try:p.wait(timeout=8)
 except subprocess.TimeoutExpired:p.kill();p.wait(timeout=5)
 log.close()
 shutil.rmtree(root)

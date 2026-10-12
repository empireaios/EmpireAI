import importlib.util,pathlib,sys,os,time,json
spec=importlib.util.spec_from_file_location('b',pathlib.Path(__file__).with_name('ci-prerequisite.py'));b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
source,root=map(lambda p:pathlib.Path(p).resolve(),sys.argv[1:3]);image=sys.argv[3];assert os.environ.get('GITHUB_ACTIONS')=='true';assert b.command(['git','-C',str(source),'rev-parse','HEAD']).stdout.strip()==b.SOURCE
root.mkdir();out=root/'rollback';out.mkdir();results=[]
for stage in ['old','new','rollback']:
 cid=None;started=time.monotonic()
 try:
  code='/app' if stage=='new' else '/app/old-source'
  cid=b.launch(source,out,image,['python3','scripts/work8/ci-isolated-unix.py','node','--import','./backend/node_modules/tsx/dist/loader.mjs','scripts/work8/finish-rollback.mjs',code,'/evidence/data',stage]);b.assert_boundary(b.inspect(cid))
  while b.inspect(cid)['State']['Running']:
   assert time.monotonic()-started<350,'Bounded stage deadline';time.sleep(1)
  assert b.inspect(cid)['State']['ExitCode']==0,'STAGE_FAILED:'+stage
  r=json.loads((out/'data'/f'{stage}.json').read_text());results.append({'stage':stage,'source':r['source'],'elapsedMs':r['elapsedMs'],'tasks':len(r['tasks']),'receipts':len(r['after']['receipts']),'financeEvents':len(r['after']['finance'])})
 finally:
  if cid:
   logs=b.command(['docker','logs',cid],check=False);(out/f'{stage}.log').write_text(logs.stdout+'\n'+logs.stderr);b.command(['docker','rm','--force',cid],check=False)
b.save(root/'receipt.json',{'status':'PASS_OPERATING_COMMERCE_ROLLBACK','runId':os.environ['GITHUB_RUN_ID'],'source':b.SOURCE,'stages':results,'productionTimersChanged':False,'externalEffects':0,'paidInference':0,'limitations':['Canonical commerce/finance worker process boundary; not full application nine-store deployment','Existing authority of internal isolated synthetic examination; no live authority restored','No off-host protected backup claim']})

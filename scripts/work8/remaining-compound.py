import importlib.util,json,os,pathlib,sys,time
spec=importlib.util.spec_from_file_location('boundary',pathlib.Path(__file__).with_name('ci-prerequisite.py'));b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
source,root=map(lambda p:pathlib.Path(p).resolve(),sys.argv[1:3]);image=sys.argv[3]
assert os.environ.get('GITHUB_ACTIONS')=='true'
assert b.command(['git','-C',str(source),'rev-parse','HEAD']).stdout.strip()==b.SOURCE
root.mkdir(parents=True,exist_ok=False);cid=None;r={'status':'FAIL','source':b.SOURCE,'runId':os.environ['GITHUB_RUN_ID'],'workflow':os.environ['GITHUB_SHA']}
try:
 cid=b.launch(source,root,image,['python3','scripts/work8/ci-isolated-unix.py','node','--import','./backend/node_modules/tsx/dist/loader.mjs','scripts/work8/remaining-compound.mjs','/evidence/run']);b.assert_boundary(b.inspect(cid));start=time.monotonic()
 while b.inspect(cid)['State']['Running']:
  assert time.monotonic()-start<120,'Compounded examination deadline';time.sleep(.25)
 r['exitCode']=b.inspect(cid)['State']['ExitCode'];assert r['exitCode']==0
 r['status']='PASS_SCOPED_COMBINED_NOT_REQUIREMENT34_CLOSURE';r['elapsedSeconds']=time.monotonic()-start
finally:
 if cid:
  logs=b.command(['docker','logs',cid],check=False);(root/'console.log').write_text(logs.stdout+'\n'+logs.stderr);b.command(['docker','rm','--force',cid],check=False)
 b.save(root/'HOST-RECEIPT.json',r)

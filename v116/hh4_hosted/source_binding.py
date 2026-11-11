"""Bind tracked source and every original distribution byte to authentic channels."""
import hashlib,json,pathlib,subprocess
IMAGE='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0'
def regular(p):
 s=p.lstat();assert p.is_file()and not p.is_symlink()and s.st_nlink==1 and s.st_size<=16777216,'UNSAFE_ORIGINAL_INPUT';return p.read_bytes()
def contract(control):
 raw=regular(control/'original-inputs.json');original=json.loads(raw);split=json.loads(regular(control/'source-binding.json'));assert split['schema']=='v116-hh4-authentic-split-source-binding-v1'and split['applicationCommit']=='6c1e63ba20619ee480742fd87dc810ca93152e22'and split['imageId']==IMAGE
 assert split['originalInputsSHA256']==hashlib.sha256(raw).hexdigest()and split['allInputsRemainMandatory']is True and split['unknownMissingFileFallback']is False
 git,image=split['gitSource'],split['compiledImageOnly'];assert len(git)==23 and len(image)==12 and not(set(git)&set(image))and {**git,**image}==original['applicationSHA256']
 assert all(p.startswith('backend/dist/')for p in image)and all(not p.startswith('backend/dist/')for p in git)
 return original,split
def verify_git(repo,control):
 original,split=contract(control)
 for relative,h in split['gitSource'].items():
  assert subprocess.run(['git','ls-files','--error-unmatch','--',relative],cwd=repo,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==0,'MANDATORY_TRACKED_SOURCE_MISSING'
  assert hashlib.sha256(regular(repo/relative)).hexdigest()==h,'TRACKED_SOURCE_HASH_MISMATCH'
 for relative in split['compiledImageOnly']:
  assert subprocess.run(['git','ls-files','--error-unmatch','--',relative],cwd=repo,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==1,'DISTRIBUTION_TRACKING_CONTRACT_CHANGED'
 return {'trackedSourceHashesVerified':len(split['gitSource']),'compiledImageHashesPending':len(split['compiledImageOnly']),'arbitraryMissingFilesAllowed':False}
def verify_image(root,control):
 original,split=contract(control);r=json.loads(regular(root/'evidence/image-original-inputs.json'))
 assert r['status']=='PASS_ALL_ORIGINAL_INPUTS_FROM_NEVER_STARTED_EXACT_IMAGE'and r['imageId']==IMAGE and r['containerNeverStarted']is True and r['sourceBindingSHA256']==hashlib.sha256(regular(control/'source-binding.json')).hexdigest()
 assert {x['path']:x['sha256']for x in r['files']}==original['applicationSHA256']and len(r['files'])==35
 for x in r['files']:
  b=regular(root/'image-inputs'/x['path']);assert len(b)==x['bytes']and hashlib.sha256(b).hexdigest()==x['sha256'],'MANDATORY_IMAGE_INPUT_MISMATCH'
 return r

"""One shared compiler/mount contract and exact output verifier for V27 A and B."""
import errno, hashlib, json, os, pathlib, re, shutil, signal, stat, struct, subprocess, tempfile, time, uuid

SHARED_FILES=('compiler_job.py','isolated-compiler.cjs')
BACKEND_IMAGE='sha256:7a93f047806b0eda47fb4927fb29f70578f22718b032a72cb56c7bc392a8e895'
MAX_GENERATED_BYTES=1024*1024

def sha(path):
 with pathlib.Path(path).open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()

def shared_hashes(directory):return {name:sha(pathlib.Path(directory)/name) for name in SHARED_FILES}

def expected_outputs(plan_path):
 plan=json.loads(pathlib.Path(plan_path).read_text());entries={}
 for row in plan['backendOverlay']:
  if not row['path'].endswith('.ts'):continue
  assert row['path'].startswith('backend/src/') and '..' not in pathlib.PurePosixPath(row['path']).parts
  javascript='backend/dist/'+row['path'][len('backend/src/'):][:-3]+'.js'
  entries[javascript]=row['javascriptSha256'];entries[javascript+'.map']=row['mapSha256']
 assert len(entries)==6,'EXACT_SIX_GENERATED_OUTPUTS_REQUIRED'
 return entries

def verify_compiled_outputs(output_root,plan_path):
 root=pathlib.Path(output_root);expected=expected_outputs(plan_path);actual={};total=0
 assert root.is_dir() and not root.is_symlink(),'GENERATED_ROOT_REFUSED'
 for p in root.rglob('*'):
  s=p.lstat();assert not p.is_symlink(),'GENERATED_SYMLINK_REFUSED'
  if stat.S_ISDIR(s.st_mode):continue
  assert stat.S_ISREG(s.st_mode) and s.st_nlink==1,'GENERATED_NONREGULAR_FILE_REFUSED'
  name=p.relative_to(root).as_posix();assert name in expected,'UNREVIEWED_GENERATED_FILE'
  total+=s.st_size;assert total<=MAX_GENERATED_BYTES,'GENERATED_BYTES_BOUND'
  h=sha(p);assert h==expected[name],'GENERATED_HASH_MISMATCH'
  actual[name]={'path':name,'sha256':h,'bytes':s.st_size}
 assert set(actual)==set(expected),'GENERATED_FILE_COVERAGE_MISMATCH'
 return {'schema':'work8-reviewed-compiler-output-v1','planSha256':sha(plan_path),'files':[actual[k] for k in sorted(actual)],'bytes':total,'exactReviewedHashes':True}

def copy_verified_outputs(output_root,destination_root,plan_path):
 manifest=verify_compiled_outputs(output_root,plan_path);destination=pathlib.Path(destination_root)
 assert destination.is_dir() and not destination.is_symlink(),'ISOLATED_BUILD_DESTINATION_REQUIRED'
 canonical=destination.resolve();touched={destination}
 for row in manifest['files']:
  relative=pathlib.PurePosixPath(row['path']);assert all(re.fullmatch('[A-Za-z0-9_.-]+',part) and part not in {'.','..'} for part in relative.parts),'GENERATED_DESTINATION_PATH_REFUSED'
  parent=destination
  for part in relative.parts[:-1]:
   parent=parent/part
   if not parent.exists():parent.mkdir(mode=0o755)
   assert parent.is_dir() and not parent.is_symlink() and parent.resolve().is_relative_to(canonical),'BUILD_DESTINATION_ANCESTOR_REFUSED'
   touched.add(parent)
  target=parent/relative.name
  assert not target.exists() and not target.is_symlink(),'GENERATED_DESTINATION_ALREADY_EXISTS'
  fd=os.open(target,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o644)
  with os.fdopen(fd,'wb') as out:out.write((pathlib.Path(output_root)/row['path']).read_bytes());os.fchmod(out.fileno(),0o644)
  assert sha(target)==row['sha256'],'COPIED_GENERATED_HASH_MISMATCH'
 for directory in touched:os.chmod(directory,0o755)
 manifest['isolatedDestinationPermissions']={'files':'0644','ancestorsWithinDestinationRoot':'0755','outsideDestinationModified':False,'sourceOutputsModified':False}
 return manifest

def acl_metadata(path):
 result={}
 for attribute in ['system.posix_acl_access','system.posix_acl_default']:
  try:data=os.getxattr(path,attribute,follow_symlinks=False)
  except OSError as e:
   if e.errno in {errno.ENODATA,getattr(errno,'ENOATTR',errno.ENODATA)}:result[attribute]={'present':False,'observation':'ENODATA'};continue
   raise AssertionError('POSIX_ACL_OBSERVATION_UNAVAILABLE') from None
  assert len(data)>=4 and (len(data)-4)%8==0 and struct.unpack_from('<I',data)[0]==2,'POSIX_ACL_FORMAT_REFUSED'
  tags={1:'USER_OBJ',2:'USER',4:'GROUP_OBJ',8:'GROUP',16:'MASK',32:'OTHER'};entries=[]
  for offset in range(4,len(data),8):
   tag,perm,identity=struct.unpack_from('<HHI',data,offset);assert tag in tags and perm<=7
   entries.append({'tag':tags[tag],'permissions':perm,'id':None if identity==0xffffffff else identity})
  result[attribute]={'present':True,'version':2,'entries':entries,'sha256':hashlib.sha256(data).hexdigest()}
 return result

def host_metadata(path,classification):
 p=pathlib.Path(path);s=p.lstat();assert p.is_dir() and not p.is_symlink()
 return {'classification':classification,'uid':s.st_uid,'gid':s.st_gid,'mode':oct(stat.S_IMODE(s.st_mode)),'directory':True,'acl':acl_metadata(p)}

def safe_state(inspected):
 s=inspected['State'];return {k:s.get(k) for k in ['Status','Running','ExitCode','OOMKilled','Dead','StartedAt','FinishedAt']}

def checked_mounts(inspected,uid,gid):
 host=inspected['HostConfig'];config=inspected['Config']
 assert config['User']==str(uid)+':'+str(gid),'CONTAINER_USER_CONTRACT_MISMATCH'
 assert host['ReadonlyRootfs'] is True and host['Privileged'] is False,'ROOT_ISOLATION_CONTRACT_MISMATCH'
 assert not host.get('CapAdd') and set(host['CapDrop'])=={'ALL'},'CAPABILITY_CONTRACT_MISMATCH'
 assert host['NetworkMode']=='none' and not host.get('PortBindings'),'NETWORK_CONTRACT_MISMATCH'
 assert any(x in {'no-new-privileges','no-new-privileges:true'} for x in host['SecurityOpt']),'NO_NEW_PRIVILEGES_MISMATCH'
 expected={'/source':False,'/compiler':False,'/reviewed-plan.json':False,'/policy':False,'/unrelated':False,'/output':True}
 mounts={m['Destination']:m for m in inspected['Mounts']};assert set(mounts)==set(expected),'UNREVIEWED_CONTAINER_MOUNT'
 rows=[]
 for dest,rw in expected.items():
  m=mounts[dest];assert m['Type']=='bind' and m['RW'] is rw,'MOUNT_ACCESS_CONTRACT_MISMATCH'
  rows.append({'destination':dest,'type':m['Type'],'readWrite':m['RW'],'propagation':m.get('Propagation')})
 return {'configuredUser':config['User'],'readOnlyContainerRoot':host['ReadonlyRootfs'],'privileged':host['Privileged'],'capDrop':host['CapDrop'],'capAdd':host.get('CapAdd') or [],'noNewPrivileges':True,'networkMode':host['NetworkMode'],'publishedPorts':False,'mounts':rows,'onlyGeneratedOutputBindWritable':True,'scope':'Declared application/input/policy/unrelated filesystem paths; no claim about all kernel pseudo-files'}

def run_compiler(*,script_directory,source_root,plan_path,output_root,evidence_directory,deadline_epoch):
 """Stage A only. Stage B imports copy_verified_outputs; it must not recompile."""
 script=pathlib.Path(script_directory).resolve();source=pathlib.Path(source_root).resolve();plan=pathlib.Path(plan_path).resolve();output=pathlib.Path(output_root).resolve();evidence=pathlib.Path(evidence_directory).resolve()
 uid,gid=os.geteuid(),os.getegid();assert uid==os.getuid() and gid==os.getgid() and uid>0 and gid>0,'MEASURED_UNPRIVILEGED_RUNNER_REQUIRED'
 assert not output.exists(),'FRESH_OUTPUT_ROOT_REQUIRED';output.mkdir(mode=0o700,parents=True)
 assert re.fullmatch('[0-9]+',os.environ.get('GITHUB_RUN_ID','')),'RUN_ID_REQUIRED'
 name='work8-v27-compiler-'+os.environ['GITHUB_RUN_ID']+'-'+uuid.uuid4().hex[:12];private=None
 receipt={'schema':'work8-v27-packaging-permission-receipt-v1','status':'FAIL','backendImage':BACKEND_IMAGE,'planSha256':sha(plan),'sharedImplementationHashes':shared_hashes(script),'applicationStarted':False,'newImagesBuilt':False,'frontendBuilt':False,'hostProcess':{'uid':uid,'gid':gid,'groups':os.getgroups()},'firstFailure':None,'controlDiagnostics':[]}
 def diagnostic(operation,stdout=b'',stderr=b'',exit_code=None,timed_out=False):
  stdout=stdout or b'';stderr=stderr or b''
  if isinstance(stdout,str):stdout=stdout.encode()
  if isinstance(stderr,str):stderr=stderr.encode()
  sample=stderr[-65536:]+stdout[-65536:]
  patterns={'PERMISSION_DENIED':rb'(?i)permission denied|operation not permitted','READ_ONLY_FILESYSTEM':rb'(?i)read-only file system','CONTAINER_ABSENT':rb'(?i)no such container','IMAGE_UNAVAILABLE':rb'(?i)no such image|unable to find image','MOUNT_CONFIGURATION':rb'(?i)invalid mount config|invalid volume specification','DOCKER_DAEMON_UNAVAILABLE':rb'(?i)cannot connect to the docker daemon|error during connect','EXECUTABLE_UNAVAILABLE':rb'(?i)executable file not found|no such file or directory','RESOURCE_EXHAUSTED':rb'(?i)no space left|cannot allocate memory|out of memory'}
  row={'operation':operation,'exitCode':exit_code,'timedOut':timed_out,'stderrBytes':len(stderr),'stderrSha256':hashlib.sha256(stderr).hexdigest(),'stdoutBytes':len(stdout),'stdoutSha256':hashlib.sha256(stdout).hexdigest(),'recognizedErrorCodes':[code for code,pattern in patterns.items() if re.search(pattern,sample)],'arbitraryOutputRetained':False}
  receipt['controlDiagnostics'].append(row)
 def command(args,limit=60):
  remaining=deadline_epoch-time.time();assert remaining>30,'STAGE_A_CLEANUP_RESERVE_REACHED'
  try:r=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=min(limit,remaining-20),check=False)
  except subprocess.TimeoutExpired as error:
   diagnostic(':'.join(args[:2]),error.stdout,error.stderr,timed_out=True);raise AssertionError('PACKAGING_CONTROL_COMMAND_TIMEOUT') from None
  if r.returncode:diagnostic(':'.join(args[:2]),r.stdout,r.stderr,r.returncode)
  assert r.returncode==0,'PACKAGING_CONTROL_COMMAND_FAILED'
  return r.stdout
 try:
  with tempfile.TemporaryDirectory(prefix='work8-v27-compiler-inputs-',dir=os.environ['RUNNER_TEMP']) as temp:
   private=pathlib.Path(temp);inputs=private/'source';inputs.mkdir(mode=0o700)
   reviewed=json.loads(plan.read_text())
   for entry in reviewed['backendOverlay']:
    assert re.fullmatch(r'backend/src/[A-Za-z0-9_./-]+\.(ts|mjs|js)',entry['path']) and '..' not in pathlib.PurePosixPath(entry['path']).parts
    original=source/entry['path'];assert sha(original)==entry['sha256'],'REVIEWED_SOURCE_INPUT_MISMATCH'
    target=inputs/entry['path'];target.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
    with target.open('xb') as out:out.write(original.read_bytes())
   policy=private/'policy';policy.mkdir(mode=0o700);(policy/'control.json').write_text('{"scope":"PACKAGING_ONLY","authority":"NONE"}\n')
   unrelated=private/'unrelated';unrelated.mkdir(mode=0o700);(unrelated/'sentinel').write_text('ISOLATED_UNRELATED_FIXTURE\n')
   receipt['hostDirectories']=[host_metadata(p,c) for p,c in [(private,'compiler_input_parent'),(inputs,'reviewed_source'),(output,'generated_output'),(policy,'policy_fixture'),(unrelated,'unrelated_fixture'),(script,'compiler_scripts')]]
   args=['docker','create','--name',name,'--label','work8.packaging='+str(os.environ['GITHUB_RUN_ID']),'--network','none','--read-only','--user',str(uid)+':'+str(gid),'--cap-drop','ALL','--security-opt','no-new-privileges','--memory','512m','--cpus','1','--pids-limit','32']
   for host,dest,ro in [(inputs,'/source',True),(script,'/compiler',True),(plan,'/reviewed-plan.json',True),(policy,'/policy',True),(unrelated,'/unrelated',True),(output,'/output',False)]:args+=['--mount','type=bind,src='+str(host)+',dst='+dest+(',readonly' if ro else '')]
   args+=['--entrypoint','node',BACKEND_IMAGE,'/compiler/isolated-compiler.cjs',str(uid),str(gid)]
   command(args)
   inspected=json.loads(command(['docker','inspect',name]))[0];assert inspected['Image']==BACKEND_IMAGE,'BACKEND_IMAGE_IDENTITY_MISMATCH'
   receipt['dockerConfiguration']=checked_mounts(inspected,uid,gid)
   try:r=subprocess.run(['docker','start','--attach',name],stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=min(120,max(1,deadline_epoch-time.time()-30)),check=False)
   except subprocess.TimeoutExpired as error:
    diagnostic('docker:start',error.stdout,error.stderr,timed_out=True);raise AssertionError('ISOLATED_COMPILER_TIMEOUT') from None
   if r.returncode:diagnostic('docker:start',r.stdout,r.stderr,r.returncode)
   receipt['containerExit']=safe_state(json.loads(command(['docker','inspect',name]))[0]);receipt['dockerStartExitCode']=r.returncode
   prefix=b'WORK8_COMPILER_RECEIPT ';lines=[line[len(prefix):] for line in r.stdout.splitlines() if line.startswith(prefix)]
   assert len(lines)==1 and len(lines[0])<=65536,'COMPILER_RECEIPT_MISSING_OR_UNBOUNDED'
   actual=json.loads(lines[0]);receipt['compiler']=actual
   assert actual['planSha256']==receipt['planSha256'] and actual['compilerScriptSha256']==receipt['sharedImplementationHashes']['isolated-compiler.cjs'],'COMPILER_RECEIPT_IDENTITY_MISMATCH'
   assert r.returncode==0 and receipt['containerExit']['ExitCode']==0 and actual['status']=='PASS_ISOLATED_COMPILER_OUTPUT_CONTRACT','ISOLATED_COMPILER_CONTRACT_FAILED'
   receipt['generatedOutputs']=verify_compiled_outputs(output,plan)
   receipt['hostOutputAfter']=host_metadata(output,'generated_output_after_compilation')
   receipt['status']='PASS_PACKAGING_PERMISSION_AND_EXACT_OUTPUTS'
 except Exception as error:
  safe=str(error) if isinstance(error,AssertionError) and re.fullmatch(r'[A-Z0-9_]{1,120}',str(error)) else type(error).__name__
  receipt['firstFailure']={'code':safe,'compilerFailure':receipt.get('compiler',{}).get('failure'),'arbitraryExceptionValuesRetained':False}
 finally:
  # The wrapper deadline must not interrupt the separately bounded 20s removal
  # and 10s census before their failure receipt can be written.
  signal.alarm(0);receipt['deadlineAlarmDisabledForBoundedCleanup']=True
  receipt['compilerContainerRemoved']=False;receipt['compilerContainerAbsenceVerified']=False
  try:
   cleanup=subprocess.run(['docker','rm','--force',name],stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=20,check=False)
   receipt['compilerContainerRemoved']=cleanup.returncode==0
   if cleanup.returncode:diagnostic('docker:cleanup',cleanup.stdout,cleanup.stderr,cleanup.returncode)
  except (OSError,subprocess.TimeoutExpired) as error:receipt['cleanupCommandFailure']=type(error).__name__
  try:
   check=subprocess.run(['docker','ps','-aq','--filter','name=^/'+name+'$'],stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=10,check=False)
   receipt['compilerContainerAbsenceVerified']=check.returncode==0 and not check.stdout.strip()
   if check.returncode:diagnostic('docker:cleanup-census',check.stdout,check.stderr,check.returncode)
  except (OSError,subprocess.TimeoutExpired) as error:receipt['cleanupCensusFailure']=type(error).__name__
  if not receipt['compilerContainerAbsenceVerified']:receipt['status']='FAIL';receipt['cleanupFailure']=True
  receipt['compilerInputFixturesRemoved']=private is None or not private.exists()
  probe=output/'.permission-probe'
  try:
   if probe.exists() and not probe.is_symlink():shutil.rmtree(probe)
  except OSError:pass
  receipt['temporaryPermissionProbeRemoved']=not probe.exists() and not probe.is_symlink()
  if not receipt['compilerInputFixturesRemoved'] or not receipt['temporaryPermissionProbeRemoved']:receipt['status']='FAIL';receipt['cleanupFailure']=True
  (evidence/'compiler-permission-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
 if receipt['status']!='PASS_PACKAGING_PERMISSION_AND_EXACT_OUTPUTS':raise AssertionError('STAGE_A_COMPILER_CONTRACT_FAILED')
 return receipt

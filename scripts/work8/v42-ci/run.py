#!/usr/bin/env python3
"""Run a frozen CI selection; retain bounded results without provider credentials."""
import argparse, datetime, hashlib, json, os, pathlib, re, shutil, subprocess, sys, time

ROOT = pathlib.Path(__file__).resolve().parent
PLAN = json.loads((ROOT / 'plan.json').read_text())
MAX_LOG = 2 * 1024 * 1024
MAX_ARTIFACT = 8 * 1024 * 1024
SECRET = re.compile(rb'(?:-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|AKIA[0-9A-Z]{16}|sk-(?:proj-)?[A-Za-z0-9_-]{35,})')
def digest(p): return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def dump(p, data): pathlib.Path(p).write_text(json.dumps(data, indent=2) + '\n')
def git(p, *args): return subprocess.check_output(['git', '-C', str(p), *args], text=True).strip()

def generated_path(source, name):
    p=source/name
    if not p.is_relative_to(source/'docs'/'audits'):raise RuntimeError('GENERATED_OUTPUT_PATH_REFUSED')
    if any(x.is_symlink() for x in [p,*p.parents] if x.is_relative_to(source)):raise RuntimeError('GENERATED_OUTPUT_SYMLINK_REFUSED')
    if not p.resolve().is_relative_to((source/'docs'/'audits').resolve()) or not p.is_file():raise RuntimeError('GENERATED_OUTPUT_SCOPE_REFUSED')
    if p.stat().st_nlink!=1:raise RuntimeError('GENERATED_OUTPUT_HARDLINK_REFUSED')
    if p.stat().st_size>MAX_LOG:raise RuntimeError('GENERATED_OUTPUT_SIZE_REFUSED')
    return p

def validate_generated_reports(workspace, source, spec, state, out=None):
    if not any(x['name']==spec['generatedReportProducerCommand'] and x['status']=='PASS' for x in state['steps']):raise RuntimeError('GENERATED_REPORT_PRODUCER_NOT_PASS')
    log=workspace/'ci-temp'/state['job']/spec['generatedReportLog']
    if any(x.is_symlink() for x in [log,*log.parents] if x.is_relative_to(workspace)):raise RuntimeError('GENERATED_REPORT_LOG_SYMLINK_REFUSED')
    if not log.resolve().is_relative_to((workspace/'ci-temp'/state['job']).resolve()) or not log.is_file() or log.stat().st_size>MAX_LOG:raise RuntimeError('GENERATED_REPORT_LOG_REFUSED')
    text=log.read_text();entries=[]
    for item in spec['generatedReports']:
        p=generated_path(source,item['path']);raw=p.read_bytes()
        if SECRET.search(raw):raise RuntimeError('GENERATED_REPORT_SECRET_PATTERN_REFUSED')
        value=json.loads(raw)
        if not isinstance(value,dict) or value.get(item['passField']) is not True:raise RuntimeError('GENERATED_REPORT_NOT_PASS')
        timestamp=datetime.datetime.fromisoformat(value['generatedAt'].replace('Z','+00:00')).timestamp()
        if not state['testStartedAtEpoch']<=timestamp<=time.time()+5:raise RuntimeError('GENERATED_REPORT_NOT_CURRENT')
        marker='▶ '+item['stdoutLabel']+'\n'
        if text.count(marker)!=1:raise RuntimeError('GENERATED_REPORT_STDOUT_AMBIGUOUS')
        segment=text.split(marker,1)[1].split('\n▶ ',1)[0];start=segment.index('{')
        printed,end=json.JSONDecoder().raw_decode(segment[start:]);printed_raw=segment[start:start+end].encode()
        if item.get('stdoutExtraMarker'):
            if printed.pop(item['stdoutExtraMarker'],None)!='PASS' or printed!=value:raise RuntimeError('GENERATED_REPORT_STDOUT_MISMATCH')
        elif printed_raw!=raw:raise RuntimeError('GENERATED_REPORT_STDOUT_BYTES_MISMATCH')
        baseline=state['generatedReportBaseline'][item['path']]
        if digest(p)==baseline['sha256']:raise RuntimeError('GENERATED_REPORT_UNCHANGED_FROM_BASELINE')
        entry={'path':item['path'],'producerPath':item['producerPath'],'producerSHA256':item['producerSHA256'],'beforeSHA256':baseline['sha256'],'beforeGitBlob':baseline['gitBlob'],'afterSHA256':digest(p),'bytes':len(raw),'generatedAt':value['generatedAt'],'stdoutEquality':'PASS','passField':item['passField']}
        if out is not None:
            artifact_name='qualification-'+pathlib.PurePosixPath(item['path']).name
            (out/artifact_name).write_bytes(raw);entry['artifact']=artifact_name
        entries.append(entry)
    state['generatedReportReadback']=entries

def verify_tracked_sources(workspace, source, spec, state, boundary):
    checks=[]
    for item in spec.get('producerSourceBindings',[]):
        if digest(source/item['path'])!=item['sha256']:raise RuntimeError('QUALIFICATION_PRODUCER_SOURCE_MISMATCH')
    for directory in [source]+[workspace/x['path'] for x in spec.get('extraCheckouts',[])]:
        paths=['.']
        if directory==source and spec.get('backendAlias'):paths.append(':(exclude)backend')
        changed=git(directory,'diff','--name-only','HEAD','--',*paths).splitlines()
        diff=git(directory,'diff','HEAD','--',*paths)
        check={'checkout':directory.name,'boundary':boundary,'changedTrackedPaths':changed,'diffSHA256':hashlib.sha256(diff.encode()).hexdigest()}
        checks.append(check);state.setdefault('sourceIntegrityChecks',[]).append(check)
        if changed:
            if spec.get('preparedCorrection') and boundary=='after-test' and directory==source:
                manifest_path=ROOT/spec.get('preparedCorrectionManifest','correction/corrective-module-manifest.json')
                manifest=json.loads(manifest_path.read_text())
                allowed={x['path']:x for x in manifest['files']}
                if not set(changed).issubset(allowed):raise RuntimeError('UNREVIEWED_CORRECTION_MUTATION')
                for entry in manifest['files']:
                    if digest(source/entry['path'])!=entry.get('candidateSha256',entry.get('sha256')):raise RuntimeError('CORRECTION_FINAL_SOURCE_MISMATCH')
                state['preparedCorrectionFileManifestSHA256']=digest(manifest_path)
            elif directory==source and spec.get('generatedReports') and boundary in ['after-test','before-independent-continuation']:
                allowed={x['path'] for x in spec['generatedReports']}
                if not set(changed).issubset(allowed):raise RuntimeError('UNREVIEWED_TRACKED_SOURCE_MUTATION:'+directory.name+':'+','.join(changed))
                validate_generated_reports(workspace,source,spec,state)
            else:raise RuntimeError('UNREVIEWED_TRACKED_SOURCE_MUTATION:'+directory.name+':'+','.join(changed))

def clean_env(temp):
    env = {k: os.environ[k] for k in ['PATH', 'LANG', 'LC_ALL', 'TZ'] if k in os.environ}
    env.update(PLAN['environment'])
    env.update({'RUNNER_TEMP': str(temp), 'TMPDIR': str(temp), 'GITHUB_STEP_SUMMARY': str(temp / 'summary.md'), 'NEXT_TELEMETRY_DISABLED': '1'})
    env['WORK8_CI_CONTROLLER_ROOT'] = str(ROOT)
    env['HOME'] = str(temp)
    env['npm_config_cache'] = str(temp / 'npm-cache')
    node_path = pathlib.Path(subprocess.check_output(['node','-p','process.execPath'],text=True).strip())
    env['npm_config_nodedir'] = str(node_path.parent.parent)
    return env

def run_step(step, source, env, out, index, seconds, isolated):
    name = step['name']; log = out / ('step-%02d.log' % index)
    script = out / ('step-%02d.sh' % index)
    body = step['run'].replace('HOME="$RUNNER_TEMP" ', '')
    entered='printf "WORK8_CI_ISOLATED_ASSERTION_ENTERED\\n"\n' if isolated else ''
    script.write_text('set -euo pipefail\ntest "$(node --version)" = v22.23.2\n' + entered + body + '\n')
    cwd = source / step.get('working-directory', '.')
    actual_env = dict(env)
    for k, v in step.get('env', {}).items():
        if '${{' in str(v): raise RuntimeError('UNRESOLVED_WORKFLOW_EXPRESSION:' + k)
        actual_env[k] = str(v).replace('__BACKEND_ROOT__', str(source.parent / 'backend-current' / 'backend')).replace('__CONTEXT_OUT__', str(pathlib.Path(env['RUNNER_TEMP']) / 'source-context'))
    command = ['bash', str(script)]
    if isolated:
        command = ['bash', str(ROOT / 'namespace.sh'), str(os.getuid()), str(os.getgid()), str(seconds), 'env', '-i'] + [k+'='+v for k,v in actual_env.items()] + command
    started = time.monotonic()
    with log.open('wb') as output:
        proc = subprocess.Popen(command, cwd=cwd, env=actual_env, stdout=output, stderr=subprocess.STDOUT, start_new_session=True)
        reason = None
        try:
            while proc.poll() is None:
                if log.stat().st_size > MAX_LOG:
                    reason = 'OUTPUT_LIMIT_EXCEEDED'; break
                if time.monotonic() - started > seconds + 15:
                    reason = 'STEP_DEADLINE_EXCEEDED'; break
                time.sleep(.2)
            if reason:
                subprocess.run(['sudo', '-n', 'kill', '-TERM', '--', '-'+str(proc.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=5)
                try: proc.wait(timeout=12)
                except subprocess.TimeoutExpired:
                    subprocess.run(['sudo', '-n', 'kill', '-KILL', '--', '-'+str(proc.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=5)
            code = proc.wait(timeout=10)
        finally:
            if proc.poll() is None:
                subprocess.run(['sudo','-n','kill','-KILL','--','-'+str(proc.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=5)
    raw = log.read_bytes()
    if len(raw) > MAX_LOG:
        raw = raw[:MAX_LOG]; log.write_bytes(raw); reason = reason or 'OUTPUT_LIMIT_EXCEEDED'
    if SECRET.search(raw):
        log.write_text('WITHHELD_SECRET_PATTERN; no credential value published.\n'); reason = 'SECRET_PATTERN_UPLOAD_REFUSED'
    if code in [124,137]:reason=reason or 'STEP_DEADLINE_EXCEEDED'
    elif code < 0 or 128 <= code <= 192:reason=reason or 'ABNORMAL_SIGNAL_EXIT'
    text = raw.decode('utf8', 'replace')
    if isolated and 'WORK8_CI_ISOLATED_ASSERTION_ENTERED\n' not in text:reason=reason or 'ISOLATED_BOUNDARY_NOT_REACHED'
    # Original command-specific TAP/count gates remain in the frozen scripts.
    # Also forbid a successful command from hiding skipped/cancelled/todo tests.
    if not reason and re.search(r'^\s*# (?:fail|cancelled|skipped|todo) [1-9]\d*\s*$', text, re.M): reason = 'MANDATORY_TEST_NOT_PASS'
    return {'name':name,'exitCode':code,'status':'PASS' if code == 0 and reason is None else 'FAIL','reason':reason,'seconds':round(time.monotonic()-started,3),'isolatedLoopbackNamespace':isolated,'commandSHA256':digest(script),'logSHA256':digest(log),'log':log.name}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--job',required=True);ap.add_argument('--phase',choices=['setup','test','collect'],required=True);args=ap.parse_args()
    spec=PLAN['jobs'][args.job]; workspace=pathlib.Path(os.environ['GITHUB_WORKSPACE']).resolve();source=workspace/'candidate';out=workspace/'ci-output'/args.job;out.mkdir(parents=True,exist_ok=True)
    state_path=out/'result.json';state=json.loads(state_path.read_text()) if state_path.exists() else {'schema':'work8-v42-ci-group-result-v1','job':args.job,'scope':spec['scope'],'status':'NOT_RUN','steps':[],'wholeO42Accepted':False,'componentPins':spec['pins'],'controllerCommit':os.environ.get('GITHUB_SHA'),'runId':os.environ.get('GITHUB_RUN_ID'),'attempt':os.environ.get('GITHUB_RUN_ATTEMPT')}
    if args.phase=='collect':
        if spec.get('backendAlias'):
            alias=source/'backend';backup=source/'incidental-backend-not-under-test'
            if alias.is_symlink() and backup.is_dir():
                if alias.resolve()!=(workspace/'backend-current'/'backend').resolve():raise RuntimeError('BACKEND_ALIAS_CLEANUP_REFUSED')
                alias.unlink();backup.rename(alias);state['incidentalBackendRestored']=True
        if state['status'] in ['NOT_RUN','RUNNING','SETUP_PASS']:
            state['status']='NOT_RUN_INCOMPLETE';state['reason']='PREREQUISITE_OR_JOB_INTERRUPTION'
        if state.get('sourceIdentityVerified'):
            try:verify_tracked_sources(workspace,source,spec,state,'after-test')
            except Exception as exc:state['status']='FAIL';state['sourceIntegrityFailure']=str(exc)
        if spec.get('generatedReports'):
            try:validate_generated_reports(workspace,source,spec,state,out)
            except Exception as exc:state['status']='FAIL';state['generatedReportValidationFailure']=str(exc)
        for item in spec.get('evidence',[]):
            origin=workspace / item['path'].replace('{job}',args.job)
            if not origin.is_relative_to(workspace/'ci-temp'/args.job):raise RuntimeError('EVIDENCE_SCOPE_REFUSED')
            if any(p.is_symlink() for p in [origin,*origin.parents] if p.is_relative_to(workspace)):raise RuntimeError('EVIDENCE_SYMLINK_REFUSED')
            if not origin.resolve().is_relative_to((workspace/'ci-temp'/args.job).resolve()):raise RuntimeError('RESOLVED_EVIDENCE_SCOPE_REFUSED')
            if origin.is_file():
                if origin.stat().st_size>MAX_LOG:raise RuntimeError('RESULT_SIZE_REFUSED')
                raw=origin.read_bytes()
                if SECRET.search(raw):raise RuntimeError('RESULT_SECRET_PATTERN_REFUSED')
                json.loads(raw)
                (out/item['name']).write_bytes(raw)
        state['retentionDays']=7;state['artifactLimitBytes']=MAX_ARTIFACT
        # Preserve only intentionally generated logs/scripts/JSON. No source trees or arbitrary fixture data.
        for f in out.iterdir():
            if f.is_symlink() or not f.is_file() or f.suffix not in ['.json','.log','.sh']: raise RuntimeError('ARTIFACT_MEMBER_REFUSED')
            if SECRET.search(f.read_bytes()): raise RuntimeError('ARTIFACT_SECRET_PATTERN_REFUSED')
        dump(state_path,state)
        total=sum(f.stat().st_size for f in out.iterdir())
        if total > MAX_ARTIFACT: raise RuntimeError('ARTIFACT_SIZE_REFUSED')
        dump(out/'index.json',{'job':args.job,'bytesBeforeIndex':total,'files':[{'path':f.name,'sha256':digest(f),'bytes':f.stat().st_size} for f in sorted(out.iterdir()) if f.name!='index.json']})
        if sum(f.stat().st_size for f in out.iterdir()) > MAX_ARTIFACT: raise RuntimeError('ARTIFACT_SIZE_REFUSED')
        with open(os.environ['GITHUB_OUTPUT'],'a') as f: f.write('allowed=true\n')
        print(json.dumps({'job':args.job,'status':state['status'],'artifactBytes':sum(f.stat().st_size for f in out.iterdir())}));return 0 if state['status']=='PASS_SELECTED_SCOPE' else 1
    if os.environ.get('GITHUB_RUN_ATTEMPT')!='1': raise RuntimeError('RETRY_REFUSED')
    if git(workspace/'controller','rev-parse','HEAD')!=os.environ.get('GITHUB_SHA'):raise RuntimeError('CONTROLLER_IDENTITY_MISMATCH')
    if git(source,'rev-parse','HEAD') != spec['pins']['primary']: raise RuntimeError('PRIMARY_SOURCE_IDENTITY_MISMATCH')
    if git(source,'rev-parse','HEAD^{tree}') != spec['pins']['primaryTree']: raise RuntimeError('PRIMARY_TREE_IDENTITY_MISMATCH')
    for extra in spec.get('extraCheckouts',[]):
        directory=workspace/extra['path']
        if git(directory,'rev-parse','HEAD')!=extra['sha'] or git(directory,'rev-parse','HEAD^{tree}')!=extra['tree']:raise RuntimeError('EXTRA_SOURCE_IDENTITY_MISMATCH')
    for directory in [source]+[workspace/x['path'] for x in spec.get('extraCheckouts',[])]:
        forbidden=[]
        for item in git(directory,'ls-files').splitlines():
            name=pathlib.PurePosixPath(item).name
            if (name=='.env' or name.startswith('.env.')) and not name.endswith(('.example','.sample','.template')):forbidden.append(item)
        if forbidden:raise RuntimeError('TRACKED_RUNTIME_ENV_FILE_REFUSED:'+','.join(forbidden))
    state['extraComponentPins']=spec.get('extraCheckouts',[])
    if spec.get('backendAlias'):
        target=workspace/'backend-current'/'backend';alias=source/'backend';backup=source/'incidental-backend-not-under-test'
        if alias.is_symlink():
            if alias.resolve()!=target.resolve():raise RuntimeError('BACKEND_ALIAS_MISMATCH')
        else:
            if backup.exists():raise RuntimeError('BACKEND_ALIAS_BACKUP_COLLISION')
            alias.rename(backup);alias.symlink_to(target,target_is_directory=True)
        state['composition']='Original frontend bytes with backend alias to separately verified94aa source; not a claim that one original frontendGitTree contains that backend.'
    for tool in ['node','bash','python3','sudo','unshare','ip','setpriv','timeout']:
        subprocess.run(['bash','-c','command -v "$1"','v42',tool],check=True,stdout=subprocess.DEVNULL)
    if subprocess.check_output(['node','--version'],text=True).strip()!='v22.23.2':raise RuntimeError('NODE_PIN_MISMATCH')
    temp=workspace/'ci-temp'/args.job;temp.mkdir(parents=True,exist_ok=True);env=clean_env(temp)
    state['sourceIdentityVerified']=True;state['node']='22.23.2';state['runner']={k:os.environ.get(k) for k in ['RUNNER_OS','RUNNER_ARCH','ImageOS','ImageVersion']};state['status']='RUNNING';dump(state_path,state)
    verify_tracked_sources(workspace,source,spec,state,'before-'+args.phase)
    if args.phase=='test':
        state['testStartedAtEpoch']=time.time()
        if spec.get('generatedReports'):
            state['generatedReportBaseline']={item['path']:{'sha256':digest(generated_path(source,item['path'])),'gitBlob':git(source,'rev-parse','HEAD:'+item['path'])} for item in spec['generatedReports']}
    dump(state_path,state)
    steps=spec[args.phase]
    deadline=time.monotonic()+spec['minutes']*60-120
    for step in steps:
        remaining=int(deadline-time.monotonic())
        if remaining<=0:state['status']='FAIL';state['reason']='GROUP_DEADLINE';dump(state_path,state);return 1
        result=run_step(step,source,env,out,len(state['steps']),min(remaining,2580),args.phase=='test');state['steps'].append(result);dump(state_path,state)
        print(json.dumps({'job':args.job,'phase':args.phase,'name':result['name'],'status':result['status'],'exitCode':result['exitCode'],'reason':result['reason']}))
        if result['status']!='PASS':
            state['status']='FAIL';state['reason']='FAILED_ASSERTION_OR_PREREQUISITE';dump(state_path,state)
            safe_independent=(args.phase=='test' and step.get('independentAssertion') is True and result['reason'] in [None,'MANDATORY_TEST_NOT_PASS'])
            if not safe_independent:return 1
            state.setdefault('continuedIndependentFailures',[]).append(result['name'])
            # Subsequent commands are independently selected. Recheck immutable
            # source before continuing; a failed safety/source boundary stops.
            verify_tracked_sources(workspace,source,spec,state,'before-independent-continuation')
            dump(state_path,state)
    failed=any(step['status']!='PASS' for step in state['steps'])
    state['status']='FAIL' if failed else ('SETUP_PASS' if args.phase=='setup' else 'PASS_SELECTED_SCOPE');dump(state_path,state)
    return 1 if failed else 0

if __name__=='__main__':
    try: sys.exit(main() or 0)
    except Exception as exc:
        print(type(exc).__name__+':'+str(exc),file=sys.stderr);sys.exit(1)

#!/usr/bin/env python3
"""Compile a qualification-only read-only observer with bounded diagnostics.

No downloads or application edits. The caller installs output and receipt as
root:root 0444 on a read-only mount and binds their hashes independently.
Compilation alone does not qualify Node ABI or an executor.
"""
import argparse, hashlib, importlib.util, json, pathlib, re, stat, subprocess, time

def digest(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def canonical_regular(p):
    p=pathlib.Path(p).absolute();s=p.lstat()
    if p.resolve()!=p or not stat.S_ISREG(s.st_mode) or s.st_nlink!=1:
        raise ValueError('OBSERVER_BUILD_PATH_REFUSED')
    return p

def build(source, output, receipt):
    source=pathlib.Path(source).absolute();output=pathlib.Path(output).absolute();receipt=pathlib.Path(receipt).absolute()
    if output.exists() or output.is_symlink() or receipt.exists() or receipt.is_symlink() or output.parent.resolve()!=output.parent or receipt.parent.resolve()!=receipt.parent:
        raise ValueError('OBSERVER_BUILD_PATH_REFUSED')
    start=time.monotonic()
    record={'schema':'work8-v75-native-observer-build-v1','status':'FAIL_COMPILE','sourceSHA256':None,'compiler':'/usr/bin/cc','rawCompilerOutputRetained':False,'maximumSeconds':60,'maximumOutputBytes':131072,'applicationModified':False,'hostedExecutorQualified':False}
    cause=None
    try:
        source=canonical_regular(source)
        if source.stat().st_size>16384:raise ValueError('OBSERVER_SOURCE_BOUND')
        runtime_path=canonical_regular(source.with_name('runtime_common.py'))
        spec=importlib.util.spec_from_file_location('v75_observer_runtime_common',runtime_path)
        runtime=importlib.util.module_from_spec(spec);spec.loader.exec_module(runtime)
        args=['/usr/bin/cc','-std=c11','-O2','-Wall','-Wextra','-Werror','-fPIC','-fvisibility=hidden','-shared','-Wl,-z,relro,-z,now','-Wl,--no-undefined-version',str(source),'-o',str(output)]
        record.update(sourceSHA256=digest(source),runtimeHelperSHA256=digest(runtime_path),compilerSHA256=digest(pathlib.Path('/usr/bin/cc').resolve()),compilerArguments=args[1:-3])
        result=runtime.bounded_process(args,{'PATH':'/usr/bin:/bin','LC_ALL':'C'},60,131072)
        combined=result.stdout+result.stderr
        record.update(exitCode=result.returncode,outputBytes=len(combined),outputSHA256=hashlib.sha256(combined).hexdigest(),streamComplete=True)
        if result.returncode!=0:raise ValueError('OBSERVER_COMPILATION_FAILED')
        canonical_regular(output);output.chmod(0o444)
        record.update(status='COMPILED_AWAITING_ACTUAL_PROTECTED_NODE_LOAD',binarySHA256=digest(output),binaryBytes=output.stat().st_size)
    except Exception as e:
        cause='OBSERVER_COMPILER_TIMEOUT' if isinstance(e,subprocess.TimeoutExpired) else 'OBSERVER_COMPILER_OUTPUT_BOUND' if str(e)=='COMMAND_OUTPUT_BOUND' else str(e) if isinstance(e,ValueError) and re.fullmatch('[A-Z_]{1,80}',str(e)) else 'OBSERVER_BUILD_PREREQUISITE_FAILED'
        record.update(firstCause=cause,errorClass=type(e).__name__,errno=getattr(e,'errno',None),streamComplete=record.get('streamComplete',False))
    record['elapsedSeconds']=round(time.monotonic()-start,3)
    with receipt.open('x') as f:f.write(json.dumps(record,indent=2)+'\n')
    receipt.chmod(0o444)
    if cause:raise ValueError(cause)
    return record

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--source',required=True);p.add_argument('--output',required=True);p.add_argument('--receipt',required=True);a=p.parse_args()
    try:build(a.source,a.output,a.receipt)
    except Exception as e:
        code=str(e) if isinstance(e,ValueError) and re.fullmatch('[A-Z_]{1,80}',str(e)) else 'OBSERVER_BUILD_PREREQUISITE_FAILED'
        print(json.dumps({'status':'FAIL','firstCause':code,'rawErrorRetained':False}));raise SystemExit(1)

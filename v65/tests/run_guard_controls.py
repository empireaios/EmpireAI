#!/usr/bin/env python3
"""Run reviewed guard fixtures, recording their limited scope and exact source."""
import argparse
import contextlib
import hashlib
import io
import json
import os
import pathlib
import sys
import unittest

HERE=pathlib.Path(__file__).resolve().parent
ADAPTER=HERE.parent/'adapter'
sys.path.insert(0,str(ADAPTER))
from github_contract import require,sha
from collect_runtime_image_provenance import bind_current_identity
sys.path.insert(0,str(HERE.parent/'foundation/runtime'))
from runtime_common import atomic

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--output',type=pathlib.Path,required=True);args=parser.parse_args()
 root=args.output.parent.parent
 identity=json.loads((root/'runner-identity.json').read_text());binding=bind_current_identity(identity,os.environ)
 files=sorted(HERE.glob('test_*guard*.py'))
 require(bool(files),'RELEASED_GUARD_TESTS_REQUIRED')
 sourceFiles=[ADAPTER/'github_contract.py',ADAPTER/'collect_runtime_image_provenance.py',ADAPTER/'compare_executor_provenance.py',HERE/'run_guard_controls.py',*files]
 sources={str(p.relative_to(HERE.parent)):sha(p) for p in sourceFiles}
 suite=unittest.defaultTestLoader.discover(str(HERE),pattern='test_*guard*.py')
 # Tests only contain reviewed fixtures. Suppress raw unittest tracebacks and
 # stdout; retain exact failing test identifiers rather than exception text.
 result=unittest.TestResult()
 with contextlib.redirect_stdout(io.StringIO()),contextlib.redirect_stderr(io.StringIO()):suite.run(result)
 receipt={'schema':'work8-v75-guard-controls-v1',**binding,'status':'PASS_SOURCE_BOUND_REJECTION_CONTROLS' if result.wasSuccessful() and result.testsRun>0 and not result.skipped else 'FAIL_SOURCE_BOUND_REJECTION_CONTROLS','testsRun':result.testsRun,'failures':[t.id() for t,_ in result.failures],'errors':[t.id() for t,_ in result.errors],'skipped':[t.id() for t,_ in result.skipped],'sourceSHA256':sources,'actualRunnerQualified':False,'applicationStarted':False,'rawOutputRetained':False}
 atomic(args.output,receipt,exclusive=True)
 print(json.dumps({'status':receipt['status'],'testsRun':result.testsRun,'actualRunnerQualified':False}))
 return 0 if receipt['status']=='PASS_SOURCE_BOUND_REJECTION_CONTROLS' else 17

if __name__=='__main__':raise SystemExit(main())

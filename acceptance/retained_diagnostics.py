"""Reuse immutable V94 diagnostics, never assert that V94 is the current host."""
import ast
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent

def digest(data):
    return hashlib.sha256(data).hexdigest()

def require(ok, code):
    if not ok:
        raise ValueError(code)

def verify_operands(controller):
    pin = json.loads((HERE/'retained-v94/diagnostic-operands.json').read_text())
    receipt = HERE/'retained-v94/diagnostic-controls.json'
    require(digest(receipt.read_bytes()) == pin['historicalEvidence']['diagnosticControlsSHA256'], 'V94_DIAGNOSTIC_RECEIPT_CHANGED')
    for name, expected in pin['files'].items():
        path = controller/name
        require(path.is_file() and not path.is_symlink() and digest(path.read_bytes()) == expected, 'RETAINED_DIAGNOSTIC_OPERAND_CHANGED')
    text = (controller/'examine-v26.py').read_text()
    functions = [n for n in ast.parse(text).body if isinstance(n, ast.FunctionDef) and n.name == 'run']
    require(len(functions) == 1 and digest(ast.get_source_segment(text, functions[0]).encode()) == pin['examineRunASTSHA256'], 'RETAINED_EXAMINER_DIAGNOSTIC_INVOCATION_CHANGED')
    functions = [x for x in (controller/'coordinator.mjs').read_text().splitlines() if x.startswith('function retainFirst(')]
    require(len(functions) == 1 and digest(functions[0].encode()) == pin['coordinatorRetainFirstSHA256'], 'RETAINED_FIRST_CAUSE_FUNCTION_CHANGED')
    return pin['historicalEvidence']

def admit(root):
    history = verify_operands(root/'controller/scripts/work8/native-transition')
    dest = root/'diagnostic-controls'
    require(not dest.exists(), 'DIAGNOSTIC_RECEIPT_ALREADY_INSTALLED')
    dest.mkdir(mode=0o700)
    target = dest/'negative-control-result.json'
    with target.open('xb') as stream:
        stream.write((HERE/'retained-v94/diagnostic-controls.json').read_bytes())
    target.chmod(0o600)
    require(digest(target.read_bytes()) == history['diagnosticControlsSHA256'], 'RETAINED_DIAGNOSTIC_COPY_CHANGED')
    return history

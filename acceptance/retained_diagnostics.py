"""Reuse immutable V94 diagnostics with separately reviewed V96 successors."""
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
    # Preserve the old evidence verbatim. Changed diagnostics are verified
    # against their own V96 review and V98 actual Docker failure evidence.
    from retained_evidence import verify_retained_evidence
    proof = verify_retained_evidence(HERE.parent, controller)
    pin = json.loads((HERE/'retained-v94/diagnostic-operands.json').read_text())
    receipt = HERE/'retained-v94/diagnostic-controls.json'
    require(digest(receipt.read_bytes()) == pin['historicalEvidence']['diagnosticControlsSHA256'], 'V94_DIAGNOSTIC_RECEIPT_CHANGED')
    require(proof['historicalQualification']['diagnosticControlsSHA256'] == pin['historicalEvidence']['diagnosticControlsSHA256']
            and proof['diagnosticSuccessor']['originalV94ReceiptChanged'] is False,
            'RETAINED_DIAGNOSTIC_SUCCESSOR_BINDING')
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

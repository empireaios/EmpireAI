"""Last read-only gate immediately before delivering the actual owner link.

Run only against the nonsecret, final handoff receipt after the access card has
been durably saved and native sign-in readiness verified. It neither reads
credentials nor signs in. A PASS is valid at its timestamp, not indefinitely.
"""
import argparse
import hashlib
import json
import pathlib
import time
from review_window import require_owner_handoff_window

OPERATION='V133-A10-PRIVATE-REVIEW-A01-20261114'
ORIGIN='https://a10-v133-owner-review-isolated-review.up.railway.app'


def check_receipt(path, now_ms=None):
    path=pathlib.Path(path).absolute()
    if path.resolve()!=path or not path.is_file() or path.stat().st_size>32768:
        raise ValueError('PUBLIC_HANDOFF_RECEIPT_REQUIRED')
    raw=path.read_bytes();receipt=json.loads(raw)
    if (receipt.get('schema')!='A09_PRIVATE_OWNER_HANDOFF_ARTIFACT_RECEIPT_V1'
        or receipt.get('operationIdentity')!=OPERATION or receipt.get('origin')!=ORIGIN
        or receipt.get('ownerActionObserved') is not False
        or receipt.get('nativeLoginPerformed') is not False
        or receipt.get('ownerApproval') is not False):
        raise ValueError('EXACT_NEW_HANDOFF_RECEIPT_REQUIRED')
    now_ms=time.time_ns()//1_000_000 if now_ms is None else now_ms
    remaining=require_owner_handoff_window(receipt['expiresAtMs'],now_ms)
    if receipt.get('reviewClosesAtMs')!=receipt['expiresAtMs']-90_000:
        raise ValueError('EXACT_CUSTODY_CUTOFF_REQUIRED')
    return {'schema':'V133_ACTUAL_OWNER_DELIVERY_WINDOW_GATE_V1','status':'PASS_AT_OBSERVED_TIMESTAMP',
            'operationIdentity':OPERATION,'checkedAtMs':now_ms,
            'ownerReviewClosesAtMs':receipt['reviewClosesAtMs'],
            'remainingOwnerOpportunityMs':remaining,'minimumOwnerOpportunityMs':600_000,
            'receiptSHA256':hashlib.sha256(raw).hexdigest(),
            'credentialsRead':False,'ownerActionPerformed':False,
            'expiresIfDeliveryDelayedPastMs':receipt['reviewClosesAtMs']-600_000}


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('receipt');args=parser.parse_args()
    print(json.dumps(check_receipt(args.receipt)))

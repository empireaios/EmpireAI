"""Last read-only gate immediately before delivering the actual owner link.

Run only against the nonsecret, final handoff receipt after the access card has
been durably saved and native sign-in readiness verified. It neither reads
credentials nor signs in. A PASS is valid at its timestamp, not indefinitely.
"""
import argparse
import hashlib
import json
import pathlib
import re
import time
from review_window import require_owner_handoff_window

OPERATION='V133-A10-PRIVATE-REVIEW-A01-20261114'
ORIGIN='https://a10-v133-owner-review-isolated-review.up.railway.app'


def public_json(path):
    path=pathlib.Path(path).absolute()
    if path.resolve()!=path or not path.is_file() or path.stat().st_size>32768:
        raise ValueError('PUBLIC_HANDOFF_RECEIPT_REQUIRED')
    raw=path.read_bytes()
    return json.loads(raw),hashlib.sha256(raw).hexdigest()


def check_receipt(path, technical_path, signin_path, now_ms=None):
    receipt,receipt_sha=public_json(path)
    if (receipt.get('schema')!='A09_PRIVATE_OWNER_HANDOFF_ARTIFACT_RECEIPT_V1'
        or receipt.get('operationIdentity')!=OPERATION or receipt.get('origin')!=ORIGIN
        or receipt.get('ownerActionObserved') is not False
        or receipt.get('nativeLoginPerformed') is not False
        or receipt.get('ownerApproval') is not False):
        raise ValueError('EXACT_NEW_HANDOFF_RECEIPT_REQUIRED')
    if receipt.get('claimsAsOfArtifactCreation') is not True:
        raise ValueError('ARTIFACT_CREATION_CLAIMS_REQUIRED')
    if (not re.fullmatch(r'[a-f0-9]{40}',str(receipt.get('publicationCommit','')))
        or not re.fullmatch(r'[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}',str(receipt.get('deploymentId','')))):
        raise ValueError('EXACT_SOURCE_AND_DEPLOYMENT_REQUIRED')
    for key in ('sourceManifestSHA256','runtimeManifestSHA256','providerBindingSHA256','accessCardSHA256'):
        if not re.fullmatch(r'[a-f0-9]{64}',str(receipt.get(key,''))):
            raise ValueError('EXACT_PUBLIC_HANDOFF_DIGEST_REQUIRED')
    technical,technical_sha=public_json(technical_path)
    signin,signin_sha=public_json(signin_path)
    for evidence in (technical,signin):
        for key in ('operationIdentity','origin','publicationCommit','deploymentId'):
            if evidence.get(key)!=receipt.get(key):
                raise ValueError('TECHNICAL_EVIDENCE_EXACT_BINDING_REQUIRED')
        if (evidence.get('ownerActionObserved') is not False
                or evidence.get('mediaDecisionSubmitted') is not False):
            raise ValueError('TECHNICAL_PROOF_IS_NOT_OWNER_DECISION')
    if (technical.get('schema')!='V134_NATIVE_AUTHENTICATED_MEDIA_TECHNICAL_VERIFICATION_V1'
        or technical.get('status')!='PASS'
        or technical.get('actor')!='AUTOMATION_TECHNICAL_VERIFIER_NOT_OWNER'
        or technical.get('expiresAtMs')!=receipt['expiresAtMs']):
        raise ValueError('NATIVE_TECHNICAL_VERIFICATION_REQUIRED')
    for key in ('nativeAuthenticationVerified','technicalSessionLoggedOut','logoutRevocationVerified','mediaHistoryUnchanged'):
        if technical.get(key) is not True:
            raise ValueError('AUTHENTICATION_MEDIA_AND_REVOCATION_PROOF_REQUIRED')
    if (technical.get('nativeMediaVersionBefore')!=2 or technical.get('nativeMediaVersionAfter')!=2
        or technical.get('ownerApproval') is not False
        or technical.get('credentialsPrinted') is not False
        or technical.get('originalSHA256')!='4fe19c2fbe0907474d053181a5568489d842421e0dbd2b627e487cca61511048'
        or technical.get('revisedSHA256')!='69f1f95ab622041332d5e5e1ee43a59a2c34bd017151a6bb45e260f69e035788'
        or technical.get('proposalEventDigest')!='75987c24e58ec6254abf597f40d85c9ddea4ff88b697c69e3c53ee198121fdf8'):
        raise ValueError('EXACT_UNDECIDED_MEDIA_VERSION_REQUIRED')
    if (signin.get('schema')!='V134_PUBLIC_NATIVE_SIGNIN_PRESENTATION_V1'
        or signin.get('status')!='PASS'
        or signin.get('publicSigninRendered') is not True
        or signin.get('emailFieldVisible') is not True
        or signin.get('passwordFieldVisible') is not True
        or signin.get('enterEmpireAIButtonVisible') is not True):
        raise ValueError('ACTUAL_PUBLIC_SIGNIN_PRESENTATION_REQUIRED')
    now_ms=time.time_ns()//1_000_000 if now_ms is None else now_ms
    remaining=require_owner_handoff_window(receipt['expiresAtMs'],now_ms)
    if receipt.get('reviewClosesAtMs')!=receipt['expiresAtMs']-90_000:
        raise ValueError('EXACT_CUSTODY_CUTOFF_REQUIRED')
    return {'schema':'V134_ACTUAL_OWNER_DELIVERY_WINDOW_GATE_V1',
            'status':'TECHNICAL_ACCESS_READY_OWNER_AUTHENTICATED_PRESENTATION_PENDING',
            'operationIdentity':OPERATION,'checkedAtMs':now_ms,
            'ownerReviewClosesAtMs':receipt['reviewClosesAtMs'],
            'remainingOwnerOpportunityMs':remaining,'minimumOwnerOpportunityMs':600_000,
            'receiptSHA256':receipt_sha,'technicalVerificationSHA256':technical_sha,
            'publicSigninVerificationSHA256':signin_sha,
            'nativeAuthenticationAndImageBytesVerified':True,
            'ownerAuthenticatedBrowserPresentationVerified':False,
            'ownerInteractionRequired':True,
            'credentialsRead':False,'ownerActionPerformed':False,
            'expiresIfDeliveryDelayedPastMs':receipt['reviewClosesAtMs']-600_000}


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('receipt')
    parser.add_argument('--technical-verification',required=True)
    parser.add_argument('--public-signin-verification',required=True)
    args=parser.parse_args()
    print(json.dumps(check_receipt(args.receipt,args.technical_verification,args.public_signin_verification)))

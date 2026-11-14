"""One verified V134 private restore; no retries or owner interaction."""
import datetime, hashlib, json, os, pathlib, ssl, time, urllib.error, urllib.request
from review_window import require_transfer_window

# V134 supplies a fresh one-launch/one-transfer grant for this exact V133
# operation and destination. Final provider/runtime admission remains mandatory.
REPLACEMENT_BINDINGS_COMPLETE = True

ROOT=pathlib.Path(__file__).resolve().parent.parent
ORIGIN='https://a10-v133-owner-review-isolated-review.up.railway.app'
def sha(data): return hashlib.sha256(data).hexdigest()
def unique(path,data):
    fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600)
    try:
        os.write(fd,data);os.fsync(fd)
    finally: os.close(fd)
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs): raise ValueError('REDIRECT_REFUSED')
def main():
    if REPLACEMENT_BINDINGS_COMPLETE is not True:
        raise ValueError('FRESH_EXACT_REPLACEMENT_AUTHORITY_AND_DESTINATION_REQUIRED')
    gate=json.loads((ROOT/'governance/live-transfer-admission.json').read_text())
    assert gate['status']=='PASS_EXACT_LIVE_TRANSFER' and gate['operationIdentity']=='V133-A10-PRIVATE-REVIEW-A01-20261114'
    assert gate['serviceId']=='d1536bae-0d47-4e39-b3eb-aeefc2e70fd4' and gate['projectId']=='afedd0ad-ebc1-45c1-b4aa-9782b5251ca3' and gate['environmentId']=='dd4591b0-1d8e-4561-812d-33c03b9d9efa'
    assert gate['exactOwnerGrantSHA256']=='34161e15de087f26f029c3eb380430c1eb3fa6a41c5e99de8073207ab02bda20'
    assert gate['origin']==ORIGIN and gate['deploymentId'] not in ['e7d16214-cc83-4fcb-812f-510066c8a949','00d21280-61c8-4d3a-ba46-58aa87ba45fd','a33102fd-b426-4d02-aecd-e2ee096f2f49','9e094e94-bfd4-4370-923e-f0eaeb07fcf5','2a78270f-0a72-42a9-9279-3a61b427690a','30677c6d-258c-449e-ac05-e7b981886461']
    assert gate['executionAttempt']==1 and gate['privateSessionAttempt']==1
    require_transfer_window(gate['expiresAtMs'])
    assert sha((ROOT/'governance/owner-grant.json').read_bytes())=='34161e15de087f26f029c3eb380430c1eb3fa6a41c5e99de8073207ab02bda20'
    encrypted=(ROOT/'private/restore-envelope.json').read_bytes()
    receipt=json.loads((ROOT/'authorization/restore-envelope-receipt.json').read_text())
    assert receipt['envelopeSHA256']==sha(encrypted) and receipt['envelopeBytes']==len(encrypted)<2*1024*1024
    assert receipt['deploymentId']==gate['deploymentId'] and receipt['keyBindingSHA256']==gate['keyBindingSHA256']
    assert receipt['publicationCommit']==gate['publicationCommit'] and receipt['sourceManifestSHA256']==gate['sourceManifestSHA256'] and receipt['expiresAtMs']==gate['expiresAtMs']
    context=ssl.create_default_context();context.minimum_version=ssl.TLSVersion.TLSv1_2
    opener=urllib.request.build_opener(NoRedirect(),urllib.request.HTTPSHandler(context=context))
    # Read-only final freshness check is before the exclusive submission intent.
    with opener.open(ORIGIN+'/__review_transport/key',timeout=15) as response:
        assert response.status==200 and response.url==ORIGIN+'/__review_transport/key'
        fresh=response.read(32769);assert len(fresh)<=32768
    key=json.loads(fresh)
    canonical=json.dumps(key,sort_keys=True,separators=(',',':')).encode()
    assert sha(canonical)==gate['keyBindingSHA256']
    # Final freshness includes the TLS request duration. This precedes the
    # exclusive intent and the one POST; refusal consumes no private transfer.
    require_transfer_window(gate['expiresAtMs'])
    intent={'schema':'V134_EXCLUSIVE_PRIVATE_SUBMISSION_INTENT_V1','atUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'operationIdentity':gate['operationIdentity'],'deploymentId':gate['deploymentId'],'origin':ORIGIN,'envelopeSHA256':sha(encrypted),'bytes':len(encrypted),'explicitOwnerGrantSHA256':'34161e15de087f26f029c3eb380430c1eb3fa6a41c5e99de8073207ab02bda20','automaticRetries':0,'ownerActionPerformed':False}
    unique(ROOT/'authorization/private-submission-intent.json',(json.dumps(intent,indent=2)+'\n').encode())
    request=urllib.request.Request(ORIGIN+'/__review_transport/restore',data=encrypted,headers={'Content-Type':'application/json','Content-Length':str(len(encrypted)),'Accept':'application/json'},method='POST')
    try:
        # Intent persistence may block; recheck the owner opportunity at the
        # last possible boundary before the one private POST. Expiry consumes
        # the intent but sends nothing and cannot be retried automatically.
        require_transfer_window(gate['expiresAtMs'])
        with opener.open(request,timeout=20) as response:
            status=response.status;url=response.url;body=response.read(65537)
    except urllib.error.HTTPError as error:
        status=error.code;url=error.url;body=error.read(65537)
    assert len(body)<=65536 and url==request.full_url
    result={'schema':'V134_ONE_PRIVATE_RESTORE_RESPONSE_V1','atUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'httpStatus':status,'body':json.loads(body),'bodySHA256':sha(body),'requestEnvelopeSHA256':sha(encrypted),'noRetry':True,'ownerActionPerformed':False}
    unique(ROOT/'authorization/private-submission-response.json',(json.dumps(result,indent=2)+'\n').encode())
    print(json.dumps(result))
    assert status==200
if __name__=='__main__': main()

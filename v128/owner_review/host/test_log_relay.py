"""Synthetic maximum-size ciphertext relay; no owner state or decision."""
import base64
import contextlib
import hashlib
import importlib.util
import io
import json
import pathlib
import tempfile
import time

spec = importlib.util.spec_from_file_location('host', pathlib.Path(__file__).with_name('root-supervisor.py'))
host = importlib.util.module_from_spec(spec)
spec.loader.exec_module(host)
chunk = bytes(range(256)) * 16
payload_sha = hashlib.sha256(chunk * 3072).hexdigest()
records = [json.dumps({'schema': 'A09_CUSTODY_INDEX_V1', 'exportSHA256': payload_sha,
                       'exportBytes': 3072 * len(chunk), 'chunks': 3072, 'complete': False})]
for index in range(3072):
    records.append(json.dumps({'schema': 'A09_CUSTODY_CIPHERTEXT_V1', 'exportSHA256': payload_sha,
                               'index': index, 'bytes': len(chunk),
                               'sha256': hashlib.sha256(chunk).hexdigest(),
                               'dataBase64': base64.b64encode(chunk).decode()}))
records.append(json.dumps({'schema': 'A09_CUSTODY_INDEX_V1', 'exportSHA256': payload_sha,
                           'exportBytes': 3072 * len(chunk), 'chunks': 3072, 'complete': True}))
raw = ('\n'.join(records) + '\n').encode()
start = time.monotonic()
with tempfile.TemporaryFile(mode='w+t') as captured:
    with contextlib.redirect_stdout(captured):
        host.relay('native', io.BufferedReader(io.BytesIO(raw)))
    captured.seek(0)
    decoded = hashlib.sha256()
    chunks = 0
    for line in captured:
        record = json.loads(line)
        if record['schema'] == 'A09_CUSTODY_CIPHERTEXT_V1':
            assert record['index'] == chunks
            decoded.update(base64.b64decode(record['dataBase64'], validate=True))
            chunks += 1
assert chunks == 3072 and decoded.hexdigest() == payload_sha
assert host.custody_logged.is_set() and host.events.empty()
assert host.counts['custodyBytes'] == len(raw) < host.MAX_CUSTODY_BYTES
print(json.dumps({'status': 'PASS', 'syntheticCiphertextBytes': 3072 * len(chunk),
                  'loggedBytes': len(raw), 'chunksReadBack': chunks,
                  'exactDigestRoundtrip': True, 'relaySeconds': time.monotonic() - start,
                  'notAnActualOwnerExport': True, 'providerWrites': 0, 'ownerActions': 0}))

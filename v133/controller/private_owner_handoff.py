#!/usr/bin/env python3
"""Create private, temporary native-login material without printing credentials.

Local controller only. This neither launches a service nor signs in as the owner.
The final access card is for the owner's private ChatGPT file handoff. It is never
part of source publication, a runtime image, provider logs or terminal evidence.
"""
import argparse
import datetime
import hashlib
import html
import json
import os
from pathlib import Path
import re
import secrets
import stat
import sys
from urllib.parse import urlsplit
from review_window import require_owner_handoff_window

REPLACEMENT_BINDINGS_COMPLETE = False

OWNER_HASH = 'a437be3d7f2e7927959c2be2040016464de75d69529d9abd197e47a8caa21267'
OPERATION = 'V132-A10-PRIVATE-REVIEW-A01-20261114'

def digest(data):
    return hashlib.sha256(data).hexdigest()

def private_directory(value):
    path = Path(value).absolute()
    if path.is_symlink() or not path.is_dir() or path.resolve() != path:
        raise ValueError('PRIVATE_DIRECTORY_REQUIRED')
    info = path.stat()
    if info.st_uid != os.getuid() or stat.S_IMODE(info.st_mode) != 0o700:
        raise ValueError('PRIVATE_DIRECTORY_MODE_REQUIRED')
    return path

def private_json(path):
    path = Path(path).absolute()
    if path.resolve(strict=True) != path:
        raise ValueError('PRIVATE_CANONICAL_PATH_REQUIRED')
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    try:
        info = os.fstat(fd)
        if not stat.S_ISREG(info.st_mode) or info.st_nlink != 1:
            raise ValueError('PRIVATE_REGULAR_FILE_REQUIRED')
        if info.st_uid != os.getuid() or stat.S_IMODE(info.st_mode) != 0o600:
            raise ValueError('PRIVATE_FILE_MODE_REQUIRED')
        if not 0 < info.st_size <= 32768:
            raise ValueError('PRIVATE_FILE_SIZE_REQUIRED')
        with os.fdopen(fd, 'rb', closefd=False) as stream:
            data = stream.read(32769)
        after = os.fstat(fd)
        current = path.lstat()
        identity = lambda s: (s.st_dev, s.st_ino, s.st_size, s.st_mtime_ns, s.st_ctime_ns, s.st_mode, s.st_uid, s.st_nlink)
        if len(data) != info.st_size or identity(after) != identity(info) or identity(current) != identity(info):
            raise ValueError('PRIVATE_INPUT_CHANGED_DURING_READ')
        return json.loads(data)
    finally:
        os.close(fd)

def create_private(path, data):
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    try:
        with os.fdopen(fd, 'wb', closefd=False) as stream:
            stream.write(data)
            stream.flush()
            os.fsync(fd)
    finally:
        os.close(fd)

def generate(identity_path, output_directory):
    if REPLACEMENT_BINDINGS_COMPLETE is not True:
        raise ValueError('FRESH_EXACT_REPLACEMENT_AUTHORITY_AND_DESTINATION_REQUIRED')
    directory = private_directory(output_directory)
    identity = private_json(identity_path)
    email = identity['founderEmail'].strip().lower()
    if digest(email.encode()) != OWNER_HASH or identity['emailSHA256'] != OWNER_HASH:
        raise ValueError('EXACT_EXISTING_OWNER_REQUIRED')
    record = {
        'schema': 'A09_PRIVATE_OWNER_CREDENTIAL_SEED_V1',
        'operationIdentity': OPERATION,
        'founderEmail': email,
        'founderEmailSHA256': OWNER_HASH,
        'founderPassword': secrets.token_urlsafe(32),
        'adminPassword': secrets.token_urlsafe(32),
        'sessionSecret': secrets.token_hex(32),
        'exportToken': secrets.token_urlsafe(48),
        'createdAtUTC': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'providerConfigured': False,
        'ownerAuthenticated': False,
        'ownerActionObserved': False,
    }
    if record['founderPassword'] == record['adminPassword']:
        raise ValueError('DISTINCT_NATIVE_CREDENTIALS_REQUIRED')
    path = directory / 'owner-credential-seed.json'
    create_private(path, (json.dumps(record, indent=2) + '\n').encode())
    return {'status': 'PRIVATE_SEED_CREATED', 'operationIdentity': OPERATION,
            'ownerHashVerified': True, 'credentialsPrinted': False,
            'providerConfigured': False, 'ownerActionObserved': False}

def finalize(seed_path, binding_path, output_directory, now_ms=None):
    if REPLACEMENT_BINDINGS_COMPLETE is not True:
        raise ValueError('FRESH_EXACT_REPLACEMENT_AUTHORITY_AND_DESTINATION_REQUIRED')
    directory = private_directory(output_directory)
    seed = private_json(seed_path)
    # The public provider binding contains no credentials and is read separately.
    binding_path = Path(binding_path).absolute()
    if binding_path.is_symlink() or not binding_path.is_file() or binding_path.stat().st_size > 32768:
        raise ValueError('INVALID_PROVIDER_BINDING_FILE')
    binding = json.loads(binding_path.read_bytes())
    now_ms = now_ms or int(datetime.datetime.now(datetime.timezone.utc).timestamp() * 1000)
    if seed['operationIdentity'] != OPERATION or binding['operationIdentity'] != OPERATION:
        raise ValueError('OPERATION_MISMATCH')
    if digest(seed['founderEmail'].encode()) != OWNER_HASH:
        raise ValueError('OWNER_MISMATCH')
    if (binding['projectId'] != 'afedd0ad-ebc1-45c1-b4aa-9782b5251ca3' or
            binding['environmentId'] != 'dd4591b0-1d8e-4561-812d-33c03b9d9efa' or
            binding['serviceId'] != 'df5d6c1f-178f-41b6-8eb5-c7870f9f06d2' or binding['origin'] != 'https://a10-v132-owner-review-isolated-review.up.railway.app'):
        raise ValueError('EXACT_V132_DESTINATION_REQUIRED')
    origin = binding['origin']
    url = urlsplit(origin)
    if (url.scheme != 'https' or url.username or url.password or url.port or
            url.path or url.query or url.fragment or
            not re.fullmatch(r'[a-z0-9][a-z0-9-]{1,61}\.up\.railway\.app', url.hostname or '') or
            origin != 'https://' + url.hostname):
        raise ValueError('EXACT_RAILWAY_HTTPS_ORIGIN_REQUIRED')
    expires = binding['expiresAtMs']
    if type(expires) is not int or not 0 < expires - now_ms <= 1200000:
        raise ValueError('NATIVE_TWENTY_MINUTE_LEASE_REQUIRED')
    require_owner_handoff_window(expires, now_ms)
    for key in ('authoritySHA256', 'sourceManifestSHA256', 'runtimeManifestSHA256', 'providerReadbackSHA256'):
        if not re.fullmatch(r'[a-f0-9]{64}', binding[key]):
            raise ValueError('INVALID_PUBLIC_BINDING_DIGEST')
    if not re.fullmatch(r'[a-f0-9]{40}', binding['publicationCommit']):
        raise ValueError('INVALID_PUBLIC_SOURCE_COMMIT')
    for key in ('projectId', 'environmentId', 'serviceId', 'deploymentId'):
        if not re.fullmatch(r'[a-f0-9-]{36}', binding[key]):
            raise ValueError('EXACT_NEW_PROVIDER_RESOURCE_REQUIRED')
    if binding.get('isolatedServiceVerified') is not True or binding.get('productionAccess') is not False:
        raise ValueError('ISOLATED_PROVIDER_READBACK_REQUIRED')
    if binding.get('provider') != 'RAILWAY':
        raise ValueError('EXACT_PROVIDER_REQUIRED')
    bootstrap = {key: seed[key] for key in ('founderEmail', 'founderPassword', 'adminPassword', 'sessionSecret', 'exportToken')}
    bootstrap.update({key: binding[key] for key in ('operationIdentity', 'origin', 'expiresAtMs', 'authoritySHA256', 'publicationCommit', 'sourceManifestSHA256', 'runtimeManifestSHA256', 'provider', 'projectId', 'environmentId', 'serviceId', 'deploymentId', 'providerReadbackSHA256')})
    review_closes = expires - 90000
    if review_closes <= now_ms:
        raise ValueError('INSUFFICIENT_REVIEW_TIME_BEFORE_CUSTODY_GRACE')
    bootstrap['reviewClosesAtMs'] = review_closes
    bootstrap.update(mode='ISOLATED_OWNER_REVIEW', ownerActionObserved=False)
    expires_sgt = datetime.datetime.fromtimestamp(review_closes / 1000, datetime.timezone(datetime.timedelta(hours=8)))
    safe = html.escape
    card = ('<!doctype html><html lang="en"><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            '<meta name="referrer" content="no-referrer">'
            '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'">'
            '<title>EmpireAI temporary owner review access</title>'
            '<style>body{font:18px/1.55 system-ui;margin:24px auto;max-width:700px;padding:0 16px;color:#17212e;background:#fafbfc}code{display:block;overflow-wrap:anywhere;background:#edf0f4;padding:12px;border-radius:6px}a{color:#174ea6}p{margin:18px 0}</style>'
            '<h1>EmpireAI temporary owner review</h1><p>King, use this temporary password only for this isolated review session. It is separate from your existing account passwords.</p>'
            '<p><a rel="noreferrer noopener" href="' + safe(origin + '/login?next=%2Fcockpit%2Fproducts', quote=True) + '">Open the native review sign-in</a></p>'
            '<p>Email<code>' + safe(seed['founderEmail']) + '</code></p>'
            '<p>Temporary review password<code>' + safe(seed['founderPassword']) + '</code></p>'
            '<p>Complete your review before: <strong>' + safe(expires_sgt.strftime('%d %b %Y, %I:%M:%S %p Singapore time')) + '</strong>.</p>'
            '<p>After signing in, open Products and review the original and proposed image. Choose the action that reflects your own review. No action is selected in advance.</p>'
            '<p>The session will end automatically. A review or selection is confirmed only after its saved native record and independent encrypted readback are verified.</p></html>').encode()
    create_private(directory / 'review-bootstrap.json', (json.dumps(bootstrap, indent=2) + '\n').encode())
    # Recheck after rendering and before access material is created. The
    # delivery controller must repeat the same guard after its durable upload.
    require_owner_handoff_window(expires)
    create_private(directory / 'EmpireAI_Temporary_Owner_Review_Access.html', card)
    receipt = {'schema': 'A09_PRIVATE_OWNER_HANDOFF_ARTIFACT_RECEIPT_V1',
               'operationIdentity': OPERATION, 'ownerEmailSHA256': OWNER_HASH,
               'origin': origin, 'expiresAtMs': expires, 'reviewClosesAtMs': review_closes,
               'providerBindingSHA256': digest(binding_path.read_bytes()),
               'accessCardSHA256': digest(card), 'accessCardBytes': len(card),
               'credentialsPrinted': False, 'nativeLoginPerformed': False,
               'ownerActionObserved': False, 'ownerApproval': False,
               'handoffDestination': 'OWNER_PRIVATE_CHATGPT_LIBRARY_FILE_ONLY',
               'publicSourceOrLogInclusionAllowed': False}
    create_private(directory / 'private-handoff-receipt.json', (json.dumps(receipt, indent=2) + '\n').encode())
    return receipt

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='mode', required=True)
    create = sub.add_parser('generate')
    create.add_argument('--identity', required=True)
    create.add_argument('--private-directory', required=True)
    card = sub.add_parser('finalize')
    card.add_argument('--seed', required=True)
    card.add_argument('--provider-binding', required=True)
    card.add_argument('--private-directory', required=True)
    args = parser.parse_args()
    result = generate(args.identity, args.private_directory) if args.mode == 'generate' else finalize(args.seed, args.provider_binding, args.private_directory)
    print(json.dumps(result))

if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError, TypeError):
        print(json.dumps({'status': 'PRIVATE_HANDOFF_REJECTED', 'credentialsPrinted': False}), file=sys.stderr)
        sys.exit(1)

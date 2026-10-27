#!/usr/bin/env python3
"""Fail closed before uploading a bounded, non-secret examination receipt."""
import json
import pathlib
import re
import sys

root = pathlib.Path(sys.argv[1])
def check_keys(value):
    if isinstance(value, dict):
        for key, child in value.items():
            normalized = re.sub(r'[^a-z]', '', key.lower())
            if normalized in {'password', 'ownerpassword', 'founderpassword', 'adminpassword',
                              'sessionsecret', 'sessiontoken', 'accesstoken', 'refreshtoken',
                              'cookie', 'cookies', 'authorization', 'redisurl', 'storagestate'}:
                raise SystemExit('credential-bearing JSON key forbidden')
            check_keys(child)
    elif isinstance(value, list):
        for child in value:
            check_keys(child)
if not root.is_dir():
    raise SystemExit('missing evidence directory')
files = list(root.rglob('*'))
total = 0
for path in files:
    if path.is_symlink() or path.is_dir():
        raise SystemExit('nested directories or symlinks forbidden')
    if path.suffix not in {'.json', '.log', '.png', '.commit', '.tree'}:
        raise SystemExit('unapproved evidence extension')
    size = path.stat().st_size
    total += size
    if size > 5_000_000 or total > 25_000_000:
        raise SystemExit('evidence exceeds bounded size')
    if path.suffix == '.png':
        if not path.read_bytes().startswith(b'\x89PNG\r\n\x1a\n'):
            raise SystemExit('invalid PNG')
        continue
    text = path.read_text()
    if re.search(r'(?i)(bearer\s+[A-Za-z0-9._-]{8,}|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]+|-----BEGIN .*PRIVATE KEY)', text):
        raise SystemExit('possible secret in evidence')
    if re.search(r'(?i)(password|session[_-]?secret|redis[_-]?url|set-cookie|authorization)\s*[=:]\s*[^\s]*', text):
        raise SystemExit('possible credential field in evidence')
    if path.suffix == '.json':
        check_keys(json.loads(text))
if not files:
    raise SystemExit('empty evidence')
print('bounded evidence scan PASS')

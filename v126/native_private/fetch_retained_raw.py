#!/usr/bin/env python3
"""Reuse admitted immutable public Git transport; no credentials or ref changes."""
import json,pathlib,sys
from raw_blob_transport import fetch_retained_zip
assert len(sys.argv)==2
dest=pathlib.Path(sys.argv[1]);assert dest.is_absolute()
receipt=fetch_retained_zip(pathlib.Path(__file__).with_name('retained-blob-manifest.json'),
 '7b8d9cfbef07c72fe97257acc5d5245459d670f77a57aaa1e39c47bacc64e658',dest,None)
print(json.dumps(receipt))

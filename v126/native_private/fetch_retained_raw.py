#!/usr/bin/env python3
"""Reuse admitted immutable public Git transport; no credentials or ref changes."""
import json,os,pathlib,sys
from raw_blob_transport import fetch_retained_zip
assert len(sys.argv)==2
dest=pathlib.Path(sys.argv[1]);assert dest.is_absolute()
def save(name,value):
 path=dest.parent/name
 with path.open('x')as stream:stream.write(json.dumps(value,indent=2)+'\n')
try:
 receipt=fetch_retained_zip(pathlib.Path(__file__).with_name('retained-blob-manifest.json'),
  '7b8d9cfbef07c72fe97257acc5d5245459d670f77a57aaa1e39c47bacc64e658',dest,None)
except BaseException as error:
 failure=getattr(error,'transport_failure',{'schema':'v128-retained-transport-first-failure-v1',
  'status':'FAILED','phase':'admit-pinned-transport','errorType':type(error).__name__,
  'partialDownloadAbsent':not os.path.lexists(dest.with_name(dest.name+'.part')),'destinationAbsent':not os.path.lexists(dest)})
 save('retained-transport-first-failure.json',failure)
 raise
save('retained-transport.json',receipt)
print(json.dumps(receipt))

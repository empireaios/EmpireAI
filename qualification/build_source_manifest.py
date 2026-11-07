#!/usr/bin/env python3
"""Build an exact local source index; no provider, identity or execution action."""
import json
from pathlib import Path
import sys
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).resolve().parent))
import qualify_only

if __name__=='__main__':
    target=qualify_only.HERE/'source-manifest.json'
    value={'schema':'work8-v81-qualification-source-manifest-v1',
           'files':qualify_only.source_inventory(qualify_only.SOURCE),
           'exclusions':sorted(qualify_only.MANIFEST_EXCLUSIONS),
           'authority':'Excluded owner-approval.json must independently bind this complete manifest SHA256; its SHA256 and full provider Git commit are recorded at admission.',
           'applicationAcceptance':False}
    target.write_text(json.dumps(value,indent=2)+'\n')
    print(json.dumps({'sourceManifestSHA256':qualify_only.digest(target),'files':len(value['files']),'executionPerformed':False}))

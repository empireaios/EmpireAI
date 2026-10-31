#!/usr/bin/env python3
"""Only safe bounded diagnostic metadata may enter public Actions artifacts."""
import hashlib,json,os,pathlib,re,stat
import candidate_packages
root=pathlib.Path(os.environ['GITHUB_WORKSPACE'])/'scan-diagnostic-output'
allowed={'scan-findings.json','scan-diagnostic-result.json','artifact-index.json'}
try:
 paths=list(root.iterdir());names={p.name for p in paths}
 assert names<=allowed and {'scan-diagnostic-result.json','artifact-index.json'}<=names
 assert len(paths)<=3
 total=0
 for p in paths:
  mode=p.lstat();assert stat.S_ISREG(mode.st_mode) and mode.st_nlink==1 and not p.is_symlink()
  assert len(p.name.encode())<=128
  raw=p.read_bytes();total+=len(raw)
  assert not any(pattern.search(raw) for _,pattern in candidate_packages.PATTERNS)
  json.loads(raw)
 assert total<=4*1024**2-64*1024
 index=json.loads((root/'artifact-index.json').read_text())
 assert index['schema']=='work8-v23-safe-scan-artifact-v1' and index['rawValuesOrSnippetsRetained'] is False and index['candidateBytesRetained'] is False
 expected={e['path']:e for e in index['files']}
 assert set(expected)==names-{'artifact-index.json'}
 for name,e in expected.items():
  raw=(root/name).read_bytes();assert len(raw)==e['bytes'] and hashlib.sha256(raw).hexdigest()==e['sha256']
 result=json.loads((root/'scan-diagnostic-result.json').read_text())
 assert result['applicationRuntimeStarted'] is False and result['dockerImagesBuilt'] is False and result['providerSecretsSupplied'] is False and result['productionDataSupplied'] is False
 with open(os.environ['GITHUB_OUTPUT'],'a') as f:f.write('allowed=true\n')
except BaseException:
 # Do not serialize unexpected input, exception messages or matched values.
 with open(os.environ['GITHUB_OUTPUT'],'a') as f:f.write('allowed=false\n')
 raise SystemExit('DIAGNOSTIC_METADATA_UPLOAD_REFUSED') from None

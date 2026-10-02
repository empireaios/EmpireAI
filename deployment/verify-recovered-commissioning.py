"""Offline recovery assessment of a retrieved mirror; never invokes the application."""
import hashlib, json, pathlib, sqlite3, subprocess, sys
source, output = map(pathlib.Path, sys.argv[1:3])
if output.exists():
    raise SystemExit('Fresh isolated output directory required')
output.mkdir(mode=0o700)
raw = source.read_bytes()
payload = json.loads(raw)
assert payload['schema'] == 'CQ12-COMMISSIONING-MIRROR-001'
r = payload['record']
assert r['selectionAuthority'] == 'pillow' and r['cursorSelected'] is False
copy = output / 'mirror.json'
copy.write_bytes(raw)
dbfile = output / 'restored-commissioning.sqlite'
c = sqlite3.connect(dbfile)
# Exact table shape from old revision21384342, without app boot, flush or providers.
c.execute('CREATE TABLE pillow_one_product_commissioning (workspace_id TEXT PRIMARY KEY, commissioning_id TEXT NOT NULL, record_json TEXT NOT NULL, updated_at TEXT NOT NULL)')
c.execute('INSERT INTO pillow_one_product_commissioning VALUES (?,?,?,?)', (r['workspaceId'],r['commissioningId'],json.dumps(r),r['updatedAt']))
c.commit(); c.close()
reader = """import sqlite3,json,sys
c=sqlite3.connect('file:'+sys.argv[1]+'?mode=ro',uri=True)
assert c.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
rows=c.execute('SELECT record_json FROM pillow_one_product_commissioning').fetchall()
assert len(rows)==1
print(rows[0][0]);c.close()
"""
restored = json.loads(subprocess.check_output([sys.executable,'-c',reader,str(dbfile.resolve())],timeout=10))
assert restored == r
assert source.read_bytes() == raw and copy.read_bytes() == raw
receipt = dict(sourceBytes=len(raw),sourceSha256=hashlib.sha256(raw).hexdigest(),sqliteSha256=hashlib.sha256(dbfile.read_bytes()).hexdigest(),freshProcessReadback=True,integrity='ok',recordsRestored=1,allRecordFieldsEqual=True,sourceUnchanged=True,productionTouched=False,providerCalls=0,fullProductionRestoreProven=False)
(output/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(receipt))

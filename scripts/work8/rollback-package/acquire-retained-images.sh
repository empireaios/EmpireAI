#!/usr/bin/env bash
# Reuse run40842144334 images. No install, compilation or image rebuild.
set -Eeuo pipefail
umask 077
root=$(realpath "${GITHUB_WORKSPACE:?}")
script="$root/controller/scripts/work8/rollback-package"
private="$root/release-package-output/private"
public="$root/release-package-output/publishable"
mkdir -p "$private" "$public"
source "$script/command-diagnostics.sh"
python3 - "$root" "$script" <<'PY'
import hashlib,json,os,pathlib,subprocess,sys
root,script=map(pathlib.Path,sys.argv[1:]);manifest=json.load(open(script/'exact-manifest.json'));retained=json.load(open(script/'assets/retained-image-identities.json'))
assert subprocess.check_output(['git','-C',str(root/'controller'),'rev-parse','HEAD'],text=True).strip()==os.environ['EXPECTED_CONTROLLER']
for role in ['backend','frontend']:
 m=manifest[role];image=retained['images'][role]
 assert image['sourceCommit']==m['commit'] and image['sourceTree']==m['tree']
PY
gh api "repos/${GITHUB_REPOSITORY:?}/actions/artifacts/12882963734/zip" > "$private/retained-images.zip"
unset GH_TOKEN GITHUB_TOKEN
printf '%s  %s\n' 7f453221fd9cdcb7ed3001f286520a171344dae490f2abc367a6139d48af3ff5 "$private/retained-images.zip" | sha256sum -c -
python3 - "$private" "$script" <<'PY'
import hashlib,json,pathlib,shutil,sys,zipfile
private,script=map(pathlib.Path,sys.argv[1:]);retained=json.load(open(script/'assets/retained-image-identities.json'))
with zipfile.ZipFile(private/'retained-images.zip') as z:
 for name in ['image-identities.json','backend-image.tar.gz','frontend-image.tar.gz']:
  assert z.namelist().count(name)==1
  with z.open(name) as a,(private/name).open('wb') as b:shutil.copyfileobj(a,b)
assert json.load(open(private/'image-identities.json'))==retained
for role in ['backend','frontend']:
 image=retained['images'][role];h=hashlib.sha256()
 with (private/image['archive']).open('rb') as f:
  for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
 assert h.hexdigest()==image['archiveSha256']
(private/'build.env').write_text(''.join(role.upper()+'_IMAGE='+retained['images'][role]['imageId']+'\n' for role in ['backend','frontend']))
PY
source "$private/build.env"
for role in backend frontend;do
 docker load -i "$private/$role-image.tar.gz" > "$private/retained-$role-load.log" 2>&1
 if [[ "$role" == backend ]];then image=$BACKEND_IMAGE;else image=$FRONTEND_IMAGE;fi
 docker image inspect "$image" > "$private/retained-$role-image.json"
done
python3 - "$private" "$public" "$script" <<'PY'
import json,pathlib,sys
private,public,script=map(pathlib.Path,sys.argv[1:]);retained=json.load(open(script/'assets/retained-image-identities.json'))
for role in ['backend','frontend']:
 actual=json.load(open(private/('retained-'+role+'-image.json')));assert len(actual)==1;actual=actual[0];expected=retained['images'][role]
 assert actual['Id']==expected['imageId'] and actual['Os']=='linux' and actual['Architecture']=='amd64'
 labels=actual['Config']['Labels'];assert labels['org.opencontainers.image.revision']==expected['sourceCommit'] and labels['io.empireai.source-tree']==expected['sourceTree']
(public/'retained-image-reuse.json').write_text(json.dumps({'sourceRun':'40842144334','artifactId':12882963734,'artifactZipSha256':'7f453221fd9cdcb7ed3001f286520a171344dae490f2abc367a6139d48af3ff5','images':retained['images'],'loadedImmutableIdsVerified':True,'rebuilt':False,'wholeRowsAccepted':[]},indent=2)+'\n')
PY

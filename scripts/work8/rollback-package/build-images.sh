#!/usr/bin/env bash
# Build only the reviewed changed boundary; preserve the accepted backend base.
set -euo pipefail
umask 077
root=$(realpath "${GITHUB_WORKSPACE:?}")
script="$root/controller/scripts/work8/rollback-package"
out="$root/release-package-output"
private="$out/private"
publishable="$out/publishable"
mkdir -p "$private" "$publishable"
source "$script/command-diagnostics.sh"
container=''
stage(){ python3 "$script/build-diagnostics.py" stage --stage "$1"; }
finish(){
 status=$?;trap - EXIT TERM INT;set +e
 if [[ -n "$container" ]];then docker rm -f "$container" >/dev/null 2>&1 || status=1;fi
 python3 "$script/build-diagnostics.py" finish --exit-code "$status" || status=1
 exit "$status"
}
trap finish EXIT
trap 'exit 143' TERM
trap 'exit 130' INT
stage runtime-preflight
[[ ! -e "$private/build.env" ]]
[[ $(node --version) == v22.23.2 ]]
base=sha256:4b1a7f3be41a509b606f609650edddb1abfd458db48d085bd34b8ee4dcc50673
stage source-contract
python3 - "$root" "$script/exact-manifest.json" <<'PY'
import hashlib,json,os,pathlib,subprocess,sys
root=pathlib.Path(sys.argv[1]);m=json.load(open(sys.argv[2]))
assert subprocess.check_output(['git','-C',str(root/'controller'),'rev-parse','HEAD'],text=True).strip()==os.environ['EXPECTED_CONTROLLER'],'Controller source mismatch'
verified={}
for role in ('backend','frontend'):
 entry=m[role]
 live=json.loads(subprocess.check_output(['gh','api','repos/'+os.environ['GITHUB_REPOSITORY']+'/git/ref/heads/'+entry['destination']],text=True))
 assert live['object']['type']=='commit' and live['object']['sha']==entry['commit'],'Published source ref mismatch'
 commit=json.loads(subprocess.check_output(['gh','api','repos/'+os.environ['GITHUB_REPOSITORY']+'/git/commits/'+entry['commit']],text=True))
 assert commit['tree']['sha']==entry['tree'],'Published source tree mismatch'
 p=root/(role+'-source')
 for rev,key in [('HEAD','commit'),('HEAD^{tree}','tree')]:
  actual=subprocess.check_output(['git','-C',str(p),'rev-parse',rev],text=True).strip()
  assert actual==m[role][key],f'{role} source {key} mismatch'
 assert not subprocess.check_output(['git','-C',str(p),'status','--porcelain'],text=True), 'Source checkout must be clean'
 files=['backend/package.json','backend/package-lock.json','backend/src/runtime/owner-write-restriction.ts','backend/src/runtime/locked-commissioning.ts','backend/src/institutional-memory/store.ts','deployment/locked-runtime.cjs'] if role=='backend' else ['empireai-web/package.json','empireai-web/package-lock.json','empireai-web/app/rollback/route.ts','empireai-web/lib/owner/rollback-handler.ts','empireai-web/lib/owner/runtime-identity.mjs']
 verified[role]={'commit':entry['commit'],'tree':entry['tree'],'publishedRef':entry['destination'],'liveRefVerified':True,'sourceFileSha256':{name:hashlib.sha256((p/name).read_bytes()).hexdigest() for name in files}}
 receipt=root/'release-package-output/publishable/source-contract.json'
 receipt.write_text(json.dumps({'sources':verified,'wholeRowsAccepted':[]},indent=2)+'\n');receipt.chmod(0o600)
PY
stage artifact-acquisition
# Credential exists only for the pinned accepted-artifact acquisition.
gh api "repos/${GITHUB_REPOSITORY:?}/actions/artifacts/12706121104/zip" > "$private/accepted-backend.zip"
unset GH_TOKEN GITHUB_TOKEN
stage artifact-zip-verification
printf '%s  %s\n' eb76703f3a4a78f63361b8ee19727cf5cec21ce27501280e2f1b66c1b644fc8c "$private/accepted-backend.zip" | sha256sum -c -
python3 - "$private" <<'PY'
import pathlib,sys,zipfile
p=pathlib.Path(sys.argv[1])
with zipfile.ZipFile(p/'accepted-backend.zip') as z:
 name='owner-package-output/owner-backend-image.tar.gz'
 assert z.namelist().count(name)==1
 with z.open(name) as src,(p/'accepted-backend.tar.gz').open('wb') as dst:
  import shutil;shutil.copyfileobj(src,dst)
PY
stage image-archive-verification
printf '%s  %s\n' 4015d4ca1eacbd308e37892ad5c32ce9945e62bd8aa0f96b96a03b0878ed8b29 "$private/accepted-backend.tar.gz" | sha256sum -c -
stage accepted-image-load
docker load -i "$private/accepted-backend.tar.gz" > "$private/load.log" 2>&1
stage accepted-image-identity
[[ $(docker image inspect "$base" --format '{{.Id}}') == "$base" ]]
stage accepted-node-identity
[[ $(docker run --rm --network none --pull never --entrypoint node "$base" --version) == v22.23.2 ]]
# Compiler dependencies do not run install scripts; native dependencies remain in
# the accepted immutable image. Never perform a whole-backend rebuild.
stage backend-compiler-dependencies
npm ci --prefix "$root/backend-source/backend" --ignore-scripts --no-audit --no-fund > "$private/backend-dependencies.log" 2>&1
stage backend-changed-compilation
mkdir -p "$private/backend-overlay/empireai-web" "$private/backend-overlay/backend/dist" "$private/backend-overlay/backend/src/runtime" "$private/backend-overlay/backend/src/institutional-memory" "$private/backend-overlay/deployment"
(
 cd "$root/backend-source"
 node backend/node_modules/typescript/bin/tsc --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --skipLibCheck --esModuleInterop --outDir "$private/compiled" backend/src/runtime/owner-write-restriction.ts backend/src/institutional-memory/store.ts
) > "$private/compile.log" 2>&1
stage backend-installer-transpilation
node --input-type=module - "$root" "$private" <<'JS'
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const [root,privateDir]=process.argv.slice(2);const require=createRequire(path.join(root,'backend-source/backend/package.json'));const ts=require('typescript');
const filename=path.join(root,'backend-source/backend/src/runtime/locked-commissioning.ts');
const result=ts.transpileModule(fs.readFileSync(filename,'utf8'),{fileName:filename,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,sourceMap:false}});
if(result.diagnostics?.some(d=>d.category===ts.DiagnosticCategory.Error))throw Error('Changed locked commissioning transpilation failed');
fs.mkdirSync(path.join(privateDir,'compiled/runtime'),{recursive:true});fs.writeFileSync(path.join(privateDir,'compiled/runtime/locked-commissioning.js'),result.outputText);
JS
stage backend-overlay
for file in runtime/owner-write-restriction runtime/locked-commissioning institutional-memory/store; do
 mkdir -p "$private/backend-overlay/backend/dist/$(dirname "$file")"
 cp "$private/compiled/$file.js" "$private/backend-overlay/backend/dist/$file.js"
 cp "$root/backend-source/backend/src/$file.ts" "$private/backend-overlay/backend/src/$file.ts"
done
cp "$root/backend-source/deployment/locked-runtime.cjs" "$private/backend-overlay/deployment/locked-runtime.cjs"
cp "$root/backend-source/vercel.json" "$private/backend-overlay/vercel.json"
cp "$root/backend-source/empireai-web/vercel.json" "$private/backend-overlay/empireai-web/vercel.json"
backend_commit=$(git -C "$root/backend-source" rev-parse HEAD)
backend_tree=$(git -C "$root/backend-source" rev-parse HEAD^{tree})
frontend_commit=$(git -C "$root/frontend-source" rev-parse HEAD)
frontend_tree=$(git -C "$root/frontend-source" rev-parse HEAD^{tree})
# Preserve accepted revision schema, replacing only its exact source identity.
stage accepted-revision-extraction
container=$(docker create --network none "$base")
docker cp "$container:/app/backend/dist/runtime-revision.json" "$private/accepted-runtime-revision.json"
docker rm "$container" >/dev/null
container=''
stage backend-revision-binding
python3 - "$script/exact-manifest.json" "$private" <<'PY'
import json,pathlib,sys
m=json.load(open(sys.argv[1]));p=pathlib.Path(sys.argv[2]);revision=json.load(open(p/'accepted-runtime-revision.json'));count=0
old=m['backend']['base'];new=m['backend']['commit']
def replace(v):
 global count
 if isinstance(v,str) and v==old:count+=1;return new
 if isinstance(v,dict):return {k:replace(x) for k,x in v.items()}
 if isinstance(v,list):return [replace(x) for x in v]
 return v
assert set(revision)=={'revision'},'Unexpected accepted revision schema'
revision=replace(revision)
assert count==1,'Accepted revision does not attribute expected backend base'
(p/'backend-overlay/backend/dist/runtime-revision.json').write_text(json.dumps(revision,indent=2)+'\n')
PY
cat > "$private/backend-overlay/Dockerfile" <<EOF
FROM $base
LABEL org.opencontainers.image.revision="$backend_commit" io.empireai.source-tree="$backend_tree"
COPY vercel.json /app/vercel.json
COPY empireai-web/vercel.json /app/empireai-web/vercel.json
COPY backend/dist/ /app/backend/dist/
COPY backend/src/ /app/backend/src/
COPY deployment/ /app/deployment/
EOF
stage backend-image-build
docker build --network none --pull=false --iidfile "$private/backend.id" "$private/backend-overlay" > "$private/backend-build.log" 2>&1
stage frontend-build
# The recovery frontend has a changed Next route; compile this exact frontend.
(
 cd "$root/frontend-source/empireai-web"
 npm ci --ignore-scripts --no-audit --no-fund
 NEXT_TELEMETRY_DISABLED=1 npm run build
) > "$private/frontend-build.log" 2>&1
stage frontend-assembly
mkdir -p "$private/frontend-image/app"
python3 - "$root/frontend-source/empireai-web" "$private/frontend-image/app" <<'PY'
import pathlib,shutil,sys
source,dest=map(pathlib.Path,sys.argv[1:]);standalone=source/'.next/standalone'
candidates=[p for p in standalone.rglob('server.js') if 'node_modules' not in p.relative_to(standalone).parts]
assert len(candidates)==1,'Expected exactly one Next standalone server'
server=candidates[0];assert server.parent==standalone,'Stable root standalone server required'
shutil.copytree(standalone,dest,dirs_exist_ok=True);app=dest/server.parent.relative_to(standalone)
shutil.copytree(source/'.next/static',app/'.next/static',dirs_exist_ok=True)
if (source/'public').exists():shutil.copytree(source/'public',app/'public',dirs_exist_ok=True)
cache=app/'.next/cache';shutil.rmtree(cache,ignore_errors=True);cache.mkdir(parents=True)
(dest.parent/'server-path').write_text(str(server.relative_to(standalone)))
PY
server_path=$(cat "$private/frontend-image/server-path")
[[ "$server_path" =~ ^[a-zA-Z0-9_./-]+$ && "$server_path" != *..* ]]
cat > "$private/frontend-image/Dockerfile" <<EOF
FROM $base
LABEL org.opencontainers.image.revision="$frontend_commit" io.empireai.source-tree="$frontend_tree"
RUN rm -rf /app
WORKDIR /frontend
COPY app/ /frontend/
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0
ENTRYPOINT ["node"]
CMD ["$server_path"]
EOF
stage frontend-image-build
docker build --network none --pull=false --iidfile "$private/frontend.id" "$private/frontend-image" > "$private/frontend-image.log" 2>&1
stage image-archive-export
for role in backend frontend; do
 image=$(cat "$private/$role.id")
 [[ "$image" =~ ^sha256:[a-f0-9]{64}$ ]]
 [[ $(docker run --rm --network none --pull never --entrypoint node "$image" --version) == v22.23.2 ]]
 docker save "$image" | gzip -n > "$publishable/$role-image.tar.gz"
done
stage image-identity-receipt
python3 - "$script/exact-manifest.json" "$private" "$publishable" "$base" <<'PY'
import hashlib,json,pathlib,sys
manifest=json.load(open(sys.argv[1]));private,out=map(pathlib.Path,sys.argv[2:4]);base=sys.argv[4];images={}
for role in ('backend','frontend'):
 archive=out/(role+'-image.tar.gz');h=hashlib.sha256()
 with archive.open('rb') as f:
  for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
 source_root=pathlib.Path(__import__('os').environ['GITHUB_WORKSPACE'])/(role+'-source')
 changed=['backend/src/runtime/owner-write-restriction.ts','backend/src/runtime/locked-commissioning.ts','backend/src/institutional-memory/store.ts','deployment/locked-runtime.cjs','vercel.json','empireai-web/vercel.json'] if role=='backend' else ['empireai-web/app/rollback/route.ts','empireai-web/lib/owner/rollback-handler.ts','empireai-web/lib/owner/runtime-identity.mjs']
 source_hashes={name:hashlib.sha256((source_root/name).read_bytes()).hexdigest() for name in changed}
 images[role]={'sourceFileSha256':source_hashes,'imageId':(private/(role+'.id')).read_text().strip(),'archive':archive.name,'archiveSha256':h.hexdigest(),'sourceCommit':manifest[role]['commit'],'sourceTree':manifest[role]['tree'],'baseImageId':base,'nodeVersion':'22.23.2'}
(out/'image-identities.json').write_text(json.dumps({'schema':'work8-rollback-images-v1','images':images,'status':'BUILT_NOT_RELEASE_ACCEPTED'},indent=2)+'\n')
(private/'build.env').write_text(''.join(role.upper()+'_IMAGE='+images[role]['imageId']+'\n' for role in ('backend','frontend')))
PY

/* Reproducible compilation of reviewed changed TypeScript only.
 * Exact strict typechecking and targeted tests are prerequisites, not replaced here.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createRequire}=require('node:module');
const {createHash}=require('node:crypto');
const [app,overlay,planPath]=process.argv.slice(2);
assert.ok(app&&overlay&&planPath);
const ts=createRequire(path.join(app,'backend/package.json'))('typescript');
const plan=JSON.parse(fs.readFileSync(planPath,'utf8'));
assert.equal(plan.compilerVersion,ts.version);
const records=[];
for(const entry of plan.backendOverlay){
 assert.match(entry.path,/^backend\/src\/[A-Za-z0-9_./-]+\.(?:ts|mjs|js)$/);
 assert.ok(!entry.path.split('/').includes('..'));
 const sourcePath=path.join(overlay,'app',entry.path),text=fs.readFileSync(sourcePath,'utf8');
 assert.equal(createHash('sha256').update(text).digest('hex'),entry.sha256);
 if(!entry.path.endsWith('.ts'))continue;
 const relative=entry.path.slice('backend/src/'.length);
 const compiled=ts.transpileModule(text,{fileName:relative,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,sourceMap:true,esModuleInterop:true,isolatedModules:true},reportDiagnostics:true});
 const errors=(compiled.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
 assert.equal(errors.length,0,'CHANGED_TYPESCRIPT_SYNTAX_ERROR');
 const destination=path.join(overlay,'app/backend/dist',relative.replace(/\.ts$/,'.js'));
 fs.mkdirSync(path.dirname(destination),{recursive:true});
 fs.writeFileSync(destination,compiled.outputText);
 fs.writeFileSync(destination+'.map',compiled.sourceMapText);
 const row={path:entry.path,javascriptSha256:createHash('sha256').update(compiled.outputText).digest('hex'),mapSha256:createHash('sha256').update(compiled.sourceMapText).digest('hex')};
 assert.equal(row.javascriptSha256,entry.javascriptSha256,'REVIEWED_COMPILED_OUTPUT_MISMATCH');
 assert.equal(row.mapSha256,entry.mapSha256,'REVIEWED_COMPILED_MAP_MISMATCH');
 records.push(row);
}
console.log(JSON.stringify({compilerVersion:ts.version,changedTypeScriptOnly:true,records}));

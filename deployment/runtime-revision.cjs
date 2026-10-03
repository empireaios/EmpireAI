'use strict';
const fs=require('node:fs'),path=require('node:path');
const valid=value=>typeof value==='string'&&/^[a-f0-9]{40}$/.test(value);
function resolveRuntimeRevision(cwd,environmentRevision){
 const revision=JSON.parse(fs.readFileSync(path.join(cwd,'backend/dist/runtime-revision.json'),'utf8')).revision;
 if(!valid(revision))throw Error('Invalid image revision');
 if(environmentRevision!==undefined&&environmentRevision!==''&&environmentRevision!==revision)throw Error('Image and environment revision mismatch');
 return revision;
}
module.exports={valid,resolveRuntimeRevision};

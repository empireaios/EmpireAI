'use strict';
/* Static webpack graph comparison. Never evaluates package Javascript. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const acorn=require('../../continuation/v75/review/frontend-semantics/acorn.js');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const ANALYZER_SHA256=hash(fs.readFileSync(__filename));
const encoded=x=>JSON.stringify(x);
class Refusal extends Error { constructor(code,details){super(code);this.code=code;this.details=details;} }
function need(ok,code){if(!ok)throw new Refusal(code);}
const plainId=n=>n&&n.type==='Literal'&&(typeof n.value==='number'||typeof n.value==='string')&&/^(0|[1-9][0-9]*)$/.test(String(n.value))?String(n.value):null;
const prop=n=>n&&n.type==='MemberExpression'&&!n.computed&&n.property.type==='Identifier'?n.property.name:null;
function webpackPush(n){if(n.type!=='CallExpression'||prop(n.callee)!=='push')return false;let o=n.callee.object;if(o.type==='AssignmentExpression')o=o.left;return o.type==='MemberExpression'&&prop(o)==='webpackChunk_N_E'&&o.object.type==='Identifier'&&['self','globalThis','window'].includes(o.object.name);}
function bindings(n){if(!n)return [];if(n.type==='Identifier')return [n.name];if(n.type==='RestElement')return bindings(n.argument);if(n.type==='AssignmentPattern')return bindings(n.left);if(n.type==='ArrayPattern')return n.elements.flatMap(bindings);if(n.type==='ObjectPattern')return n.properties.flatMap(p=>bindings(p.type==='RestElement'?p.argument:p.value));return [];}
function walk(n,fn){if(!n||typeof n!=='object')return;fn(n);for(const [k,v]of Object.entries(n)){if(k==='start'||k==='end'||k==='raw')continue;if(Array.isArray(v))v.forEach(x=>walk(x,fn));else if(v&&typeof v==='object')walk(v,fn);}}
function shellWalk(n,fn){if(!n||typeof n!=='object')return;fn(n);if(n.type==='AssignmentExpression'&&prop(n.left)==='modules'&&n.right.type==='ObjectExpression')return;if(webpackPush(n)&&n.arguments[0]?.type==='ArrayExpression'&&n.arguments[0].elements[1]?.type==='ObjectExpression')return;for(const [k,v]of Object.entries(n)){if(['start','end','raw'].includes(k))continue;if(Array.isArray(v))v.forEach(x=>shellWalk(x,fn));else if(v&&typeof v==='object')shellWalk(v,fn);}}
function members(root){const out=[];let logical=0;function recurse(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);const s=fs.lstatSync(p);need(!s.isSymbolicLink(),'INPUT_SYMLINK');if(s.isDirectory())recurse(p);else{need(s.isFile()&&s.nlink===1,'INPUT_NONREGULAR');if(p.endsWith('.js')){need(s.size<=16*1024*1024,'JS_FILE_BOUND');logical+=s.size;need(logical<=512*1024*1024,'JS_TOTAL_BOUND');out.push(p);need(out.length<=4096,'JS_COUNT_BOUND');}}}}recurse(root);return out.sort();}
const replacementCache=new WeakMap();
function stringNormalize(s,side,options,fileMap){let v=s;for(const [a,b]of [[options[side+'SourceRoot'],'<SOURCE_ROOT>'],[encodeURIComponent(options[side+'SourceRoot']||''),'<SOURCE_ROOT_URL>'],[options[side+'BuildId'],'<BUILD_ID>']])if(a)v=v.split(a).join(b);if(side==='old'&&fileMap&&v.includes('/')){
 let replacement=replacementCache.get(fileMap);if(!replacement){const values=new Map();for(const [a,b]of fileMap){const base=[[a,b],[a.replace(/^app\//,''),b.replace(/^app\//,'')],[a.replace(/^app\/\.next\//,''),b.replace(/^app\/\.next\//,'')]];for(const [x,y]of [...base,...base.map(([x,y])=>[encodeURI(x),encodeURI(y)])])if(x!==y){need(!values.has(x)||values.get(x)===y,'FILE_REFERENCE_MAPPING_COLLISION');values.set(x,y);}}
 const keys=[...values.keys()].sort((a,b)=>b.length-a.length||a.localeCompare(b));const regex=keys.length?new RegExp(keys.map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g'):null;replacement={values,regex};replacementCache.set(fileMap,replacement);}
 if(replacement.regex)v=v.replace(replacement.regex,x=>replacement.values.get(x));}return v;}
function analyze(root,side,options){
 const state={root,side,files:[],nodes:new Map(),refs:new WeakMap(),maps:new WeakSet(),factories:new WeakMap(),runtimeFactories:new WeakMap(),options,issues:[]};
 const register=(kind,id,body,file)=>{const key=kind+':'+id;let node=state.nodes.get(key);if(!node){node={key,kind,id,bodies:[],files:[]};state.nodes.set(key,node);}if(body)node.bodies.push(body);node.files.push(file);return key;};
 const mark=(n,kind,id,definition=false)=>{need(id!==null,'WEBPACK_ID_SHAPE');const previous=state.refs.get(n);need(!previous||(previous.kind===kind&&previous.id===id),'REFERENCE_NAMESPACE_CONFLICT');state.refs.set(n,{kind,id,definition});};
 for(const p of members(root)){
  need(!options.deadline||Date.now()<options.deadline,'STATIC_ANALYSIS_DEADLINE');
  const relative=path.relative(root,p).split(path.sep).join('/');if(!relative.startsWith('app/.next/'))continue;const bytes=fs.readFileSync(p);let ast;const comments=[];
  try{ast=acorn.parse(bytes.toString('utf8'),{ecmaVersion:'latest',sourceType:'script',onComment:comments});}catch(e){state.issues.push({file:relative,code:'PARSE_REFUSED'});continue;}
  const f={file:relative,sha256:hash(bytes),ast,comments,chunkIds:[],namespace:relative.includes('/static/')?'client':'server'};state.files.push(f);
  const serverOwners=new Map();shellWalk(ast,n=>{if(n.type==='AssignmentExpression'&&n.left.type==='MemberExpression'&&n.left.object.type==='Identifier'){const name=n.left.object.name,key=prop(n.left);if((key==='id'&&plainId(n.right)!==null)||(key==='ids'&&n.right.type==='ArrayExpression'&&n.right.elements.every(x=>plainId(x)!==null))||(key==='modules'&&n.right.type==='ObjectExpression')){if(!serverOwners.has(name))serverOwners.set(name,new Set());serverOwners.get(name).add(key);}}});
  const validOwner=n=>n.left?.object?.type==='Identifier'&&serverOwners.get(n.left.object.name)?.size===3;
  const addModules=(object,namespace)=>{state.maps.add(object);for(const entry of object.properties){need(entry.type==='Property'&&!entry.computed&&entry.kind==='init'&&!entry.method&&!entry.shorthand,'MODULE_DICTIONARY_SHAPE');let id=plainId(entry.key);if(id===null&&entry.key.type==='Identifier'&&/^(0|[1-9][0-9]*)$/.test(entry.key.name))id=entry.key.name;need(id!==null,'MODULE_KEY_SHAPE');const kind=namespace+':module';mark(entry.key,kind,id,true);register(kind,id,entry.value,relative);need(['FunctionExpression','ArrowFunctionExpression'].includes(entry.value.type),'MODULE_FACTORY_REQUIRED');state.factories.set(entry.value,namespace);}};
  shellWalk(ast,n=>{
   if(n.type==='AssignmentExpression'&&prop(n.left)==='modules'&&n.right.type==='ObjectExpression'&&validOwner(n))addModules(n.right,'server');
   if(webpackPush(n)&&n.arguments.length===1&&n.arguments[0].type==='ArrayExpression'){
    const elements=n.arguments[0].elements;if(elements[0]?.type==='ArrayExpression'&&elements[1]?.type==='ObjectExpression'){
     addModules(elements[1],'client');for(const x of elements[0].elements){const id=plainId(x);mark(x,'client:chunk',id,true);register('client:chunk',id,elements[1],relative);f.chunkIds.push('client:chunk:'+id);}if(elements[2]&&['FunctionExpression','ArrowFunctionExpression'].includes(elements[2].type))state.runtimeFactories.set(elements[2],'client');
    }
   }
  });
  // Server chunk ids are recognized only in files with a modules dictionary.
  let serverModules=null,serverOwner=null;shellWalk(ast,n=>{if(n.type==='AssignmentExpression'&&prop(n.left)==='modules'&&n.right.type==='ObjectExpression'&&validOwner(n)){need(serverModules===null,'ONE_SERVER_MODULE_DICTIONARY_PER_FILE');serverModules=n.right;serverOwner=n.left.object.name;}});
  if(serverModules)shellWalk(ast,n=>{if(n.type!=='AssignmentExpression'||n.left.object?.type!=='Identifier'||n.left.object.name!==serverOwner)return;if(prop(n.left)==='ids'&&n.right.type==='ArrayExpression')for(const x of n.right.elements){const id=plainId(x);mark(x,'server:chunk',id,true);register('server:chunk',id,serverModules,relative);f.chunkIds.push('server:chunk:'+id);}else if(prop(n.left)==='id'&&plainId(n.right)!==null)mark(n.right,'server:chunk',plainId(n.right),true);});
  if(relative.endsWith('_client-reference-manifest.js')){
   const fields=o=>{need(o?.type==='ObjectExpression','RSC_OBJECT_REQUIRED');const out=new Map();for(const p of o.properties){need(p.type==='Property'&&!p.computed&&!p.method&&!p.shorthand&&p.kind==='init','RSC_PROPERTY_SHAPE');const key=p.key.type==='Literal'?p.key.value:p.key.type==='Identifier'?p.key.name:null;need(typeof key==='string'&&!out.has(key),'RSC_UNIQUE_STRING_KEY_REQUIRED');out.set(key,p);}return out;};
   const item=(o,namespace)=>{const f=fields(o);need([...f.keys()].sort().join(',')==='async,chunks,id,name','RSC_ITEM_FIELDS');mark(f.get('id').value,namespace+':module',plainId(f.get('id').value));const chunks=f.get('chunks').value;need(chunks.type==='ArrayExpression'&&chunks.elements.length%2===0,'RSC_CHUNK_PAIRS_REQUIRED');for(let i=0;i<chunks.elements.length;i+=2){mark(chunks.elements[i],'client:chunk',plainId(chunks.elements[i]));need(chunks.elements[i+1].type==='Literal'&&typeof chunks.elements[i+1].value==='string','RSC_CHUNK_FILE_REQUIRED');}};
   let assignments=0;walk(ast,n=>{if(n.type==='AssignmentExpression'&&n.left.type==='MemberExpression'&&n.left.object.type==='MemberExpression'&&prop(n.left.object)==='__RSC_MANIFEST'&&n.left.object.object.type==='Identifier'&&n.left.object.object.name==='globalThis'){
    assignments++;const f=fields(n.right);need([...f.keys()].sort().join(',')==='clientModules,edgeRscModuleMapping,edgeSSRModuleMapping,entryCSSFiles,moduleLoading,rscModuleMapping,ssrModuleMapping','RSC_ROOT_FIELDS');
    for(const name of ['ssrModuleMapping','rscModuleMapping']){const table=f.get(name).value;state.maps.add(table);for(const p of table.properties){mark(p.key,'client:module',plainId(p.key));for(const inner of fields(p.value).values())item(inner.value,'server');}}
    for(const name of ['edgeSSRModuleMapping','edgeRscModuleMapping'])need(fields(f.get(name).value).size===0,'RSC_EDGE_MAPPING_REQUIRES_CLASSIFICATION');
    const client=f.get('clientModules').value;state.maps.add(client);for(const p of fields(client).values())item(p.value,'client');state.maps.add(f.get('entryCSSFiles').value);
   }});need(assignments===1,'EXACT_RSC_ASSIGNMENT_REQUIRED');
  }
  function visit(n,aliases=new Set(),namespace=f.namespace,entryAliases=new Set()){
   if(!n||typeof n!=='object')return;
   if(['FunctionExpression','FunctionDeclaration','ArrowFunctionExpression'].includes(n.type)){
    aliases=new Set(aliases);entryAliases=new Set(entryAliases);for(const p of n.params||[])for(const name of bindings(p)){aliases.delete(name);entryAliases.delete(name);}
    if(state.factories.has(n)){namespace=state.factories.get(n);if(n.params[2]){need(n.params[2].type==='Identifier','REQUIRE_PARAMETER_SHAPE');aliases.add(n.params[2].name);}}
    if(state.runtimeFactories.has(n)){namespace=state.runtimeFactories.get(n);need(n.params[0]?.type==='Identifier','RUNTIME_REQUIRE_PARAMETER_SHAPE');aliases.add(n.params[0].name);}
   }
   if(n.type==='BlockStatement'){aliases=new Set(aliases);entryAliases=new Set(entryAliases);for(const x of n.body){if(x.type==='VariableDeclaration'&&['let','const'].includes(x.kind))for(const d of x.declarations)for(const name of bindings(d.id)){aliases.delete(name);entryAliases.delete(name);}if(x.type==='FunctionDeclaration'&&x.id){aliases.delete(x.id.name);entryAliases.delete(x.id.name);}}}
   if(n.type==='CatchClause'){aliases=new Set(aliases);entryAliases=new Set(entryAliases);for(const name of bindings(n.param)){aliases.delete(name);entryAliases.delete(name);}}
   if(n.type==='AssignmentExpression'&&n.left.type==='Identifier'){aliases.delete(n.left.name);entryAliases.delete(n.left.name);}
   if(n.type==='UpdateExpression'&&n.argument.type==='Identifier'){aliases.delete(n.argument.name);entryAliases.delete(n.argument.name);}
   if(n.type==='VariableDeclarator')for(const name of bindings(n.id)){aliases.delete(name);entryAliases.delete(name);}
   if(n.type==='VariableDeclarator'&&n.id.type==='Identifier'&&n.init?.type==='CallExpression'&&n.init.callee.type==='Identifier'&&n.init.callee.name==='require'&&n.init.arguments.length===1&&n.init.arguments[0].type==='Literal'&&typeof n.init.arguments[0].value==='string'&&/(^|\/)webpack-runtime\.js$/.test(n.init.arguments[0].value))aliases.add(n.id.name);
   if(n.type==='VariableDeclarator'&&n.id.type==='Identifier'&&n.init?.type==='ArrowFunctionExpression'&&n.init.params.length===1&&n.init.params[0].type==='Identifier'){
    const body=n.init.body;if(body.type==='CallExpression'&&body.callee.type==='Identifier'&&aliases.has(body.callee.name)&&body.arguments.length===1){const arg=body.arguments[0];if(arg.type==='AssignmentExpression'&&arg.operator==='='&&prop(arg.left)==='s'&&arg.left.object.type==='Identifier'&&arg.left.object.name===body.callee.name&&arg.right.type==='Identifier'&&arg.right.name===n.init.params[0].name)entryAliases.add(n.id.name);}
   }
   const markArgument=(node,kind)=>{const id=plainId(node);if(id!==null)mark(node,namespace+':'+kind,id);};
   if(n.type==='CallExpression'){
    const c=n.callee;
    if(c.type==='Identifier'&&(aliases.has(c.name)||entryAliases.has(c.name))&&n.arguments[0])markArgument(n.arguments[0],'module');
    if(c.type==='MemberExpression'&&c.object.type==='Identifier'&&aliases.has(c.object.name)){
     const method=prop(c);
     if(method==='bind'&&n.arguments[1])markArgument(n.arguments[1],'module');
     if(method==='t'&&n.arguments[0])markArgument(n.arguments[0],'module');
     if(method==='e'&&n.arguments[0])markArgument(n.arguments[0],'chunk');
     if(['O','X'].includes(method)&&n.arguments[1]?.type==='ArrayExpression')for(const x of n.arguments[1].elements)markArgument(x,'chunk');
    }
    if(prop(c)==='bind'&&c.object.type==='MemberExpression'&&prop(c.object)==='t'&&c.object.object.type==='Identifier'&&aliases.has(c.object.object.name)&&n.arguments[1])markArgument(n.arguments[1],'module');
   }
   if(n.type==='AssignmentExpression'&&prop(n.left)==='s'&&n.left.object.type==='Identifier'&&aliases.has(n.left.object.name))markArgument(n.right,'module');
   for(const [k,v]of Object.entries(n)){if(['start','end','raw','params'].includes(k))continue;if(Array.isArray(v)){for(const item of v)visit(item,aliases,namespace,entryAliases);}else if(v&&typeof v==='object')visit(v,aliases,namespace,entryAliases);}
  }
  visit(ast);
 }
 return state;
}
function canonical(value,state,refValue,fileMap,definitionValue=true){
 if(value===null)return null;if(typeof value==='string')return stringNormalize(value,state.side,state.options,fileMap);if(Array.isArray(value))return value.map(x=>canonical(x,state,refValue,fileMap,definitionValue));if(typeof value!=='object')return value;
 const mark=state.refs.get(value);if(mark){const key=mark.kind+':'+mark.id;return {$webpackReference:mark.kind,value:refValue(key,mark)};}
 const result={};for(const [k,v]of Object.entries(value))if(!['start','end','loc'].includes(k)&&!(k==='raw'&&value.type==='Literal'))result[k]=canonical(v,state,refValue,fileMap,definitionValue);
 // Only recognized webpack module lookup tables are order-insensitive here.
 if(state.maps.has(value))result.properties.sort((a,b)=>encoded(a.key).localeCompare(encoded(b.key)));
 return result;
}
function signatures(a,b){
 const states=[a,b];let colors=states.map(s=>new Map([...s.nodes].map(([key,n])=>[key,n.kind])));
 const skeletons=states.map(s=>new Map([...s.nodes].map(([key,n])=>{const unique=new Map();for(const x of n.bodies){
  if(n.kind.endsWith(':chunk')){need(s.maps.has(x),'CHUNK_MODULE_DICTIONARY_REQUIRED');const refs=x.properties.map(p=>{const r=s.refs.get(p.key);need(r&&r.definition,'CHUNK_MODULE_ID_REQUIRED');return r.kind+':'+r.id;});const item={shape:'CHUNK_MODULE_MULTISET',refs};unique.set(encoded(item),item);continue;}
  const refs=[];const fixed=encoded(canonical(x,s,(k,m)=>{if(m.definition)return 'DEFINED';refs.push(k);return 'REFERENCE_SLOT';}));const item={shape:hash(fixed),refs};unique.set(encoded(item),item);
 }return [key,[...unique.values()].sort((x,y)=>encoded(x).localeCompare(encoded(y)))];})));
 const body=(s,n,c,si)=>encoded([n.kind,skeletons[si].get(n.key).map(x=>[x.shape,x.shape==='CHUNK_MODULE_MULTISET'?x.refs.map(key=>c.get(key)||'EXTERNAL:'+key).sort():x.refs.map(key=>c.get(key)||'EXTERNAL:'+key)])]);
 for(let round=0;round<32;round++){
  need(!a.options.deadline||Date.now()<a.options.deadline,'STATIC_ANALYSIS_DEADLINE');
  const signatures=states.map((s,si)=>new Map([...s.nodes].map(([k,n])=>[k,body(s,n,colors[si],si)])));
  const all=[...new Set(signatures.flatMap(x=>[...x.values()]))].sort();const names=new Map(all.map((x,i)=>[x,'c'+i]));const next=signatures.map(x=>new Map([...x].map(([k,v])=>[k,names.get(v)])));
  if(round>0&&next.every((m,i)=>[...m].every(([k,v])=>colors[i].get(k)===v))){colors=next;break;}colors=next;
 }
 return colors;
}
function mapping(a,b){
 const colors=signatures(a,b),groups=[new Map(),new Map()],states=[a,b];
 const paths=states.map(s=>new Set(s.files.map(f=>logicalPath(f.file,s))));const common=new Set([...paths[0]].filter(x=>paths[1].has(x)));
 for(let i=0;i<2;i++)for(const [key,color]of colors[i]){const s=states[i],locations=[...new Set(s.nodes.get(key).files.map(f=>logicalPath(f,s)).filter(f=>common.has(f)))].sort();const anchored=encoded([color,locations]);if(!groups[i].has(anchored))groups[i].set(anchored,[]);groups[i].get(anchored).push(key);}
 const map=new Map(),ambiguous=[];
 for(const [color,old]of groups[0]){
  const next=groups[1].get(color)||[];if(old.length!==next.length)throw new Refusal('GRAPH_COLOR_CARDINALITY',{old:old.slice(0,32).map(key=>({key,files:[...new Set(a.nodes.get(key).files)].slice(0,4)})),new:next.slice(0,32).map(key=>({key,files:[...new Set(b.nodes.get(key).files)].slice(0,4)})),oldCount:old.length,newCount:next.length});const unused=new Set(next);
  for(const key of old)if(unused.has(key)){map.set(key,key);unused.delete(key);}
  const left=old.filter(k=>!map.has(k));if(left.length>1)ambiguous.push({color,old:left,new:[...unused]});
  const sorted=[...unused].sort();left.sort().forEach((k,i)=>map.set(k,sorted[i]));
 }
 need(map.size===a.nodes.size&&new Set(map.values()).size===b.nodes.size,'GLOBAL_BIJECTION_REQUIRED');
 return {map,ambiguous,colors};
}
function logicalPath(p,state){const id=state?.options[state.side+'BuildId'];return (id?p.split('/'+id+'/').join('/<BUILD_ID>/'):p).replace(/-[a-f0-9]{16}(?=\.js$)/,'-<CONTENT_HASH>');}
function pairFiles(a,b,map){
 const pairs=new Map(),remaining=new Map(b.files.map(f=>[f.file,f]));
 for(const f of a.files){if(remaining.has(f.file)){pairs.set(f.file,f.file);remaining.delete(f.file);}}
 for(const f of a.files.filter(f=>!pairs.has(f.file))){
  let candidates=[...remaining.values()].filter(g=>logicalPath(g.file,b)===logicalPath(f.file,a));
  if(candidates.length!==1&&f.chunkIds.length){const ids=f.chunkIds.map(x=>map.get(x)||x).sort();candidates=[...remaining.values()].filter(g=>encoded([...g.chunkIds].sort())===encoded(ids));}
  if(candidates.length!==1)throw new Refusal('FILE_PAIRING_AMBIGUOUS',{oldFile:f.file,oldChunks:f.chunkIds,mappedChunks:f.chunkIds.map(x=>map.get(x)||x),candidates:candidates.map(x=>x.file).slice(0,16)});pairs.set(f.file,candidates[0].file);remaining.delete(candidates[0].file);
 }
 need(remaining.size===0,'UNPAIRED_JS_FILES');return pairs;
}
function compare(options){
 options={...options,deadline:Date.now()+180000};
 const a=analyze(options.old,'old',options),b=analyze(options.new,'new',options);
 const result={schema:'work8-v84-q05-webpack-graph-proof-v1',status:'FAIL_CLOSED_UNPROVEN',scope:'Every .js file beneath app/.next; app/server.js and all other package members require separate classification.',applicationExecuted:false,packageEquivalenceApproved:false,oldRootSHA256:hash(options.old),newRootSHA256:hash(options.new),analyzerSHA256:ANALYZER_SHA256,parserSHA256:hash(fs.readFileSync(require.resolve('../../continuation/v75/review/frontend-semantics/acorn.js'))),normalization:['AST source positions and raw literal spelling only','Exact supplied source roots, encoded source roots and BUILD_ID strings','Recognized webpack module/chunk definitions, require/bind/entry aliases and typed RSC references under one global bijection','Order of properties in recognized webpack module and typed RSC lookup dictionaries','Known generated file and URI-encoded references under one exact file bijection'],limits:{maximumJsFiles:4096,maximumJsBytes:512*1024*1024,maximumFileBytes:16*1024*1024,maximumSeconds:180},files:{old:a.files.length,new:b.files.length},issues:[...a.issues,...b.issues],modulesAndChunks:{old:a.nodes.size,new:b.nodes.size}};
 try{
  need(!result.issues.length,'UNPARSED_JS_FILES');need(a.files.length===b.files.length,'JS_FILE_COUNT');const m=mapping(a,b);result.mapping=[...m.map].map(([old,next])=>({old,new:next}));const fileMap=pairFiles(a,b,m.map);const lookup=new Map(b.files.map(f=>[f.file,f]));const failures=[],checks=[];
  const ref=(side)=>(key,mark)=>{const target=side==='old'?m.map.get(key)||key:key;return target;};
  for(const f of a.files){need(Date.now()<options.deadline,'STATIC_ANALYSIS_DEADLINE');const g=lookup.get(fileMap.get(f.file));const x=encoded(canonical({ast:f.ast,comments:f.comments},a,ref('old'),fileMap)),y=encoded(canonical({ast:g.ast,comments:g.comments},b,ref('new'),null));const equal=x===y;checks.push({oldPath:f.file,newPath:g.file,oldSHA256:f.sha256,newSHA256:g.sha256,normalizedOldSHA256:hash(x),normalizedNewSHA256:hash(y),equal});if(!equal)failures.push({old:f.file,new:g.file,code:'WHOLE_FILE_AST_DIFFERENT'});}
  result.mapping=[...m.map].map(([old,next])=>({old,new:next}));result.duplicateColorGroups=m.ambiguous;result.filePairs=checks;result.failures=failures;result.globallyConsistentBijection=true;result.wholeFileASTEquality=failures.length===0;result.graphIsomorphismProved=failures.length===0;result.status=failures.length?'FAIL_CLOSED_UNCLASSIFIED_JS':'PASS_GLOBAL_JS_GRAPH_AND_FULL_AST';
 }catch(e){if(!(e instanceof Refusal))throw e;result.failure=e.code;if(e.details)result.failureDetails=e.details;}
 return result;
}
module.exports={compare,analyze,mapping,pairFiles,canonical,Refusal};
if(require.main===module){const values={};for(let i=2;i<process.argv.length;i+=2){need(process.argv[i]?.startsWith('--')&&process.argv[i+1],'ARGUMENTS_REQUIRED');const k=process.argv[i].slice(2).replace(/-([a-z])/g,(_,c)=>c.toUpperCase());values[k]=process.argv[i+1];}need(values.old&&values.new&&values.output,'PATHS_REQUIRED');for(const k of ['old','new'])values[k]=path.resolve(values[k]);const result=compare(values);fs.writeFileSync(values.output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,files:result.files,failure:result.failure,failures:result.failures?.length,graphIsomorphismProved:result.graphIsomorphismProved}));process.exitCode=result.status.startsWith('PASS_')?0:2;}

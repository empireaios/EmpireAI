import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';import {build} from 'esbuild';import {createElement} from 'react';import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
const compiled=await build({entryPoints:[new URL('../../components/owner/work8/TwinWorkspace.tsx',import.meta.url).pathname],bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime','next/*'],plugins:[{name:'css-for-ssr',setup(b){b.onLoad({filter:/\.css$/},()=>({contents:'export default {}',loader:'js'}));}}]});
const m={exports:{}};new Function('require','module','exports',compiled.outputFiles[0].text)(require,m,m.exports);
const evidence=JSON.parse(fs.readFileSync(new URL('./twin-vertical-readback.json',import.meta.url),'utf8'));
test('seven existing Console destinations render the same actual service-generated twin session and business identities',()=>{
 assert.equal(evidence.classification,'LABELLED_FIXTURE_EXAMINATION');assert.equal(evidence.view.records.length,3);
 for(const path of ['/cockpit','/cockpit/eyes','/cockpit/products','/cockpit/listings','/cockpit/orders','/cockpit/finance','/cockpit/assurance']){
  const html=renderToStaticMarkup(createElement(m.exports.TwinView,{path,data:evidence.view}));
  assert.match(html,/data-twin-session="exam"/);assert.match(html,/DIGITAL TWIN \/ SIMULATED/);assert.match(html,/NOT_BORN/);
  if(path!=='/cockpit/assurance')for(const r of evidence.view.records)assert.ok(html.includes(r.missionId),path+' canonical mission missing');
  if(path==='/cockpit/finance'){assert.match(html,/80\.00 SGD/);assert.match(html,/16\.00 SGD/);assert.match(html,/Verified for this simulated order/);}
  if(path==='/cockpit/assurance'){assert.match(html,/ASSURANCE_DETECTED/);assert.match(html,/ASSURANCE_RECOVERED/);}
 }
});

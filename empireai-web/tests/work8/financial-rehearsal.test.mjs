import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';import {build} from 'esbuild';import {createElement} from 'react';import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url),compiled=await build({entryPoints:[new URL('../../components/owner/work8/FinancialRehearsal.tsx',import.meta.url).pathname],bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime'],plugins:[{name:'css-for-ssr',setup(b){b.onLoad({filter:/\.css$/},()=>({contents:'export default {}',loader:'js'}));}}]});
const m={exports:{}};new Function('require','module','exports',compiled.outputFiles[0].text)(require,m,m.exports);
test('actual financial service projection renders period identity, aggregate stages, unknown fee and no live activation',()=>{
 const evidence=JSON.parse(fs.readFileSync(new URL('./financial-rehearsal-readback.json',import.meta.url),'utf8'));
 const html=renderToStaticMarkup(createElement(m.exports.FinancialRehearsal,{value:evidence.value,busy:false,submit:async()=>null}));
 assert.match(html,/isolated-ui-exam/);assert.match(html,/0\.140116843823/);assert.match(html,/19\.933990200364/);assert.match(html,/Fixed fee: (?:<!-- -->)?Unknown/);assert.match(html,/do not confirm invoice payment/);assert.match(html,/Revenue and expenses begin at zero/);
 assert.equal(evidence.productionWrites,0);assert.equal(evidence.value.birth.liveActivation,false);
});

test('authorised Railway account readback renders separately from actual charges',()=>{
 const evidence=JSON.parse(fs.readFileSync(new URL('./railway-rehearsal-readback.json',import.meta.url),'utf8'));
 const html=renderToStaticMarkup(createElement(m.exports.FinancialRehearsal,{value:evidence.value,busy:false,submit:async()=>null}));
 assert.match(html,/Pro/);assert.match(html,/3\.63/);assert.match(html,/43\.78/);assert.match(html,/unverified/i);assert.match(html,/production/i);
 assert.equal(evidence.productionWrites,0);
});

import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {chromium} from 'playwright';
const require=createRequire(import.meta.url);
const out=new URL('../../../docs/work8/',import.meta.url);
await fs.mkdir(out,{recursive:true});
const compiled=await build({entryPoints:[new URL('../../components/owner/work7/SimulatedFinancials.tsx',import.meta.url).pathname],bundle:true,write:false,outfile:'preview.cjs',platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime']});
const module={exports:{}};new Function('require','module','exports',compiled.outputFiles.find(x=>x.path.endsWith('.cjs')).text)(require,module,module.exports);
const data=JSON.parse(await fs.readFile(new URL('./simulated-financial-readback.json',import.meta.url),'utf8'));
const body=renderToStaticMarkup(createElement(module.exports.SimulatedFinancials,{value:data}));
const css=compiled.outputFiles.find(x=>x.path.endsWith('.css')).text;
const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:16px;font-family:Arial,sans-serif;background:#f6fbff;color:#294363}*{box-sizing:border-box}button{min-height:44px}h1{font-size:20px} ${css}</style></head><body><h1>Local simulated-finance component check</h1><p>Not authenticated production acceptance · canonical synthetic readback</p><main class="journeys_page">${body}</main></body></html>`;
const browser=await chromium.launch({headless:true,...(process.env.WORK8_CHROMIUM_PATH?{executablePath:process.env.WORK8_CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const results=[];
for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
 const page=await browser.newPage({viewport:{width,height}});let attemptedRequests=0;await page.route('**/*',route=>{attemptedRequests++;return route.abort();});await page.setContent(html);await page.screenshot({path:new URL(`finance-${name}.png`,out).pathname,fullPage:true});const layout=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,imageCount:document.images.length,visibleDialogs:[...document.querySelectorAll('dialog')].filter(d=>d.open).length,rows:document.querySelectorAll('tbody tr').length}));results.push({name,...layout,attemptedRequests,pass:layout.scrollWidth<=width&&layout.imageCount===0&&layout.visibleDialogs===0&&layout.rows===1&&attemptedRequests===0});await page.close();
}
await browser.close();await fs.writeFile(new URL('finance-local-visual-qa.json',out),JSON.stringify({kind:'LOCAL_CANONICAL_SIMULATED_FINANCE_COMPONENT_ONLY',productionAcceptance:false,results},null,2));if(results.some(r=>!r.pass))throw Error('VISUAL_LAYOUT_INVARIANT');console.log(JSON.stringify(results));

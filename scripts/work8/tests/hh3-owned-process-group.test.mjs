import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../hh3-owned-process-group.mjs',import.meta.url),'utf8');
async function fixture(rows,{survive=false}={}){
 const calls=[];const context=vm.createContext({setTimeout,Date,process:{pid:10,kill:(pid,signal)=>{calls.push({pid,signal});if(!survive)for(const row of rows.values())if(row.group===-pid)row.state='Z';}}});
 const mockFs={readdirSync:()=>[...rows.keys()].map(String),readFileSync:p=>{const pid=Number(p.split('/')[2]),r=rows.get(pid);if(!r)throw Object.assign(Error('gone'),{code:'ENOENT'});const f=Array(20).fill('0');f[0]=r.state??'S';f[2]=String(r.group);f[3]=String(r.session??r.group);f[19]=String(r.start);return `${pid} (test) ${f.join(' ')}`;}};
 const module=new vm.SourceTextModule(source,{context});
 await module.link(async id=>{const x=new vm.SyntheticModule(['default'],function(){this.setExport('default',id==='node:fs'?mockFs:assert);},{context});return x;});await module.evaluate();return {...module.namespace,calls};
}
const base=()=>new Map([[10,{group:10,start:1}],[20,{group:20,start:2}],[21,{group:20,start:3}],[30,{group:30,start:4}]]);
{
 const rows=base(),m=await fixture(rows),owner=m.ownProcessGroup({pid:20});rows.delete(20);const result=await m.terminateOwnedProcessGroup(owner);assert.equal(result.remainingLive,0);assert.equal(m.calls[0].pid,-20);assert.equal(rows.get(21).state,'Z');assert.equal(rows.get(30).state,undefined);
}
{
 const rows=base(),m=await fixture(rows),owner=m.ownProcessGroup({pid:20});rows.get(20).start=99;await assert.rejects(m.terminateOwnedProcessGroup(owner),/PID reused/);assert.equal(m.calls.length,0);
}
{
 const rows=base(),m=await fixture(rows);assert.throws(()=>m.ownProcessGroup({pid:10}),/outside owned group/);assert.equal(m.calls.length,0);
}
{
 const rows=base(),m=await fixture(rows,{survive:true}),owner=m.ownProcessGroup({pid:20});await assert.rejects(m.terminateOwnedProcessGroup(owner,{timeoutMs:0}),/failed termination/);
}
console.log(JSON.stringify({pass:true,checks:4,scope:'Exact helper with mocked proc identity and signal boundaries; not actual hosted process proof',checksPassed:['leader absent orphan group killed; unrelated group untouched','PID reuse no signal','controller group no authority','live survivor bounded failure']}));

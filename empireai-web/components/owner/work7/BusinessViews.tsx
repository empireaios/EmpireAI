'use client';
import {useEffect,useState,type ReactNode} from 'react';
import Link from 'next/link';
import {FinancialCentre} from '../FinancialCentre';
import {actualCosts,object,records,text,sgd,sourceMoney,plainStatus,operationalAmounts,periodBounds,inBillingPeriod,providerAmounts,sumKnown,type BusinessRow} from '@/lib/owner/business-view';
import s from './business.module.css';

export function useBusinessRead(url:string) {
 const [result,setResult]=useState<{url:string;data:BusinessRow|null;error:string}>({url:'',data:null,error:''});
 const [attempt,setAttempt]=useState(0);
 useEffect(()=>{const c=new AbortController();fetch(url,{credentials:'include',cache:'no-store',signal:c.signal}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||'Records unavailable');return d;}).then(data=>setResult({url,data,error:''})).catch(e=>{if(!c.signal.aborted)setResult({url,data:null,error:e.message});});return()=>c.abort();},[url,attempt]);
 return {data:result.url===url?result.data:null,error:result.url===url?result.error:'',retry:()=>setAttempt(n=>n+1)};
}
export function BusinessStatus({data,error,retry}:ReturnType<typeof useBusinessRead>){return error?<p role="alert">{error} <button onClick={retry}>Retry evidence</button></p>:!data?<p role="status">Loading records…</p>:null;}
export function BusinessPage({title,note,children}:{title:string;note:string;children:ReactNode}){return <section className={s.page}><header><p className={s.eyebrow}>EMPIREAI</p><h1>{title}</h1><p>{note}</p></header>{children}</section>;}
export function Audit({value,label='Audit details'}:{value:unknown;label?:string}){return <details className={s.audit}><summary>{label}</summary><pre>{JSON.stringify(value,null,2)}</pre></details>;}
export function Pager({page,total,setPage}:{page:number;total:number;setPage:(n:number)=>void}){return <nav aria-label="Results pages" className={s.toolbar}><button disabled={page<=1} onClick={()=>setPage(page-1)}>Previous</button><span role="status">{total ? (page-1)*10+1 : 0}–{Math.min(page*10,total)} of {total}</span><button disabled={page*10>=total} onClick={()=>setPage(page+1)}>Next</button></nav>;}

function Period({period,setPeriod,from,setFrom,to,setTo}:{period:string;setPeriod:(s:string)=>void;from:string;setFrom:(s:string)=>void;to:string;setTo:(s:string)=>void}){return <div className={s.toolbar}><label>Period<select aria-label="Period" value={period} onChange={e=>setPeriod(e.target.value)}>{['MTD','YTD','All history','Custom'].map(p=><option key={p}>{p}</option>)}</select></label>{period==='Custom'&&<><label>From<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>Through<input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label></>}</div>;}

export function FinanceView({infrastructure=false,initialOrder=''}:{infrastructure?:boolean;initialOrder?:string}) {
 const state=useBusinessRead('/api/owner/finance');
 const [period,setPeriod]=useState('MTD'),[from,setFrom]=useState(''),[to,setTo]=useState(''),[provider,setProvider]=useState(''),[controls,setControls]=useState(false),[page,setPage]=useState(1),[order,setOrder]=useState(initialOrder);
 const [now]=useState(()=>new Date());
 const bounds=periodBounds(period,now,from,to),valid=period!=='Custom'||Boolean(from&&to&&from<=to);
 const all=actualCosts(state.data?.costs),filtered=valid?all.filter(c=>inBillingPeriod(c,bounds)):[],amounts=operationalAmounts(order?filtered.filter(c=>object(object(c.data).attribution).orderId===order):filtered);
 const providers=records(state.data?.providers).filter(p=>!provider||p.id===provider);
 const mtd=periodBounds('MTD',now),ytd=periodBounds('YTD',now);
 const entries=amounts.entries,visible=entries.slice((page-1)*10,page*10);
 return <BusinessPage title={infrastructure?'Live Cost Centre':'Operational Finance'} note={infrastructure?'Infrastructure and subscriptions that maintain EmpireAI.':'Revenue − direct product and fulfilment costs = operational profit.'}>
 <Period {...{period,from,to,setFrom,setTo}} setPeriod={p=>{setPeriod(p);setPage(1);}}/>
 {!valid&&<p role="status">Choose a valid start and end date.</p>}
 {!infrastructure&&<label>Order reference<input value={order} onChange={e=>{setOrder(e.target.value);setPage(1);}} placeholder="All orders"/></label>}<BusinessStatus {...state}/>
 {state.data&&valid&&<>
 {infrastructure?<>
 <label>Provider<select aria-label="Provider" value={provider} onChange={e=>setProvider(e.target.value)}><option value="">All providers</option>{records(state.data.providers).map(p=><option key={text(p.id)} value={text(p.id)}>{text(p.name)}</option>)}</select></label>
 <div className={s.tableScroll} tabIndex={0} role="region" aria-label="Infrastructure expenses"><table><thead><tr>{['Provider / service','MTD · SGD','YTD · SGD',period+' · SGD','Billing status','Next bill / exception'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{providers.map(p=>{const id=text(p.id),v=providerAmounts(all,id,bounds),monthly=providerAmounts(all,id,mtd),yearly=providerAmounts(all,id,ytd);const dates=v.entries.map(c=>text(object(c.data).renewalDate,'')).filter(d=>d>=now.toISOString()).sort();return <tr key={id}><th scope="row">{text(p.name)}<small>{[...new Set(v.entries.map(c=>text(object(c.data).service)))].join(', ')||'No bills recorded'}</small></th><td>{sgd(monthly.amount)}</td><td>{sgd(yearly.amount)}</td><td>{sgd(v.amount)}</td><td>{v.stages}{v.entries.filter(c=>!['INVOICED','SETTLED'].includes(text(object(c.data).stage))).map(c=><small key={text(c.id)}>{plainStatus(object(c.data).stage)}: {sourceMoney(c.originalMicro??object(c.data).amountMicro,object(c.data).currency)}{object(object(c.data).attribution).project==='TEAM_SHARED_UNALLOCATED'?' · Shared team usage; EmpireAI share unknown':''}</small>)}<small>{p.commissioned==='NO'?'Not commissioned':p.commissioned==='UNKNOWN'?'Connection not confirmed':''}</small></td><td>{dates[0]||'Next bill unknown'}{v.entries.some(c=>c.sgdMicro===null)&&<p role="alert">Currency conversion missing</p>}{v.entries.some(c=>c.stale||c.fxStale)&&<p role="alert">Billing evidence needs review</p>}<Audit value={v.entries} label={'Bills and usage · '+text(p.name)}/></td></tr>;})}</tbody></table></div>
 <p><strong>Confirmed infrastructure charges · {period}: {sgd(sumKnown(filtered.filter(c=>object(c.data).category==='TECHNOLOGY'&&(!provider||object(c.data).provider===provider)&&['INVOICED','SETTLED'].includes(text(object(c.data).stage)))))}</strong></p><p className={s.note}>Confirmed columns include reviewed invoices and settled charges only. Estimates, unpaid commitments and unbilled usage remain separate in each provider’s details. Missing bills are not zero spend.</p>
 </>:<>
 <div className={s.metrics}>{[['Revenue',amounts.revenue],['Direct product & fulfilment costs',amounts.costs],['Operational profit',amounts.profit]].map(([label,v])=><article key={String(label)}><h2>{label}</h2><strong>{sgd(v)}</strong></article>)}</div>
 <p className={s.note}>SGD · recorded invoices and settled entries, not necessarily cash received. Profit covers only direct costs shown here; infrastructure is excluded. Coverage is incomplete until all related costs are reconciled.</p>
 {!entries.length?<p className={s.empty}>No verified operational amounts in this period. Commerce remains locked.</p>:<><div className={s.tableScroll} tabIndex={0} role="region" aria-label="Order and product economics"><table><thead><tr>{['Order / product','Marketplace','Category','Amount · SGD','Status','Details'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{visible.map(c=>{const d=object(c.data),a=object(d.attribution);return <tr key={text(c.id)}><td>{text(a.orderId)}<small>{text(a.productId)}</small></td><td>{text(a.channel)}</td><td>{plainStatus(d.category)}</td><td>{sgd(c.sgdMicro)}</td><td>{plainStatus(d.stage)}{c.stale||c.fxStale?<p role="alert">Evidence needs review</p>:null}</td><td><Audit value={c}/>{a.orderId?<Link href={'/cockpit/orders?order='+encodeURIComponent(text(a.orderId))}>Inspect order</Link>:null}</td></tr>;})}</tbody></table></div><Pager page={Math.min(page,Math.max(1,Math.ceil(entries.length/10)))} total={entries.length} setPage={setPage}/></>}
 <details><summary>Commitments, settlements and forecast amounts</summary><p>These amounts are excluded from the recorded profit above.</p><Audit value={filtered.filter(c=>!['TECHNOLOGY','CAPITAL'].includes(text(object(c.data).category))&&!entries.includes(c))}/></details>
 </>}
 {records(state.data.alerts).length>0&&<details open><summary>Financial exceptions · {records(state.data.alerts).length}</summary><ul>{records(state.data.alerts).map((a,i)=><li key={i}>{text(a.detail)}</li>)}</ul></details>}
 <details><summary>Calculation and coverage</summary><p>Periods use Singapore time. Overlapping billing periods are included in full, without daily proration. Reviewed replacement lineage is resolved by the financial service. Unknown exchange rates are never converted to zero.</p><Audit value={{scope:bounds,kpis:state.data.kpis,entryDigest:state.data.entryDigest,accounting:state.data.accounting}}/></details>
 </>}
 <button aria-expanded={controls} onClick={()=>setControls(!controls)}>{controls?'Close':'Open'} financial controls &amp; full ledger</button>
 {controls&&<div className={s.legacy}><FinancialCentre/></div>}
 </BusinessPage>;
}

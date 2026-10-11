'use client';
import {useState} from 'react';
import {TechnicalEvidence} from '../work7/TechnicalEvidence';
type Row=Record<string,unknown>;
const row=(v:unknown):Row=>v&&typeof v==='object'&&!Array.isArray(v)?v as Row:{};
const rows=(v:unknown):Row[]=>Array.isArray(v)?v.map(row):[];
const text=(v:unknown)=>v===null||v===undefined?'Unknown':String(v);
const money=(v:unknown,currency:unknown)=>typeof v==='number'?`${(v/1e6).toFixed(6).replace(/0+$/,'').replace(/\.$/,'')} ${text(currency)}`:'Unknown';
const field='mt-1 min-h-11 w-full rounded border border-white/25 bg-slate-950 p-2';
export function FinancialRehearsal({value,busy,submit}:{value:unknown;busy:boolean;submit:(v:unknown)=>Promise<unknown>}){
 const [cutoff,setCutoff]=useState(''),[period,setPeriod]=useState(''),[confirmed,setConfirmed]=useState(false),[error,setError]=useState('');
 const data=row(value),birth=row(data.birth),costs=row(data.costs),config=row(birth.config);
 return <section className="space-y-4" aria-label="Financial launch rehearsal"><h2 className="text-xl font-semibold">Financial launch rehearsal</h2>
 <p>Rehearse a new reporting period in isolation. Historical records and real balances remain preserved. Live activation belongs to the separately approved launch.</p>
 {!data.birth?<form className="space-y-3" onSubmit={e=>{e.preventDefault();const d=new Date(cutoff);if(!/^\d{4}-\d{2}-\d{2}T.*Z$/.test(cutoff)||!Number.isFinite(d.getTime())){setError('Enter a valid UTC timestamp.');return;}setError('');void submit({type:'work8_birth_rehearsal',periodId:period,cutoff:d.toISOString(),confirmation:'ISOLATED_ONLY'});}}>
 <label className="block">Rehearsal period name<input className={field} required pattern="[A-Za-z0-9_.:-]+" maxLength={120} value={period} onChange={e=>setPeriod(e.target.value)}/></label>
 <label className="block">Cutover time in UTC<input className={field} required placeholder="2026-10-11T08:00:00Z" value={cutoff} onChange={e=>setCutoff(e.target.value)}/></label>
 <label className="flex items-center gap-3"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>Create an isolated rehearsal only.</label>
 <button className="min-h-11 rounded border border-amber-300/50 px-4 py-2" disabled={busy||!confirmed}>Prepare rehearsal period</button>{error?<p role="alert">{error}</p>:null}</form>:<>
 <p>Period: {text(config.periodId)} · Cutover: {text(config.cutoff)} · Isolated rehearsal</p>
 <p>Pre-launch archive: {rows(row(birth.archive).entries).length} preserved records. Allocation conservation: {birth.conservation===true?'Verified for these records':'Unverified'}.</p>
 <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption>Original currency, separated by financial stage and category</caption><thead><tr><th>Currency / stage / category</th><th>Pre-launch</th><th>New period</th><th>Future service</th></tr></thead><tbody>{Object.entries(row(birth.totals)).map(([key,v])=><tr key={key}><th>{key}</th><td>{money(row(v).archiveMicro,key.split(':')[0])}</td><td>{money(row(v).liveMicro,key.split(':')[0])}</td><td>{money(row(v).futureMicro,key.split(':')[0])}</td></tr>)}</tbody></table></div>
 {Object.keys(row(birth.totals)).length===0?<p>No financial entries in this isolated period. Revenue and expenses begin at zero; this does not reset real obligations.</p>:null}
 <TechnicalEvidence label="Preserved opening position and period evidence" value={birth}/></>}
 <h3 className="text-lg font-semibold">Cost discovery</h3><p>Provider evidence stays separate by currency and stage. Unreviewed discoveries are not confirmed financial actuals.</p>
 {!data.costs?<p>No discovery examination has been recorded for this workspace. Provider charges remain unknown.</p>:<>
 <div className="grid gap-3 sm:grid-cols-2">{rows(costs.resources).map(r=><article className="rounded border border-white/20 p-3" key={text(r.provider)+text(r.id)}><h4>{text(r.provider)} · {text(r.service)}</h4><p>{text(r.state)} · Billing owner: {text(r.billingOwner)}</p><p>Fixed fee: {money(r.fixedAmountMicro,r.currency)}</p><p>Renewal: {text(r.renewalAt)}</p><p>Cancellation: {text(r.cancellationTerms)}</p></article>)}</div>
 {rows(costs.providerSummaries).map((r,i)=><article key={i}><h4>{text(r.provider)} billing readback</h4><p>Billed: {text(r.billed)} {text(r.currency)} · Effective cost: {text(r.effective)} {text(r.currency)}</p><p>{text(r.periodStart)} through {text(r.periodEnd)}. These aggregates do not confirm invoice payment.</p></article>)}
 {Object.entries(row(costs.totalsByCurrencyStageAuthenticity)).map(([key,v])=><p key={key}>{key.replaceAll(':',' · ')}: {money(v,key.split(':')[0])} · Unreviewed evidence</p>)}
 <ul>{rows(costs.alerts).map((a,i)=><li key={i}>{text(a.provider)}: {text(a.code).replaceAll('_',' ')}</li>)}</ul><TechnicalEvidence label="Costs by stage and evidence identity" value={costs}/></>}
 </section>;
}

'use client';
import {useState} from 'react';
import Link from 'next/link';
import {useBusinessRead,BusinessStatus,Audit,Pager} from './BusinessViews';
import {object,records,text,plainStatus,evidenceMatches} from '@/lib/owner/business-view';
import {intelligencePeriod,findingGroups,findingName,findingFacts,linkedOpportunities,evidenceGaps} from '@/lib/owner/intelligence-view';
import {recommendationHeadline} from '@/lib/owner/presentation';
import {ownerLabel} from '@/lib/owner/executive-presentation';
import s from './business.module.css';
export function IntelligenceTrace({evidence,opportunities}:{evidence:Record<string,unknown>[];opportunities:Record<string,unknown>[]}) {
 const executive=useBusinessRead('/api/owner/advisor/executive');
 const [range,setRange]=useState('7'),[eye,setEye]=useState('ALL'),[page,setPage]=useState(1),[selected,setSelected]=useState('');
 const [now]=useState(()=>Date.now());const bounds=intelligencePeriod(range,now);
 const inEye=evidence.filter(e=>eye==='ALL'||e.eye===eye);
 const shown=inEye.filter(e=>{const at=Date.parse(text(e.observedAt));return Number.isFinite(at)&&at>=bounds.start&&at<=bounds.end;});
 const previous=inEye.filter(e=>{const at=Date.parse(text(e.observedAt));return at>=bounds.previousStart&&at<bounds.start;});
 const decisions=records(executive.data?.recommendations);
 const groups=findingGroups(shown).sort((a,b)=>Number(evidenceGaps(linkedOpportunities(b,opportunities)).length>0)-Number(evidenceGaps(linkedOpportunities(a,opportunities)).length>0)||(Date.parse(text(b[0].observedAt))||0)-(Date.parse(text(a[0].observedAt))||0));
 const assessed=groups.filter(g=>decisions.some(r=>g.some(e=>evidenceMatches(e,r)))).length;
 const currentPage=Math.min(page,Math.max(1,Math.ceil(groups.length/10)));
 return <section className={s.page} aria-label="Intelligence to action">
 <div className={s.toolbar}><label>Discovery period<select value={range} onChange={e=>{setRange(e.target.value);setPage(1);setSelected('');}}>{[['1','Today'],['7','7 days'],['30','30 days'],['90','Quarter to date'],['365','Year to date'],['all','All loaded findings']].map(([v,n])=><option key={v} value={v}>{n}</option>)}</select></label><label>Intelligence eye<select value={eye} onChange={e=>{setEye(e.target.value);setPage(1);setSelected('');}}>{['ALL','MARKET','SUPPLIER','INTERNET','EMPIRE'].map(v=><option key={v} value={v}>{ownerLabel(v)}</option>)}</select></label></div>
 <div className={s.metrics}><article><h2>Discoveries to review</h2><strong>{groups.length}</strong><small>{shown.length} observations</small></article><article><h2>Linked Pillow assessments</h2><strong>{assessed}</strong><small>For these findings</small></article><article><h2>Change in observations</h2><strong>{range==='all'?'—':`${shown.length-previous.length>=0?'+':''}${shown.length-previous.length}`}</strong><small>Loaded records, preceding period</small></article></div>
 <BusinessStatus {...executive}/>
 {!shown.length?<p className={s.empty}>No discoveries in this period. Older findings remain available in All loaded findings.</p>:<div className={s.tableScroll} tabIndex={0} role="region" aria-label="Research findings"><table role="table"><thead role="rowgroup"><tr role="row"><th role="columnheader">Finding</th><th role="columnheader">Business relevance / missing evidence</th><th role="columnheader">Pillow assessment</th><th role="columnheader">Next step</th></tr></thead>{groups.slice((currentPage-1)*10,currentPage*10).map(group=>{
 const e=group[0],linked=decisions.filter(r=>group.some(f=>evidenceMatches(f,r))),op=linkedOpportunities(group,opportunities),gaps=evidenceGaps(op);
 const stale=typeof e.staleAfter!=='string'||!Number.isFinite(Date.parse(e.staleAfter))||Date.parse(e.staleAfter)<=now;
 return <tbody role="rowgroup" key={text(e.id)} data-testid="intelligence-trace"><tr role="row"><th role="rowheader" scope="row">{findingName(e)}<small>{plainStatus(e.eye)} · {text(e.provider)}</small><span className={s.badge}>{stale?'Needs fresh evidence':'Within source freshness window'}</span>{(e.authenticity??e.classification)==='SYNTHETIC'&&<small>Test example</small>}</th>
 <td role="cell" data-label="Business relevance / missing evidence">{gaps.length?gaps.map(ownerLabel).join(' · '):op.length?'Review candidate qualification.':'Product relevance not established.'}</td>
 <td role="cell" data-label="Pillow assessment">{linked.length?linked.map(r=><p key={text(r.id)}>{recommendationHeadline(text(r.title))}</p>):'No linked assessment'}</td>
 <td role="cell" data-label="Next step"><p>{stale?'Refresh evidence before relying on it.':gaps.length?'Resolve missing evidence.':linked.length?'Review the saved decision.':'Request an assessment when authorised.'}</p><button aria-expanded={selected===e.id} onClick={()=>setSelected(selected===e.id?'':text(e.id))}>Inspect finding</button></td></tr>
 {selected===e.id&&<tr role="row"><td role="cell" colSpan={4}><section className={s.detailPanel} aria-label="Finding details"><h3>{findingName(e)}</h3><p>{findingFacts(e)}</p><p className={s.note}>Source freshness does not establish commercial confidence. {op.length} linked candidate investigation(s).</p>
 {linked.map(r=><section key={text(r.id)}><h3>What Pillow thinks</h3><p>{recommendationHeadline(text(r.rationale))}</p><p>Owner decision: {ownerLabel(object(r.ownerDecision).decision)} · Execution: {ownerLabel(r.executionStatus)} · Outcome: {ownerLabel(object(r.outcome).status)}</p><p className={s.note}>Execution claims require independent verification.</p><Audit label="Full assessment and outcome" value={r}/><Link href={'/cockpit/ceo#'+encodeURIComponent(text(r.id))}>Inspect this Pillow decision</Link><br/><Link href={text(r.evidenceHref,'/cockpit/advisor')}>Inspect source and receipt</Link></section>)}
 <Audit label="Technical evidence · original finding and linked records" value={{observations:group,qualification:op}}/>{op.length>0&&<Link href="/cockpit/products">Review Products &amp; Approvals</Link>}
 </section></td></tr>}</tbody>;
 })}</table></div>}
 <Pager page={currentPage} total={groups.length} setPage={setPage}/>
 <details><summary>About these findings</summary><p>Evidence gaps are shown first. Equal source facts are grouped without deleting records. Counts cover loaded records only; they are not sales rankings. Periods use Singapore time.</p></details>
 </section>;
}

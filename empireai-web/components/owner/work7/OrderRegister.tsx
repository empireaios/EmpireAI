'use client';
import {useState} from 'react';
import {SimulatedFinancials} from './SimulatedFinancials';
import Link from 'next/link';
import {BusinessPage,BusinessStatus,useBusinessRead,Audit,Pager} from './BusinessViews';
import {records,object,text,type BusinessRow} from '@/lib/owner/business-view';
import s from './business.module.css';
import {ownerDate,ownerLabel,displayAmount} from '@/lib/owner/executive-presentation';
export function orderStage(o:BusinessRow) {
 if(o.outcome==='UNKNOWN')return 'Needs reconciliation';
 const count=Number(o.accepted);
 if(count>0&&Number(o.delivered)>=count)return 'Delivered';
 if(Number(o.shipped)>0)return Number(o.shipped)<count?'Partly shipped':'Shipped';
 return count>0?'Processing':'Supplier pending';
}
export function OrderRegister(){
 const [cursors,setCursors]=useState<string[]>(['']);const cursor=cursors[cursors.length-1]??'';
 const state=useBusinessRead('/api/owner/commerce'+(cursor?'?afterMission='+encodeURIComponent(cursor):'')),[test,setTest]=useState(false),[filter,setFilter]=useState('All'),[page,setPage]=useState(1),[selected,setSelected]=useState('');
 // Current governed lifecycle contract exposes isolated demonstrations, not a real order feed.
 const orders:BusinessRow[]=records(state.data?.missions).flatMap(m=>Object.entries(object(object(m.state).orders)).map(([id,v])=>({...object(v),id,missionId:m.missionId,at:m.at,title:object(object(m.state).candidate).title})));
 const coverage=object(state.data?.missionCoverage);
 const changeGroup=(next:boolean)=>{setCursors(previous=>next?[...previous,text(coverage.next)]:previous.slice(0,-1));setPage(1);setSelected('');};
 const matching=orders.filter(o=>filter==='All'||orderStage(o)===filter||(filter==='Shipped'&&orderStage(o)==='Partly shipped'));
 const visible=matching.slice((page-1)*10,page*10),item=orders.find(o=>text(o.missionId)+':'+o.id===selected);
 return <BusinessPage title="Orders & Fulfilment" note="Customer purchases, supplier acceptance and delivery are separate facts.">
 <div className={s.toolbar}><button aria-pressed={!test} onClick={()=>setTest(false)}>Actual orders</button><button aria-pressed={test} onClick={()=>setTest(true)}>Test order history</button><Link href="/cockpit/commerce/transactions">Full historical lifecycle</Link></div><BusinessStatus {...state}/>
 {state.data&&(!test?<div className={s.empty}><h2>No verified live order feed</h2><p>Commerce is locked. Test order history is retained separately and does not establish real purchases or revenue.</p></div>:<>
 <p className={s.note}>Showing orders and simulated finances from {text(coverage.returned)} of {text(coverage.total)} saved lifecycle records. {coverage.complete===true?'This group includes every currently saved lifecycle record.':'This is one group, not the complete order history. Use the record-group controls to inspect other records.'} Status filters and result pages apply only to this group; records may change between reads.</p>
 <nav aria-label="Saved record groups" className={s.toolbar}><button disabled={cursors.length<=1} onClick={()=>changeGroup(false)}>Previous record group</button><span>Group {cursors.length}</span><button disabled={coverage.hasMore!==true||typeof coverage.next!=='string'} onClick={()=>changeGroup(true)}>Next record group</button></nav>
 <div className={s.toolbar}><label>Order status<select value={filter} onChange={e=>{setFilter(e.target.value);setPage(1);}}>{['All','New','Supplier pending','Processing','Shipped','Delivered','Delayed','Cancelled','Returned/Refunded','Needs reconciliation'].map(v=><option key={v}>{v}</option>)}</select></label><span className={s.badge}>Test examples — excluded from actual orders and profit</span></div>
 {!matching.length?<p className={s.empty}>No saved test orders match this status.</p>:<div className={s.tableScroll} tabIndex={0} role="region" aria-label="Order transactions"><table role="table"><thead role="rowgroup"><tr role="row">{['Date / order','Product / quantity','Payment / supplier cost','Supplier / fulfilment','Shipment / delivery','Action'].map(h=><th role="columnheader" key={h}>{h}</th>)}</tr></thead><tbody role="rowgroup">{visible.map(o=><tr role="row" key={text(o.missionId)+o.id}><th role="rowheader" scope="row">{text(o.id)}<small>{ownerDate(o.at)}</small></th><td role="cell" data-label="Product / quantity">{text(o.title)}<small>Accepted units: {text(o.accepted)}</small></td><td role="cell" data-label="Payment / supplier cost">—<small>Actual payment and cost unverified</small></td><td role="cell" data-label="Fulfilment">{orderStage(o)}</td><td role="cell" data-label="Shipment / delivery">{text(o.shipped)} shipped / {text(o.delivered)} delivered<small>{ownerDate(o.lastTrackingAt)}</small></td><td role="cell" data-label="Action"><button aria-expanded={selected===text(o.missionId)+':'+o.id} onClick={()=>setSelected(selected===text(o.missionId)+':'+o.id?'':text(o.missionId)+':'+o.id)}>Inspect order</button>{o.outcome==='UNKNOWN'&&<p role="alert">Reconcile before retry</p>}</td></tr>)}</tbody></table></div>}
 <Pager page={page} total={matching.length} setPage={setPage}/>
 <SimulatedFinancials value={state.data.simulatedFinancials} lifecycle={state.data.durableSimulatedFinancials} coverage={state.data.simulatedFinancialCoverage}/>
 {item&&<section aria-label="Order details" className={s.detailPanel}><h2>{text(item.title,'Order details')}</h2><p className={s.badge}>Test order · excluded from actual orders and profit</p>{item.outcome==='UNKNOWN'&&<p role="alert">Outcome unknown. Reconcile before any retry; no resubmission is offered here.</p>}
 <dl className={s.facts}><div><dt>Supplier</dt><dd>{ownerLabel(object(item.order).supplierPlatform)}</dd></div><div><dt>Fulfilment</dt><dd>{orderStage(item)}</dd></div><div><dt>Payment</dt><dd>Actual payment unverified</dd></div><div><dt>Last tracking update</dt><dd>{ownerDate(item.lastTrackingAt)}</dd></div></dl>
 <h3>Order items</h3>{records(object(item.order).items).length?<ul>{records(object(item.order).items).map((line,i)=><li key={i}>{text(line.title,'Unnamed item')} · {text(line.quantity)} units · recorded unit cost {displayAmount(line.unitCost,line.currency)}</li>)}</ul>:<p>Item details not recorded.</p>}
 <h3>Shipment progress</h3><div data-testid="order-package" className={s.timeline}>{Object.entries(object(item.shipments)).map(([id,p],i)=><article key={id}><h3>Package {i+1}</h3><p>{text(object(p).quantity)} units · {text(object(p).carrier,'Carrier unknown')}</p><p>Tracking: {text(object(p).tracking,'Not recorded')}</p><p>{object(p).delivered===true?'Delivered package':'Delivery not confirmed'}</p></article>)}<p className={s.note}>Package delivery is separate from whole-order completion. Expected delivery date not recorded.</p></div>
 <h3>Returns and refunds</h3>{records(item.remedies).length?<ul>{records(item.remedies).map((r,i)=><li key={i}>{ownerLabel(r.kind)} · {text(r.quantity,'Quantity unknown')} units{r.amount!==undefined?' · '+displayAmount(r.amount,r.currency):''}{r.status?' · '+ownerLabel(r.status):''}</li>)}</ul>:<p>No return or refund recorded.</p>}
 <Audit label="Technical evidence · full order, tracking and remedies" value={item}/><div data-testid="order-settlement"><Link href={'/cockpit/finance?order='+encodeURIComponent(text(item.id))}>Inspect operational amounts</Link></div>
 </section>}
 </>)}
 </BusinessPage>;
}

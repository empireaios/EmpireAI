'use client';
import {useState} from 'react';
import Link from 'next/link';
import {BusinessPage,BusinessStatus,useBusinessRead,Audit,Pager} from './BusinessViews';
import {records,object,text,plainStatus,type BusinessRow} from '@/lib/owner/business-view';
import s from './business.module.css';
export function orderStage(o:BusinessRow) {
 if(o.outcome==='UNKNOWN')return 'Needs reconciliation';
 const count=Number(o.accepted);
 if(count>0&&Number(o.delivered)>=count)return 'Delivered';
 if(Number(o.shipped)>0)return Number(o.shipped)<count?'Partly shipped':'Shipped';
 return count>0?'Processing':'Supplier pending';
}
export function OrderRegister(){
 const state=useBusinessRead('/api/owner/commerce'),[test,setTest]=useState(false),[filter,setFilter]=useState('All'),[page,setPage]=useState(1),[selected,setSelected]=useState('');
 // Current governed lifecycle contract exposes isolated demonstrations, not a real order feed.
 const orders:BusinessRow[]=records(state.data?.missions).flatMap(m=>Object.entries(object(object(m.state).orders)).map(([id,v])=>({...object(v),id,missionId:m.missionId,at:m.at,title:object(object(m.state).candidate).title})));
 const matching=orders.filter(o=>filter==='All'||orderStage(o)===filter||(filter==='Shipped'&&orderStage(o)==='Partly shipped'));
 const visible=matching.slice((page-1)*10,page*10),item=orders.find(o=>text(o.missionId)+':'+o.id===selected);
 return <BusinessPage title="Orders & Fulfilment" note="Customer purchases, supplier acceptance and delivery are separate facts.">
 <div className={s.toolbar}><button aria-pressed={!test} onClick={()=>setTest(false)}>Actual orders</button><button aria-pressed={test} onClick={()=>setTest(true)}>Test order history</button><Link href="/cockpit/commerce/transactions">Full historical lifecycle</Link></div><BusinessStatus {...state}/>
 {state.data&&(!test?<div className={s.empty}><h2>No verified live order feed</h2><p>Commerce is locked. Test order history is retained separately and does not establish real purchases or revenue.</p></div>:<>
 <div className={s.toolbar}><label>Order status<select value={filter} onChange={e=>{setFilter(e.target.value);setPage(1);}}>{['All','New','Supplier pending','Processing','Shipped','Delivered','Delayed','Cancelled','Returned/Refunded','Needs reconciliation'].map(v=><option key={v}>{v}</option>)}</select></label><span className={s.badge}>Test examples — excluded from actual orders and profit</span></div>
 {!matching.length?<p className={s.empty}>No saved test orders match this status.</p>:<div className={s.tableScroll} tabIndex={0} role="region" aria-label="Order transactions"><table><thead><tr>{['Date / order','Product / quantity','Payment / supplier cost','Supplier / fulfilment','Shipment / delivery','Action'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{visible.map(o=><tr key={text(o.missionId)+o.id}><th scope="row">{text(o.id)}<small>{text(o.at)} · saved record date</small></th><td>{text(o.title)}<small>Accepted units: {text(o.accepted)}</small></td><td>—<small>Actual payment and cost unverified</small></td><td>{orderStage(o)}</td><td>{text(o.shipped)} shipped / {text(o.delivered)} delivered<small>{text(o.lastTrackingAt)}</small></td><td><button aria-expanded={selected===text(o.missionId)+':'+o.id} onClick={()=>setSelected(selected===text(o.missionId)+':'+o.id?'':text(o.missionId)+':'+o.id)}>Inspect order</button>{o.outcome==='UNKNOWN'&&<p role="alert">Reconcile before retry</p>}</td></tr>)}</tbody></table></div>}
 <Pager page={page} total={matching.length} setPage={setPage}/>
 {item&&<section aria-label="Order details"><h2>{text(item.id)}</h2>{item.outcome==='UNKNOWN'&&<p role="alert">Outcome unknown. A timeout does not establish a failed purchase; no resubmission is offered here.</p>}<div data-testid="order-package">{Object.entries(object(item.shipments)).map(([id,p])=><article key={id}><h3>Package {id}</h3><p>{text(object(p).quantity)} units · {text(object(p).carrier)} · {text(object(p).tracking)}</p><p>{object(p).delivered===true?'Delivered package':'Delivery not confirmed'}</p></article>)}<p>A delivered package does not establish delivery of the whole order. Expected delivery dates are not supplied by this record.</p></div><Audit label="Order lines and tracking" value={{order:item.order,tracking:item.tracking}}/><Audit label="Returns and refunds" value={item.remedies}/><Audit label="Original order record" value={item}/><div data-testid="order-settlement"><p>These test records are excluded from Operational Finance actuals.</p><Link href={'/cockpit/finance?order='+encodeURIComponent(text(item.id))}>Inspect operational amounts</Link></div><p>Current state: {plainStatus(item.outcome)}</p></section>}
 </>)}
 </BusinessPage>;
}

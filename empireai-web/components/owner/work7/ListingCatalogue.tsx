'use client';
import {ProductContextLink} from '../work8/ProductContextLink';
import {ProductChatActions} from '../ProductChatActions';
import {useRef,useState} from 'react';
import {BusinessPage,BusinessStatus,useBusinessRead,Audit,Pager} from './BusinessViews';
import {records,object,text,plainStatus} from '@/lib/owner/business-view';
import s from './business.module.css';
import {displayAmount} from '@/lib/owner/executive-presentation';

function ProductImage({url,alt}:{url:string;alt:string}) {const [broken,setBroken]=useState(false);return broken?<span role="img" aria-label={alt+' unavailable'}>Image unavailable</span>:<img src={url} alt={alt} loading="lazy" onError={()=>setBroken(true)}/>;}
export function MediaGallery({value,title}:{value:unknown;title:string}) {
 const urls=[...new Set((Array.isArray(value)?value:[]).map(v=>typeof v==='string'?v:text(object(v).url??object(v).sourceUrl,'')).filter(v=>/^https:\/\//.test(v)))];
 const [index,setIndex]=useState(0);const dialog=useRef<HTMLDialogElement>(null);const trigger=useRef<HTMLButtonElement>(null);
 const current=urls[Math.min(index,Math.max(0,urls.length-1))];
 return current?<div className={s.gallery}><button ref={trigger} aria-label={'Enlarge '+title} onClick={()=>dialog.current?.showModal()}><ProductImage key={current} url={current} alt={title}/></button><div className={s.thumbnails} aria-label="Product images">{urls.map((url,i)=><button key={url} aria-label={'Image '+(i+1)} aria-pressed={i===index} onClick={()=>setIndex(i)}><ProductImage url={url} alt={title+' · '+(i+1)}/></button>)}</div><dialog ref={dialog} className={s.dialog} aria-label={'Enlarged '+title} onClose={()=>trigger.current?.focus()}><button onClick={()=>dialog.current?.close()}>Close image</button><ProductImage key={current} url={current} alt={title}/></dialog></div>:<p>No product image available.</p>;
}

export function ListingCatalogue({initialMission=''}:{initialMission?:string}) {
 const [view,setView]=useState(initialMission?'Prepared':'Published'),[search,setSearch]=useState(''),[sort,setSort]=useState('title'),[page,setPage]=useState(1),[selected,setSelected]=useState(initialMission);
 const q=new URLSearchParams({classification:view==='Test examples'?'SYNTHETIC':'REAL_READ_ONLY',page:String(page),pageSize:'10',search,sort,direction:sort==='title'?'asc':'desc'});
 if(initialMission&&selected===initialMission){q.set('missionId',initialMission);q.set('classification','ALL');}
 const state=useBusinessRead('/api/owner/commerce/portfolio?'+q),items=records(state.data?.items),item=items.find(p=>p.missionId===selected);
 return <BusinessPage title="Listings" note="Prepared content and published marketplace inventory are separate stages.">
 <div className={s.toolbar}>{['Published','Prepared','Test examples'].map(v=><button key={v} aria-pressed={view===v} onClick={()=>{setView(v);setPage(1);setSelected('');}}>{v}</button>)}</div>
 <BusinessStatus {...state}/>
 {state.data&&view==='Published'?<div className={s.empty}><h2>No published inventory verified</h2><p>The connected records contain preparation and approval evidence, not marketplace publication receipts. Publication remains locked.</p></div>:state.data&&<>
 <div className={s.toolbar}><label>Search listings<input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);setSelected('');}}/></label><label>Sort listings<select value={sort} onChange={e=>{setSort(e.target.value);setPage(1);}}><option value="title">Title</option><option value="updated">Last updated</option><option value="contribution">Estimated contribution</option></select></label></div>
 <p className={s.note}>{view==='Test examples'?'Test examples — not real products or published inventory.':'Prepared content is a draft for review; approval does not publish it.'}</p>
 {!items.length?<p className={s.empty}>No matching listing records.</p>:<div className={s.tableScroll} tabIndex={0} role="region" aria-label="Listing catalogue"><table role="table"><thead role="rowgroup"><tr role="row">{['Product','Selling / competitor price','Marketplace status','First listed / age','Stock / sales','Review'].map(h=><th role="columnheader" key={h}>{h}</th>)}</tr></thead><tbody role="rowgroup">{items.map(p=><tr role="row" key={text(p.missionId)}><th role="rowheader" scope="row">{Array.isArray(p.media)&&typeof p.media[0]==='string'&&/^https:\/\//.test(p.media[0])?<span className={s.thumb}><ProductImage url={p.media[0]} alt={text(p.title)}/></span>:null}{text(p.title)}<small>{text(p.sku)}</small><ProductContextLink missionId={text(p.missionId)} receiptDigest={text(p.digest)} title={text(p.title)} sku={text(p.sku)}/><ProductChatActions missionId={text(p.missionId)}/></th><td role="cell" data-label="Selling / competitor price">{displayAmount(object(p.economicsInputs).sellingPrice,object(p.economicsInputs).currency)}<small>Competitors: {displayAmount(p.competitorLow,undefined)}–{displayAmount(p.competitorHigh,undefined)}</small></td><td role="cell" data-label="Marketplace status">{p.classification==='SYNTHETIC'?'Test example':p.listing?'Prepared — not published':'Content not prepared'}<small>{plainStatus(p.phase)}</small></td><td role="cell" data-label="First listed">—<small>No publication date verified</small></td><td role="cell" data-label="Stock / sales">—<small>Marketplace stock and sales unverified</small></td><td role="cell" data-label="Review"><button aria-expanded={selected===p.missionId} onClick={()=>setSelected(selected===p.missionId?'':text(p.missionId))}>Inspect listing</button></td></tr>)}</tbody></table></div>}
 <Pager page={page} total={Number(state.data.total)||0} setPage={n=>{setPage(n);setSelected('');}}/>
 {item&&<section aria-label="Listing details"><h2>{text(object(item.listing).title,text(item.title))}</h2><MediaGallery key={text(item.missionId)} value={item.media} title={text(item.title)}/><p>{text(object(item.listing).description,'Customer-facing content is not prepared.')}</p><ul>{(Array.isArray(object(item.listing).bullets)?object(item.listing).bullets as unknown[]:[]).map((v,i)=><li key={i}>{text(v)}</li>)}</ul><p>Supplier: {text(object(item.offer).supplierId)} · Price: {displayAmount(object(item.economicsInputs).sellingPrice,object(item.economicsInputs).currency)}</p><p>Publication locked. Product selection and exact-content publication approval remain independent.</p><Audit label="Variations, supplier and stock evidence" value={{offer:item.offer,attributes:object(item.listing).attributes,variants:object(item.listing).variants,stale:item.stale}}/><Audit label="Approval and original listing evidence" value={item}/><button disabled title="NOT_BORN and commerce LOCKED prohibit publication">Publication locked</button></section>}
 </>}
 </BusinessPage>;
}

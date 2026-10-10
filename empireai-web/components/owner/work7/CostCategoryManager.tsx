'use client';
import {useState} from 'react';
import {records,object,text,type BusinessRow} from '@/lib/owner/business-view';
import {costCategories} from '@/lib/owner/cost-centre';
import s from './business.module.css';
type DirectoryCommand={id:string;type:'cost_category'|'provider_category';data:BusinessRow};

/** Metadata-only owner workflow. Financial amounts and provider authority are never edited. */
export function CostCategoryManager({data,refresh}:{data:BusinessRow;refresh:()=>void}){
 const directory=object(data.costDirectory),categories=records(directory.categories),mappings=records(directory.mappings),providers=records(data.providers);
 const supported=object(data.directoryCapabilities).standaloneCategories===true&&object(data.directoryCapabilities).providerCategoryMapping===true;
 const [edit,setEdit]=useState<BusinessRow|null>(null),[showArchived,setShowArchived]=useState(false),[vendor,setVendor]=useState(''),[categoryId,setCategoryId]=useState('');
 const [mappingRevision,setMappingRevision]=useState<string|null>(null);
 const [busy,setBusy]=useState(false),[pending,setPending]=useState<DirectoryCommand|null>(null),[notice,setNotice]=useState('');
 const locked=busy||pending!==null;
 async function save(command:DirectoryCommand){
  if(!supported)return;
  setBusy(true);setPending(command);setNotice('');
  try{
   const response=await fetch('/api/owner/finance',{method:'POST',credentials:'include',headers:{'content-type':'application/json'},body:JSON.stringify(command)});
   const receipt=await response.json();
   if(!response.ok){if(response.status>=400&&response.status<500){setPending(null);setEdit(null);refresh();}throw Error(receipt.error||'Directory update not confirmed');}
   if(receipt.status!=='RECORDED'||receipt.receipt?.id!==command.id)throw Error('Directory receipt unconfirmed');
   setPending(null);setEdit(null);if(command.type==='provider_category'){setVendor('');setCategoryId('');setMappingRevision(null);}setNotice('Directory change saved. Historical charges and service authority are unchanged.');refresh();
  }catch(error){setNotice((error instanceof Error?error.message:'Result unconfirmed')+'. Refresh before a new edit; an uncertain retry retains the original identity.');}
  finally{setBusy(false);}
 }
 function chooseVendor(value:string){setVendor(value);const mapping=mappings.find(m=>m.provider===value);setCategoryId(text(mapping?.categoryId,''));setMappingRevision(typeof mapping?.revision==='string'?mapping.revision:null);}
 return <details><summary>Manage cost categories</summary>
  <p>Owner-defined categories and vendor assignments. Archiving retains history and existing assignments; it does not cancel a service or change accounting classifications.</p>
  {!supported&&<p role="status">Category editing is unavailable on the connected backend. Existing vendor mappings and financial records remain available.</p>}
  <div className={s.toolbar}><button disabled={!supported||locked} onClick={()=>{setEdit({id:'category-'+crypto.randomUUID(),name:'',description:'',archived:false,expectedRevision:null});setNotice('');}}>Add category</button><label><input type="checkbox" checked={showArchived} onChange={e=>setShowArchived(e.target.checked)}/>Show archived categories</label></div>
  {categories.length===0&&<p>No owner-defined categories saved. The coverage checklist does not imply active spending.</p>}
  <ul>{categories.filter(c=>showArchived||!c.archived).map(c=><li key={text(c.id)}><strong>{text(c.name)}</strong>{c.archived?' · Archived':''}<p>{text(c.description,'')}</p><button disabled={!supported||locked} onClick={()=>setEdit({...c,expectedRevision:c.revision})}>Edit category · {text(c.name)}</button></li>)}</ul>
  {edit&&<form aria-label="Cost category editor" onSubmit={e=>{e.preventDefault();void save({id:'category-change-'+crypto.randomUUID(),type:'cost_category',data:{id:edit.id,name:text(edit.name,'').trim(),description:text(edit.description,'').trim(),archived:edit.archived===true,expectedRevision:edit.expectedRevision??null}});}}>
   <label>Category name<input required maxLength={100} list="category-suggestions" disabled={locked} value={text(edit.name,'')} onChange={e=>setEdit({...edit,name:e.target.value})}/></label>
   <datalist id="category-suggestions">{costCategories.map(name=><option key={name} value={name}/>)}</datalist>
   <label>Category description<input maxLength={500} disabled={locked} value={text(edit.description,'')} onChange={e=>setEdit({...edit,description:e.target.value})}/></label>
   {Boolean(edit.expectedRevision)&&<label><input type="checkbox" disabled={locked} checked={edit.archived===true} onChange={e=>setEdit({...edit,archived:e.target.checked})}/>Archive category</label>}
   <div className={s.toolbar}><button disabled={locked}>Save category</button><button type="button" disabled={locked} onClick={()=>setEdit(null)}>Cancel category edit</button></div>
  </form>}
  <form aria-label="Vendor category assignment" onSubmit={e=>{e.preventDefault();void save({id:'category-mapping-'+crypto.randomUUID(),type:'provider_category',data:{provider:vendor,categoryId:categoryId||null,expectedRevision:mappingRevision}});}}>
   <div className={s.toolbar}><label>Assign vendor<select aria-label="Assign vendor" required disabled={!supported||locked} value={vendor} onChange={e=>chooseVendor(e.target.value)}><option value="">Choose vendor</option>{providers.map(p=><option key={text(p.id)} value={text(p.id)}>{text(p.name)}</option>)}</select></label>
   <label>Assigned category<select aria-label="Assigned category" disabled={!supported||locked} value={categoryId} onChange={e=>setCategoryId(e.target.value)}><option value="">Use original vendor category</option>{categories.filter(c=>!c.archived||c.id===categoryId).map(c=><option key={text(c.id)} value={text(c.id)} disabled={c.archived===true}>{text(c.name)}{c.archived?' · Archived (retained assignment)':''}</option>)}</select></label>
   <button disabled={!supported||locked||!vendor||categories.some(c=>c.id===categoryId&&c.archived)}>Save vendor category</button></div>
  </form>
  {notice&&<p role="status">{notice}</p>}{pending&&!busy&&<button onClick={()=>void save(pending)}>Retry same category change</button>}
 </details>;
}

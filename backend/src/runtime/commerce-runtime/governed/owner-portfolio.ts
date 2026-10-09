import {z} from 'zod';
import type {GovernedCommerceStore,Receipt} from './store.js';
import type {CommerceState} from './engine.js';
export const portfolioQuery=z.object({missionId:z.string().regex(/^[A-Za-z0-9_.:-]{1,160}$/).optional(),page:z.coerce.number().int().min(1).max(100000).default(1),pageSize:z.coerce.number().refine(n=>[10,25,50].includes(n)).default(10),search:z.string().max(200).default(''),category:z.string().max(160).default(''),verdict:z.string().max(80).default(''),classification:z.enum(['REAL_READ_ONLY','SYNTHETIC','ALL']).default('REAL_READ_ONLY'),sort:z.enum(['title','updated','contribution']).default('updated'),direction:z.enum(['asc','desc']).default('desc')}).strict();
/** Read projection over canonical receipts. No secondary catalogue, write, provider call or inference. */
export function readOwnerPortfolio(store:GovernedCommerceStore,workspace:string,input:unknown,now=Date.now()){
 const q=portfolioQuery.parse(input);
 const classification="json_extract(record,'$.state.candidate.offer.provenance.classification')";
 const where=`(?='' OR json_extract(record,'$.missionId')=?) AND (?='ALL' OR ${classification}=?) AND (?='' OR instr(lower(json_extract(record,'$.state.candidate.title') || ' ' || json_extract(record,'$.state.candidate.offer.sku')),lower(?))>0) AND (?='' OR json_extract(record,'$.state.candidate.category')=?) AND (?='' OR json_extract(record,'$.state.phase')=?)`;
 const cte=`WITH mission_latest AS (SELECT r.record FROM commerce_runtime_receipts r JOIN (SELECT mission,max(version) version FROM commerce_runtime_receipts WHERE workspace=? GROUP BY mission) m ON r.mission=m.mission AND r.version=m.version WHERE r.workspace=?), ranked AS (SELECT record,row_number() OVER (PARTITION BY json_extract(record,'$.state.candidate.offer.sku'),json_extract(record,'$.state.candidate.offer.provenance.classification') ORDER BY json_extract(record,'$.at') DESC,json_extract(record,'$.missionId')) rank FROM mission_latest), latest AS (SELECT record FROM ranked WHERE rank=1)`;
 const params=[workspace,workspace,q.missionId??'',q.missionId??'',q.classification,q.classification,q.search,q.search,q.category,q.category,q.verdict,q.verdict];
 const total=Number(store.db.prepare(`${cte} SELECT count(*) n FROM latest WHERE ${where}`).get(...params)?.n??0);
 const key={title:"json_extract(record,'$.state.candidate.title')",updated:"json_extract(record,'$.at')",contribution:"json_extract(record,'$.state.qualification.economics.contribution')"}[q.sort];
 const rows=store.db.prepare(`${cte} SELECT record FROM latest WHERE ${where} ORDER BY ${key} IS NULL, ${key} ${q.direction==='asc'?'ASC':'DESC'},json_extract(record,'$.missionId') LIMIT ? OFFSET ?`).all(...params,q.pageSize,(q.page-1)*q.pageSize);
 const items=rows.map(row=>{
  const r=JSON.parse(String(row.record)) as Receipt;
  // Verify immutable receipt chain for each returned mission before exposing authoritative evidence.
  const verified=store.history(workspace,r.missionId).at(-1)!;
  const s=verified.state as unknown as CommerceState,c=s.candidate,p=c.offer.provenance;
  return {missionId:r.missionId,receiptId:r.id,version:r.version,digest:r.digest,candidateDigest:s.candidateDigest,at:r.at,productId:c.productId,title:c.title,sku:c.offer.sku,category:c.category,classification:p.classification,executionClassification:r.classification,source:p,stale:Date.parse(p.expiresAt)<=now,phase:s.phase,qualified:s.qualification.qualified,reasons:s.qualification.reasons,offer:c.offer,economics:s.qualification.economics,economicsInputs:c.economics,listing:s.listing??null,media:s.listing?.images??[],listingDigest:s.listingDigest??null,approval:s.approval??null,decisions:s.decisions,evidence:c.evidence,competitorLow:null,competitorHigh:null,asin:null,buyable:null,sales:null,organicRank:null,limitations:['Competitor prices, ASIN buyability, sales and organic rank require provider observations; absent values are unknown','Listing media is prepared evidence, not proof of marketplace publication'],detailHref:`/cockpit/commerce/governed?mission=${encodeURIComponent(r.missionId)}`};
 });
 return {at:new Date(now).toISOString(),classification:q.classification,items,total,page:q.page,pageSize:q.pageSize,pages:Math.ceil(total/q.pageSize),activeCeiling:1000,activeCount:null,capacityStatus:'NOT_CONFIRMED',grantsAuthority:false,externalEffects:0};
}

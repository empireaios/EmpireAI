import {digest,defaultStrategy,type Evidence} from './model.js';
import type {IntelligenceStore,Row} from './store.js';
const dimensions=['demand','competition','supply','shipping','customer_problem','rank_growth','restriction_risk','economics_inputs'];
export function qualify(evidence:Evidence[],strategy=defaultStrategy,now=Date.now()){
 const usable=evidence.filter(e=>e.authenticity!=='SYNTHETIC'&&Date.parse(e.staleAfter)>now);
 const sources=new Set(usable.map(e=>e.provider));const present=new Set<string>();
 for(const e of usable){if(e.capabilityId==='amazon.catalog')present.add('rank_growth');if(e.capabilityId==='amazon.offers')present.add('competition');if(e.capabilityId==='cj.detail'||e.capabilityId==='cj.stock')present.add('supply');if(e.capabilityId==='cj.freight'){present.add('shipping');present.add('economics_inputs');}}
 const missing=dimensions.filter(d=>!present.has(d));const reasons=[...(usable.length<evidence.length?['STALE_OR_SYNTHETIC_EXCLUDED']:[]),...(sources.size<2?['SINGLE_SOURCE']:[]),...missing.map(d=>'MISSING_'+d.toUpperCase())];
 return {status:present.size>=strategy.minDimensions&&sources.size>=2?'INVESTIGATE':'INCOMPLETE',score:Math.round(present.size/dimensions.length*100),evidenceCompleteness:present.size+'/'+dimensions.length,missing,reasons,evidenceRefs:usable.map(e=>e.id),independentSources:[...sources],strategy:{id:strategy.id,version:strategy.version},winningProduct:false,executionApproved:false};
}
export function rankDiagnosis(metrics:Row){
 const valid=(x:unknown)=>typeof x==='number'&&Number.isFinite(x)&&x>=0;
 const rate=(n:unknown,d:unknown)=>valid(n)&&valid(d)&&Number(d)>0&&Number(n)<=Number(d)?Number(n)/Number(d):null;
 const ctr=rate(metrics.clicks,metrics.impressions),cartRate=rate(metrics.carts,metrics.clicks),conversion=rate(metrics.purchases,metrics.clicks);
 const hypotheses:Row[]=[];
 if(valid(metrics.impressions)&&metrics.impressions===0)hypotheses.push({stage:'VISIBILITY',hypothesis:'Investigate discoverability, eligibility and query relevance',expectedEffect:'More relevant impressions',measure:'impressions',causality:'UNPROVEN'});
 if(ctr!==null&&ctr<.01)hypotheses.push({stage:'CLICK_THROUGH',hypothesis:'Test main image/title/offer relevance with controlled measurement',expectedEffect:'Higher qualified click-through',measure:'clicks/impressions',causality:'UNPROVEN'});
 if(conversion!==null&&conversion<.02)hypotheses.push({stage:'CONVERSION',hypothesis:'Investigate delivered price, delivery promise, trust and listing clarity',expectedEffect:'Higher qualified purchase conversion',measure:'purchases/clicks',causality:'UNPROVEN'});
 return {metrics:{ctr,cartRate,conversion},hypotheses,sourceType:metrics.sourceType??'UNKNOWN',traffic:metrics.traffic??'UNKNOWN',exactKeywordPosition:null,organicVsPaid:'Must not combine without source-specific attribution',economics:'Profitability not established; Work5',status:hypotheses.length?'HYPOTHESES_ONLY':'INSUFFICIENT_OR_NO_MATERIAL_SIGNAL',prohibited:['Review manipulation','False scarcity','Rank guarantees','Advertising spend'],grantsAuthority:false};
}
export function reconcileSignals(store:IntelligenceStore,workspace:string){
 const recent=store.recent(workspace,'evidence',100) as Evidence[];const groups=new Map<string,Evidence[]>();
 for(const e of recent){if(e.authenticity==='SYNTHETIC')continue;const k=digest([e.provider,e.subject.id,e.subject.variant??null,e.subject.marketplace,e.subject.destination??null]);const g=groups.get(k)??[];if(!g.some(x=>x.capabilityId===e.capabilityId))g.push(e);groups.set(k,g);}
 const strategy=store.get(workspace,'strategy','active')??defaultStrategy;const output:Row[]=[];
 for(const [id,group] of groups){const e=group[0]!;if(!group.some(x=>['amazon.catalog','amazon.offers','cj.detail','cj.stock','cj.freight'].includes(x.capabilityId)))continue;
  const match=store.list(workspace,'matches','',100).find(m=>m.source===e.provider&&m.subject===e.subject.id&&(m.variant??null)===(e.subject.variant??null)&&m.marketplace===e.subject.marketplace&&m.status==='OWNER_CONFIRMED');const linked=match?recent.filter(x=>x.provider===match.targetProvider&&x.subject.id===match.targetId&&(x.subject.variant??null)===(match.targetVariant??null)&&x.subject.marketplace===match.marketplace&&x.authenticity!=='SYNTHETIC'):[];
  output.push({id:'op_'+id.slice(0,36),subject:e.subject,...qualify([...group,...linked],strategy as typeof defaultStrategy,store.now()),matching:match??{confidence:'UNMATCHED',reason:'Stable IDs retained; name similarity is insufficient'},updatedAt:new Date(store.now()).toISOString(),decisionRequired:'PILLOW_JUDGMENT',authenticity:'EVIDENCE_DERIVED'});
 }
 output.sort((a,b)=>b.score-a.score);for(const item of output.slice(0,strategy.maxShortlist))store.put(workspace,'opportunities',item.id,item);
 const health=store.arsenal(workspace);const active=new Set<string>();
 for(const c of health){if(c.availability==='AVAILABLE')continue;const id='ex_'+c.id;active.add(id);const old=store.get(workspace,'exceptions',id);store.put(workspace,'exceptions',id,{id,capabilityId:c.id,status:'OPEN',severity:c.priority==='ESSENTIAL_NOW'?'MATERIAL':'GAP',reason:c.currentFailure??c.availability,firstSeen:old?.firstSeen??new Date(store.now()).toISOString(),lastSeen:new Date(store.now()).toISOString(),lastGoodAt:c.lastVerifiedRead,count:old?.reason===(c.currentFailure??c.availability)?old?.count??1:(old?.count??0)+1,materialChange:old?.reason!==(c.currentFailure??c.availability),resolvedAt:null});}
 for(const x of store.list(workspace,'exceptions','',100))if(x.status==='OPEN'&&!active.has(x.id))store.put(workspace,'exceptions',x.id,{...x,status:'RESOLVED',resolvedAt:new Date(store.now()).toISOString()});
 const compared=new Set<string>();
 const prices=recent.filter(e=>e.authenticity!=='SYNTHETIC'&&Number.isFinite(Date.parse(e.observedAt))&&Date.parse(e.observedAt)<=store.now()).sort((a,b)=>Date.parse(b.observedAt)-Date.parse(a.observedAt));
 for(const e of prices){const group=digest([e.capabilityId,e.subject]);if(compared.has(group))continue;compared.add(group);const older=prices.find(x=>x.id!==e.id&&x.capabilityId===e.capabilityId&&digest(x.subject)===digest(e.subject)&&Date.parse(x.observedAt)<Date.parse(e.observedAt));const a=e.facts.price,b=older?.facts.price;if(typeof a==='number'&&typeof b==='number'&&b>0&&e.facts.currency===older?.facts.currency){const id='change_'+digest([e.capabilityId,e.subject]).slice(0,32),pct=(a-b)/b*100,old=store.get(workspace,'changes',id);store.put(workspace,'changes',id,{id,status:Math.abs(pct)>=strategy.priceChangePct?'MATERIAL':'QUIET',current:a,prior:b,changePct:pct,evidenceRefs:[e.id,older!.id],newObservation:old?.evidenceRefs?.[0]!==e.id,judgment:'Investigate; no automatic product approval'});}}
 return {shortlist:output.slice(0,strategy.maxShortlist),quiet:!store.list(workspace,'exceptions','',100).some(x=>x.materialChange),inferenceCalls:0};
}

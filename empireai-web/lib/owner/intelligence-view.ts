import {object,text,type BusinessRow} from './business-view';

export function intelligencePeriod(range:string, now:number) {
 const date=new Date(now+28800000),y=date.getUTCFullYear(),m=date.getUTCMonth(),d=date.getUTCDate();
 const start=range==='1'?Date.UTC(y,m,d)-28800000:range==='90'?Date.UTC(y,Math.floor(m/3)*3,1)-28800000:range==='365'?Date.UTC(y,0,1)-28800000:range==='all'?0:now-Number(range)*86400000;
 return {start,end:now,previousStart:Math.max(0,start-(now-start))};
}
function stable(value:unknown):unknown {
 if(Array.isArray(value))return value.map(stable);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(object(value)).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,stable(v)]));
 return value;
}
/** Group only equal subject/source/facts. Every original identity remains available. */
export function findingGroups(evidence:BusinessRow[]) {
 const groups=new Map<string,BusinessRow[]>();
 for(const e of evidence){const facts=e.facts??e.data??e.result;const key=JSON.stringify(stable([e.eye,e.provider,e.capabilityId,e.subject,e.authenticity??e.classification,e.summary,facts??e.id]));groups.set(key,[...(groups.get(key)??[]),e]);}
 return [...groups.values()].map(rows=>[...rows].sort((a,b)=>(Date.parse(text(b.observedAt))||0)-(Date.parse(text(a.observedAt))||0)));
}
export function findingName(e:BusinessRow) {
 const subject=object(e.subject),name=subject.title??subject.name??subject.query;
 if(subject.id==='empire'||e.capabilityId==='empire.state')return 'Empire operating status';
 if(typeof name==='string'&&name.trim())return name;
 const capability=text(e.capabilityId,'').toLowerCase();
 const kind=capability.includes('stock')?'stock observation':capability.includes('freight')?'freight observation':capability.includes('offer')?'offer observation':capability.includes('detail')?'product details':'product observation';
 return `${e.eye==='SUPPLIER'?'Supplier':e.eye==='MARKET'?'Market':'Source'} ${kind}`;
}
export function findingFacts(e:BusinessRow) {
 if(typeof e.summary==='string'&&e.summary.trim()&&!/Fetch evidence:|[a-f0-9]{40}/i.test(e.summary))return e.summary;
 const facts=object(e.facts);
 return Object.entries(facts).filter(([k,v])=>!/(?:id$|hash|digest|backend|detail|reference|receipt|source)/i.test(k)&&(typeof v==='string'||typeof v==='number'||typeof v==='boolean')&&!/Fetch evidence:|[a-f0-9]{40}/i.test(String(v))).slice(0,3).map(([k,v])=>`${k.replace(/([a-z])([A-Z])/g,'$1 $2')}: ${String(v)}`).join(' · ')||'Detailed source facts are available for inspection; no commercial conclusion is recorded.';
}
export function jobGroups(jobs:BusinessRow[]) {
 const groups=new Map<string,BusinessRow[]>();
 for(const job of jobs){const key=JSON.stringify([job.objective,job.status,job.requester,job.capabilities]);groups.set(key,[...(groups.get(key)??[]),job]);}
 return [...groups.values()];
}
export function linkedOpportunities(group:BusinessRow[],opportunities:BusinessRow[]) {
 return opportunities.filter(o=>group.some(e=>Array.isArray(o.evidenceRefs)&&o.evidenceRefs.includes(e.id)));
}
export function evidenceGaps(opportunities:BusinessRow[]) {
 return [...new Set(opportunities.flatMap(o=>Array.isArray(o.missing)?o.missing.map(v=>text(v)):[]))];
}

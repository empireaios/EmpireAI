export const memoryReadPreservingRevision='3f9f1aacbb0fb265b0141bc27af2d8cf272bab85';
const categories=['failures','successes','architecture','businessLessons','capitalLessons','supplierLessons','marketingLessons'] as const;
export type MemoryInventory={total:number;active:number;archived:number;superseded:number;withSource:number;latestChange:string|null;byCategory:Record<string,number>;checkedAt:string};
/** Aggregate metadata only. Never return insight, context, arbitrary metadata or
 * source text; these fields can contain credentials or private working content. */
export function summarizeMemoryEvidence(value:unknown):MemoryInventory {
 if(!value||typeof value!=='object')throw Error('Invalid memory evidence');
 const data=value as Record<string,unknown>;
 if(!Array.isArray(data.memories)||data.memories.length>10000||data.total!==data.memories.length)throw Error('Incomplete memory evidence');
 const out:MemoryInventory={total:data.memories.length,active:0,archived:0,superseded:0,withSource:0,latestChange:null,byCategory:Object.fromEntries(categories.map(x=>[x,0])),checkedAt:new Date().toISOString()};
 const ids=new Set<string>();
 for(const entry of data.memories){
  if(!entry||typeof entry!=='object')throw Error('Invalid memory record');
  const r=entry as Record<string,unknown>;
  if(r.workspaceId!=='ws_empire_1'||typeof r.memoryId!=='string'||!r.memoryId||ids.has(r.memoryId))throw Error('Invalid memory scope');
  ids.add(r.memoryId);
  if(!categories.includes(r.category as typeof categories[number])||!['ACTIVE','ARCHIVED','SUPERSEDED'].includes(String(r.status))||typeof r.updatedAt!=='string'||!Number.isFinite(Date.parse(r.updatedAt)))throw Error('Invalid memory lifecycle');
  out.byCategory[String(r.category)]++;
  if(r.status==='ACTIVE')out.active++;else if(r.status==='ARCHIVED')out.archived++;else out.superseded++;
  if(typeof r.source==='string'&&r.source.trim())out.withSource++;
  if(out.latestChange===null||Date.parse(r.updatedAt)>Date.parse(out.latestChange))out.latestChange=new Date(r.updatedAt).toISOString();
 }
 return out;
}

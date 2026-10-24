import {z} from 'zod';
import {FinancialCentre} from './financial-centre.js';
import {financialExamWorkspace} from './work8-financial-view.js';
import {Work8CostIntelligence,expectedProviders,costCapabilitiesSchema,type CostCapability,type ReadOnlyBillingPort} from './work8-cost-intelligence.js';
const command=z.object({type:z.literal('work8_cost_discovery'),runId:z.string().regex(/^[A-Za-z0-9_.:-]{1,160}$/),confirmation:z.literal('ISOLATED_ONLY')}).strict();
/** Registration is server-owned and account-scoped. No browser-supplied adapters,
 * endpoints, credentials or observations are accepted. Empty means unavailable. */
export interface RegisteredBillingPort {workspace:string;owner:string;port:ReadOnlyBillingPort}
export interface RegisteredBillingConfiguration {workspace:string;owner:string;capability:Omit<CostCapability,'access'>}
export function createCostDiscoveryDispatcher(registry:readonly RegisteredBillingPort[]=[],configuration:readonly RegisteredBillingConfiguration[]=[]){
 const configured=configuration.map(r=>({workspace:r.workspace,owner:r.owner,capability:Object.freeze(costCapabilitiesSchema.parse([{...r.capability,access:'UNAVAILABLE'}])[0]!)}));
 const registered=registry.map(({workspace,owner,port})=>Object.freeze({workspace,owner,port:Object.freeze({provider:port.provider,discover:port.discover.bind(port),read:port.read.bind(port)})}));
 const active=new WeakMap<FinancialCentre,Set<string>>();
 return async(centre:FinancialCentre,workspace:string,owner:string,input:unknown)=>{
  const request=command.parse(input);if(!workspace||!owner)throw Error('ISOLATED_OWNER_REQUIRED');
  const isolated=financialExamWorkspace(workspace,owner),running=active.get(centre)??new Set<string>();
  if(running.has(isolated))throw Error('COST_DISCOVERY_IN_PROGRESS');
  active.set(centre,running);running.add(isolated);
  try{
   const scoped=registered.filter(p=>p.workspace===workspace&&p.owner===owner).map(p=>p.port);
   const settings=configured.filter(p=>p.workspace===workspace&&p.owner===owner).map(p=>p.capability);
   if(new Set(settings.map(p=>p.provider)).size!==settings.length)throw Error('DUPLICATE_PROVIDER_CONFIGURATION');
   const capabilities:CostCapability[]=[...new Set([...expectedProviders,...scoped.map(p=>p.provider),...settings.map(p=>p.provider)])].map(provider=>{const setting=settings.find(p=>p.provider===provider),reader=scoped.some(p=>p.provider===provider);return {...(setting??{provider,configuration:reader?'CONFIGURED' as const:'UNKNOWN' as const,billingOwner:null,reason:reader?'Server-scoped read-only reader registered; billing owner requires source evidence':'No authorised runtime billing reader or verified configuration available'}),access:reader&&(!setting||setting.configuration==='CONFIGURED')?'REGISTERED_READ_ONLY':'UNAVAILABLE'};});
   const ports=scoped.filter(p=>capabilities.some(c=>c.provider===p.provider&&c.access==='REGISTERED_READ_ONLY'));
   const intel=new Work8CostIntelligence(centre,isolated,owner);
   const receipt=await intel.examine(request.runId,ports,capabilities);
   return {status:'RECORDED',receipt,costs:intel.projection(),label:'Isolated financial rehearsal',liveActivation:false,noExecutionAuthority:true};
  }finally{running.delete(isolated);}
 };
}

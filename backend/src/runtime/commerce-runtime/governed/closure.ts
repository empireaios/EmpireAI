import {z} from 'zod';
const sha=z.string().regex(/^[a-f0-9]{40}$/),hash=z.string().regex(/^[a-f0-9]{64}$/);
export const commerceClosureSchema=z.object({action:z.literal('mission_close'),id:z.string().regex(/^[A-Za-z0-9_.:-]{1,160}$/),state:z.literal('COMPLETE'),backendSha:sha,frontendSha:sha,railwayDeployment:z.string().uuid(),vercelDeployment:z.string().startsWith('dpl_'),ciRunIds:z.array(z.string().regex(/^\d+$/)).min(4).max(16),leaseId:z.string().min(10).max(160),accountingDigest:hash,legacyDigest:hash,journalDigest:hash,scenarioMission:z.string().min(1).max(160),scenarioReceiptDigest:hash,criteria:z.array(z.object({id:z.string().regex(/^W6-(?:0[1-9]|1[0-9]|2[0-4])$/),passed:z.literal(true),code:z.string().min(5).max(500),test:z.string().min(5).max(500),evidence:z.string().min(10).max(2000),providerCoverage:z.string().min(5).max(500)}).strict()).length(24),limitations:z.array(z.string().min(5).max(1000)).min(1).max(30)}).strict();
export type CommerceClosure=z.infer<typeof commerceClosureSchema>;
export function validateCommerceClosure(raw:unknown,current:{revision:string|undefined;deployment:string|undefined;profile:string|undefined;accountingDigest:string|null;accountingCount:number;legacyDigest:string|null;legacyCount:number;journalDigest:string;journalCount:number;scenarioDigest:string;scenarioComplete:boolean;leaseId:string|null;leaseTerminal:boolean}){
 const c=commerceClosureSchema.parse(raw);if(new Set(c.criteria.map(x=>x.id)).size!==24)throw Error('DUPLICATE_ACCEPTANCE_CRITERIA');
 if(current.profile!=='LOCKED_COMMISSIONING_V1'||c.backendSha!==current.revision||c.railwayDeployment!==current.deployment)throw Error('RELEASE_IDENTITY_MISMATCH');
 if(current.accountingCount!==224||current.legacyCount!==7||current.journalCount!==3||c.accountingDigest!==current.accountingDigest||c.legacyDigest!==current.legacyDigest||c.journalDigest!==current.journalDigest)throw Error('PROTECTED_FINANCIAL_RECORDS_CHANGED');
 if(!current.scenarioComplete||c.scenarioReceiptDigest!==current.scenarioDigest)throw Error('COMMERCE_SCENARIO_UNVERIFIED');
 if(!current.leaseTerminal||c.leaseId!==current.leaseId)throw Error('RELEASE_LEASE_UNRESOLVED');return c;
}

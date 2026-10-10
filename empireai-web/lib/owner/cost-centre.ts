import {actualCosts,object,text,sumKnown,inBillingPeriod,periodBounds,type BusinessRow} from './business-view';

/** Candidate taxonomy only: presence never establishes a charge or subscription. */
export const costCategories = [
 'AI subscriptions and inference','Training, fine-tuning, embeddings and reranking','Image, video and audio generation',
 'Hosting, compute, containers and workers','Databases, storage and archival','Networking, bandwidth and CDN',
 'Backups, restore and disaster recovery','Domains, DNS and email','SMS and notifications','Repositories, CI/CD and testing',
 'Coding assistants and development','Authentication, secrets and security','Monitoring, logging and incident response',
 'Marketplace platforms and connectors','Market data, analytics, trends and reviews','Browser, scraping and workflow automation',
 'Design, media licensing and content','Payments, FX, banking and reconciliation','Accounting and professional services',
 'Registration, legal, compliance and insurance','Equipment, hardware and connectivity','One-off development','Contingency and miscellaneous',
];
export const archivedNote='[OWNER_DIRECTORY_ARCHIVED] ';
export const isArchived=(p:BusinessRow)=>text(p.note,'').startsWith(archivedNote);
export const infrastructureCosts=(costs:unknown,provider='')=>actualCosts(costs).filter(c=>object(c.data).category==='TECHNOLOGY'&&(!provider||object(c.data).provider===provider));
export function infrastructureSummary(costs:unknown,now:Date,provider='') {
 const all=infrastructureCosts(costs,provider),mtd=periodBounds('MTD',now),ytd=periodBounds('YTD',now);
 const confirmed=(entries:BusinessRow[])=>entries.filter(c=>['INVOICED','SETTLED'].includes(text(object(c.data).stage)));
 const stage=(value:string)=>all.filter(c=>object(c.data).stage===value);
 const future=all.flatMap<BusinessRow & {nextDate:string}>(c=>{const d=object(c.data),date=d.stage==='SETTLED'?d.renewalDate:d.dueDate??d.renewalDate;return typeof date==='string'&&Date.parse(date)>=now.getTime()?[{...c,nextDate:date}]:[];}).sort((a,b)=>Date.parse(a.nextDate)-Date.parse(b.nextDate));
 return {all,mtd:sumKnown(confirmed(all.filter(c=>inBillingPeriod(c,mtd)))),ytd:sumKnown(confirmed(all.filter(c=>inBillingPeriod(c,ytd)))),payable:sumKnown(stage('INVOICED')),accrued:sumKnown(stage('ACCRUED_UNBILLED')),settled:sumKnown(stage('SETTLED')),estimated:sumKnown(stage('ESTIMATED')),committed:sumKnown(stage('COMMITTED')),future};
}
export function providerCommand(provider:BusinessRow,changes:BusinessRow,commandId:string) {
 return {id:commandId,type:'provider',data:{id:text(provider.id),name:text(provider.name),category:text(provider.category,''),commissioned:text(provider.commissioned,'UNKNOWN'),mandatory:provider.mandatory===true,billingAccess:text(provider.billingAccess,'UNAVAILABLE'),note:text(provider.note,''),...changes}};
}

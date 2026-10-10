/** Read-only projections. These functions never grant authority or replace ledgers. */
export type BusinessRow = Record<string, unknown>;
export const object = (v: unknown): BusinessRow => v && typeof v === 'object' && !Array.isArray(v) ? v as BusinessRow : {};
export const records = (v: unknown): BusinessRow[] => Array.isArray(v) ? v.map(object) : [];
export const text = (v: unknown, fallback = '—'): string => v == null || v === '' ? fallback : typeof v === 'object' ? 'Details available' : String(v);
export const sgd = (v: unknown): string => typeof v === 'number' && Number.isFinite(v) ? new Intl.NumberFormat('en-SG', {style:'currency',currency:'SGD',maximumFractionDigits:4}).format(v / 1e6) : '—';
export const sourceMoney = (amount: unknown, currency: unknown): string => typeof amount === 'number' && Number.isFinite(amount) && typeof currency === 'string' && /^[A-Z]{3}$/.test(currency) ? currency+' '+(amount/1e6).toLocaleString('en-SG',{maximumFractionDigits:6}) : '—';
export const plainStatus = (v: unknown): string => text(v).replaceAll('_',' ').toLowerCase().replace(/^./, c=>c.toUpperCase());
export function sumKnown(items: BusinessRow[]): number | null {
  if (!items.length || items.some(c=>typeof c.sgdMicro !== 'number' || !Number.isFinite(c.sgdMicro) || object(object(c.data).attribution).project === 'TEAM_SHARED_UNALLOCATED')) return null;
  return items.reduce((n,c)=>n + Number(c.sgdMicro),0);
}
export function actualCosts(value: unknown): BusinessRow[] {
  // The backend projection has already resolved review/reversal/replacement lineage.
  return records(value).filter(c=>object(c.data).authenticity === 'REAL');
}
export function operationalAmounts(value: unknown) {
  const actual = actualCosts(value).filter(c=>['INVOICED','SETTLED'].includes(text(object(c.data).stage)));
  const revenue = sumKnown(actual.filter(c=>object(c.data).category === 'REVENUE'));
  const direct = actual.filter(c=>['COGS','FEES','REFUNDS','ADVERTISING','TAX'].includes(text(object(c.data).category)) && (object(c.data).category === 'COGS' || Boolean(object(object(c.data).attribution).orderId || object(object(c.data).attribution).productId)));
  const costs = sumKnown(direct);
  return {revenue, costs, profit:revenue === null || costs === null ? null : revenue-costs, entries:actual.filter(c=>object(c.data).category==='REVENUE'||direct.includes(c))};
}
export function periodBounds(period: string, now = new Date(), from = '', to = '') {
  // Owner periods use Singapore calendar boundaries, converted to UTC.
  const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Singapore',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const get = (type:string)=>Number(parts.find(p=>p.type===type)?.value);
  const y=get('year'),m=get('month'),d=get('day');
  if(period==='All history') return {from:'0000',to:'9999'};
  if(period==='Custom') return {from:from ? new Date(from+'T00:00:00+08:00').toISOString() : '',to:to ? new Date(Date.parse(to+'T00:00:00+08:00')+86400000).toISOString() : ''};
  const start = period==='YTD' ? Date.UTC(y,0,1)-28800000 : period==='MTD' ? Date.UTC(y,m-1,1)-28800000 : Date.UTC(y,m-1,d)-28800000;
  return {from:new Date(start).toISOString(),to:now.toISOString()};
}
export function inBillingPeriod(c:BusinessRow,bounds:{from:string;to:string}) {
  const d=object(c.data);
  return typeof d.periodStart==='string' && typeof d.periodEnd==='string' && d.periodStart<bounds.to && d.periodEnd>bounds.from;
}
export function providerAmounts(value:unknown,provider:string,bounds:{from:string;to:string}) {
  const entries=actualCosts(value).filter(c=>object(c.data).category==='TECHNOLOGY' && object(c.data).provider===provider && inBillingPeriod(c,bounds));
  const confirmed=entries.filter(c=>['INVOICED','SETTLED'].includes(text(object(c.data).stage)));
  return {amount:sumKnown(confirmed), entries, stages:[...new Set(entries.map(c=>plainStatus(object(c.data).stage)))].join(' · ') || 'Bills unavailable'};
}
export function evidenceMatches(finding:BusinessRow,decision:BusinessRow) {
  return records(decision.evidence).some(ref=>(typeof finding.id==='string' && ref.id===finding.id) || (typeof finding.digest==='string' && finding.digest.length>0 && ref.hash===finding.digest));
}

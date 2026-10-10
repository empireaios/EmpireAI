import {FinancialCentre,commandSchema,hash} from '../finance/financial-centre.js';
/** Reads only the existing evidence journal in one bounded SQLite snapshot. No repair authority. */
export function readWork8FinancialProbe(finance:FinancialCentre,workspace:string){
 const base={id:'financial_evidence',capability:'financial_evidence',classification:'financial_evidence',severity:'HIGH',runbookId:null};
 try{
  if(!(finance instanceof FinancialCentre))throw Error('FINANCE_SOURCE_INVALID');
  finance.db.exec('BEGIN');
  try{
   const sizes=finance.db.prepare('SELECT length(CAST(record AS BLOB)) bytes FROM financial_evidence WHERE workspace=? LIMIT 1001').all(workspace);
   if(sizes.length>1000||sizes.reduce((n,r)=>n+Number(r.bytes),0)>4194304)throw Error('FINANCE_SCAN_BOUND');
   const rows=finance.db.prepare('SELECT id,digest,record FROM financial_evidence WHERE workspace=? ORDER BY rowid').all(workspace);
   for(const row of rows){const e=JSON.parse(String(row.record));const parsed=commandSchema.parse(e);if(e.workspace!==workspace||e.id!==row.id||e.digest!==row.digest||hash(parsed)!==e.digest||typeof e.actor!=='string'||!Number.isFinite(Date.parse(e.at)))throw Error('FINANCE_JOURNAL_INTEGRITY');}
   const snapshot=finance.snapshot(workspace),cash=snapshot.availableCashSgdMicro,contribution=snapshot.kpis.knownContributionSgdMicro;
   if((cash!==null&&!Number.isSafeInteger(cash))||!Number.isSafeInteger(contribution))throw Error('FINANCE_AMOUNT_INVALID');
   const negativeCash=snapshot.completeCashPosition&&cash!==null&&cash<0,unknownCash=!snapshot.completeCashPosition||cash===null,negativeContribution=contribution<0;
   const status=negativeCash?'FAILED':unknownCash?'BLOCKED':negativeContribution||snapshot.alerts.length?'DEGRADED':'HEALTHY';
   return {...base,status,summary:negativeCash?'Verified complete cash position is negative; owner review required.':unknownCash?'Complete cash position is unknown; readable records do not establish financial health.':negativeContribution?'Known contribution is negative; partial known amounts are not certified profit.':snapshot.alerts.length?'Financial evidence has unresolved alerts; owner review required.':'Fresh bounded financial evidence has no detected cash, contribution or alert risk; profit remains uncertified.',evidence:{observedAt:Date.now(),entryDigest:snapshot.entryDigest,entries:rows.length,completeCashPosition:snapshot.completeCashPosition,availableCashSgdMicro:cash,knownContributionSgdMicro:contribution,contributionQualification:'PARTIAL_KNOWN_AMOUNTS_NOT_CERTIFIED_PROFIT',negativeCash,negativeContribution,unknownCash,alertCount:snapshot.alerts.length,alertsDigest:hash(snapshot.alerts),alerts:snapshot.alerts.slice(0,20).map(a=>({code:a.code,refs:a.refs.slice(0,5)})),alertsTruncated:snapshot.alerts.length>20||snapshot.alerts.some(a=>a.refs.length>5),externalEffects:0}};
  }finally{finance.db.exec('ROLLBACK');}
 }catch(error){return {...base,status:'UNAVAILABLE',summary:'Financial source integrity or bounded coverage is unavailable; no healthy cash position inferred.',evidence:{observedAt:Date.now(),reason:error instanceof Error&&error.message==='FINANCE_SCAN_BOUND'?'FINANCE_SCAN_BOUND':'FINANCE_SOURCE_UNVERIFIED',externalEffects:0}};}
}

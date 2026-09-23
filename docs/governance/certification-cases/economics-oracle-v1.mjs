// Independent decimal oracle for frozen synthetic held cases. Never imports Pillow implementation.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const SCALE=1000000n;
export function decimal(value) {
 if(typeof value!=='string'||!/^\d+(?:\.\d{1,6})?$/.test(value)) throw Error('Explicit nonnegative decimal required');
 const [whole,fraction='']=value.split('.'); return BigInt(whole)*SCALE+BigInt(fraction.padEnd(6,'0'));
}
function halfUp(n,d) { return n>=0n?(n+d/2n)/d:-((-n+d/2n)/d); }
function cents(value) { const n=halfUp(value,10000n); return (n<0n?'-':'')+(n<0n?-n:n)/100n+'.'+String((n<0n?-n:n)%100n).padStart(2,'0'); }
export function economics(e) {
 const keys=['price','supplier','shipping','marketplaceRatePercent','marketplaceFixed','paymentRatePercent','paymentFixed','returnAllowance','overhead','duty','tax'];
 const missing=keys.filter(k=>e[k]===null||e[k]===undefined);
 if(missing.length)return {status:'UNKNOWN',missing,contribution:null,marginPercent:null};
 if(e.currency!=='USD')throw Error('This case set has explicit USD-only inputs; no inferred FX');
 const p=Object.fromEntries(keys.map(k=>[k,decimal(e[k])]));
 const marketNumerator=p.price*p.marketplaceRatePercent, paymentNumerator=p.price*p.paymentRatePercent;
 if(marketNumerator%(100n*SCALE)!==0n||paymentNumerator%(100n*SCALE)!==0n)throw Error('Case exceeds frozen oracle exact micro precision');
 const marketplaceFee=marketNumerator/(100n*SCALE), paymentFee=paymentNumerator/(100n*SCALE);
 const cost=p.supplier+p.shipping+marketplaceFee+p.marketplaceFixed+paymentFee+p.paymentFixed+p.returnAllowance+p.overhead+p.duty+p.tax;
 const contribution=p.price-cost;
 const marginBasisPoints=p.price===0n?null:halfUp(contribution*10000n,p.price);
 const margin=marginBasisPoints===null?null:(marginBasisPoints<0n?'-':'')+String((marginBasisPoints<0n?-marginBasisPoints:marginBasisPoints)/100n)+'.'+String((marginBasisPoints<0n?-marginBasisPoints:marginBasisPoints)%100n).padStart(2,'0');
 return {status:'KNOWN',currency:'USD',marketplaceFeeMicrounits:String(marketplaceFee),paymentFeeMicrounits:String(paymentFee),
 totalCostMicrounits:String(cost),contributionMicrounits:String(contribution),contribution:cents(contribution),marginPercent:margin,
 economicClass:'SYNTHETIC_FORECAST_NOT_REALISED'};
}
function rank(input,candidates=input.candidates) {
 const results=candidates.map(c=>{
  const value=economics({...input.commonEconomics,supplier:c.supplier,shipping:c.shipping});
  const reasons=[];
  if(value.status!=='KNOWN')reasons.push('UNKNOWN_REQUIRED_COST');
  else if(BigInt(value.contributionMicrounits)<decimal(input.constraints.minimumContribution))reasons.push('CONTRIBUTION_BELOW_MINIMUM');
  if(c.stock<input.constraints.minimumStock)reasons.push('STOCK_BELOW_MINIMUM');
  if(c.deliveryDays>input.constraints.maximumDeliveryDays)reasons.push('DELIVERY_TOO_LATE');
  if(c.approval!==input.constraints.approval)reasons.push('APPROVAL_NOT_GRANTED');
  return {id:c.id,economics:value,eligible:reasons.length===0,reasons};
 });
 const eligible=results.filter(r=>r.eligible).sort((a,b)=>BigInt(a.economics.contributionMicrounits)>BigInt(b.economics.contributionMicrounits)?-1:BigInt(a.economics.contributionMicrounits)<BigInt(b.economics.contributionMicrounits)?1:a.id.localeCompare(b.id));
 return {candidates:results,eligibleRanking:eligible.map(r=>r.id),selected:eligible[0]?.id??null,liveActionAuthorized:false};
}
export function expectedCase(c) {
 if(c.oracleKind==='economics'||c.oracleKind==='unknown_economics') return economics(c.inputs.economics);
 if(c.oracleKind==='economics_correction') {
  const initial=economics(c.inputs.initial),corrected=economics(c.inputs.corrected);
  return {initial,corrected,contributionDelta:cents(BigInt(corrected.contributionMicrounits)-BigInt(initial.contributionMicrounits)),currentRevision:2,priorHistoryPreserved:true};
 }
 if(c.oracleKind==='ranking')return c.inputs.initialCandidates?{initial:rank(c.inputs,c.inputs.initialCandidates),corrected:rank(c.inputs),currentRevision:2}:rank(c.inputs);
 throw Error('Unsupported frozen oracle case');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=path.dirname(fileURLToPath(import.meta.url));
 const bytes=fs.readFileSync(path.join(root,'economics-held-cases-v1.json'));
 const set=JSON.parse(bytes);
 const result={schemaVersion:1,status:'ORACLE_ONLY_NOT_PILLOW_EXECUTION',caseSetId:set.caseSetId,
 caseSetSha256:crypto.createHash('sha256').update(bytes).digest('hex'),
 oracleSourceSha256:crypto.createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).digest('hex'),
 expected:set.cases.map(c=>({caseId:c.id,expected:expectedCase(c)})),certificationCredit:0};
 console.log(JSON.stringify(result,null,2));
}

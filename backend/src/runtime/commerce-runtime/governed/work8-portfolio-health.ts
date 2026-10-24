import type {Outcome} from './contracts.js';
/** Deterministic advisory projection of already-filtered outcome evidence; never Pillow judgement. */
export function portfolioHealth(outcomes:Outcome[], exposure:number){
 const recommendations=new Set<'RETAIN'|'IMPROVE'|'OBSERVE'|'PAUSE'|'RETIRE'|'REPLACE'>();
 const checks=outcomes.flatMap(o=>[
  {evidenceId:o.id,check:'demand',passed:o.sales>0},
  {evidenceId:o.id,check:'conversion',passed:o.conversion>=0.01},
  {evidenceId:o.id,check:'economics',passed:o.margin>0},
  {evidenceId:o.id,check:'stock',passed:o.stockouts===0},
  {evidenceId:o.id,check:'delivery',passed:o.deliveryFailures===0},
  {evidenceId:o.id,check:'returns',passed:o.returns===0},
  {evidenceId:o.id,check:'restriction',passed:!o.restricted},
  {evidenceId:o.id,check:'capital',passed:o.cash===null?null:o.cash>=exposure},
 ]);
 for(const o of outcomes){
  if(o.sales===0||o.cash===null)recommendations.add('OBSERVE');
  if(o.conversion<0.01||o.deliveryFailures||o.returns)recommendations.add('IMPROVE');
  if(o.margin<=0||o.restricted||(o.cash!==null&&o.cash<exposure))recommendations.add('PAUSE');
  if(o.restricted||(o.days===90&&o.sales===0))recommendations.add('RETIRE');
  if(o.stockouts)recommendations.add('REPLACE');
 }
 if(!outcomes.length)recommendations.add('OBSERVE');
 if(outcomes.length&&!recommendations.size)recommendations.add('RETAIN');
 const known=checks.filter(c=>c.passed!==null);
 return {classification:'SOFTWARE_ADVISORY_ONLY' as const,policy:'existing-outcome-checks-v1',score:known.length?Math.round(100*known.filter(c=>c.passed).length/known.length):null,scoreMeaning:'Percentage of known outcome checks passed; not a profit forecast',unknownChecks:checks.filter(c=>c.passed===null).length,checks,recommendations:[...recommendations],grantsAuthority:false as const};
}

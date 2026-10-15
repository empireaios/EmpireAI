import {TechnicalEvidence} from '../work7/TechnicalEvidence';
type Row=Record<string,unknown>;
const row=(v:unknown):Row=>v&&typeof v==='object'&&!Array.isArray(v)?v as Row:{};
const rows=(v:unknown):Row[]=>Array.isArray(v)?v.map(row):[];
const labels:Record<string,string>={RETAIN:'Retain',IMPROVE:'Improve',OBSERVE:'Observe',PAUSE:'Consider pausing',RETIRE:'Consider retiring',REPLACE:'Consider a replacement'};
const checks:Record<string,string>={demand:'Recorded demand',conversion:'Conversion',economics:'Positive margin',stock:'Stock availability',delivery:'Delivery performance',returns:'Return exposure',restriction:'Product restrictions',capital:'Available capital'};
/** Existing authenticated twin projection only. This panel cannot approve or execute a change. */
export function PortfolioHealth({record,observations,modelReviews}:{record:Row;observations:unknown;modelReviews?:unknown}){
 const modelHistory=rows(modelReviews).filter(e=>row(row(e.result).modelProposal).kind==='PORTFOLIO_MODEL_REVIEW'&&row(row(row(e.result).modelProposal).reference).missionId===record.missionId).sort((a,b)=>Number(b.at)-Number(a.at));
 const model=row(row(modelHistory[0]?.result).modelProposal),modelCurrent=row(model.reference).receiptDigest===record.receiptDigest;
 const modelView=modelHistory.length?<section aria-label="Saved Pillow portfolio recommendation"><h4>Saved Pillow portfolio recommendation</h4>{modelCurrent?<><p>{labels[String(model.recommendation)]??'Recommendation unavailable'} · Model score: {String(model.score)} / 100</p><p>{String(model.rationale)}</p><p>Retained reply consumed for this saved product record, not real-time health. Owner review required; no product change authorised.</p></>:<p>Historical Pillow review: the product record has changed. A new bound assessment is required.</p>}<p>Recorded: {typeof modelHistory[0]?.at==='number'?new Date(Number(modelHistory[0].at)).toISOString():'Time unavailable'}.</p><TechnicalEvidence label="Saved Pillow review evidence and history" value={modelHistory}/></section>:<p>Pillow portfolio assessment pending. The software check summary is not a Pillow response.</p>;
 const history=rows(observations).filter(o=>o.kind==='PORTFOLIO_HEALTH_REVIEW'&&o.missionId===record.missionId).sort((a,b)=>Number(b.observedAt)-Number(a.observedAt));
 const latest=history[0],health=row(latest?.health),bound=Boolean(latest&&latest.receiptDigest===record.receiptDigest),valid=health.classification==='SOFTWARE_ADVISORY_ONLY'&&health.grantsAuthority===false;
 if(!latest)return <section aria-label="Portfolio health"><h3>Portfolio health</h3>{modelView}<p>No portfolio review in the returned observation window. This does not mean the product is healthy.</p></section>;
 if(!bound||!valid)return <section aria-label="Portfolio health"><h3>Portfolio health</h3>{modelView}<p>A historical review is available, but it does not establish current product health. Wait for a review of this saved product record.</p><TechnicalEvidence label="Historical review evidence" value={latest}/></section>;
 const recommendations=Array.isArray(health.recommendations)?health.recommendations.filter((x):x is string=>typeof x==='string'&&Boolean(labels[x])):[];
 const known=rows(health.checks).filter(c=>typeof c.passed==='boolean'),unknown=rows(health.checks).filter(c=>c.passed===null),issues=rows(health.checks).filter(c=>c.passed!==true);
 return <section aria-label="Portfolio health"><h3>Portfolio health</h3>{modelView}<p>Saved software advisory from simulated operating evidence, not real-time health. No Pillow judgement or permission to act is claimed.</p>
 <p><strong>{recommendations.length?recommendations.map(x=>labels[x]).join(' · '):'Recommendation unavailable'}</strong></p>
 <p>{typeof health.score==='number'&&Number.isFinite(health.score)&&known.length?`${known.filter(c=>c.passed===true).length} of ${known.length} known checks passed (${health.score}%).`:'Health score unknown: no verified operating outcomes.'} This is a check summary, not a profit forecast.</p>
 {unknown.length>0&&<p>{unknown.length} check{unknown.length===1?' is':'s are'} unknown, including available capital where not supplied.</p>}
 {issues.length>0&&<ul>{issues.map((c,i)=><li key={String(c.evidenceId)+':'+String(c.check)+':'+i}>{checks[String(c.check)]??'Operating check'}: {c.passed===null?'unknown':'requires review'}</li>)}</ul>}
 <p>Review recorded: {typeof latest.observedAt==='number'&&Number.isFinite(latest.observedAt)?new Date(latest.observedAt).toISOString():'Time unavailable'}.</p>
 <TechnicalEvidence label="Portfolio review evidence and retained history" value={history}/>
 </section>;
}

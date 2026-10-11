'use client';
import {useRef,useState} from 'react';
import s from './journeys.module.css';
type Row=Record<string,unknown>;
const row=(v:unknown):Row=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Row:{};
const text=(v:unknown,fallback='Unknown')=>typeof v==='string'&&v?v:fallback;
export function SimulationAuthorization({candidate}:{candidate:Row}){
 const dossier=row(candidate.dossier),assessment=row(candidate.assessment);
 const [prepared,setPrepared]=useState<Row|null>(null),[version,setVersion]=useState(0),[approved,setApproved]=useState(false),[authorized,setAuthorized]=useState(false),[ack,setAck]=useState(false),[pending,setPending]=useState(false),[error,setError]=useState('');
 const inFlight=useRef(false),ids=useRef<Record<string,string>>({});
 const eligible=row(dossier.eligibility).qualified===true&&assessment.status==='COMPLETED_ASSESSMENT_LINKED'&&typeof assessment.investigationId==='string'&&Boolean(row(dossier.review).listingPreparation);
 async function act(action:'prepare_simulation'|'approve_prepared_simulation'|'enroll_simulation'){
  if(!eligible||inFlight.current||authorized)return;
  if(action==='approve_prepared_simulation'&&(!prepared||approved))return;
  if(action==='enroll_simulation'&&(!prepared||!approved||!ack))return;
  inFlight.current=true;setPending(true);setError('');
  const id=ids.current[action]??(ids.current[action]='work8-'+crypto.randomUUID());
  const common={id,candidateId:candidate.candidateId,dossierDigest:dossier.digest,simulationOnly:true};
  const payload=action==='prepare_simulation'?{preparation:common}:action==='approve_prepared_simulation'?{approval:{...common,missionId:prepared?.missionId,expectedVersion:version,acknowledgeProductApprovalOnly:true}}:{enrollment:{...common,missionId:prepared?.missionId,expectedVersion:version,acknowledgeNoActualPayment:true}};
  try{
   const response=await fetch('/api/owner/commerce',{method:'POST',credentials:'include',headers:{'content-type':'application/json'},body:JSON.stringify({action,investigationId:assessment.investigationId,...payload})});
   const body=row(await response.json());if(!response.ok)throw Error(text(body.error,'Result unconfirmed. Refresh and recover the prepared mission before retrying.'));
   if(body.externalEffects!==0||body.paidInference!==0)throw Error('Authority receipt could not be verified.');
   if(action==='prepare_simulation'){
    const p=row(body.preparation),state=row(body.missionState);
    if(p.dossierDigest!==dossier.digest||p.candidateId!==candidate.candidateId||p.assessmentHash!==assessment.assessmentHash||p.investigationId!==assessment.investigationId||p.liveAuthority!==false||typeof p.missionId!=='string'||typeof state.version!=='number')throw Error('Prepared mission did not match this dossier.');
    setPrepared(p);setVersion(state.version);setApproved(state.approved===true);setAuthorized(typeof state.simulation==='string');
   }else if(action==='approve_prepared_simulation'){
    const receipt=row(body.receipt),state=row(receipt.state);
    if(receipt.missionId!==prepared?.missionId||state.phase!=='APPROVED'||row(state.approval).digest!==prepared?.canonicalCandidateDigest||typeof receipt.version!=='number')throw Error('Product approval could not be verified.');
    setVersion(receipt.version);setApproved(true);
   }else{
    const enrollment=row(body.enrollment);
    if(enrollment.mission!==prepared?.missionId||enrollment.dossierDigest!==dossier.digest||enrollment.preparationDigest!==prepared?.digest||enrollment.classification!=='SIMULATION_EXCLUDED_FROM_ACTUALS')throw Error('Simulation authorization could not be verified.');
    setAuthorized(true);
   }
  }catch(e){setError(e instanceof Error?e.message:'Result unconfirmed.');}finally{inFlight.current=false;setPending(false);}
 }
 return <section className={s.details} aria-label="Isolated simulation authorization">
  <h4 className={s.rowTitle}>Product approval &amp; isolated simulation</h4>
  <p>Live commerce is locked. These steps cannot publish to Amazon, buy from a supplier or move money.</p>
  {!eligible?<p role="status">Preparation needs a qualified dossier, a completed assessment for this exact dossier, and reviewed listing content with exact image permissions.</p>:<>
   <ol><li>Prepare or recover the source-bound mission.</li><li>Approve this product for an isolated scenario.</li><li>Separately authorize one simulated listing, order and delivery.</li></ol>
   <div className={s.toolbar}>
    <button type="button" disabled={pending||!!prepared||authorized} onClick={()=>void act('prepare_simulation')}>{prepared?'Mission prepared':'Prepare / recover mission'}</button>
    <button type="button" disabled={pending||!prepared||approved||authorized} onClick={()=>void act('approve_prepared_simulation')}>{approved?'Product approved for simulation':'Approve product for simulation'}</button>
   </div>
   {approved&&!authorized?<><label><input type="checkbox" checked={ack} disabled={pending} onChange={e=>setAck(e.target.checked)}/> I authorize one isolated simulation. All payment, marketplace capacity and delivery events are simulated.</label><div className={s.toolbar}><button type="button" disabled={pending||!ack} onClick={()=>void act('enroll_simulation')}>Authorize isolated simulation</button></div></>:null}
  </>}
  {pending?<p role="status">Checking current evidence and recording your decision…</p>:null}
  {error?<p role="alert" className={s.error}>{error}</p>:null}
  {authorized?<p role="status">Simulation authorization is recorded. Check its operational receipts for progress; authorization alone does not mean the simulation has completed.</p>:null}
  {prepared?<details><summary>Mission receipt</summary><p style={{overflowWrap:'anywhere'}}>{text(prepared.missionId)}<br/>Expires {text(prepared.expiresAt)}</p></details>:null}
 </section>;
}

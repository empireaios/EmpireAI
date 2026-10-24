import {initializeMissionPreparations,readMissionPreparation} from './work8-mission-preparation.js';
import {z} from 'zod';
import {id,envelopeSchema,type Command,type Actor,type CanonicalOrder} from './contracts.js';
import {qualify,type CommerceState} from './engine.js';
import {digest,type GovernedCommerceStore} from './store.js';
import type {CommerceWorker,Task} from './worker.js';
import type {Row} from '../../../intelligence/store.js';
export const simulationEnrollmentSchema=z.object({id:id.max(96),missionId:id,candidateId:id,expectedVersion:z.number().int().positive(),dossierDigest:z.string().regex(/^[a-f0-9]{64}$/),simulationOnly:z.literal(true),acknowledgeNoActualPayment:z.literal(true)}).strict();
export function initializeSimulationEnrollments(store:GovernedCommerceStore){initializeMissionPreparations(store);store.db.exec(`CREATE TABLE IF NOT EXISTS work8_simulation_enrollments(workspace TEXT NOT NULL,id TEXT NOT NULL,mission TEXT NOT NULL,record TEXT NOT NULL,PRIMARY KEY(workspace,id),UNIQUE(workspace,mission));
 CREATE TRIGGER IF NOT EXISTS immutable_work8_enrollment_update BEFORE UPDATE ON work8_simulation_enrollments BEGIN SELECT RAISE(ABORT,'IMMUTABLE_SIMULATION_ENROLLMENT');END;
 CREATE TRIGGER IF NOT EXISTS immutable_work8_enrollment_delete BEFORE DELETE ON work8_simulation_enrollments BEGIN SELECT RAISE(ABORT,'IMMUTABLE_SIMULATION_ENROLLMENT');END;`);}
const planDigest=(t:Task)=>digest({id:t.id,mission:t.mission,workspace:t.workspace,owner:t.owner,baseVersion:t.baseVersion,steps:t.steps});
export function verifySimulationEnrollment(store:GovernedCommerceStore,task:Task){
 const raw=store.db.prepare('SELECT record FROM work8_simulation_enrollments WHERE workspace=? AND id=?').get(task.workspace,task.id);
 if(!raw||String(raw.record).length>16000)throw Error('SIMULATION_ENROLLMENT_MISSING');
 const r=JSON.parse(String(raw.record)),{digest:actual,...body}=r;
 if(actual!==digest(body)||r.workspace!==task.workspace||r.mission!==task.mission||r.owner!==task.owner||r.baseVersion!==task.baseVersion||r.taskPlanDigest!==planDigest(task)||r.classification!=='SIMULATION_EXCLUDED_FROM_ACTUALS'||r.externalEffects!==0||r.paidInference!==0)throw Error('SIMULATION_ENROLLMENT_CORRUPT');
 const history=store.history(task.workspace,task.mission);if(history[(task.baseVersion??0)-1]?.digest!==r.sourceReceiptDigest)throw Error('SIMULATION_ENROLLMENT_SOURCE_CHANGED');
 if(r.preparationDigest){const preparation=readMissionPreparation(store,task.workspace,task.mission);if(!preparation||preparation.digest!==r.preparationDigest||preparation.owner!==task.owner||preparation.dossierDigest!==r.dossierDigest||preparation.assessmentHash!==r.assessmentHash||preparation.requestId!==r.assessmentRequestId||preparation.investigationId!==r.investigationId||history[preparation.preparedVersion-1]?.digest!==preparation.sourceReceiptDigest)throw Error('SIMULATION_PREPARATION_LINEAGE_MISSING');}
 return r;
}
/** Server-only resolver must re-read source qualification and completed assessment proof.
 * The HTTP body contains identities/acknowledgements only, never candidates, facts or approval.
 * A deferred dossier cannot be enrolled. Positive tests use explicitly injected fixture proofs. */
export function enrollQualifiedSimulation(worker:CommerceWorker,workspace:string,owner:string,input:unknown,resolve:(candidateId:string)=>Row){
 id.parse(workspace);id.parse(owner);const command=simulationEnrollmentSchema.parse(input),store=worker.engine.store;initializeSimulationEnrollments(store);
 return store.transaction(()=>{
  const previous=store.db.prepare('SELECT record FROM work8_simulation_enrollments WHERE workspace=? AND id=?').get(workspace,command.id);
  if(previous){const task=worker.get(workspace,command.id);if(!task)throw Error('SIMULATION_TASK_MISSING');const r=verifySimulationEnrollment(store,task);if(r.requestDigest!==digest(command)||r.owner!==owner)throw Error('SIMULATION_ID_CONFLICT');return {task,enrollment:r};}
  const d=resolve(command.candidateId),now=worker.engine.clock();
  if(d.workspace!==workspace||d.candidateId!==command.candidateId||d.digest!==command.dossierDigest||d.grantsAuthority!==false)throw Error('SIMULATION_DOSSIER_STALE');
  if(d.eligibility?.qualified!==true||!Array.isArray(d.eligibility.missing)||d.eligibility.missing.length)throw Error('SIMULATION_QUALIFICATION_REQUIRED');
  if(d.assessment?.status!=='COMPLETED_ASSESSMENT_LINKED'||typeof d.assessment.assessmentHash!=='string'||!(/^[a-f0-9]{64}$/).test(d.assessment.assessmentHash)||d.assessment.candidateBinding?.snapshotDigest!==d.sourceBinding?.snapshotDigest)throw Error('SIMULATION_ASSESSMENT_REQUIRED');
  const history=store.history(workspace,command.missionId),receipt=history.at(-1);if(!receipt||receipt.version!==command.expectedVersion)throw Error('SIMULATION_MISSION_VERSION');
  const state=receipt.state as unknown as CommerceState;
  if(state.externalEffects!==0||state.paidInference!==0||Object.keys(state.orders).length||!state.listing||!qualify(state.candidate,now).qualified||d.canonicalCandidateDigest!==digest({candidate:state.candidate,listing:state.listing}))throw Error('SIMULATION_CANDIDATE_BINDING');
  if(state.phase!=='APPROVED'||state.approval?.actor!==owner||state.approval.revoked||state.approval.digest!==state.candidateDigest||Date.parse(state.approval.expiresAt)<=now)throw Error('SIMULATION_OWNER_APPROVAL_REQUIRED');
  if(state.candidate.offer.currency!==state.candidate.economics.currency||state.candidate.offer.price!==state.candidate.economics.productCost||state.candidate.offer.freight!==state.candidate.economics.freight)throw Error('SIMULATION_CANONICAL_CURRENCY_REQUIRED');
  const payment=state.candidate.evidence.filter(e=>e.kind==='PAYMENT'&&e.verified&&e.provenance.classification==='SYNTHETIC');if(payment.length!==1)throw Error('SIMULATION_PAYMENT_ASSUMPTION_REQUIRED');
  const pending=Number(store.db.prepare("SELECT count(*) n FROM commerce_runtime_tasks WHERE workspace=? AND json_extract(record,'$.status') IN ('PENDING','RUNNING')").get(workspace)?.n);if(pending>=1000)throw Error('QUEUE_BACKPRESSURE');
  if(store.db.prepare('SELECT id FROM commerce_runtime_tasks WHERE workspace=? AND mission=? LIMIT 1').get(workspace,command.missionId))throw Error('SIMULATION_MISSION_ALREADY_QUEUED');
  const candidate=state.candidate,at=new Date(now).toISOString(),orderId='sim-order:'+command.id;
  const order:CanonicalOrder={orderId,workspaceId:workspace,storeId:'isolated',brandId:'work8-simulation',supplierPlatform:'CJ_DROPSHIPPING',connectorId:'cj-interceptor',status:'DRAFT',fulfillmentStatus:'PENDING',items:[{itemId:'sim-line',supplierSku:candidate.offer.sku,supplierProductId:candidate.productId,title:candidate.title,quantity:1,unitCost:candidate.offer.price,currency:candidate.offer.currency}],shippingAddress:{fullName:'Simulated Recipient',addressLine1:'Isolated fixture address',city:'Simulation',state:'Simulation',postalCode:'000000',countryCode:candidate.offer.destination,phone:'00000000'},estimatedCost:candidate.offer.price,estimatedDeliveryDaysMin:candidate.offer.leadDays,estimatedDeliveryDaysMax:candidate.offer.leadDays,currency:candidate.offer.currency,approval:null,supplierOrderId:null,trackingNumber:null,carrier:null,trackingEvents:[],integrationMode:'SANDBOX',createdAt:at,updatedAt:at};
  const actor:Actor={id:'brain-commerce-interceptor',workspace,role:'EXECUTOR'},p=payment[0]!.provenance;
  const tracking={orderId,shipmentId:'sim-shipment:'+command.id,providerId:'sim-provider:'+command.id,carrier:'simulation-carrier',tracking:'sim-tracking:'+command.id,quantity:1,occurredAt:at};
  const commands:Command[]=[{type:'publication_intent',capacity:{account:'isolated',marketplace:candidate.economics.channel,mode:'NEW_ASIN',asin:null,newAsinRemaining:1,unsoldRemaining:1,requestsPerSecond:1,eligibility:'ELIGIBLE',provenance:p}},{type:'intake',order,paymentEvidence:payment[0]!.id},{type:'prepare',orderId,offer:candidate.offer},{type:'intercept',orderId,result:'ACCEPTED',acceptedQuantity:1,providerId:tracking.providerId},{type:'tracking',event:{...tracking,eventId:'sim-shipped:'+command.id,status:'SHIPPED'}},{type:'tracking',event:{...tracking,eventId:'sim-delivered:'+command.id,status:'DELIVERED',proof:'SIMULATED_DELIVERY_NOT_SUPPLIER_EVIDENCE'}}];
  for(const [index,step]of commands.entries())envelopeSchema.parse({id:digest({task:command.id,index}),missionId:command.missionId,expectedVersion:receipt.version+index,command:step});
  const task:Task={id:command.id,mission:command.missionId,workspace,owner,baseVersion:receipt.version,createdAt:now,cursor:0,fence:0,status:'PENDING',error:null,steps:commands.map(command=>({actor,command})),attempts:0,maxSteps:6,maxAttempts:1,paidInference:0};
  const body={id:command.id,workspace,mission:task.mission,owner,attestedBy:'AUTHENTICATED_OWNER',requestDigest:digest(command),dossierDigest:d.digest,sourceSnapshotDigest:d.sourceBinding.snapshotDigest,assessmentHash:d.assessment.assessmentHash,...(d.preparationDigest?{preparationDigest:d.preparationDigest,assessmentRequestId:d.assessment.requestId,investigationId:d.assessment.investigationId,productId:d.supplier.productId,variantId:d.supplier.variantId}:{}),baseVersion:receipt.version,sourceReceiptDigest:receipt.digest,taskPlanDigest:planDigest(task),classification:'SIMULATION_EXCLUDED_FROM_ACTUALS',payment:'EXPLICIT_SYNTHETIC_ASSUMPTION_NOT_ACTUAL_RECEIPT',capacity:'ISOLATED_ONE_LISTING_ASSUMPTION_NOT_MARKETPLACE_PERMISSION',at,externalEffects:0,paidInference:0,birth:'NOT_BORN',commerce:'LOCKED'};
  const enrollment={...body,digest:digest(body)};
  store.db.prepare('INSERT INTO work8_simulation_enrollments VALUES(?,?,?,?)').run(workspace,task.id,task.mission,JSON.stringify(enrollment));
  store.db.prepare('INSERT INTO commerce_runtime_tasks VALUES(?,?,?,?,?)').run(workspace,task.id,task.mission,JSON.stringify(task),0);
  return {task,enrollment};
 });
}

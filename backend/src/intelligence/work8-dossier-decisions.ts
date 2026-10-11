import {z} from 'zod';
import {digest,key} from './model.js';
import type {IntelligenceStore,Row} from './store.js';
export const dossierDecisionSchema=z.object({id:key,candidateId:key,dossierDigest:z.string().regex(/^[a-f0-9]{64}$/),decision:z.enum(['DEFER','REJECT','REQUEST_REVIEW']),reason:z.string().trim().min(10).max(1000)}).strict();
function records(store:IntelligenceStore,workspace:string){return store.use(db=>{
 db.exec(`CREATE TABLE IF NOT EXISTS work8_dossier_decisions(workspace TEXT NOT NULL,id TEXT NOT NULL,candidate TEXT NOT NULL,body TEXT NOT NULL,PRIMARY KEY(workspace,id)) STRICT;
 CREATE TRIGGER IF NOT EXISTS work8_dossier_decisions_no_update BEFORE UPDATE ON work8_dossier_decisions BEGIN SELECT RAISE(ABORT,'IMMUTABLE_DOSSIER_DECISION'); END;
 CREATE TRIGGER IF NOT EXISTS work8_dossier_decisions_no_delete BEFORE DELETE ON work8_dossier_decisions BEGIN SELECT RAISE(ABORT,'IMMUTABLE_DOSSIER_DECISION'); END;`);
 const rows=db.prepare('SELECT body FROM work8_dossier_decisions WHERE workspace=? ORDER BY rowid LIMIT 1001').all(workspace).map(r=>JSON.parse(String(r.body)) as Row);
 if(rows.length>1000)throw Error('DOSSIER_DECISION_HISTORY_BOUND');
 for(const r of rows){const {digest:actual,...body}=r;if(r.workspace!==workspace||actual!==digest(body)||r.grantsAuthority!==false||r.commerce!=='LOCKED'||r.birth!=='NOT_BORN')throw Error('DOSSIER_DECISION_CORRUPT');}
 return rows;
 });}
/** authenticatedOwner is supplied by owner middleware; resolve reads current server evidence.
 * There is deliberately no approval alias: requesting review cannot enroll or authorize commerce. */
export function recordDossierDecision(store:IntelligenceStore,workspace:string,authenticatedOwner:string,input:unknown,resolve:(candidateId:string)=>Row){
 key.parse(workspace);key.parse(authenticatedOwner);const command=dossierDecisionSchema.parse(input);
 const current=resolve(command.candidateId);
 if(current.workspace!==workspace||current.candidateId!==command.candidateId||current.digest!==command.dossierDigest||current.grantsAuthority!==false)throw Error('DOSSIER_DECISION_STALE');
 const prior=records(store,workspace);const old=prior.find(r=>r.id===command.id);
 if(old){if(old.actor!==authenticatedOwner||digest(old.command)!==digest(command))throw Error('DOSSIER_DECISION_ID_CONFLICT');return old;}
 const body={id:command.id,workspace,candidateId:command.candidateId,actor:authenticatedOwner,attestedBy:'AUTHENTICATED_OWNER',command,at:new Date(store.now()).toISOString(),sourceSnapshotDigest:current.sourceBinding?.snapshotDigest??null,dossierDigest:current.digest,classification:'OWNER_REVIEW_DECISION_NOT_COMMERCIAL_APPROVAL',birth:'NOT_BORN',commerce:'LOCKED',grantsAuthority:false,externalEffects:0,paidInference:0};
 const receipt={...body,digest:digest(body)};
 return store.use(db=>{db.exec('BEGIN IMMEDIATE');try{
 const n=Number(db.prepare('SELECT count(*) n FROM work8_dossier_decisions WHERE workspace=?').get(workspace)?.n);if(n>=1000)throw Error('DOSSIER_DECISION_HISTORY_BOUND');
 // Re-read under the write fence: an evidence change between display and submission refuses the decision.
 if(resolve(command.candidateId).digest!==current.digest)throw Error('DOSSIER_DECISION_STALE');
 db.prepare('INSERT INTO work8_dossier_decisions VALUES(?,?,?,?)').run(workspace,command.id,command.candidateId,JSON.stringify(receipt));db.exec('COMMIT');return receipt;
 }catch(e){if(db.isTransaction)db.exec('ROLLBACK');throw e;}});
}
export function readDossierDecisions(store:IntelligenceStore,workspace:string,candidateId:string,currentDigest:string){return records(store,workspace).filter(r=>r.candidateId===candidateId).slice(-20).map(r=>({...r,current:r.dossierDigest===currentDigest}));}

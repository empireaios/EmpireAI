import {readOwnerSimulatedFinance} from './work8-owner-finance.js';
import {z} from 'zod';
import type {GovernedCommerceStore} from './store.js';
const mission=z.string().regex(/^[A-Za-z0-9_.:-]{1,160}$/);
export const missionPageQuery=z.object({missionId:mission.optional(),afterMission:mission.optional(),limit:z.coerce.number().int().min(1).max(200).default(200)}).strict().refine(q=>!q.missionId||!q.afterMission,{message:'Single mission and cursor cannot be combined'});
/** Workspace-scoped lexical cursor. Every returned head is verified through canonical history. */
export function readWork8MissionPage(store:GovernedCommerceStore,workspace:string,input:unknown={}){
 const q=missionPageQuery.parse(input);const ownTransaction=!store.db.isTransaction;if(ownTransaction)store.db.exec('BEGIN');try{
 if(q.afterMission&&!store.db.prepare('SELECT 1 FROM commerce_runtime_receipts WHERE workspace=? AND mission=? LIMIT 1').get(workspace,q.afterMission))throw Error('INVALID_MISSION_CURSOR');
 const total=Number(store.db.prepare('SELECT count(DISTINCT mission) n FROM commerce_runtime_receipts WHERE workspace=? AND (? IS NULL OR mission=?)').get(workspace,q.missionId??null,q.missionId??null)?.n??0);
 const ids=store.db.prepare('SELECT DISTINCT mission FROM commerce_runtime_receipts WHERE workspace=? AND (? IS NULL OR mission=?) AND mission>? ORDER BY mission COLLATE BINARY LIMIT ?').all(workspace,q.missionId??null,q.missionId??null,q.afterMission??'',q.limit+1).map(r=>String(r.mission));
 const hasMore=ids.length>q.limit,selected=ids.slice(0,q.limit),missions=selected.map(id=>store.history(workspace,id).at(-1)!);
 const simulatedFinancials=missions.filter(r=>r.classification==='SYNTHETIC').map(r=>readOwnerSimulatedFinance(store,workspace,r.missionId));
 const result={missions,simulatedFinancials,missionCoverage:{scope:q.missionId?'SINGLE_MISSION':'WORKSPACE_MISSIONS',total,returned:missions.length,limit:q.limit,afterMission:q.afterMission??null,hasMore,next:hasMore?selected.at(-1)!:null,complete:missions.length===total,order:'MISSION_ID_ASC',consistency:'CURRENT_READ_NOT_FROZEN_CROSS_PAGE_SNAPSHOT'}};if(ownTransaction)store.db.exec('COMMIT');return result;
 }catch(error){if(ownTransaction&&store.db.isTransaction)store.db.exec('ROLLBACK');throw error;}
}

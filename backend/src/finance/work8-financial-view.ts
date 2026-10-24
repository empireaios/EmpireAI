import {FinancialCentre,hash} from './financial-centre.js';
import {configureIsolatedBirth,readIsolatedBirth} from './work8-birth-cutover.js';
import {Work8CostIntelligence} from './work8-cost-intelligence.js';
import {z} from 'zod';
export const financialExamWorkspace=(workspace:string,owner:string)=>'work8-twin:finance:'+hash({workspace,owner}).slice(0,32);
export function financialRehearsal(centre:FinancialCentre,workspace:string,owner:string,asOf=new Date().toISOString()){
 const isolated=financialExamWorkspace(workspace,owner),has=(name:string)=>!!centre.db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name=?").get(name);
 const configured=has('work8_birth_cutovers')&&!!centre.db.prepare('SELECT workspace FROM work8_birth_cutovers WHERE workspace=?').get(isolated);
 return {workspace:isolated,birth:configured?readIsolatedBirth(centre,isolated,owner,asOf):null,
  costs:has('work8_cost_observations')?new Work8CostIntelligence(centre,isolated,owner).projection():null,
  liveActivation:false,label:'Isolated financial rehearsal'};
}
export function prepareFinancialBirth(centre:FinancialCentre,workspace:string,owner:string,input:unknown){
 const r=z.object({type:z.literal('work8_birth_rehearsal'),periodId:z.string().min(1).max(120),cutoff:z.string().datetime(),confirmation:z.literal('ISOLATED_ONLY')}).strict().parse(input);
 if(Date.parse(r.cutoff)>Date.now())throw Error('REHEARSAL_CUTOFF_IN_FUTURE');
 return configureIsolatedBirth(centre,{workspace:financialExamWorkspace(workspace,owner),ownerId:owner,periodId:r.periodId,cutoff:r.cutoff,mode:'ISOLATED_EXAMINATION',allocation:'ELAPSED_SERVICE_TIME_INTEGER_REMAINDER'});
}

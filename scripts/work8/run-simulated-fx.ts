import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {GovernedCommerceStore,digest} from '../../backend/src/runtime/commerce-runtime/governed/store.js';
import {GovernedCommerceEngine} from '../../backend/src/runtime/commerce-runtime/governed/engine.js';
import {CommerceWorker} from '../../backend/src/runtime/commerce-runtime/governed/worker.js';
import {projectSimulatedFx} from '../../backend/src/runtime/commerce-runtime/governed/work8-simulated-fx.js';
import type {Work8FinanceEvent} from '../../backend/src/runtime/commerce-runtime/governed/work8-finance.js';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'work8-fx-')),store=new GovernedCommerceStore(path.join(root,'commerce.sqlite')),now=Date.parse('2026-10-11T00:00:00Z');
try{
 const w=new CommerceWorker(new GovernedCommerceEngine(store,()=>now));let t=w.enqueue('synthetic:fx-evidence','synthetic-owner','fx');t=w.runBounded(t.workspace,t.id,4);t=w.tick(t.workspace,t.id,t.fence);
 const receipts=store.history(t.workspace,t.mission),source=receipts.at(-1)!;const pairs:Array<[Work8FinanceEvent['kind'],number]>=[['SALE',8000],['COGS',1600],['FREIGHT',600],['FEE',400],['DUTY',0],['DISCOUNT',0],['SETTLEMENT',7600],['BANK_RECEIPT',7600],['SUPPLIER_PAYMENT',2200]];
 const events=pairs.map(([kind,minor],i):Work8FinanceEvent=>({id:'fx-event-'+i,orderId:'order-fixture',kind,minor,currency:'SGD',sourceReceiptDigest:source.digest,classification:'SIMULATION',assumptionRef:'synthetic:preregistered-fx-exam',at:new Date(now+i*1000).toISOString()}));
 const body={id:'fx-3-over-4',from:'SGD',to:'USD',numerator:3,denominator:4,rounding:'EXACT',observedAt:new Date(now).toISOString(),expiresAt:new Date(now+86400000).toISOString(),classification:'SIMULATION_ASSUMPTION',reference:'synthetic:preregistered-three-quarters'};
 const quote={body,digest:digest(body)},cutoffAt=new Date(now+3600000).toISOString();const projection=projectSimulatedFx(store,t.workspace,t.mission,events,cutoffAt,quote);
 const independentExpected={sourceContributionMinor:8000-1600-600-400,targetContributionMinor:6000-1200-450-300};
 if(projection.source.orders[0]!.contributionMinor!==independentExpected.sourceContributionMinor||projection.translated.orders[0]!.contributionMinor!==independentExpected.targetContributionMinor||digest(store.history(t.workspace,t.mission))!==digest(receipts))throw Error('FX_INDEPENDENT_ORACLE_FAILURE');
 const report={schema:'work8-simulated-fx-exam-v1',result:'PASS_SCOPED_SIMULATED_TRANSLATION',node:process.version,kernelEgress:process.env.WORK8_KERNEL_EGRESS,receipts,events,quote,cutoffAt,projection,independentExpected,sourceHistoryDigest:digest(receipts),supersedesScopeOnly:{report:'finance-boundary-exam-evidence.json',priorTrace:'8e36f73ae56b6c178f11af33beeb56eba30c47cec8faf0f53d7c6cde56e6855d',scope:'Adds explicit rational simulated translation; prior SGD-only canonical qualification finding remains true'},limitations:['No independent USD business qualification','No real market FX quote or bank conversion','EXACT minor-unit conversion only; no implicit fallback rounding'],paidInference:0,externalEffects:0};
 const output=path.resolve('docs/work8/simulated-fx-evidence.json');fs.writeFileSync(output,JSON.stringify(report,null,2));console.log(JSON.stringify({result:report.result,source:independentExpected.sourceContributionMinor,target:independentExpected.targetContributionMinor,sourceReceiptDigest:source.digest,projectionDigest:projection.digest,output}));
}finally{store.close();fs.rmSync(root,{recursive:true,force:true});}

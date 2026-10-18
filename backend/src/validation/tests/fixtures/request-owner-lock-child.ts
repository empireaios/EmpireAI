import {acquireRequestOwnerCaptureFence,persistRequestOwner,type RequestOwnerRecord} from '../../../orchestration/shadow-ceo-integration/request-owner.js';
function owner(id: string): RequestOwnerRecord {
  return {
    requestId: id, runId: `run_${id}`, correlationId: `corr_${id}`,
    completeInstruction: `synthetic ${id}`, suppliedProducts: [], eligibilityRules: {},
    requestedBusinessOperation: "synthetic evaluation", permittedActions: [], prohibitedActions: [],
    requestedAnswerFormat: { expectedLineCount: null, fieldNames: [], requiredToken: null,
      prohibitsExtraProse: false, template: "unspecified" },
    operatingMode: "SYNTHETIC", birthStatus: "NOT_BORN",
    realCommerceAuthority: "unauthorized", createdAt: new Date().toISOString(),
    workspaceId: "ws_capture", instructionDigest: `digest_${id}`,
  };
}

const [mode,id] = process.argv.slice(2);
if(mode==='hold') { acquireRequestOwnerCaptureFence(); process.send?.({ready:true}); setInterval(()=>{},1000); }
else if(mode==='capture') {
 try { const release=acquireRequestOwnerCaptureFence(); release(); release(); process.exit(0); }
 catch(e) { console.error(String(e)); process.exit(7); }
}
else if(mode==='write') {
 try { persistRequestOwner(owner(id!)); process.exit(0); }
 catch(e) { console.error(String(e)); process.exit(7); }
} else if(mode==='batch') {
 for(let i=0;i<20;i++) {
  const deadline=Date.now()+15000;
  for(;;) { try { persistRequestOwner(owner(id+'_'+i)); break; }
   catch(e) { if(!String(e).includes('REQUEST_OWNER_SHARED_CAPTURE_BUSY') || Date.now()>deadline) throw e;
    await new Promise(r=>setTimeout(r,2)); }
  }
 }
} else throw Error('UNKNOWN_MODE');

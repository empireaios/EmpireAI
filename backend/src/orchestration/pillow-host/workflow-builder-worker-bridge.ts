/** Safe offline snapshot; workflow execution remains inside the Pillow worker. */
export function collectWorkflowBuilderWorkerSnapshot() {
  return {computedAt:new Date().toISOString(),missionId:"Q6-11",live:false,engine:{engineVersion:"PILLOW-WBW-001",missionId:"Q6-11",status:"idle",initializedAt:null,latestReport:null},cockpit:{missionId:"Q6-11",status:"idle",workerId:"wkr-workflow-builder-01",workflows:0,runs:0,neverReplaceWorkerBusinessLogic:true,neverReplaceRuntimeScheduling:true,neverReplaceApprovalGovernance:true,neverFabricateSuccessfulWorkflowExecution:true,neverImplementQ612OrLater:true}};
}

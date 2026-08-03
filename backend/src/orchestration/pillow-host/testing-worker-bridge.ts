/** Safe offline snapshot; test execution remains inside the Pillow worker. */
export function collectTestingWorkerSnapshot() {
  return {computedAt:new Date().toISOString(),missionId:"Q6-13",live:false,engine:{engineVersion:"PILLOW-TSW-001",missionId:"Q6-13",status:"idle",initializedAt:null,latestReport:null},cockpit:{missionId:"Q6-13",status:"idle",workerId:"wkr-testing-01",suites:0,runs:0,neverFabricateSuccessfulTests:true,neverModifyUnrelatedProductionCode:true,neverReplaceDeployment:true,neverReplaceCertification:true,neverImplementQ614OrLater:true}};
}

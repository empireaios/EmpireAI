/** Safe offline snapshot; deployments remain inside the Pillow worker. */
export function collectDeploymentWorkerSnapshot() {
  return {computedAt:new Date().toISOString(),missionId:"Q6-14",live:false,engine:{engineVersion:"PILLOW-DPW-001",missionId:"Q6-14",status:"idle",initializedAt:null,latestReport:null},cockpit:{missionId:"Q6-14",status:"idle",workerId:"wkr-deployment-01",packages:0,deployments:0,neverFabricateSuccessfulDeploymentResults:true,neverBypassApprovalGates:true,neverDeployUnvalidatedBuilds:true,neverImplementQ615OrLater:true}};
}

/** Safe offline snapshot; live API operations remain in the Pillow worker. */
export function collectApiIntegrationWorkerSnapshot() {
  return {computedAt:new Date().toISOString(),missionId:"Q6-10",live:false,engine:{engineVersion:"PILLOW-AIW-001",missionId:"Q6-10",status:"idle",initializedAt:null,latestReport:null},cockpit:{missionId:"Q6-10",status:"idle",workerId:"wkr-api-integration-01",integrations:0,requests:0,neverExposeApiSecretsOrCredentials:true,neverFabricateSuccessfulIntegrationTests:true,neverImplementQ611OrLater:true}};
}

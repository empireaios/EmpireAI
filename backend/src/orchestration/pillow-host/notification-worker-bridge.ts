/** Safe offline snapshot; notification delivery remains inside the Pillow worker. */
export function collectNotificationWorkerSnapshot() {
  return {computedAt:new Date().toISOString(),missionId:"Q6-12",live:false,engine:{engineVersion:"PILLOW-NTW-001",missionId:"Q6-12",status:"idle",initializedAt:null,latestReport:null},cockpit:{missionId:"Q6-12",status:"idle",workerId:"wkr-notification-01",providers:0,messages:0,neverReplaceWorkflowOrchestration:true,neverReplaceBusinessLogic:true,neverExposeCredentialsOrSecrets:true,neverFabricateDeliveryResults:true,neverImplementQ613OrLater:true}};
}

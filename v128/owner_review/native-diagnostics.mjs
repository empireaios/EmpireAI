// Closed, non-sensitive terminal metadata only. Never accept an exception,
// stderr, argument, filename, credential, or request value in these fields.
export const NATIVE_STAGES=Object.freeze(['BOOTSTRAP','RESTORE','REDIS','BACKEND','FRONTEND','READY']);
export const NATIVE_REASONS=Object.freeze(['NATIVE_BOOTSTRAP_FAILED','CHILD_START_FAILURE','EARLY_CHILD_EXIT','HARD_DRAIN','ABSOLUTE_EXPIRY','INTERRUPTED','EXACT_EXPORT_ACKNOWLEDGED','NATIVE_STARTUP_FAILED']);
export function projectNativeTerminal(stage,reason,exitCode,controllerAcknowledged){
 if(!NATIVE_STAGES.includes(stage)||!NATIVE_REASONS.includes(reason)
   ||!(exitCode===null||(Number.isInteger(exitCode)&&exitCode>=0&&exitCode<=255))
   ||typeof controllerAcknowledged!=='boolean')return null;
 return {schema:'A09_NATIVE_SUPERVISOR_TERMINAL_V1',stage,reason,exitCode,controllerAcknowledged,acceptanceClaimed:false};
}

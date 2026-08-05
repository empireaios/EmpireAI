const logs: Array<{ event: string; details: string; timestamp: string }> = [];



export function appendAifrtLog(input: { event: string; details: string }) {

  logs.push({ ...input, timestamp: new Date().toISOString() });

}



export function getAifrtLogs() {

  return logs.map((l) => ({ ...l }));

}



export function resetAifrtLogsForTesting() {

  logs.length = 0;

}



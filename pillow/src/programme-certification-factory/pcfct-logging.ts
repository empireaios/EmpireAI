type PcfctLogEntry = {

  timestamp: string;

  event: string;

  details: string;

};



const logs: PcfctLogEntry[] = [];



export function appendPcfctLog(entry: Omit<PcfctLogEntry, "timestamp">) {

  logs.push({ ...entry, timestamp: new Date().toISOString() });

}



export function getPcfctLogs(limit = 100): PcfctLogEntry[] {

  return logs.slice(-limit).map((entry) => ({ ...entry }));

}



export function resetPcfctLogsForTesting() {

  logs.length = 0;

}



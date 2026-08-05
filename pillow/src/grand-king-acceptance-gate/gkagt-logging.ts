type LogEntry = {

  timestamp: string;

  event: string;

  details: string;

};



const logs: LogEntry[] = [];



export function appendGkagtLog(entry: Omit<LogEntry, "timestamp">) {

  logs.push({ timestamp: new Date().toISOString(), ...entry });

}



export function getGkagtLogs(limit = 100) {

  return logs.slice(-limit).map((e) => ({ ...e }));

}



export function resetGkagtLogsForTesting() {

  logs.length = 0;

}


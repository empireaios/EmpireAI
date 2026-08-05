export type IrplnLogEntry = {
  timestamp: string;
  event: string;
  details: string;
};

const logs: IrplnLogEntry[] = [];

export function appendIrplnLog(entry: Omit<IrplnLogEntry, "timestamp">) {
  logs.push({ ...entry, timestamp: new Date().toISOString() });
}

export function getIrplnLogs(limit = 100): IrplnLogEntry[] {
  return logs.slice(-limit).map((entry) => ({ ...entry }));
}

export function resetIrplnLogsForTesting() {
  logs.length = 0;
}

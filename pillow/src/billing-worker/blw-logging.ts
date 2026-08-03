const sensitive=/(card(?:Number)?|cvv|secret|token|authorization)/i;
const logs:Array<{level:string;message:string;data:Record<string,unknown>}>=[];
export function redactBillingValue(value:unknown):unknown { if(typeof value==="string") return "[REDACTED]"; if(Array.isArray(value)) return value.map(redactBillingValue); if(value&&typeof value==="object") return Object.fromEntries(Object.entries(value as Record<string,unknown>).map(([k,v])=>[k,sensitive.test(k)?"[REDACTED]":redactBillingValue(v)])); return value; }
export function appendBlwLog(level:string,message:string,data:Record<string,unknown>={}){logs.push({level,message,data:redactBillingValue(data) as Record<string,unknown>});}
export function getBlwLogs(){return logs.map(x=>({...x,data:{...x.data}}));} export function resetBlwLogsForTesting(){logs.length=0;}

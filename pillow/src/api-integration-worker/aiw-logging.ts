const sensitive=/apiKey|secret|token|password|authorization|credential|clientSecret/i;
export function redactAiwValue(value:unknown):unknown{if(Array.isArray(value))return value.map(redactAiwValue);if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value as Record<string,unknown>).map(([k,v])=>[k,sensitive.test(k)?"[REDACTED]":redactAiwValue(v)]));return value;}
const logs:Array<{timestamp:string;message:string;context:unknown}>=[];
export function appendAiwLog(message:string,context:unknown={}){logs.push({timestamp:new Date().toISOString(),message,context:redactAiwValue(context)});}
export function getAiwLogs(){return logs.map(x=>({...x}));} export function resetAiwLogsForTesting(){logs.length=0;}

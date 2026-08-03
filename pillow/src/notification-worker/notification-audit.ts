import type { NotificationAuditEvent } from "./types.js";
export class NotificationAudit {private values:NotificationAuditEvent[]=[];append(event:string,data:Record<string,unknown>={}){const record={eventId:`ntw-evt-${crypto.randomUUID()}`,event,timestamp:new Date().toISOString(),data};this.values.push(record);return record}list(limit=50){return this.values.slice(-limit)}}

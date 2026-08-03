import type { TestingAuditEvent } from "./types.js";
export class TestingAudit { private events:TestingAuditEvent[]=[];append(event:string,data:Record<string,unknown>={}){const value={eventId:`tsw-evt-${crypto.randomUUID()}`,event,timestamp:new Date().toISOString(),data};this.events.push(value);return value}list(limit=50){return this.events.slice(-limit)} }

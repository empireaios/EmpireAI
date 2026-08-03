import type { NotificationTransport } from "./types.js";
export const DEFAULT_NOTIFICATION_TRANSPORT:NotificationTransport={send:async()=>({success:false,reason:"No notification transport configured"})};

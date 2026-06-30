export {
  GlobalNotificationSchema,
  GlobalNotificationSourceSchema,
  GlobalNotificationTypeSchema,
  NotificationListQuerySchema,
  NotificationTimeGroupSchema,
  NOTIFICATION_TYPE_PRIORITY,
  inferTypeFromSignalPriority,
  priorityForType,
} from "./models/global-notification.js";
export type {
  GlobalNotification,
  GlobalNotificationSource,
  GlobalNotificationType,
  NotificationListQuery,
  NotificationTimeGroup,
} from "./models/global-notification.js";

export {
  getGlobalNotificationRepository,
  resetGlobalNotificationRepository,
} from "./repositories/sqlite-global-notification-repository.js";

export {
  acknowledgeNotification,
  buildGlobalNotificationDashboard,
  createManualNotification,
  getUnreadNotificationCount,
  groupNotificationTime,
  listGlobalNotifications,
  listGroupedGlobalNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  syncGlobalNotifications,
  DEEP_LINKS,
  moduleDeepLink,
} from "./services/global-notification-service.js";

export {
  ingestNotificationsFromSources,
  seedDemoNotification,
} from "./services/notification-ingestion-service.js";

export { registerGlobalNotificationRoutes } from "./routes/global-notification-routes.js";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, X } from "lucide-react";
import {
  acknowledgeNotification,
  fetchNotificationFilters,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  syncNotifications,
  TIME_GROUP_LABELS,
  TYPE_LABELS,
  type GlobalNotification,
  type GlobalNotificationSource,
  type GlobalNotificationType,
  type NotificationTimeGroup,
} from "@/api/notifications";
import { GRAND_KING_COMPANY_ID } from "@/config/constants";
import { useAuth } from "@/context/AuthContext";
import styles from "./NotificationsCenter.module.css";

interface NotificationsCenterProps {
  open: boolean;
  onClose: () => void;
  onUnreadChange?: (count: number) => void;
}

/** GC-03 — Global Notifications Center (ESS + eye-series feed). */
export function NotificationsCenter({ open, onClose, onUnreadChange }: NotificationsCenterProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canUse = user?.role === "founder" || user?.role === "admin";

  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [groups, setGroups] = useState<Array<{ group: NotificationTimeGroup; notifications: GlobalNotification[] }>>(
    [],
  );
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<GlobalNotificationType | "">("");
  const [sourceFilter, setSourceFilter] = useState<GlobalNotificationSource | "">("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [filterOptions, setFilterOptions] = useState<{
    types: GlobalNotificationType[];
    sources: GlobalNotificationSource[];
  }>({ types: [], sources: [] });

  const load = useCallback(async () => {
    if (!canUse) return;
    setLoading(true);
    try {
      await syncNotifications(GRAND_KING_COMPANY_ID);
      const result = await fetchNotifications({
        companyId: GRAND_KING_COMPANY_ID,
        q: query || undefined,
        type: typeFilter || undefined,
        source: sourceFilter || undefined,
        unreadOnly,
        grouped: true,
        limit: 100,
      });
      setGroups(result.groups ?? []);
      setUnreadCount(result.unreadCount);
      onUnreadChange?.(result.unreadCount);
    } catch {
      setGroups([]);
      setUnreadCount(0);
      onUnreadChange?.(0);
    } finally {
      setLoading(false);
    }
  }, [canUse, query, typeFilter, sourceFilter, unreadOnly, onUnreadChange]);

  useEffect(() => {
    if (!open || !canUse) return;
    void fetchNotificationFilters()
      .then(setFilterOptions)
      .catch(() => setFilterOptions({ types: [], sources: [] }));
  }, [open, canUse]);

  useEffect(() => {
    if (!open || !canUse) return;
    void load();
  }, [open, canUse, load]);

  const flatCount = useMemo(
    () => groups.reduce((sum, group) => sum + group.notifications.length, 0),
    [groups],
  );

  async function handleSelect(notification: GlobalNotification) {
    try {
      await markNotificationRead(notification.notificationId);
      setUnreadCount((count) => Math.max(0, count - (notification.readAt ? 0 : 1)));
      onUnreadChange?.(Math.max(0, unreadCount - (notification.readAt ? 0 : 1)));
    } catch {
      // navigation still proceeds
    }
    onClose();
    navigate(notification.deepLink);
  }

  async function handleAcknowledge(event: React.MouseEvent, notification: GlobalNotification) {
    event.stopPropagation();
    await acknowledgeNotification(notification.notificationId);
    void load();
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setUnreadCount(0);
    onUnreadChange?.(0);
    void load();
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await syncNotifications();
      await load();
    } finally {
      setSyncing(false);
    }
  }

  if (!open || !canUse) return null;

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={onClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Notifications center"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>
            <Bell size={18} aria-hidden="true" style={{ verticalAlign: "text-bottom", marginRight: "0.375rem" }} />
            Notifications
            {unreadCount > 0 ? ` (${unreadCount})` : ""}
          </h2>
          <div className={styles.headerActions}>
            <button type="button" className={styles.textButton} onClick={() => void handleSync()} disabled={syncing}>
              {syncing ? "Syncing…" : "Sync"}
            </button>
            {unreadCount > 0 && (
              <button type="button" className={styles.textButton} onClick={() => void handleMarkAllRead()}>
                Mark all read
              </button>
            )}
            <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close notifications">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.searchRow}>
            <Search size={16} aria-hidden="true" />
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Search notifications…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search notifications"
            />
          </div>
          <div className={styles.filterRow}>
            <select
              className={styles.select}
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as GlobalNotificationType | "")}
              aria-label="Filter by type"
            >
              <option value="">All types</option>
              {filterOptions.types.map((type) => (
                <option key={type} value={type}>
                  {TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            <select
              className={styles.select}
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value as GlobalNotificationSource | "")}
              aria-label="Filter by source"
            >
              <option value="">All sources</option>
              {filterOptions.sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
            <label className={styles.select} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(event) => setUnreadOnly(event.target.checked)}
              />
              Unread only
            </label>
          </div>
        </div>

        <div className={styles.body}>
          {loading ? (
            <p className={styles.loading}>Loading notifications…</p>
          ) : flatCount === 0 ? (
            <p className={styles.empty}>No notifications match your filters.</p>
          ) : (
            groups.map(({ group, notifications }) => (
              <section key={group}>
                <h3 className={styles.groupLabel}>{TIME_GROUP_LABELS[group]}</h3>
                <ul className={styles.list}>
                  {notifications.map((notification) => (
                    <li key={notification.notificationId}>
                      <button
                        type="button"
                        className={`${styles.item}${notification.readAt ? "" : ` ${styles.itemUnread}`}`}
                        onClick={() => void handleSelect(notification)}
                      >
                        <div className={styles.itemHeader}>
                          <span className={styles.itemTitle}>{notification.title}</span>
                          <span className={styles.badge} data-type={notification.type}>
                            {TYPE_LABELS[notification.type]}
                          </span>
                        </div>
                        <span className={styles.itemBody}>{notification.body}</span>
                        <div className={styles.itemMeta}>
                          <span>{notification.source.replace(/-/g, " ")}</span>
                          {!notification.acknowledgedAt && (
                            <button
                              type="button"
                              className={styles.ackButton}
                              onClick={(event) => void handleAcknowledge(event, notification)}
                            >
                              Acknowledge
                            </button>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>

        <div className={styles.footer}>GC-03 · ESS + Eye Series · {flatCount} shown</div>
      </div>
    </div>
  );
}

export function useNotificationsUnreadCount(enabled: boolean) {
  const { user } = useAuth();
  const canUse = enabled && (user?.role === "founder" || user?.role === "admin");
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!canUse) return;
    try {
      await syncNotifications(GRAND_KING_COMPANY_ID);
      const result = await fetchNotifications({ companyId: GRAND_KING_COMPANY_ID, limit: 1 });
      setUnreadCount(result.unreadCount);
    } catch {
      setUnreadCount(0);
    }
  }, [canUse]);

  useEffect(() => {
    if (!canUse) return;
    void refresh();
    const interval = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(interval);
  }, [canUse, refresh]);

  return { unreadCount, setUnreadCount, refresh };
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmpirePageShell } from "@/components/empire/EmpirePageShell";
import { ExecutivePanel } from "@/components/system/ExecutivePanel";
import { MissionBriefPanel } from "@/components/system/MissionBriefPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { GRAND_KING_COMPANY_ID } from "@/config/constants";
import {
  canonicalPlatformIdentityLabel,
  canonicalRoleLabel,
  resolveDisplayName,
} from "@/lib/canonical-identity";
import { loadUserSettings, saveUserSettings } from "@/lib/user-settings";
import { paths } from "@/routes/paths";
import styles from "./SettingsPage.module.css";

export function SettingsPage() {
  const { user, logout } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const saved = loadUserSettings(user.id);
    setDisplayName(saved?.displayName ?? user.name);
    setSavedAt(saved?.updatedAt ?? null);
  }, [user]);

  if (!user) return null;

  const currentUser = user;
  const roleLabel = canonicalRoleLabel(currentUser.role, currentUser.platformIdentity);
  const identityLabel = canonicalPlatformIdentityLabel(currentUser.platformIdentity);
  const effectiveName = resolveDisplayName(currentUser, displayName);

  function handleSave() {
    const trimmed = displayName.trim();
    if (!trimmed) return;
    const updatedAt = new Date().toISOString();
    saveUserSettings(currentUser.id, { displayName: trimmed, updatedAt });
    setSavedAt(updatedAt);
    setSaveMessage("Settings saved.");
  }

  return (
    <EmpirePageShell
      eyebrow="System · UX-021"
      title="Empire Settings"
      description="Profile, identity, and account configuration — role terminology follows UID doctrine; settings persist on this device."
      actions={
        <>
          <Link to={paths.dashboard.integrations} className="empireBtnSecondary">
            Integrations Hub
          </Link>
          <Link to={paths.dashboard.infrastructure} className="empireBtnSecondary">
            Back to Infrastructure
          </Link>
          <button type="button" className="empireBtnSecondary" onClick={() => void logout()}>
            Log out
          </button>
        </>
      }
    >
      <MissionBriefPanel
        title="Executive Contract"
        happened={`Signed in as ${effectiveName} · ${roleLabel} · ${identityLabel}.`}
        why="Identity and role terminology must be canonical so every screen speaks the same Empire language (UID-001)."
        next="Update your display name if needed — role is determined by authentication, not selection (UID-003)."
        decision="No platform decision required on this screen."
        blocker="Nothing blocking account access."
      />

      <ExecutivePanel title="Profile & Identity" eyebrow="auth · settings · UID-001">
        <dl className={styles.profileGrid}>
          <div>
            <dt>Display name</dt>
            <dd>
              <input
                type="text"
                className={styles.input}
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setSaveMessage(null);
                }}
                aria-label="Display name"
              />
            </dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{currentUser.email}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>
              <StatusBadge status={currentUser.role.toUpperCase()} label={roleLabel} />
            </dd>
          </div>
          <div>
            <dt>Platform identity</dt>
            <dd>{identityLabel}</dd>
          </div>
          <div>
            <dt>Workspace</dt>
            <dd>{currentUser.workspaceId}</dd>
          </div>
          <div>
            <dt>Company</dt>
            <dd>{GRAND_KING_COMPANY_ID}</dd>
          </div>
        </dl>

        <div className={styles.actions}>
          <button type="button" className="empireBtnPrimary" onClick={handleSave} disabled={!displayName.trim()}>
            Save settings
          </button>
          {saveMessage && <span className={styles.savedHint}>{saveMessage}</span>}
          {savedAt && !saveMessage && (
            <span className={styles.savedHint}>Last saved {new Date(savedAt).toLocaleString()}</span>
          )}
        </div>

        <p className={styles.panelHint} style={{ marginTop: "var(--space-3)" }}>
          Role is not selectable — authentication determines your destination (UID-003). Display name persists locally
          on this device.
        </p>
      </ExecutivePanel>

      <ExecutivePanel title="System Links" eyebrow="Commercial spine">
        <p className="empireCardBody">
          Plan, payment method, and invoices live on Billing. Infrastructure holds connector health and ESIS
          inspectors.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "0.75rem" }}>
          {(currentUser.role === "founder" || currentUser.role === "admin") && (
            <Link to={paths.dashboard.billing} className="empireBtnSecondary">
              Open Billing
            </Link>
          )}
          <Link to={paths.dashboard.infrastructure} className="empireBtnSecondary">
            Open Infrastructure
          </Link>
        </div>
      </ExecutivePanel>
    </EmpirePageShell>
  );
}

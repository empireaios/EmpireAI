import { Moon } from "lucide-react";

import { usePillowCompanion } from "@/context/PillowCompanionContext";
import styles from "./PillowCompanionIcon.module.css";

export function PillowCompanionIcon() {
  const { open, toggleCompanion } = usePillowCompanion();

  return (
    <button
      type="button"
      className={styles.pillowFab}
      data-open={open || undefined}
      aria-label={open ? "Close Pillow Executive Companion" : "Open Pillow Executive Companion"}
      aria-pressed={open}
      onClick={toggleCompanion}
    >
      <Moon size={22} strokeWidth={2.2} aria-hidden="true" />
    </button>
  );
}

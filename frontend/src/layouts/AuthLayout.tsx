import { Outlet } from "react-router-dom";
import styles from "./AuthLayout.module.css";

export function AuthLayout() {
  return (
    <div className={styles.root}>
      <div className={styles.panel}>
        <Outlet />
      </div>
      <aside className={styles.aside} aria-hidden="true">
        <div className={styles.asideContent}>
          <p className={styles.asideTag}>EmpireAI Commerce</p>
          <h2 className={styles.asideTitle}>
            Pick a name and category. AI builds and runs your store.
          </h2>
          <ul className={styles.asideList}>
            <li>AI picks winning products</li>
            <li>AI builds your storefront</li>
            <li>AI runs your ads</li>
            <li>You watch the dashboard</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

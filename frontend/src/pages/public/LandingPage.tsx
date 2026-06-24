import { Link } from "react-router-dom";
import { paths } from "@/routes/paths";
import styles from "./LandingPage.module.css";

export function LandingPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>EmpireAI Commerce</span>
        <nav className={styles.nav}>
          <Link to={paths.login}>Log in</Link>
          <Link to={paths.signup} className={styles.cta}>
            Start my store
          </Link>
        </nav>
      </header>

      <main className={styles.hero}>
        <h1>AI builds and runs your dropshipping store</h1>
        <p>
          Pick a name and category. AI finds products, builds your site, and
          launches ads—you watch the dashboard.
        </p>
        <div className={styles.actions}>
          <Link to={paths.signup} className={styles.primary}>
            Start my store
          </Link>
          <Link to={paths.login} className={styles.secondary}>
            Log in
          </Link>
        </div>
      </main>
    </div>
  );
}

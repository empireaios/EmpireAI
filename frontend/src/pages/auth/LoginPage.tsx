import { Link } from "react-router-dom";
import { paths } from "@/routes/paths";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  return (
    <div className={styles.card}>
      <div className={styles.brand}>
        <div className={styles.logoMark} aria-hidden="true">
          E
        </div>
        <div>
          <h1 className={styles.title}>Log in to EmpireAI Commerce</h1>
          <p className={styles.subtitle}>Welcome back. Your dashboard awaits.</p>
        </div>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Sign in method">
        <button type="button" className={`${styles.tab} ${styles.tabActive}`} role="tab" aria-selected="true">
          Email
        </button>
        <button type="button" className={styles.tab} role="tab" aria-selected="false" disabled>
          Google
        </button>
        <button type="button" className={styles.tab} role="tab" aria-selected="false" disabled>
          Apple
        </button>
      </div>

      <form className={styles.form} onSubmit={(e) => e.preventDefault()} noValidate>
        <div className={styles.field}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>
        <button type="submit" className={styles.primaryButton}>
          Log in
        </button>
      </form>

      <p className={styles.footer}>
        Don&apos;t have an account?{" "}
        <Link to={paths.signup}>Sign up</Link>
      </p>

      <p className={styles.devHint}>
        <Link to={paths.dashboard.profit}>Preview dashboard shell →</Link>
      </p>
    </div>
  );
}

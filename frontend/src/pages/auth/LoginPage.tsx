import { type FormEvent, useState } from "react";

import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { ApiError } from "@/api/client";

import { useAuth } from "@/context/AuthContext";

import { postLoginDestination } from "@/lib/post-login-destination";

import { paths } from "@/routes/paths";

import styles from "./LoginPage.module.css";

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={redirectTo ?? postLoginDestination(user)} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const loggedIn = await login(email, password);
      navigate(redirectTo ?? postLoginDestination(loggedIn), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.brand}>
        <div className={styles.logoMark} aria-hidden="true">
          E
        </div>
        <div>
          <h1 className={styles.title}>Sign in to EmpireAI</h1>
          <p className={styles.subtitle}>Your credentials determine your destination — no role selection</p>
        </div>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.field}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className={styles.primaryButton} disabled={submitting}>
          {submitting ? "Signing in…" : "Log in"}
        </button>
      </form>

      <p className={styles.footer}>
        New to EmpireAI? <Link to={paths.home}>Learn more</Link>
      </p>
    </div>
  );
}

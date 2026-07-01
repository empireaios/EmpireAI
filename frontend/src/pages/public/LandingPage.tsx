import { Link } from "react-router-dom";
import { paths } from "@/routes/paths";
import styles from "./LandingPage.module.css";

const pillars = [
  {
    title: "E-commerce OS",
    body: "One operating system for discovery, brand build, launch, commerce, and scale — not a stack of disconnected tools.",
  },
  {
    title: "AI CEO",
    body: "EmpireAI tells Grand King what to do today: missions, blockers, and the highest-leverage next action.",
  },
  {
    title: "Company Factory",
    body: "A factory that manufactures companies — from product intelligence to brand workspace to launch mission.",
  },
];

const capabilities = [
  "Launch businesses",
  "Operate businesses",
  "Scale businesses",
  "Command revenue & profit",
  "Connect infrastructure",
  "Execute Operation First Dollar",
];

export function LandingPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>
          <span className={styles.logoMark} aria-hidden="true">E</span>
          EmpireAI
        </span>
        <nav className={styles.nav}>
          <Link to={paths.login}>Log in</Link>
          <Link to={paths.login} className={styles.cta}>
            Enter Command Center
          </Link>
        </nav>
      </header>

      <main>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>E-commerce Operating System</p>
          <h1>The factory that manufactures companies.</h1>
          <p className={styles.lead}>
            EmpireAI is the headquarters of a billion-dollar commerce company — an AI CEO, a launch engine,
            and a unified command center to discover, build, launch, operate, and scale real businesses.
          </p>
          <div className={styles.actions}>
            <Link to={paths.login} className={styles.primary}>
              Get Started
            </Link>
            <Link to={paths.login} className={styles.secondary}>
              Grand King Login
            </Link>
          </div>
          <ul className={styles.capabilityList}>
            {capabilities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className={styles.pillars}>
          {pillars.map((pillar) => (
            <article key={pillar.title}>
              <h2>{pillar.title}</h2>
              <p>{pillar.body}</p>
            </article>
          ))}
        </section>

        <section className={styles.ctaSection}>
          <h2>All from one operating system.</h2>
          <p>Stop browsing software. Start operating an empire.</p>
          <Link to={paths.login} className={styles.primary}>
            Open EmpireAI
          </Link>
        </section>
      </main>

      <footer className={styles.footer}>
        <span>EmpireAI — E-commerce OS · Operation First Dollar</span>
        <Link to={paths.login}>Sign in →</Link>
      </footer>
    </div>
  );
}

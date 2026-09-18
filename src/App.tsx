import { useMemo, useState } from 'react'
import { ExperienceErrorBoundary } from './components/ExperienceErrorBoundary'
import { PromoCatchExperience } from './components/PromoCatchExperience'
import { getRuntimeSupport } from './lib/runtimeSupport'
import styles from './App.module.css'

export default function App() {
  const [session, setSession] = useState(0)
  const support = useMemo(() => getRuntimeSupport(), [])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Independent technical concept</p>
        <h1 className={styles.title}>Promo Catch</h1>
        <p className={styles.subtitle}>Interactive retail engagement concept</p>
      </header>

      <main className={styles.main}>
        {support.supported ? (
          // Changing this key remounts both the error boundary and Rive tree,
          // restoring a clean state without reloading the whole page.
          <ExperienceErrorBoundary key={session}>
            <PromoCatchExperience />
          </ExperienceErrorBoundary>
        ) : (
          <p className="runtime-message" role="alert">
            {support.message}
          </p>
        )}
      </main>

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.restart}
          onClick={() => {
            setSession((value) => value + 1)
          }}
        >
          Reiniciar demo
        </button>
      </footer>
    </div>
  )
}

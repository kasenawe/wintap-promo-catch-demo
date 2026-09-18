import { useEffect, useMemo, useState } from 'react'
import {
  Alignment,
  EventType,
  Fit,
  Layout,
  useRive,
} from '@rive-app/react-canvas'
import promoCatchRiv from '../assets/wintap-promo-catch.riv?url'
import {
  ARTBOARD_HEIGHT,
  ARTBOARD_WIDTH,
  PROMO_ARTBOARD,
  PROMO_STATE_MACHINE,
} from '../lib/riveConfig'
import { useContainedSize } from '../lib/useContainedSize'
import styles from './PromoCatchExperience.module.css'

type LoadStatus = 'loading' | 'ready' | 'error'

const ARTBOARD_RATIO = ARTBOARD_WIDTH / ARTBOARD_HEIGHT

export function PromoCatchExperience() {
  const [stageNode, setStageNode] = useState<HTMLElement | null>(null)
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [errorMessage, setErrorMessage] = useState(
    'No se pudo cargar el archivo de la experiencia.',
  )
  const size = useContainedSize(stageNode, ARTBOARD_RATIO)
  const canMountRive = size.width > 0 && size.height > 0
  const riveParams = useMemo(
    () =>
      canMountRive
        ? {
            src: promoCatchRiv,
            artboard: PROMO_ARTBOARD,
            stateMachine: PROMO_STATE_MACHINE,
            autoplay: true,
            // The W, catch and reset listeners write to PromoViewModel inside
            // the .riv. Data Binding must exist for those actions to work.
            autoBind: true,
            shouldDisableRiveListeners: false,
            layout: new Layout({
              fit: Fit.Contain,
              alignment: Alignment.Center,
            }),
            onLoad: () => {
              setStatus('ready')
            },
            onLoadError: (event: { data?: unknown }) => {
              const detail =
                typeof event.data === 'string' && event.data.trim().length > 0
                  ? event.data
                  : 'No se pudo cargar el archivo de la experiencia.'
              setErrorMessage(detail)
              setStatus('error')
            },
          }
        : null,
    [canMountRive],
  )

  const { RiveComponent, rive } = useRive(riveParams, {
    useDevicePixelRatio: true,
  })

  useEffect(() => {
    if (!rive) {
      return
    }

    rive.setupRiveListeners()

    const viewModelInstance = rive.viewModelInstance
    const started = viewModelInstance?.boolean('started')
    const claimed = viewModelInstance?.boolean('claimed')
    const expired = viewModelInstance?.boolean('expired')
    const ctaLabel = viewModelInstance?.string('ctaLabel')
    let revealTimer: ReturnType<typeof setTimeout> | undefined
    let countdownTimer: ReturnType<typeof setInterval> | undefined

    const stopTimers = () => {
      if (revealTimer) {
        clearTimeout(revealTimer)
        revealTimer = undefined
      }
      if (countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = undefined
      }
    }

    const resetCountdown = () => {
      stopTimers()
      if (ctaLabel) {
        ctaLabel.value = 'ATRAPAR [30]'
      }
    }

    const onStartedChange = () => {
      resetCountdown()
      if (!started?.value) {
        return
      }

      let remaining = 30
      revealTimer = setTimeout(() => {
        countdownTimer = setInterval(() => {
          remaining -= 1
          if (ctaLabel) {
            ctaLabel.value = `ATRAPAR [${String(remaining).padStart(2, '0')}]`
          }
          if (remaining <= 0) {
            stopTimers()
            if (expired) {
              expired.value = true
            }
          }
        }, 1_000)
      }, 2_700)
    }

    const onTerminalStateChange = () => {
      if (claimed?.value || expired?.value) {
        stopTimers()
      }
    }

    started?.on(onStartedChange)
    claimed?.on(onTerminalStateChange)
    expired?.on(onTerminalStateChange)
    resetCountdown()

    if (!import.meta.env.DEV) {
      return () => {
        stopTimers()
        started?.off(onStartedChange)
        claimed?.off(onTerminalStateChange)
        expired?.off(onTerminalStateChange)
      }
    }

    const properties = viewModelInstance?.properties ?? []

    // Reading the trigger properties verifies the binding; it does not fire
    // them. The real interaction remains entirely inside Rive.
    const bindReport = {
      hasViewModelInstance: viewModelInstance != null,
      viewModelName: viewModelInstance?.viewModelName ?? null,
      properties: properties.map((property) => ({
        name: property.name,
        type: property.type,
      })),
      hasStarted: started != null,
      hasClaimed: claimed != null,
      hasExpired: expired != null,
      hasCtaLabel: ctaLabel != null,
    }

    console.info('[PromoCatch] Data Binding', bindReport)
    ;(
      window as Window & { __promoBindReport?: typeof bindReport }
    ).__promoBindReport = bindReport

    const onStateChange = (event: { data?: unknown }) => {
      const states = Array.isArray(event.data)
        ? event.data.filter((value) => typeof value === 'string').join(', ')
        : ''
      console.info(
        `[PromoCatch] ${PROMO_STATE_MACHINE} state change:`,
        states || event.data,
      )
      const w = window as Window & { __promoStates?: unknown[] }
      w.__promoStates = w.__promoStates ?? []
      w.__promoStates.push(event.data)
    }

    rive.on(EventType.StateChange, onStateChange)

    return () => {
      stopTimers()
      started?.off(onStartedChange)
      claimed?.off(onTerminalStateChange)
      expired?.off(onTerminalStateChange)
      rive.off(EventType.StateChange, onStateChange)
    }
  }, [rive])

  return (
    <section
      ref={setStageNode}
      className={styles.stage}
      aria-label="Promo Catch interactive experience"
      aria-busy={status === 'loading'}
    >
      <div
        className={styles.frame}
        data-status={status}
        style={
          canMountRive
            ? { width: `${size.width}px`, height: `${size.height}px` }
            : undefined
        }
      >
        {canMountRive ? (
          <RiveComponent
            className={styles.riveHost}
            role="img"
            aria-label="Promo Catch. Toca la W, espera la revelación y atrapa la promoción antes de que termine el contador de treinta segundos."
          />
        ) : null}
        {status !== 'ready' ? (
          <div
            className={styles.status}
            role={status === 'error' ? 'alert' : 'status'}
          >
            <p>{status === 'error' ? errorMessage : 'Cargando experiencia…'}</p>
          </div>
        ) : null}
      </div>
    </section>
  )
}

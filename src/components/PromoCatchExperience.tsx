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

    if (!import.meta.env.DEV) {
      return
    }

    const viewModelInstance = rive.viewModelInstance
    const properties = viewModelInstance?.properties ?? []

    const bindReport = {
      hasViewModelInstance: viewModelInstance != null,
      viewModelName: viewModelInstance?.viewModelName ?? null,
      properties: properties.map((property) => ({
        name: property.name,
        type: property.type,
      })),
      hasClaimPromo: viewModelInstance?.trigger('claimPromo') != null,
      hasExpirePromo: viewModelInstance?.trigger('expirePromo') != null,
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
            aria-label="Promo Catch. Pulsa el botón dentro de la animación para atrapar la promoción antes de que venza."
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

export type RuntimeSupport =
  | { supported: true }
  | { supported: false; message: string }

export function getRuntimeSupport(): RuntimeSupport {
  if (
    typeof WebAssembly !== 'object' ||
    typeof WebAssembly.instantiate !== 'function'
  ) {
    return {
      supported: false,
      message:
        'Este navegador no admite WebAssembly, necesario para ejecutar la experiencia.',
    }
  }

  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) {
      return {
        supported: false,
        message:
          'Este navegador no admite Canvas 2D, necesario para ejecutar la experiencia.',
      }
    }
  } catch {
    return {
      supported: false,
      message: 'No se pudo inicializar Canvas en este navegador.',
    }
  }

  return { supported: true }
}

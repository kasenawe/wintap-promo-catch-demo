import { useEffect, useState } from 'react'

type Size = {
  width: number
  height: number
}

export function useContainedSize(
  element: HTMLElement | null,
  ratio: number,
): Size {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })

  useEffect(() => {
    if (!element) {
      return
    }

    const updateSize = () => {
      const availWidth = element.clientWidth
      const availHeight = element.clientHeight

      if (availWidth <= 0 || availHeight <= 0) {
        return
      }

      const availableRatio = availWidth / availHeight

      if (availableRatio > ratio) {
        const height = availHeight
        setSize({ width: height * ratio, height })
        return
      }

      const width = availWidth
      setSize({ width, height: width / ratio })
    }

    updateSize()

    const observer = new ResizeObserver(() => {
      updateSize()
    })

    observer.observe(element)
    window.addEventListener('resize', updateSize)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateSize)
    }
  }, [element, ratio])

  return size
}

import { expect, test, type ConsoleMessage, type Page } from '@playwright/test'

const VIEWPORTS = [
  { name: '390x844', width: 390, height: 844 },
  { name: '360x800', width: 360, height: 800 },
  { name: '412x915', width: 412, height: 915 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1440x900', width: 1440, height: 900 },
] as const

function attachConsoleGuards(page: Page) {
  const errors: string[] = []

  page.on('pageerror', (error) => {
    errors.push(error.message)
  })

  page.on('console', (message: ConsoleMessage) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })

  return errors
}

async function waitForExperience(page: Page) {
  await page.getByRole('heading', { name: 'Promo Catch' }).waitFor()
  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible({ timeout: 20_000 })
  await expect(async () => {
    const box = await canvas.boundingBox()
    expect(box?.width ?? 0).toBeGreaterThan(100)
    expect(box?.height ?? 0).toBeGreaterThan(100)
  }).toPass({ timeout: 20_000 })
  await expect(page.getByText('Cargando experiencia…')).toHaveCount(0, {
    timeout: 20_000,
  })
  return canvas
}

test.describe('Promo Catch smoke', () => {
  test('loads the canvas without application console errors', async ({
    page,
  }) => {
    const errors = attachConsoleGuards(page)
    await page.goto('/')
    const canvas = await waitForExperience(page)

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow, noarchive, nosnippet',
    )
    await expect(page.getByRole('button', { name: 'Reiniciar demo' })).toBeVisible()
    await expect(canvas).toHaveCount(1)

    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()
    expect(box?.width ?? 0).toBeGreaterThan(100)
    expect(box?.height ?? 0).toBeGreaterThan(100)

    expect(errors, errors.join('\n')).toEqual([])
  })

  test('serves robots.txt that blocks the whole site', async ({ request }) => {
    const response = await request.get('/robots.txt')
    expect(response.ok()).toBeTruthy()
    const body = await response.text()
    expect(body).toMatch(/User-agent:\s*\*/i)
    expect(body).toMatch(/Disallow:\s*\//)
  })
})

test.describe('Promo Catch responsive', () => {
  for (const viewport of VIEWPORTS) {
    test(`fits the artboard at ${viewport.name}`, async ({ page }) => {
      const errors = attachConsoleGuards(page)
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      })
      await page.goto('/')
      const canvas = await waitForExperience(page)

      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        clientHeight: document.documentElement.clientHeight,
      }))

      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1)

      const box = await canvas.boundingBox()
      expect(box).not.toBeNull()
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(-1)
        expect(box.y).toBeGreaterThanOrEqual(-1)
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1)
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1)
        expect(box.width / box.height).toBeCloseTo(390 / 844, 2)
      }

      await expect(page.getByRole('button', { name: 'Reiniciar demo' })).toBeVisible()
      expect(errors, errors.join('\n')).toEqual([])
    })
  }
})

test.describe('Promo Catch interaction', () => {
  test('W reveal and catch targets remain hittable', async ({ page }) => {
    const errors = attachConsoleGuards(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await waitForExperience(page)
    await page.getByRole('button', { name: 'Reiniciar demo' }).click()
    const canvas = await waitForExperience(page)
    const box = await canvas.boundingBox()

    expect(box).not.toBeNull()
    if (!box) {
      return
    }

    const hit = await page.evaluate(
      ({ x, y }) => {
        const element = document.elementFromPoint(x, y)
        return element?.tagName ?? null
      },
      { x: box.x + box.width * 0.5, y: box.y + box.height * 0.481 },
    )

    expect(hit).toBe('CANVAS')
    await canvas.click({
      position: { x: box.width * 0.5, y: box.height * 0.481 },
      force: true,
    })

    await page.waitForTimeout(3_000)
    await canvas.click({
      position: { x: box.width * 0.5, y: box.height * 0.789 },
      force: true,
    })

    await expect(canvas).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reiniciar demo' })).toBeEnabled()
    expect(errors, errors.join('\n')).toEqual([])
  })
})

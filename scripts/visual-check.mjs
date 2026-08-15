import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from '@playwright/test'

const baseURL = process.env.DSH_VISUAL_BASE_URL ?? 'http://127.0.0.1:3188'
const outputDir = resolve(process.env.VISUAL_OUTPUT_DIR ?? 'test-results/visual')
const liveData = process.env.DSH_VISUAL_LIVE === '1'
await mkdir(outputDir, { recursive: true })

function bucket(totalTokens, estimatedCostCny, cacheHitRate = 0.668, calls = 4) {
  const outputTokens = Math.round(totalTokens * 0.18)
  const cacheReadTokens = Math.round(totalTokens * 0.55)
  const cacheWriteTokens = Math.round(totalTokens * 0.02)
  const uncachedInputTokens = totalTokens - outputTokens - cacheReadTokens - cacheWriteTokens
  return {
    uncachedInputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens,
    calls,
    cacheHitCostCny: Number((estimatedCostCny * 0.08).toFixed(4)),
    cacheMissCostCny: Number((estimatedCostCny * 0.42).toFixed(4)),
    outputCostCny: Number((estimatedCostCny * 0.5).toFixed(4)),
    estimatedCostCny,
    pricedCalls: calls,
    unpricedCalls: 0,
    totalTokens,
    cacheHitRate,
  }
}

function series(model, ratio) {
  const dailyValues = [0.4, 0.62, 0.18, 0.74, 0.52, 0.88, 0.31, 0.44, 0.69, 0.22, 0.58, 0.48, 1, 0.91, 0.36]
  const days = Array.from({ length: 31 }, (_, index) => {
    const factor = dailyValues[index] ?? 0
    return { date: `2026-08-${String(index + 1).padStart(2, '0')}`, ...bucket(Math.round(12_200_000 * ratio * factor), Number((0.7 * ratio * factor).toFixed(4)), 0.61 + factor * 0.08, Math.max(0, Math.round(8 * factor))) }
  })
  return {
    ...(model === undefined ? {} : { model }),
    today: '2026-08-15',
    currentWeekStart: '2026-08-10',
    currentMonth: '2026-08',
    selectedMonth: '2026-08',
    totals: {
      today: bucket(Math.round(1_580_000 * ratio), Number((0.55 * ratio).toFixed(4)), 0.668, 4),
      week: bucket(Math.round(42_600_000 * ratio), Number((2.7 * ratio).toFixed(4)), 0.71, 21),
      month: bucket(Math.round(172_300_000 * ratio), Number((8.45 * ratio).toFixed(4)), 0.69, 83),
      allTime: bucket(Math.round(172_300_000 * ratio), Number((8.45 * ratio).toFixed(4)), 0.69, 83),
      selectedMonth: bucket(Math.round(172_300_000 * ratio), Number((8.45 * ratio).toFixed(4)), 0.69, 83),
    },
    days,
  }
}

const usage = {
  provider: 'deepseek-official',
  source: 'local-retained-sessions',
  timeZone: 'Asia/Taipei',
  generatedAt: Date.parse('2026-08-15T08:55:18+08:00'),
  ...series(undefined, 1),
  models: [series('deepseek-v4-flash', 0.785), series('deepseek-v4-pro', 0.215)],
  pricing: {
    currency: 'CNY',
    unitTokens: 1_000_000,
    sourceUrl: 'https://api-docs.deepseek.com/zh-cn/quick_start/pricing/',
    sourceUpdatedAt: '2026-08-13',
    effectiveAt: Date.parse('2026-08-16T16:00:00Z'),
    timeZone: 'Asia/Shanghai',
    currentPhase: 'legacy',
    peakPeriods: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
    models: [
      {
        model: 'deepseek-v4-flash',
        legacy: { cacheHit: 0.02, cacheMiss: 1, output: 2 },
        offPeak: { cacheHit: 0.05, cacheMiss: 1.5, output: 4.5 },
        peak: { cacheHit: 0.1, cacheMiss: 3, output: 9 },
      },
      {
        model: 'deepseek-v4-pro',
        legacy: { cacheHit: 0.025, cacheMiss: 3, output: 6 },
        offPeak: { cacheHit: 0.15, cacheMiss: 4.5, output: 13.5 },
        peak: { cacheHit: 0.3, cacheMiss: 9, output: 27 },
      },
    ],
  },
  coverage: { sessions: 37, failedSessions: 0, durable: true },
}

const balance = {
  ok: true,
  provider: 'deepseek-official',
  baseURL: 'https://api.deepseek.com',
  checkedAt: Date.parse('2026-08-15T08:55:18+08:00'),
  isAvailable: true,
  infos: [{ currency: 'CNY', totalBalance: '96.46', grantedBalance: '0.00', toppedUpBalance: '96.46' }],
}

async function inspectViewport(browser, name, viewport, locale, storageState) {
  const context = await browser.newContext({ viewport, locale, colorScheme: 'light', storageState })
  const page = await context.newPage()
  const consoleErrors = []
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  if (!liveData) {
    await page.route('**/api/api-balance/**', async route => {
      const path = new URL(route.request().url()).pathname
      const body = path.endsWith('/balance') ? balance : usage
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    })
  }
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  for (let step = 0; step < 4; step += 1) {
    const dialog = page.getByRole('dialog')
    if (!await dialog.isVisible().catch(() => false)) break
    const text = await dialog.textContent() ?? ''
    const action = /API\s*key/i.test(text)
      ? dialog.getByRole('button', { name: /稍后配置|Configure later|Skip/i }).first()
      : dialog.getByRole('button', { name: /继续|Continue/i }).last()
    if (await action.count() === 0) throw new Error(`${name}: unexpected onboarding dialog: ${text}`)
    await action.click()
    await page.waitForTimeout(200)
  }
  const trigger = page.locator('[data-api-balance-trigger]')
  await trigger.waitFor({ state: 'visible' })
  await trigger.click()
  const panel = page.locator('[data-api-balance-panel]')
  await panel.waitFor({ state: 'visible' })
  await page.waitForTimeout(250)

  const geometry = await panel.evaluate(element => {
    const rect = element.getBoundingClientRect()
    const overflowing = [...element.querySelectorAll('button')]
      .filter(button => button.getClientRects().length > 0 && button.scrollWidth > button.clientWidth + 1)
      .map(button => button.textContent?.trim() || button.getAttribute('aria-label') || 'button')
    return {
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      horizontalOverflow: element.scrollWidth > element.clientWidth + 1,
      overflowing,
    }
  })
  const { rect, viewport: actual } = geometry
  if (rect.x < 0 || rect.y < 0 || rect.x + rect.width > actual.width + 1 || rect.y + rect.height > actual.height + 1) {
    throw new Error(`${name}: panel escapes viewport: ${JSON.stringify(geometry)}`)
  }
  if (geometry.horizontalOverflow || geometry.overflowing.length > 0) {
    throw new Error(`${name}: horizontal text overflow: ${JSON.stringify(geometry)}`)
  }
  await page.screenshot({ path: resolve(outputDir, `${name}.png`), fullPage: false })
  const nextStorageState = await context.storageState()
  await context.close()
  return { geometry, consoleErrors, storageState: nextStorageState }
}

const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const desktopZh = await inspectViewport(browser, 'desktop-zh-1440x960', { width: 1440, height: 960 }, 'zh-CN')
  const mobileZh = await inspectViewport(browser, 'mobile-zh-390x844', { width: 390, height: 844 }, 'zh-CN', desktopZh.storageState)
  const showcaseZh = await inspectViewport(browser, 'showcase-zh-1440x1100', { width: 1440, height: 1100 }, 'zh-CN', desktopZh.storageState)
  const desktopEn = await inspectViewport(browser, 'desktop-en-1440x960', { width: 1440, height: 960 }, 'en-US', desktopZh.storageState)
  const mobileEn = await inspectViewport(browser, 'mobile-en-390x844', { width: 390, height: 844 }, 'en-US', desktopZh.storageState)
  const showcaseEn = await inspectViewport(browser, 'showcase-en-1440x1100', { width: 1440, height: 1100 }, 'en-US', desktopZh.storageState)
  const results = { desktopZh, mobileZh, showcaseZh, desktopEn, mobileEn, showcaseEn }
  const relevantErrors = Object.values(results)
    .flatMap(result => result.consoleErrors)
    .filter(message => !message.includes('favicon'))
  if (relevantErrors.length > 0) throw new Error(`browser console errors:\n${relevantErrors.join('\n')}`)
  process.stdout.write(`${JSON.stringify({
    outputDir,
    ...Object.fromEntries(Object.entries(results).map(([key, result]) => [key, result.geometry])),
  }, null, 2)}\n`)
} finally {
  await browser.close()
}

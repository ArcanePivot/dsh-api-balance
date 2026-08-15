import type { Context } from '@deepseek-ai/cordis'
import type { CredentialRef } from '@deepseek-ai/dsh-credentials'
import type {} from '@deepseek-ai/dsh-settings'
import type { BalanceInfoView, BalanceView } from './contracts.js'

const PROVIDER = 'deepseek-official' as const
const DEFAULT_BASE_URL = 'https://api.deepseek.com'
const DEFAULT_API_KEY_ENV = 'DEEPSEEK_API_KEY'
const CREDENTIAL_REF_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

interface SettingsDescriptorLike {
  ns: unknown
  value?: {
    baseURL?: unknown
    apiKeyEnv?: unknown
  }
}

interface SettingsLike {
  describe(options: { redactSecrets: boolean }): SettingsDescriptorLike[]
}

interface DeepSeekBalancePayload {
  is_available?: unknown
  balance_infos?: Array<{
    currency?: unknown
    total_balance?: unknown
    granted_balance?: unknown
    topped_up_balance?: unknown
  }>
}

function normalizedBaseURL(value: string): string {
  const url = new URL(value)
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new TypeError('DeepSeek base URL must use HTTP or HTTPS')
  return url.toString().replace(/\/+$/, '')
}

function failure(
  baseURL: string,
  code: Exclude<BalanceView, { ok: true }>['code'],
  message: string,
): BalanceView {
  return { ok: false, provider: PROVIDER, baseURL, checkedAt: Date.now(), code, message }
}

export async function readDeepSeekBalance(
  ctx: Context,
  signal?: AbortSignal,
  fetcher: typeof fetch = globalThis.fetch,
): Promise<BalanceView> {
  let configuredBaseURL: string | undefined
  let apiKeyEnv = DEFAULT_API_KEY_ENV
  const settings = ctx.get('settings') as SettingsLike | undefined
  if (settings !== undefined) {
    try {
      const descriptor = settings.describe({ redactSecrets: true })
        .find(candidate => String(candidate.ns) === 'llm-deepseek')
      const value = descriptor?.value
      if (typeof value?.baseURL === 'string' && value.baseURL.trim().length > 0) configuredBaseURL = value.baseURL.trim()
      if (typeof value?.apiKeyEnv === 'string' && value.apiKeyEnv.trim().length > 0) apiKeyEnv = value.apiKeyEnv.trim()
    } catch {
      // Settings are advisory; environment/default values remain valid fallbacks.
    }
  }

  let baseURL: string
  try {
    baseURL = normalizedBaseURL(configuredBaseURL ?? process.env.DEEPSEEK_BASE_URL ?? DEFAULT_BASE_URL)
  } catch (error) {
    return failure(DEFAULT_BASE_URL, 'upstream', error instanceof Error ? error.message : String(error))
  }

  if (!CREDENTIAL_REF_PATTERN.test(apiKeyEnv)) {
    return failure(baseURL, 'missing-credential', `Invalid DeepSeek credential reference: ${apiKeyEnv}`)
  }

  let apiKey: string | undefined
  const credentials = ctx.get('credentials')
  if (credentials !== undefined) {
    const hit = await credentials.resolve(apiKeyEnv as CredentialRef)
    if (hit !== undefined) apiKey = hit.value
  } else {
    const ambient = process.env[apiKeyEnv]
    if (typeof ambient === 'string' && ambient.length > 0) apiKey = ambient
  }
  if (apiKey === undefined || apiKey.length === 0) {
    return failure(baseURL, 'missing-credential', `DeepSeek API key is not configured (${apiKeyEnv})`)
  }
  let callerAborted = signal?.aborted === true
  if (callerAborted) return failure(baseURL, 'cancelled', 'Balance check was cancelled')

  const controller = new AbortController()
  const abortFromCaller = (): void => {
    callerAborted = true
    controller.abort(signal?.reason)
  }
  signal?.addEventListener('abort', abortFromCaller, { once: true })
  const timeout = setTimeout(() => controller.abort(new Error('timeout')), 10_000)
  try {
    const response = await fetcher(`${baseURL}/user/balance`, {
      headers: { authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    })
    if (!response.ok) return failure(baseURL, 'upstream', `DeepSeek balance API returned HTTP ${response.status}`)
    const payload = await response.json() as DeepSeekBalancePayload
    const infos: BalanceInfoView[] = Array.isArray(payload.balance_infos)
      ? payload.balance_infos.map(info => ({
          currency: String(info.currency ?? ''),
          totalBalance: String(info.total_balance ?? ''),
          grantedBalance: String(info.granted_balance ?? ''),
          toppedUpBalance: String(info.topped_up_balance ?? ''),
        }))
      : []
    return {
      ok: true,
      provider: PROVIDER,
      baseURL,
      checkedAt: Date.now(),
      isAvailable: payload.is_available === true,
      infos,
    }
  } catch (error) {
    if (callerAborted) return failure(baseURL, 'cancelled', 'Balance check was cancelled')
    if (controller.signal.aborted) return failure(baseURL, 'timeout', 'DeepSeek balance request timed out after 10 seconds')
    return failure(baseURL, 'upstream', error instanceof Error ? error.message : String(error))
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', abortFromCaller)
  }
}

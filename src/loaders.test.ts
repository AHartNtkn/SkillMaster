import { describe, it, expect, vi } from 'vitest'
import { loadMarkdown, loadYaml } from './loaders'

function mockFetch(status: number, body: string) {
  return vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, text: () => Promise.resolve(body) })
}

describe('loadMarkdown/loadYaml', () => {
  it('returns file contents on success', async () => {
    vi.stubGlobal('fetch', mockFetch(200, 'ok'))
    await expect(loadMarkdown('/path')).resolves.toBe('ok')
    await expect(loadYaml('/path')).resolves.toBe('ok')
    vi.unstubAllGlobals()
  })

  it('returns placeholder when fetch fails', async () => {
    vi.stubGlobal('fetch', mockFetch(404, ''))
    await expect(loadMarkdown('/missing')).resolves.toBe('Content unavailable')
    await expect(loadYaml('/missing')).resolves.toBe('Content unavailable')
    vi.unstubAllGlobals()
  })

  it('returns placeholder on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')))
    await expect(loadMarkdown('/err')).resolves.toBe('Content unavailable')
    await expect(loadYaml('/err')).resolves.toBe('Content unavailable')
    vi.unstubAllGlobals()
  })
})

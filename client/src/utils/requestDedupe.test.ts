import { describe, expect, it, vi } from 'vitest'
import { createDedupeKey, dedupeRequest } from './requestDedupe'

describe('dedupeRequest', () => {
  it('reuses the same pending request for the same key', async () => {
    const request = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      return 'done'
    })

    const [first, second] = await Promise.all([
      dedupeRequest('todos:list', request),
      dedupeRequest('todos:list', request),
    ])

    expect(first).toBe('done')
    expect(second).toBe('done')
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('preserves numeric arguments when building dedupe keys', () => {
    expect(createDedupeKey('accounts', 0, 20, 'income')).toBe('accounts:0:20:income')
  })
})

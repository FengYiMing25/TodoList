import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { authMiddleware, generateToken } from './auth'

const createReply = () => {
  const reply = {
    code: vi.fn(),
    send: vi.fn(),
  } as unknown as FastifyReply & {
    code: ReturnType<typeof vi.fn>
    send: ReturnType<typeof vi.fn>
  }

  reply.code.mockReturnValue(reply)
  return reply
}

describe('auth middleware', () => {
  const originalSecret = process.env.JWT_SECRET

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret
    vi.restoreAllMocks()
  })

  it('accepts a valid token and attaches the user id', () => {
    process.env.JWT_SECRET = 'test-secret'
    const token = generateToken('user-123')
    const request = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    } as FastifyRequest
    const reply = createReply()
    const done = vi.fn()

    authMiddleware(request, reply, done)

    expect(request.userId).toBe('user-123')
    expect(done).toHaveBeenCalledTimes(1)
    expect(reply.code).not.toHaveBeenCalled()
  })

  it('rejects requests without a bearer token', () => {
    const request = {
      headers: {},
    } as FastifyRequest
    const reply = createReply()
    const done = vi.fn()

    authMiddleware(request, reply, done)

    expect(done).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    )
  })

  it('rejects invalid tokens', () => {
    process.env.JWT_SECRET = 'test-secret'
    const request = {
      headers: {
        authorization: 'Bearer invalid-token',
      },
    } as FastifyRequest
    const reply = createReply()
    const done = vi.fn()

    authMiddleware(request, reply, done)

    expect(done).not.toHaveBeenCalled()
    expect(reply.code).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    )
  })
})

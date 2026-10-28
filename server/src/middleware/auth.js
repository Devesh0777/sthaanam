import { verifyAccessToken } from '../lib/jwt.js'
import { ApiError } from '../lib/errors.js'
import { asyncHandler } from '../lib/http.js'
import { safeEqual } from '../lib/crypto.js'
import env from '../config/env.js'
import prisma from '../config/prisma.js'

const getTokenFromRequest = (req) => {
  const authHeader = req.get('authorization') ?? ''
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim()
  }
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken
  }
  return null
}

/** Verifies the access token and loads a fresh user row from Prisma */
export const authenticate = asyncHandler(async (req, res, next) => {
  const token = getTokenFromRequest(req)
  if (!token) throw ApiError.unauthorized('Authentication required. Missing access token.')

  const payload = verifyAccessToken(token)
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!user) throw ApiError.unauthorized('Account no longer exists')
  if (user.status !== 'ACTIVE') {
    throw ApiError.forbidden(`Account status is ${user.status}. Please contact support.`)
  }

  req.user = user
  req.tokenPayload = payload
  next()
})

/** Attaches req.user when a valid token is present, but never fails the request */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = getTokenFromRequest(req)
  if (!token) return next()
  try {
    return await authenticate(req, res, next)
  } catch {
    return next()
  }
})

/** Role guard middleware - enforces required roles (USER, HOST, ADMIN) */
export const requireRole = (...roles) => {
  const upperRoles = roles.map((r) => r.toUpperCase())
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'))
    }
    const userRole = (req.user.role || '').toUpperCase()
    if (!upperRoles.includes(userRole)) {
      return next(
        new ApiError(
          403,
          'FORBIDDEN',
          `Access forbidden: requires ${roles.join(' or ')} role, but your account is ${req.user.role}`,
        ),
      )
    }
    next()
  }
}

/** Machine-to-machine auth for service integration */
export const requireServiceKey = (req, res, next) => {
  const provided = req.get('x-service-key')
  if (!provided || !safeEqual(provided, env.serviceKey)) {
    return next(ApiError.forbidden('Invalid or missing X-Service-Key'))
  }
  next()
}

import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { asyncHandler, sendData } from '../lib/http.js'
import { authenticate } from '../middleware/auth.js'
import {
  clearTokenCookies,
  loginUser,
  revokeToken,
  rotateRefreshToken,
  setTokenCookies,
  signupUser,
} from '../services/prisma-auth.service.js'

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60, // 60 attempts per 15 minutes
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Please try again later.' } },
})

const router = Router()

// Input validation schemas
const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().email('Please enter a valid email address'),
  phone: z.string().trim().optional().nullable(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z
    .enum(['USER', 'HOST', 'user', 'host', 'Driver', 'Host', 'driver', 'DRIVER'])
    .optional()
    .transform((val) => {
      if (!val) return 'USER'
      const lower = val.toLowerCase()
      return lower === 'host' ? 'HOST' : 'USER'
    }),
})

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

/**
 * POST /auth/signup
 * Create a new USER (Driver) or HOST account
 */
router.post(
  '/signup',
  authLimiter,
  asyncHandler(async (req, res) => {
    const parsed = signupSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid registration details',
          details: parsed.error.issues,
        },
      })
    }

    const result = await signupUser({
      ...parsed.data,
      userAgent: req.get('user-agent'),
    })

    setTokenCookies(res, result)
    sendData(res, result, 201)
  }),
)

/**
 * POST /auth/login
 * Log in with email and password
 */
router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid email or password',
        },
      })
    }

    const result = await loginUser({
      email: parsed.data.email,
      password: parsed.data.password,
      userAgent: req.get('user-agent'),
    })

    setTokenCookies(res, result)
    sendData(res, result)
  }),
)

/**
 * POST /auth/refresh
 * Exchange refresh token (from cookie or body) for new access and refresh tokens
 */
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken || req.body?.refreshToken
    if (!token) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'No refresh token provided' },
      })
    }

    const result = await rotateRefreshToken(token, req.get('user-agent'))
    setTokenCookies(res, result)
    sendData(res, result)
  }),
)

/**
 * POST /auth/logout
 * Revoke refresh token and clear cookies
 */
router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken || req.body?.refreshToken
    if (token) {
      await revokeToken(token)
    }
    clearTokenCookies(res)
    sendData(res, { success: true, message: 'Logged out successfully' })
  }),
)

/**
 * GET /auth/me
 * Get current authenticated user profile
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    sendData(res, { user: req.user })
  }),
)

export default router

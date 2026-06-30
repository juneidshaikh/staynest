import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiter (use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  windowMs: number
  max: number
  message?: string
}

export function rateLimit(config: RateLimitConfig) {
  const { windowMs, max, message = 'Too many requests, please try again later.' } = config

  return function rateLimitMiddleware(req: NextRequest): NextResponse | null {
    const ip = req.headers.get('x-forwarded-for') || 
                req.headers.get('x-real-ip') || 
                '127.0.0.1'
    
    const key = `${ip}:${req.nextUrl.pathname}`
    const now = Date.now()
    
    const record = requestCounts.get(key)
    
    if (!record || now > record.resetTime) {
      requestCounts.set(key, { count: 1, resetTime: now + windowMs })
      return null
    }
    
    record.count++
    
    if (record.count > max) {
      return NextResponse.json(
        { success: false, error: message },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((record.resetTime - now) / 1000)),
            'X-RateLimit-Limit': String(max),
            'X-RateLimit-Remaining': '0',
          }
        }
      )
    }
    
    return null
  }
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key)
    }
  }
}, 5 * 60 * 1000)

// Pre-configured rate limiters
export const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 })
export const apiRateLimit = rateLimit({ windowMs: 60 * 1000, max: 100 })
export const uploadRateLimit = rateLimit({ windowMs: 60 * 1000, max: 20 })

import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// Sesión simple basada en HMAC-SHA256.
// Token = base64url(payload) + "." + base64url(hmac(payload))
// Para uso personal del fan page.

const SESSION_SECRET =
  process.env.SESSION_SECRET || 'douhalaribilive-fan-archive-2026-secret-key'
const COOKIE_NAME = 'douhal_admin_session'
const SESSION_TTL = 1000 * 60 * 60 * 24 * 7 // 7 días

function hmac(data: string): string {
  return crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('base64url')
}

function sign(payload: { adminId: string; exp: number }): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = hmac(body)
  return `${body}.${sig}`
}

function verify(token: string): { adminId: string; exp: number } | null {
  try {
    const [body, sig] = token.split('.')
    if (!body || !sig) return null
    const expected = hmac(body)
    if (sig !== expected) return null
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString())
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null
    if (typeof payload.adminId !== 'string') return null
    return payload as { adminId: string; exp: number }
  } catch {
    return null
  }
}

export function createSession(adminId: string) {
  const token = sign({ adminId, exp: Date.now() + SESSION_TTL })
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_TTL / 1000,
  }
}

export async function getSessionAdmin(req: Request) {
  const cookie = req.headers.get('cookie') || ''
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))
  if (!match) return null
  // El navegador puede URL-encode el punto y otros chars; revertirlo.
  const token = decodeURIComponent(match[1])
  const payload = verify(token)
  if (!payload) return null
  const admin = await db.admin.findUnique({ where: { id: payload.adminId } })
  return admin
}

export function clearSession() {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  }
}

export async function ensureDefaultAdmin() {
  const exists = await db.admin.findFirst()
  if (exists) return
  const hash = await bcrypt.hash('douhal2026', 10)
  await db.admin.create({
    data: { username: 'admin', password: hash },
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { clearSession } from '@/lib/auth'

export async function POST(_req: NextRequest) {
  const cookie = await clearSession()
  const res = NextResponse.json({ ok: true })
  res.cookies.set(cookie.name, cookie.value, cookie)
  return res
}

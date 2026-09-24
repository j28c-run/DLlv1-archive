import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// POST /api/auth/login
// Body: { username, password }
export async function POST(req: NextRequest) {
  const { username, password } = await req.json()
  if (!username || !password) {
    return NextResponse.json({ error: 'Faltan credenciales' }, { status: 400 })
  }
  const admin = await db.admin.findUnique({ where: { username } })
  if (!admin) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 })
  }
  const ok = await bcrypt.compare(password, admin.password)
  if (!ok) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 })
  }
  const cookie = await createSession(admin.id)
  const res = NextResponse.json({ ok: true, username: admin.username })
  res.cookies.set(cookie.name, cookie.value, cookie)
  return res
}

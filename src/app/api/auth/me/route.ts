import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const admin = await getSessionAdmin(req)
  if (!admin) {
    return NextResponse.json({ authenticated: false })
  }
  return NextResponse.json({ authenticated: true, username: admin.username })
}

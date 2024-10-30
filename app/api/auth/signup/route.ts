import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'db.json')

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))

  if (data.users[email]) {
    return NextResponse.json({ error: 'User already exists' }, { status: 400 })
  }

  data.users[email] = { password }
  data.notes[email] = []

  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))

  const response = NextResponse.json({ success: true })
  response.cookies.set('authToken', email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600 // 1 hour
  })
  return response
}
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { sign } from 'jsonwebtoken'

const DB_PATH = path.join(process.cwd(), 'db.json')
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    const data = JSON.parse(await fs.readFile(DB_PATH, 'utf8'))
    const user = data.users.find((u: any) => u.username === username && u.password === password)

    if (user) {
      const token = sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' })
      
      // Set the token as an HTTP-only cookie
      const response = NextResponse.json({ success: true, message: 'Login successful' })
      response.cookies.set('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600, // 1 hour
        path: '/',
      })

      return response
    } else {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 })
    }
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ success: false, message: 'An error occurred during login' }, { status: 500 })
  }
}
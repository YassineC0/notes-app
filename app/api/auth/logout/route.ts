import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  response.cookies.set('authToken', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  })
  return response
}
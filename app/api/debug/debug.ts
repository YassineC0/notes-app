import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'db.json')

export async function GET() {
  try {
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Debug: Error reading database:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
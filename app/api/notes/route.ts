import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { verify, JsonWebTokenError } from 'jsonwebtoken'

const DB_PATH = path.join(process.cwd(), 'db.json')
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function readDatabase() {
  try {
    const fileContent = await fs.readFile(DB_PATH, 'utf8')
    return JSON.parse(fileContent)
  } catch (error) {
    console.error('Error reading or parsing database file:', error)
    throw error
  }
}

async function writeDatabase(data: any) {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error writing to database file:', error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    const authToken = request.cookies.get('authToken')?.value
    if (!authToken) {
      console.error('GET: No authToken provided')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let decoded
    try {
      decoded = verify(authToken, JWT_SECRET) as { userId: string }
    } catch (error) {
      console.error('Invalid token:', error)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    let data = await readDatabase()

    const userNotes = data.notes[decoded.userId] || []
    return NextResponse.json({ notes: userNotes })
  } catch (error) {
    console.error('Unexpected error in GET handler:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authToken = request.cookies.get('authToken')?.value
    if (!authToken) {
      console.error('POST: No authToken provided')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let decoded
    try {
      decoded = verify(authToken, JWT_SECRET) as { userId: string }
    } catch (error) {
      console.error('Invalid token:', error)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { title, content, category } = await request.json()

    let data = await readDatabase()

    if (!data.notes) {
      data.notes = {}
    }
    if (!data.notes[decoded.userId]) {
      data.notes[decoded.userId] = []
    }

    const newNote = {
      id: Date.now(),
      title,
      content,
      category
    }

    data.notes[decoded.userId].push(newNote)

    await writeDatabase(data)

    return NextResponse.json({ message: 'Note added successfully', note: newNote })
  } catch (error) {
    console.error('Unexpected error in POST handler:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
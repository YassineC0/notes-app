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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  console.log('DELETE /api/notes/[id] called with id:', params.id)
  try {
    const authToken = request.cookies.get('authToken')?.value
    if (!authToken) {
      console.error('DELETE: No authToken provided')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let decoded
    try {
      decoded = verify(authToken, JWT_SECRET) as { userId: string }
    } catch (error) {
      console.error('Invalid token:', error)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const noteId = parseInt(params.id)

    console.log('Deleting note:', noteId, 'for user:', decoded.userId)

    let data = await readDatabase()

    if (!data.notes || !data.notes[decoded.userId]) {
      console.error('User notes not found for user:', decoded.userId)
      return NextResponse.json({ error: 'User notes not found' }, { status: 404 })
    }

    const userNotes = data.notes[decoded.userId]
    const noteIndex = userNotes.findIndex((note: any) => note.id === noteId)
    if (noteIndex === -1) {
      console.error('Note not found:', noteId)
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    userNotes.splice(noteIndex, 1)
    data.notes[decoded.userId] = userNotes

    await writeDatabase(data)

    console.log('Note deleted successfully')
    return NextResponse.json({ message: 'Note deleted successfully' })
  } catch (error) {
    console.error('Unexpected error in DELETE handler:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  console.log('PUT /api/notes/[id] called with id:', params.id)
  try {
    const authToken = request.cookies.get('authToken')?.value
    if (!authToken) {
      console.error('PUT: No authToken provided')
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
    const noteId = parseInt(params.id)

    console.log('Updating note:', { noteId, title, content, category })

    let data = await readDatabase()

    if (!data.notes || !data.notes[decoded.userId]) {
      console.error('User notes not found for user:', decoded.userId)
      return NextResponse.json({ error: 'User notes not found' }, { status: 404 })
    }

    const userNotes = data.notes[decoded.userId]
    const noteIndex = userNotes.findIndex((note: any) => note.id === noteId)
    if (noteIndex === -1) {
      console.error('Note not found:', noteId)
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    userNotes[noteIndex] = { ...userNotes[noteIndex], title, content, category }
    data.notes[decoded.userId] = userNotes

    await writeDatabase(data)

    console.log('Note updated successfully')
    return NextResponse.json({ message: 'Note updated successfully', note: userNotes[noteIndex] })
  } catch (error) {
    console.error('Unexpected error in PUT handler:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
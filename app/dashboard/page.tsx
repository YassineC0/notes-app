'use client'

import https from 'https';
import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { PlusCircle, Search, Video, Gift, BookOpen, Briefcase, GraduationCap, FolderKanban, Trash2, Moon, Sun, LogOut } from "lucide-react"

interface Note {
  id: number;
  title: string;
  content: string;
  category: string;
}

interface Category {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const categories: Category[] = [
  { name: "Videos", icon: Video, color: "bg-red-500" },
  { name: "Wishlist", icon: Gift, color: "bg-purple-500" },
  { name: "Assignments", icon: BookOpen, color: "bg-blue-500" },
  { name: "Projects", icon: FolderKanban, color: "bg-green-500" },
  { name: "Work", icon: Briefcase, color: "bg-yellow-500" },
  { name: "Study", icon: GraduationCap, color: "bg-indigo-500" },
  { name: "Personal", icon: BookOpen, color: "bg-pink-500" },
]

function YouTubeEmbed({ url, usePrivacyEnhancedMode = true }: { url: string; usePrivacyEnhancedMode?: boolean }) {
  const videoIdMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu.be\/)([^&?/]+)/)
  const videoId = videoIdMatch ? videoIdMatch[1] : null

  if (!videoId) return null

  const embedUrl = usePrivacyEnhancedMode
    ? `https://www.youtube-nocookie.com/embed/${videoId}`
    : `https://www.youtube.com/embed/${videoId}`

  return (
    <div className="relative" style={{ paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
      <iframe
        src={embedUrl}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="absolute top-0 left-0 w-full h-full rounded-lg"
      ></iframe>
    </div>
  )
}

function NoteContent({ content, category }: { content: string; category: string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const maxLength = 100

  if (category === "Videos" && content.includes("youtube.com")) {
    return <YouTubeEmbed url={content} usePrivacyEnhancedMode={false} />
  }

  if (content.length <= maxLength) {
    return <p className="text-gray-600 dark:text-gray-300 flex-grow">{content}</p>
  }

  return (
    <>
      <p className="text-gray-600 dark:text-gray-300 flex-grow">
        {isExpanded ? content : `${content.slice(0, maxLength)}...`}
      </p>
      <Button
        variant="link"
        onClick={(e) => {
          e.stopPropagation()
          setIsExpanded(!isExpanded)
        }}
        className="mt-2"
      >
        {isExpanded ? "Show Less" : "Show More"}
      </Button>
    </>
  )
}

export default function Dashboard() {
  const [notes, setNotes] = useState<Note[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [newNote, setNewNote] = useState<Omit<Note, 'id'>>({ title: "", content: "", category: "" })
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false)
  const [isEditNoteOpen, setIsEditNoteOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const response = await fetch('/api/auth/check', { credentials: 'include' })
      if (!response.ok) {
        router.push('/')
      } else {
        fetchNotes()
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const fetchNotes = async () => {
    try {
      const agent = new https.Agent({
        rejectUnauthorized: false // WARNING: This is insecure and should only be used for development
      });
  
      const response = await fetch('/api/notes', {
        credentials: 'include',
        agent: process.env.NODE_ENV === 'development' ? agent : undefined
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched notes:', data.notes);
        setNotes(data.notes);
      } else {
        console.error('Failed to fetch notes:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleAddNote = async () => {
    if (newNote.title && newNote.content && newNote.category) {
      try {
        console.log('Sending request to add note:', newNote)
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newNote),
          credentials: 'include'
        })

        console.log('Response status:', response.status)
        const data = await response.json()
        console.log('Response data:', data)

        if (response.ok) {
          setNotes(prevNotes => [...prevNotes, data.note])
          setNewNote({ title: "", content: "", category: "" })
          setIsAddNoteOpen(false)
          console.log('Note added successfully')
          fetchNotes() // Refresh the notes list
        } else {
          console.error('Failed to add note:', data.error)
          alert(`Failed to add note: ${data.error}`)
        }
      } catch (error) {
        console.error('Error adding note:', error)
        alert('An error occurred while adding the note. Please try again.')
      }
    } else {
      console.error('Missing required fields')
      alert('Please fill in all required fields')
    }
  }

  const handleEditNote = async () => {
    if (editingNote && editingNote.title && editingNote.content && editingNote.category) {
      try {
        console.log('Sending request to edit note:', editingNote)
        const response = await fetch(`/api/notes/${editingNote.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editingNote),
          credentials: 'include'
        })

        console.log('Edit note response status:', response.status)
        const data = await response.json()
        console.log('Response data:', data)

        if (response.ok) {
          setNotes(prevNotes => prevNotes.map(note => note.id === editingNote.id ? data.note : note))
          setEditingNote(null)
          setIsEditNoteOpen(false)
          console.log('Note edited successfully')
        } else {
          console.error('Failed to update note:', data.error)
          alert(`Failed to update note: ${data.error || 'Unknown error'}`)
        }
      } catch (error) {
        console.error('Error updating note:', error)
        alert('An error occurred while updating the note. Please try again.')
      }
    } else {
      console.error('Missing required fields')
      alert('Please fill in all required fields')
    }
  }

  const handleDeleteNote = async (id: number) => {
    try {
      console.log('Sending request to delete note:', id)
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      console.log('Delete note response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (response.ok) {
        setNotes(prevNotes => prevNotes.filter(note => note.id !== id))
        setIsEditNoteOpen(false)
        console.log('Note deleted successfully')
      } else {
        console.error('Failed to delete note:', data.error)
        alert(`Failed to delete note: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('An error occurred while deleting the note. Please try again.')
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      if (response.ok) {
        router.push('/')
      } else {
        console.error('Logout failed')
      }
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev)
  }

  const filteredNotes = notes.filter((note) => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          note.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || note.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName)
    return category ? category.color : 'bg-gray-500'
  }

  return (
    <div className={`flex h-screen ${isDarkMode ? 'dark' : ''}`}>
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=2029&q=80')`,
          opacity: isDarkMode ? 0.1 : 0.05
        }}
      ></div>

      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 p-6 shadow-lg relative z-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Notes</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleDarkMode}
            className="rounded-full"
          >
            {isDarkMode ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
        <ul className="space-y-2">
          <li>
            <button
              className={`w-full text-left py-2 px-4 rounded-lg transition-colors duration-200 ${
                selectedCategory === "All"
                  ? "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
              onClick={() => setSelectedCategory("All")}
            >
              All Notes
            </button>
          </li>
          {categories.map((category) => (
            <li key={category.name}>
              <button
                className={`w-full text-left py-2 px-4 rounded-lg flex items-center transition-colors duration-200 ${
                  selectedCategory === category.name
                    ? `${category.color} text-white`
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
                onClick={() => setSelectedCategory(category.name)}
              >
                <category.icon className="mr-2 h-5 w-5" />
                {category.name}
                <span className="ml-auto bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 px-2 py-1 rounded-full text-xs">
                  {notes.filter((note) => note.category === category.name).length}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="absolute bottom-4 left-4 text-sm text-gray-500 dark:text-gray-400">
          Made By: Yassine Ghanmouni
        </div>
        <Button
          variant="outline"
          className="absolute bottom-4 right-4"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 overflow-auto bg-white dark:bg-gray-900 bg-opacity-90 dark:bg-opacity-90 relative z-10">
        <div className="mb-8 flex justify-between items-center">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <Input
              type="text"
              placeholder="Search notes..."
              className="pl-10 pr-4 py-2 w-full rounded-full border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 transition-colors duration-200 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsAddNoteOpen(true)} className="bg-black  hover:bg-gray-800 text-white rounded-full px-6 py-2 flex items-center transition-colors duration-200">
                <PlusCircle className="mr-2 h-5 w-5" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-gray-800">
              <DialogHeader>
                <DialogTitle className="text-gray-800 dark:text-white">Add New Note</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Input
                  placeholder="Title"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
                <Textarea
                  placeholder="Content"
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
                <select
                  className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-gray-200"
                  value={newNote.category}
                  onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.name} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <Button onClick={handleAddNote}>Save Note</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className={`bg-white dark:bg-gray-800 hover:shadow-xl transition-shadow duration-300 cursor-pointer ${getCategoryColor(note.category)} bg-opacity-10`}
              onClick={() => {
                setEditingNote(note)
                setIsEditNoteOpen(true)
              }}
            >
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">{note.title}</h3>
                <NoteContent content={note.content} category={note.category} />
                <div className="mt-4 flex items-center">
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${getCategoryColor(note.category)} text-white`}>
                    {note.category}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isEditNoteOpen} onOpenChange={setIsEditNoteOpen}>
          <DialogContent className="bg-white dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="text-gray-800 dark:text-white">Edit Note</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                placeholder="Title"
                value={editingNote?.title || ""}
                onChange={(e) => setEditingNote(editingNote ? { ...editingNote, title: e.target.value } : null)}
                className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
              <Textarea
                placeholder="Content"
                value={editingNote?.content || ""}
                onChange={(e) => setEditingNote(editingNote ? { ...editingNote, content: e.target.value } : null)}
                className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
              <select
                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-gray-200"
                value={editingNote?.category || ""}
                onChange={(e) => setEditingNote(editingNote ? { ...editingNote, category: e.target.value } : null)}
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.name} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="flex justify-between">
                <Button onClick={handleEditNote}>Save Changes</Button>
                <Button variant="destructive" onClick={() => {
                  if (editingNote) {
                    handleDeleteNote(editingNote.id)
                  }
                }}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Note
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
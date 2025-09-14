import React, { useState } from 'react'
import { Plus, Edit, Trash2, StickyNote } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'

function NotesTab() {
  const { state, addNote, updateNote, deleteNote } = useApp()
  const { notes } = state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [noteForm, setNoteForm] = useState({ title: '', content: '' })
  
  const handleOpenModal = (note = null) => {
    if (note) {
      setEditingNote(note)
      setNoteForm({ title: note.title, content: note.content })
    } else {
      setEditingNote(null)
      setNoteForm({ title: '', content: '' })
    }
    setIsModalOpen(true)
  }
  
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingNote(null)
    setNoteForm({ title: '', content: '' })
  }
  
  const handleSaveNote = () => {
    if (!noteForm.title.trim()) return
    
    if (editingNote) {
      updateNote({
        ...editingNote,
        title: noteForm.title,
        content: noteForm.content,
        updatedAt: new Date().toISOString()
      })
    } else {
      addNote({
        id: Date.now().toString(),
        title: noteForm.title,
        content: noteForm.content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }
    
    handleCloseModal()
  }
  
  const handleDeleteNote = (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteNote(noteId)
    }
  }
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Notes</h2>
            <p className="text-gray-600">
              Take and organize your personal study notes. All notes are stored locally in your browser.
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="btn btn-primary px-4 py-2 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </button>
        </div>
      </div>
      
      {notes.length === 0 ? (
        <div className="card p-8 text-center">
          <StickyNote className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Notes Yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first note to start organizing your study materials.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="btn btn-primary px-6 py-2"
          >
            Create First Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <div
              key={note.id}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-gray-900 truncate flex-1">
                    {note.title}
                  </h3>
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={() => handleOpenModal(note)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {note.content || 'No content'}
                  </p>
                </div>
                
                <div className="text-xs text-gray-500">
                  {note.updatedAt !== note.createdAt ? (
                    <span>Updated {formatDate(note.updatedAt)}</span>
                  ) : (
                    <span>Created {formatDate(note.createdAt)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden border">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {editingNote ? 'Edit Note' : 'Add New Note'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <Plus className="h-6 w-6 rotate-45" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={noteForm.title}
                  onChange={(e) => setNoteForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter note title"
                  className="input w-full"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={noteForm.content}
                  onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter your notes here..."
                  rows={10}
                  className="input w-full resize-none"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 p-6 border-t bg-muted">
              <button
                onClick={handleCloseModal}
                className="btn btn-outline px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                disabled={!noteForm.title.trim()}
                className="btn btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingNote ? 'Update Note' : 'Add Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotesTab
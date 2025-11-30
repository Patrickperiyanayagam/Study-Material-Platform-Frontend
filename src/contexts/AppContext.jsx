import React, { createContext, useContext, useReducer, useEffect } from 'react'

const AppContext = createContext()

const initialState = {
  currentTab: 'upload',
  documents: [],
  isLoading: false,
  error: null,
  modelConfig: {
    chatModel: {
      provider: 'ollama',
      modelName: 'llama3.1:8b',
      temperature: 0.7,
      baseUrl: 'http://localhost:11434'
    },
    quizModel: {
      provider: 'ollama',
      modelName: 'llama3.1:8b',
      temperature: 0.7,
      baseUrl: 'http://localhost:11434'
    },
    flashcardModel: {
      provider: 'ollama',
      modelName: 'llama3.1:8b',
      temperature: 0.7,
      baseUrl: 'http://localhost:11434'
    },
    summaryModel: {
      provider: 'ollama',
      modelName: 'llama3.1:8b',
      temperature: 0.7,
      baseUrl: 'http://localhost:11434'
    }
  },
  // Individual service model configs for per-request usage
  chatModelConfig: {
    provider: 'ollama',
    modelName: 'llama3.1:8b',
    temperature: 0.7,
    baseUrl: 'http://localhost:11434'
  },
  quizModelConfig: {
    provider: 'ollama',
    modelName: 'llama3.1:8b',
    temperature: 0.7,
    baseUrl: 'http://localhost:11434'
  },
  flashcardModelConfig: {
    provider: 'ollama',
    modelName: 'llama3.1:8b',
    temperature: 0.7,
    baseUrl: 'http://localhost:11434'
  },
  summaryModelConfig: {
    provider: 'ollama',
    modelName: 'llama3.1:8b',
    temperature: 0.7,
    baseUrl: 'http://localhost:11434'
  },
  chatSessions: {},
  notes: []
}

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, currentTab: action.payload }
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    
    case 'SET_DOCUMENTS':
      return { ...state, documents: action.payload }
    
    case 'ADD_DOCUMENTS':
      return { 
        ...state, 
        documents: [...state.documents, ...action.payload] 
      }
    
    case 'CLEAR_DOCUMENTS':
      return { ...state, documents: [] }
    
    case 'UPDATE_MODEL_CONFIG':
      return { 
        ...state, 
        modelConfig: { ...state.modelConfig, ...action.payload } 
      }
    
    case 'UPDATE_CHAT_MODEL_CONFIG':
      return { 
        ...state, 
        chatModelConfig: { ...state.chatModelConfig, ...action.payload } 
      }
    
    case 'UPDATE_QUIZ_MODEL_CONFIG':
      return { 
        ...state, 
        quizModelConfig: { ...state.quizModelConfig, ...action.payload } 
      }
    
    case 'UPDATE_FLASHCARD_MODEL_CONFIG':
      return { 
        ...state, 
        flashcardModelConfig: { ...state.flashcardModelConfig, ...action.payload } 
      }
    
    case 'UPDATE_SUMMARY_MODEL_CONFIG':
      return { 
        ...state, 
        summaryModelConfig: { ...state.summaryModelConfig, ...action.payload } 
      }
    
    case 'UPDATE_CHAT_SESSION':
      return {
        ...state,
        chatSessions: {
          ...state.chatSessions,
          [action.payload.sessionId]: action.payload.messages
        }
      }
    
    case 'CLEAR_CHAT_SESSION':
      const { [action.payload]: _, ...remainingSessions } = state.chatSessions
      return { ...state, chatSessions: remainingSessions }
    
    case 'SET_NOTES':
      return { ...state, notes: action.payload }
    
    case 'ADD_NOTE':
      return { 
        ...state, 
        notes: [...state.notes, action.payload] 
      }
    
    case 'UPDATE_NOTE':
      return {
        ...state,
        notes: state.notes.map(note => 
          note.id === action.payload.id ? action.payload : note
        )
      }
    
    case 'DELETE_NOTE':
      return {
        ...state,
        notes: state.notes.filter(note => note.id !== action.payload)
      }
    
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  
  // Load notes from localStorage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('study-platform-notes')
    if (savedNotes) {
      dispatch({ type: 'SET_NOTES', payload: JSON.parse(savedNotes) })
    }
  }, [])
  
  // Save notes to localStorage whenever notes change
  useEffect(() => {
    localStorage.setItem('study-platform-notes', JSON.stringify(state.notes))
  }, [state.notes])
  
  const value = {
    state,
    dispatch,
    // Helper functions
    setTab: (tab) => dispatch({ type: 'SET_TAB', payload: tab }),
    setLoading: (loading) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error) => dispatch({ type: 'SET_ERROR', payload: error }),
    clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
    addDocuments: (docs) => dispatch({ type: 'ADD_DOCUMENTS', payload: docs }),
    clearDocuments: () => dispatch({ type: 'CLEAR_DOCUMENTS' }),
    updateModelConfig: (config) => dispatch({ type: 'UPDATE_MODEL_CONFIG', payload: config }),
    updateChatModelConfig: (config) => dispatch({ type: 'UPDATE_CHAT_MODEL_CONFIG', payload: config }),
    updateQuizModelConfig: (config) => dispatch({ type: 'UPDATE_QUIZ_MODEL_CONFIG', payload: config }),
    updateFlashcardModelConfig: (config) => dispatch({ type: 'UPDATE_FLASHCARD_MODEL_CONFIG', payload: config }),
    updateSummaryModelConfig: (config) => dispatch({ type: 'UPDATE_SUMMARY_MODEL_CONFIG', payload: config }),
    updateChatSession: (sessionId, messages) => 
      dispatch({ type: 'UPDATE_CHAT_SESSION', payload: { sessionId, messages } }),
    clearChatSession: (sessionId) => 
      dispatch({ type: 'CLEAR_CHAT_SESSION', payload: sessionId }),
    addNote: (note) => dispatch({ type: 'ADD_NOTE', payload: note }),
    updateNote: (note) => dispatch({ type: 'UPDATE_NOTE', payload: note }),
    deleteNote: (id) => dispatch({ type: 'DELETE_NOTE', payload: id })
  }
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
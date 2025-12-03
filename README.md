# Study Material Platform - Frontend

Modern React-based frontend with Vite, Tailwind CSS, and intelligent state management for AI-powered document learning experiences.

## 🏗️ Architecture Overview

The frontend follows a component-based architecture with centralized state management:

```
┌─────────────────────────────────────────────────────────────┐
│                    React Application                       │
├─────────────────────────────────────────────────────────────┤
│                     App Context                            │
│           (Centralized State Management)                   │
├─────────────────────────────────────────────────────────────┤
│                      Layout Component                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────┐ │
│  │   Upload    │ │    Chat     │ │    Quiz     │ │ Notes  │ │
│  │     Tab     │ │     Tab     │ │     Tab     │ │  Tab   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────┘ │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ Flashcards  │ │   Summary   │ │   Config    │            │
│  │     Tab     │ │     Tab     │ │     Tab     │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                           │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    API Services                        │ │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐ │ │
│  │ │ Document    │ │    Chat     │ │    Quiz     │ │  Config  │ │ │
│  │ │    API      │ │    API      │ │    API      │ │   API    │ │ │
│  │ └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘ │ │
│  │ ┌─────────────┐ ┌─────────────┐                             │ │
│  │ │ Flashcard   │ │  Summary    │                             │ │
│  │ │    API      │ │    API      │                             │ │
│  │ └─────────────┘ └─────────────┘                             │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                  Utilities & Helpers                       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │         Session Manager & Local Storage                │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Core Components

### 1. Application Context (`src/contexts/AppContext.jsx`)

**Centralized State Management:**
```javascript
const initialState = {
  // Navigation
  currentTab: 'upload',
  
  // Document Management
  documents: [],
  
  // Global States
  isLoading: false,
  error: null,
  
  // Model Configurations
  modelConfig: {},
  chatModelConfig: {},
  quizModelConfig: {},
  flashcardModelConfig: {},
  
  // Chat Management
  chatSessions: {},
  
  // Personal Notes
  notes: []
}
```

**State Actions:**
- `setTab(tab)` - Navigate between tabs
- `setLoading(loading)` - Manage global loading state
- `setError(error)` - Handle error messages
- `addDocuments(documents)` - Update document list
- `updateModelConfig(config)` - Update AI model settings
- `saveChatSession(sessionId, data)` - Persist chat sessions
- `addNote(note)` - Add personal notes

### 2. Tab-Based UI System

#### Upload Tab (`src/components/tabs/UploadTab.jsx`)
**Features:**
- **Drag & Drop Interface**: Intuitive file upload
- **File Validation**: PDF, TXT, DOC, DOCX, PPT, PPTX up to 50MB
- **Real-time Feedback**: Upload progress and validation errors
- **Document Management**: View uploaded documents and clear all

**Key Components:**
```javascript
// File upload handler
const handleFileSelect = (files) => {
  const validFiles = Array.from(files).filter(file => {
    const validTypes = ['.pdf', '.txt', '.docx', '.doc', '.pptx', '.ppt']
    const extension = '.' + file.name.split('.').pop().toLowerCase()
    return validTypes.includes(extension) && file.size <= 50000000
  })
  setSelectedFiles(validFiles)
}

// Document upload
const handleUpload = async () => {
  const result = await documentAPI.upload(selectedFiles)
  addDocuments(result.file_names || [])
}
```

#### Chat Tab (`src/components/tabs/ChatTab.jsx`)
**Features:**
- **Conversational AI**: Interactive chat with document knowledge
- **Session Management**: Persistent conversations across browser sessions
- **Message History**: Full conversation tracking with timestamps
- **Source Attribution**: Citations from uploaded documents with **bold** formatting
- **Model Configuration**: Runtime AI model switching
- **Markdown Rendering**: Clean, formatted responses with proper styling
- **Enhanced Citations**: Source filenames displayed prominently for easy identification

**Chat Architecture:**
```javascript
// Message handling
const handleSendMessage = async () => {
  const response = await chatAPI.sendMessage({
    message: inputMessage,
    session_id: currentSession.id,
    model_configuration: chatModelConfig
  })
  
  // Update session with new messages
  saveChatSession(currentSession.id, {
    ...currentSession,
    messages: [...currentSession.messages, newMessage, response]
  })
}

// Session persistence
const loadChatSessions = () => {
  const sessions = sessionManager.getAllSessions()
  setChatSessions(sessions)
}
```

#### Quiz Tab (`src/components/tabs/QuizTab.jsx`)
**Features:**
- **Interactive Quizzes**: Multiple-choice questions from documents
- **Customizable Settings**: Number of questions, difficulty levels
- **Real-time Scoring**: Instant feedback and explanations
- **Progress Tracking**: Visual progress indicators
- **Export Results**: Download quiz results in multiple formats (PDF, Word, TXT, JSON)
- **Detailed Review**: Complete answer analysis with correct/incorrect indicators

**Quiz Flow:**
```javascript
// Quiz generation
const generateQuiz = async () => {
  const quiz = await quizAPI.generate({
    num_questions: numQuestions,
    difficulty: difficulty,
    topic: selectedTopic,
    model_configuration: quizModelConfig
  })
  setQuizData(quiz)
  setCurrentQuestion(0)
  setAnswers({})
}

// Answer handling
const handleAnswerSelect = (questionIndex, selectedOption) => {
  setAnswers(prev => ({
    ...prev,
    [questionIndex]: selectedOption
  }))
}
```

#### Flashcards Tab (`src/components/tabs/FlashcardsTab.jsx`)
**Features:**
- **Interactive Flashcards**: Front/back card flipping
- **Smart Navigation**: Previous/next with keyboard support
- **Progress Indicators**: Visual progress bar
- **Customization**: Number of cards and topic selection
- **Export Collection**: Download flashcard sets in multiple formats (PDF, Word, TXT, JSON)
- **Card Metadata**: Topic and difficulty information for each card

**Flashcard Logic:**
```javascript
// Card generation
const generateFlashcards = async () => {
  const result = await flashcardAPI.generate({
    num_cards: numCards,
    topic: selectedTopic,
    model_configuration: flashcardModelConfig
  })
  setFlashcards(result)
}

// Card navigation
const nextCard = () => {
  if (currentCard < flashcards.cards.length - 1) {
    setCurrentCard(prev => prev + 1)
    setFlipped(false)
  }
}
```

#### Summary Tab (`src/components/tabs/SummaryTab.jsx`)
**Features:**
- **Document Summarization**: Generate intelligent summaries from uploaded content
- **Length Control**: Short, medium, and long summary options
- **Type Variation**: Overview, key points, detailed analysis, bullet points
- **Topic Filtering**: Focus on specific documents or topics
- **Export Functionality**: Download summaries in multiple formats (PDF, Word, TXT, JSON)
- **Metadata Display**: Word count, reading time, confidence scores
- **Markdown Rendering**: Clean, formatted display with proper headers and styling
- **Professional Layout**: Well-structured responses with organized sections

**Summary Generation:**
```javascript
// Summary configuration
const generateSummary = async () => {
  const result = await summaryAPI.generate({
    length: summarySettings.length,
    type: summarySettings.type,
    topics: summarySettings.selectedTopics,
    model_configuration: summaryModelConfig
  })
  setSummary(result)
}

// Topic selection
const handleTopicToggle = (topic) => {
  setSummarySettings(prev => ({
    ...prev,
    selectedTopics: prev.selectedTopics.includes(topic)
      ? prev.selectedTopics.filter(t => t !== topic)
      : [...prev.selectedTopics, topic]
  }))
}

// Export functionality
const exportSummary = () => {
  const element = document.createElement('a')
  const file = new Blob([summary.content], { type: 'text/plain' })
  element.href = URL.createObjectURL(file)
  element.download = `summary_${summary.type}_${Date.now()}.txt`
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}
```

#### Config Tab (`src/components/tabs/ConfigTab.jsx`)
**Features:**
- **Multi-Provider Support**: Ollama, Groq, OpenRouter, Gemini, OpenAI
- **Model Selection**: Dynamic model lists per provider
- **Service-Specific Config**: Separate models for Chat, Quiz, Flashcard, Summary
- **Parameter Tuning**: Temperature, max tokens, base URLs
- **API Key Management**: Secure credential handling
- **Real-time Updates**: Instant configuration application

**Configuration Management:**
```javascript
// Provider switching
const handleProviderChange = (provider) => {
  setModelConfig(prev => ({
    ...prev,
    provider: provider,
    model_name: getDefaultModel(provider)
  }))
}

// Configuration saving
const saveConfiguration = async () => {
  await configAPI.updateModelConfig(modelConfig)
  updateModelConfig(modelConfig)
}
```

#### Notes Tab (`src/components/tabs/NotesTab.jsx`)
**Features:**
- **Enhanced Note-Taking**: Large content area with improved UI for extensive note writing
- **Local Persistence**: Browser localStorage storage
- **Export Individual Notes**: Download specific notes in multiple formats (PDF, Word, TXT, JSON)
- **Safe Deletion**: Custom confirmation modal with note preview before deletion
- **Improved UX**: Larger textarea (300px min-height) for better writing experience
- **Action Icons**: Download, edit, and delete actions for each note with tooltips

### 3. Session Management System

**Location**: `src/utils/sessionManager.js`

**Core Features:**
```javascript
class SessionManager {
  // Session creation
  createSession(type = 'chat') {
    const session = {
      id: generateUUID(),
      type: type,
      created_at: new Date().toISOString(),
      messages: [],
      metadata: {}
    }
    this.saveSession(session)
    return session
  }
  
  // Server health monitoring
  async checkServerHealth() {
    try {
      await fetch('/health')
      return true
    } catch {
      this.clearAllSessions() // Clean up on server restart
      return false
    }
  }
  
  // Session analytics
  getSessionStats() {
    const sessions = this.getAllSessions()
    return {
      totalSessions: sessions.length,
      totalMessages: sessions.reduce((acc, s) => acc + s.messages.length, 0),
      activeToday: sessions.filter(s => isToday(s.created_at)).length
    }
  }
}
```

### 4. API Service Layer

**Location**: `src/services/api.js`

**Service Architecture:**
```javascript
// Base API configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 300000, // 5 minutes for AI processing
})

// Document API
export const documentAPI = {
  upload: (files) => api.post('/api/upload/documents', formData),
  clear: () => api.delete('/api/upload/documents'),
  status: () => api.get('/api/upload/status')
}

// Chat API
export const chatAPI = {
  sendMessage: (data) => api.post('/api/chat/message', data),
  getHistory: (sessionId) => api.get(`/api/chat/sessions/${sessionId}/history`),
  clearSession: (sessionId) => api.delete(`/api/chat/sessions/${sessionId}`),
  status: () => api.get('/api/chat/status')
}

// Quiz API
export const quizAPI = {
  generate: (data) => api.post('/api/quiz/generate', data),
  status: () => api.get('/api/quiz/status')
}

// Flashcard API
export const flashcardAPI = {
  generate: (data) => api.post('/api/flashcards/generate', data),
  status: () => api.get('/api/flashcards/status')
}

// Configuration API
export const configAPI = {
  updateModelConfig: (config) => api.post('/api/config/models', config),
  getModelConfig: () => api.get('/api/config/models'),
  getProviders: () => api.get('/api/config/providers'),
  status: () => api.get('/api/config/status')
}
```

### 5. Export System

**Location**: `src/utils/exportUtils.js`

**Universal Export Functionality:**
The application features a comprehensive export system that allows users to download content in multiple formats across all major features.

**Supported Export Formats:**
```javascript
// Export formats supported
const formats = {
  PDF: 'Styled document with print functionality',
  DOCX: 'Microsoft Word compatible HTML format', 
  TXT: 'Clean plain text format',
  JSON: 'Structured data for programmatic use'
}

// Export functions
export const exportSummary = async (summaryData, format, filename)
export const exportQuiz = async (quizData, userAnswers, format, filename)
export const exportFlashcards = async (flashcardData, format, filename)
export const exportNote = async (noteData, format, filename)
```

**Export Modal Component:**
```javascript
// Reusable export modal with format selection
<ExportModal
  isOpen={showExportModal}
  onClose={() => setShowExportModal(false)}
  onExport={handleExport}
  title="Export Content"
/>

// Format selection with icons and descriptions
const formatOptions = [
  { value: 'pdf', label: 'PDF Document', icon: FileText },
  { value: 'docx', label: 'Word Document', icon: FileText },
  { value: 'txt', label: 'Plain Text', icon: File },
  { value: 'json', label: 'JSON Data', icon: Code }
]
```

**Content-Specific Export Features:**

**Quiz Export:**
- Complete quiz results with score and statistics
- Question-by-question review with correct/incorrect indicators
- User answers vs. correct answers comparison
- Explanations included when available

**Summary Export:**
- Summary content with full metadata
- Configuration settings (type, length, topics)
- Reading time and confidence scores
- Markdown formatting preserved in PDF/Word

**Flashcard Export:**
- Complete card collections with front/back content
- Topic and difficulty metadata for each card
- Organized format for easy review and printing

**Notes Export:**
- Individual note export with title and content
- Creation and modification timestamps
- Markdown formatting support
- Custom filename selection

## 🎨 UI/UX Features

### Design System

**Tailwind CSS Classes:**
```css
/* Primary Components */
.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-colors;
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700;
}

.card {
  @apply bg-white rounded-lg shadow-sm border;
}

.input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg;
}

/* Loading States */
.spinner {
  @apply animate-spin rounded-full border-2 border-gray-300 border-t-primary-600;
}
```

**Responsive Design:**
- **Mobile-First**: Optimized for all screen sizes
- **Breakpoints**: sm, md, lg, xl responsive breakpoints
- **Touch-Friendly**: Large tap targets for mobile
- **Accessibility**: ARIA labels and keyboard navigation

### Interactive Elements

**Loading Spinners:**
```javascript
const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }
  
  return (
    <div className={`${sizeClasses[size]} ${className} spinner`} />
  )
}
```

**Error Handling:**
```javascript
const ErrorMessage = ({ error, onDismiss }) => {
  if (!error) return null
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <span className="text-red-800">{error}</span>
        <button onClick={onDismiss} className="text-red-600">×</button>
      </div>
    </div>
  )
}
```

### Enhanced Response Formatting

**React Markdown Integration:**
The application now uses `react-markdown` to render properly formatted responses in both Chat and Summary tabs.

**Key Features:**
```javascript
import ReactMarkdown from 'react-markdown'

// Chat message rendering
<div className="prose prose-gray max-w-none">
  <ReactMarkdown>
    {message.content}
  </ReactMarkdown>
</div>

// Summary content rendering  
<div className="prose prose-gray max-w-none">
  <ReactMarkdown>
    {summary?.content || 'Summary content would appear here...'}
  </ReactMarkdown>
</div>
```

**Styling Benefits:**
- **Proper Headers**: ## and ### rendered with appropriate sizes and spacing
- **Bold Text**: **Important terms** displayed with proper emphasis
- **Bullet Points**: Clean list formatting with consistent spacing
- **Source Citations**: Filenames displayed in **bold** for easy identification
- **Professional Layout**: Clean, readable formatting with proper typography

**Tailwind Prose Integration:**
- Uses `prose prose-gray` classes for consistent typography
- `max-w-none` allows full-width content display
- Maintains consistent styling across all formatted responses

## 📱 User Experience Flow

### Complete User Journey

1. **Document Upload**
   ```
   Landing → Upload Tab → Drag Files → Validation → 
   Upload Progress → Processing Confirmation → Ready State
   ```

2. **Chat Interaction**
   ```
   Chat Tab → Session Creation → Message Input → 
   AI Processing → Response Display → History Update
   ```

3. **Quiz Generation**
   ```
   Quiz Tab → Settings Selection → Generation Request → 
   Loading State → Interactive Quiz → Results Display
   ```

4. **Flashcard Review**
   ```
   Flashcard Tab → Generation → Card Display → 
   Flip Animation → Navigation → Progress Tracking
   ```

### State Persistence

**Local Storage Schema:**
```javascript
// Chat sessions
localStorage.setItem('chat-sessions', JSON.stringify({
  'session-id-1': {
    id: 'session-id-1',
    created_at: '2024-01-01T12:00:00Z',
    messages: [...],
    metadata: {}
  }
}))

// User preferences
localStorage.setItem('user-preferences', JSON.stringify({
  defaultModelConfig: {...},
  theme: 'light',
  autoSave: true
}))

// Personal notes
localStorage.setItem('user-notes', JSON.stringify([
  {
    id: 'note-1',
    title: 'Study Notes',
    content: 'My notes...',
    created_at: '2024-01-01T12:00:00Z'
  }
]))
```

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+**
- **npm or yarn**

### Installation

1. **Clone and Setup**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Configuration**
   ```bash
   # Create .env file
   echo "VITE_API_BASE_URL=http://localhost:8000" > .env
   ```

3. **Development Server**
   ```bash
   npm run dev
   ```

4. **Production Build**
   ```bash
   npm run build
   npm run preview
   ```

### Available Scripts

```json
{
  "dev": "vite",              // Development server
  "build": "vite build",      // Production build
  "preview": "vite preview",  // Preview built app
  "lint": "eslint src",       // Code linting
  "test": "vitest"            // Run tests
}
```

## 🧪 Testing

### Component Testing

**Test Structure:**
```javascript
// Example: UploadTab.test.jsx
describe('UploadTab', () => {
  test('renders file upload interface', () => {
    render(<UploadTab />)
    expect(screen.getByText('Drop files here')).toBeInTheDocument()
  })
  
  test('validates file types', () => {
    const invalidFile = new File(['content'], 'test.exe', {
      type: 'application/exe'
    })
    // Test file validation logic
  })
})
```

**Integration Testing:**
```javascript
// Example: API integration test
test('chat message flow', async () => {
  const mockResponse = { response: 'AI response', sources: [] }
  vi.spyOn(chatAPI, 'sendMessage').mockResolvedValue(mockResponse)
  
  // Test complete chat flow
  render(<ChatTab />)
  // ... test interactions
})
```

### E2E Testing

**Cypress Tests:**
```javascript
// cypress/e2e/upload-flow.cy.js
describe('Document Upload Flow', () => {
  it('should upload documents successfully', () => {
    cy.visit('/')
    cy.get('[data-testid="file-input"]').selectFile('test-document.pdf')
    cy.get('[data-testid="upload-button"]').click()
    cy.contains('Documents uploaded successfully').should('be.visible')
  })
})
```

## 📊 Performance Optimization

### Build Optimization

**Vite Configuration:**
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react'],
          api: ['axios']
        }
      }
    }
  }
})
```

### Runtime Performance

**Code Splitting:**
```javascript
// Lazy load components
const ChatTab = lazy(() => import('./components/tabs/ChatTab'))
const QuizTab = lazy(() => import('./components/tabs/QuizTab'))

// Suspense wrapper
<Suspense fallback={<LoadingSpinner />}>
  <ChatTab />
</Suspense>
```

**Memoization:**
```javascript
// Memo for expensive components
const ExpensiveComponent = memo(({ data }) => {
  return <div>{/* Complex rendering */}</div>
})

// useMemo for calculations
const processedData = useMemo(() => {
  return expensiveCalculation(rawData)
}, [rawData])
```

## 🎨 Styling & Theming

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
```

### Component Variants

**Button Variants:**
```javascript
const buttonVariants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
}

const Button = ({ variant = 'primary', children, ...props }) => {
  return (
    <button 
      className={`btn ${buttonVariants[variant]}`}
      {...props}
    >
      {children}
    </button>
  )
}
```

## 🔧 Configuration

### Environment Variables

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Feature Flags
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=false

# Build Configuration
VITE_APP_VERSION=1.0.0
VITE_BUILD_TARGET=production
```

### Build Configuration

**Development:**
```javascript
// Development settings
const devConfig = {
  server: {
    port: 5173,
    host: true,
    cors: true
  },
  define: {
    __DEV__: true
  }
}
```

**Production:**
```javascript
// Production settings
const prodConfig = {
  build: {
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      external: ['react', 'react-dom']
    }
  }
}
```

## 🚀 Deployment

### Static Site Deployment

**Build and Deploy:**
```bash
# Build for production
npm run build

# Deploy to various platforms
# Vercel
vercel --prod

# Netlify
netlify deploy --prod --dir=dist

# GitHub Pages
npm run build && gh-pages -d dist
```

### Docker Deployment

```dockerfile
# Multi-stage build
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🤝 Contributing

### Development Guidelines

1. **Code Style**: Use Prettier and ESLint
2. **Component Structure**: Follow established patterns
3. **State Management**: Use Context for global state
4. **Testing**: Write tests for new components
5. **Documentation**: Update README for new features

### Component Development

**Component Template:**
```javascript
import React, { useState, useEffect } from 'react'
import { useApp } from '../contexts/AppContext'

function NewComponent({ prop1, prop2 }) {
  const { state, actions } = useApp()
  const [localState, setLocalState] = useState(null)
  
  useEffect(() => {
    // Component initialization
  }, [])
  
  const handleAction = () => {
    // Event handling
  }
  
  return (
    <div className="component-container">
      {/* Component JSX */}
    </div>
  )
}

export default NewComponent
```

---

**Built with React, Vite, and Tailwind CSS for modern, responsive user experiences.**
import React, { useState, useRef, useEffect } from 'react'
import { Send, MessageCircle, History, Trash2, Bot, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useApp } from '../../contexts/AppContext'
import { chatAPI } from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'
import SessionManager from '../../utils/sessionManager'

function ChatTab() {
  const { state, setLoading, setError, clearError, setTab } = useApp()
  const { isLoading, documents, chatModelConfig } = state
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef(null)
  
  // Persistent session management using SessionManager
  const [sessionId, setSessionId] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  // Initialize session manager and load messages
  useEffect(() => {
    const initializeSession = async () => {
      try {
        console.log('🚀 Initializing chat session...')
        const initializedSessionId = await SessionManager.initialize()
        setSessionId(initializedSessionId)
        
        // Load messages for this session
        const savedMessages = SessionManager.loadMessages(initializedSessionId)
        setMessages(savedMessages)
        
        setIsInitialized(true)
        console.log(`✅ Chat session initialized: ${initializedSessionId}`)
        
      } catch (error) {
        console.error('Failed to initialize session:', error)
        // Fallback to basic session
        const fallbackSession = SessionManager.getOrCreateSession()
        setSessionId(fallbackSession)
        setIsInitialized(true)
      }
    }
    
    initializeSession()
  }, [])
  
  // Save messages using SessionManager whenever messages change
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      SessionManager.saveMessages(sessionId, messages)
    }
  }, [messages, sessionId])
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100)
    return () => clearTimeout(timer)
  }, [messages])
  
  // Cleanup session on component unmount (when user navigates away)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Keep the session alive - only clear on explicit action
      console.log('💾 Chat session persisted across page refresh/navigation')
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !sessionId) return
    
    const userMessage = { 
      role: 'user', 
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    // Add user message immediately
    setMessages(prev => [...prev, userMessage])
    const currentInput = inputMessage.trim()
    setInputMessage('')
    
    try {
      clearError()
      setLoading(true)
      
      console.log(`💬 Sending message to API with session: ${sessionId}`)
      console.log(`📝 Message: ${currentInput}`)
      console.log(`🔧 Model config:`, chatModelConfig)
      
      const response = await chatAPI.sendMessage(currentInput, sessionId, chatModelConfig)
      
      const assistantMessage = { 
        role: 'assistant', 
        content: response.response,
        sources: response.sources || [],
        timestamp: new Date().toISOString(),
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
      
      // Add assistant message
      setMessages(prev => [...prev, assistantMessage])
      
      console.log(`✅ Received response (${response.response.length} chars)`)
      
    } catch (error) {
      console.error('❌ Chat API Error:', error)
      setError(error.message)
      
      // Remove the user message if there was an error
      setMessages(prev => prev.slice(0, -1))
      
      // Add error message
      const errorMessage = {
        role: 'system',
        content: `❌ Error: ${error.message}`,
        timestamp: new Date().toISOString(),
        id: `error-${Date.now()}`
      }
      setMessages(prev => [...prev, errorMessage])
      
    } finally {
      setLoading(false)
    }
  }
  
  const clearChatHistory = () => {
    if (!sessionId) return
    
    try {
      console.log('🗑️ Clearing chat history')
      setMessages([])
      SessionManager.clearSession(sessionId)
      console.log('✅ Chat history cleared successfully')
    } catch (error) {
      console.error('Failed to clear chat history:', error)
    }
  }
  
  const startNewSession = () => {
    try {
      console.log('🆕 Starting new chat session')
      
      const newSessionId = SessionManager.startNewSession()
      if (newSessionId) {
        setSessionId(newSessionId)
        setMessages([])
        console.log(`✅ New session started: ${newSessionId}`)
      }
    } catch (error) {
      console.error('Failed to start new session:', error)
    }
  }
  
  const loadChatHistoryFromServer = async () => {
    try {
      setLoading(true)
      console.log(`🔄 Loading chat history from server for session: ${sessionId}`)
      
      const response = await chatAPI.getHistory(sessionId)
      if (response.messages && response.messages.length > 0) {
        const serverMessages = response.messages.map(msg => ({
          ...msg,
          timestamp: new Date().toISOString(),
          id: `server-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }))
        setMessages(serverMessages)
        console.log(`📜 Loaded ${serverMessages.length} messages from server`)
      } else {
        console.log('📝 No messages found on server')
      }
    } catch (error) {
      console.error('Failed to load chat history from server:', error)
      setError('Failed to load chat history from server')
    } finally {
      setLoading(false)
    }
  }
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return ''
    try {
      return new Date(timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } catch {
      return ''
    }
  }
  
  const renderMessage = (message, index) => {
    const isUser = message.role === 'user'
    const isSystem = message.role === 'system'
    const isAssistant = message.role === 'assistant'
    
    return (
      <div
        key={message.id || index}
        className={`flex gap-3 p-4 ${isUser ? 'bg-blue-50' : isSystem ? 'bg-red-50' : 'bg-gray-50'} rounded-lg`}
      >
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-600 text-white' : 
          isSystem ? 'bg-red-600 text-white' : 
          'bg-gray-600 text-white'
        }`}>
          {isUser ? <User className="w-4 h-4" /> : 
           isSystem ? '!' : 
           <Bot className="w-4 h-4" />}
        </div>
        
        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900">
              {isUser ? 'You' : isSystem ? 'System' : 'Assistant'}
            </span>
            {message.timestamp && (
              <span className="text-xs text-gray-500">
                {formatTimestamp(message.timestamp)}
              </span>
            )}
          </div>
          
          <div className="text-gray-800 leading-relaxed prose prose-gray max-w-none">
            <ReactMarkdown>
              {message.content}
            </ReactMarkdown>
          </div>
          
          {/* Sources */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-200">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <span className="font-medium">Sources:</span>
                <span>{message.sources.join(', ')}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
  
  if (documents.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 text-center">
          <MessageCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No Documents Uploaded
          </h3>
          <p className="text-gray-600 mb-4">
            Upload some documents first to start chatting with your study materials.
          </p>
          <button
            onClick={() => setTab('upload')}
            className="btn btn-primary px-6 py-2"
          >
            Go to Upload
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Chat with Your Documents</h2>
          <p className="text-gray-600">
            Ask questions about your uploaded documents. The AI will provide answers based on the content.
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span>Session: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{sessionId || 'Loading...'}</code></span>
            <span>Messages: <span className="font-medium">{messages.length}</span></span>
            {!isInitialized && <span className="text-orange-500">Initializing...</span>}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2 ml-4">
          <button
            onClick={loadChatHistoryFromServer}
            className="btn btn-secondary px-3 py-2 text-sm flex items-center gap-2"
            disabled={isLoading}
            title="Load chat history from server"
          >
            <History className="h-4 w-4" />
            Load from Server
          </button>
          <button
            onClick={clearChatHistory}
            className="btn btn-secondary px-3 py-2 text-sm flex items-center gap-2"
            disabled={isLoading}
            title="Clear current chat history"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </button>
          <button
            onClick={startNewSession}
            className="btn btn-primary px-3 py-2 text-sm"
            disabled={isLoading}
            title="Start a new chat session"
          >
            New Chat
          </button>
        </div>
      </div>
      
      {/* Chat Container */}
      <div className="flex-1 card flex flex-col overflow-hidden" style={{ height: '600px' }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="text-center text-gray-500 py-12">
              <MessageCircle className="mx-auto h-16 w-16 mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">Start a Conversation</h3>
              <p className="text-sm">
                Ask questions about your uploaded documents.<br />
                Your chat history will be automatically saved and persist across tab switches.
              </p>
            </div>
          )}
          
          {messages.map((message, index) => renderMessage(message, index))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-900">Assistant</span>
                  <span className="text-xs text-gray-500">thinking...</span>
                </div>
                <LoadingSpinner size="sm" message="Generating response..." />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className="border-t bg-white p-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask a question about your documents..."
                className="w-full input resize-none"
                rows="2"
                disabled={isLoading}
                style={{ minHeight: '52px' }}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="btn btn-primary px-4 py-2 flex items-center justify-center self-end"
              style={{ height: '52px' }}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          
          {/* Model info */}
          {chatModelConfig && (
            <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
              <span>Using:</span>
              <code className="bg-gray-100 px-2 py-1 rounded">
                {chatModelConfig.provider}/{chatModelConfig.modelName}
              </code>
              {chatModelConfig.temperature !== undefined && (
                <span>temp: {chatModelConfig.temperature}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatTab
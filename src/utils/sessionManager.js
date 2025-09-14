/**
 * Session Manager for Chat History
 * Handles localStorage operations and session cleanup
 */

export class SessionManager {
  static CURRENT_SESSION_KEY = 'current-chat-session-id'
  static MESSAGES_KEY_PREFIX = 'chat-messages-'
  static SESSION_LIST_KEY = 'chat-sessions-list'
  static SERVER_STATUS_KEY = 'server-status'
  static LAST_SERVER_CHECK_KEY = 'last-server-check'
  
  /**
   * Get or create a persistent session ID
   */
  static getOrCreateSession() {
    let sessionId = localStorage.getItem(this.CURRENT_SESSION_KEY)
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem(this.CURRENT_SESSION_KEY, sessionId)
      console.log(`🆕 Created new chat session: ${sessionId}`)
    } else {
      console.log(`🔄 Using existing session: ${sessionId}`)
    }
    return sessionId
  }
  
  /**
   * Save messages to localStorage
   */
  static saveMessages(sessionId, messages) {
    try {
      const messagesKey = `${this.MESSAGES_KEY_PREFIX}${sessionId}`
      localStorage.setItem(messagesKey, JSON.stringify(messages))
      
      // Update session list
      this.addToSessionList(sessionId)
      
      console.log(`💾 Saved ${messages.length} messages for session ${sessionId}`)
      return true
    } catch (error) {
      console.error('Failed to save messages:', error)
      return false
    }
  }
  
  /**
   * Load messages from localStorage
   */
  static loadMessages(sessionId) {
    try {
      const messagesKey = `${this.MESSAGES_KEY_PREFIX}${sessionId}`
      const savedMessages = localStorage.getItem(messagesKey)
      
      if (savedMessages) {
        const messages = JSON.parse(savedMessages)
        console.log(`📜 Loaded ${messages.length} messages for session ${sessionId}`)
        return messages
      }
      
      console.log(`📝 No messages found for session ${sessionId}`)
      return []
    } catch (error) {
      console.error('Failed to load messages:', error)
      return []
    }
  }
  
  /**
   * Clear messages for a specific session
   */
  static clearSession(sessionId) {
    try {
      const messagesKey = `${this.MESSAGES_KEY_PREFIX}${sessionId}`
      localStorage.removeItem(messagesKey)
      console.log(`🗑️ Cleared session ${sessionId}`)
      return true
    } catch (error) {
      console.error('Failed to clear session:', error)
      return false
    }
  }
  
  /**
   * Start a new session (clear current and create new)
   */
  static startNewSession() {
    try {
      const currentSessionId = localStorage.getItem(this.CURRENT_SESSION_KEY)
      if (currentSessionId) {
        this.clearSession(currentSessionId)
      }
      
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem(this.CURRENT_SESSION_KEY, newSessionId)
      
      console.log(`🆕 Started new session: ${newSessionId}`)
      return newSessionId
    } catch (error) {
      console.error('Failed to start new session:', error)
      return null
    }
  }
  
  /**
   * Add session to the session list
   */
  static addToSessionList(sessionId) {
    try {
      const sessionList = JSON.parse(localStorage.getItem(this.SESSION_LIST_KEY) || '[]')
      if (!sessionList.includes(sessionId)) {
        sessionList.push(sessionId)
        localStorage.setItem(this.SESSION_LIST_KEY, JSON.stringify(sessionList))
      }
    } catch (error) {
      console.error('Failed to update session list:', error)
    }
  }
  
  /**
   * Get all session IDs
   */
  static getAllSessions() {
    try {
      return JSON.parse(localStorage.getItem(this.SESSION_LIST_KEY) || '[]')
    } catch (error) {
      console.error('Failed to get session list:', error)
      return []
    }
  }
  
  /**
   * Clear all chat data
   */
  static clearAllSessions() {
    try {
      const sessionList = this.getAllSessions()
      
      // Clear all session messages
      sessionList.forEach(sessionId => {
        this.clearSession(sessionId)
      })
      
      // Clear session metadata
      localStorage.removeItem(this.SESSION_LIST_KEY)
      localStorage.removeItem(this.CURRENT_SESSION_KEY)
      localStorage.removeItem(this.SERVER_STATUS_KEY)
      localStorage.removeItem(this.LAST_SERVER_CHECK_KEY)
      
      console.log(`🧹 Cleared all ${sessionList.length} chat sessions`)
      return true
    } catch (error) {
      console.error('Failed to clear all sessions:', error)
      return false
    }
  }
  
  /**
   * Check server status and clear sessions if server restarted
   */
  static async checkServerStatus(apiBaseUrl = 'http://localhost:8000') {
    try {
      const response = await fetch(`${apiBaseUrl}/health`)
      const healthData = await response.json()
      
      const currentTime = Date.now()
      const lastCheck = localStorage.getItem(this.LAST_SERVER_CHECK_KEY)
      const previousStatus = localStorage.getItem(this.SERVER_STATUS_KEY)
      
      // Store current check time
      localStorage.setItem(this.LAST_SERVER_CHECK_KEY, currentTime.toString())
      
      if (response.ok) {
        localStorage.setItem(this.SERVER_STATUS_KEY, 'online')
        
        // If server was offline and now online, assume restart
        if (previousStatus === 'offline') {
          console.log('🔄 Server came back online - clearing old sessions')
          this.clearAllSessions()
          
          // Create a fresh session
          return this.getOrCreateSession()
        }
        
        return this.getOrCreateSession()
      } else {
        localStorage.setItem(this.SERVER_STATUS_KEY, 'offline')
        console.warn('⚠️ Server health check failed')
        return this.getOrCreateSession()
      }
    } catch (error) {
      console.warn('⚠️ Server health check error:', error.message)
      localStorage.setItem(this.SERVER_STATUS_KEY, 'offline')
      return this.getOrCreateSession()
    }
  }
  
  /**
   * Initialize session manager with server check
   */
  static async initialize(apiBaseUrl = 'http://localhost:8000') {
    console.log('🚀 Initializing Session Manager')
    
    // Check if we should clear old sessions due to server restart
    const sessionId = await this.checkServerStatus(apiBaseUrl)
    
    // Set up periodic server status check
    const checkInterval = setInterval(async () => {
      try {
        await this.checkServerStatus(apiBaseUrl)
      } catch (error) {
        console.warn('Periodic server check failed:', error)
      }
    }, 30000) // Check every 30 seconds
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      clearInterval(checkInterval)
    })
    
    return sessionId
  }
  
  /**
   * Get session statistics
   */
  static getSessionStats() {
    const sessions = this.getAllSessions()
    const currentSession = localStorage.getItem(this.CURRENT_SESSION_KEY)
    
    let totalMessages = 0
    const sessionDetails = sessions.map(sessionId => {
      const messages = this.loadMessages(sessionId)
      totalMessages += messages.length
      return {
        id: sessionId,
        messageCount: messages.length,
        isCurrent: sessionId === currentSession
      }
    })
    
    return {
      totalSessions: sessions.length,
      totalMessages,
      currentSession,
      sessions: sessionDetails
    }
  }
}

export default SessionManager
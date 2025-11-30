import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for adding auth token if needed
api.interceptors.request.use(
  (config) => {
    // Add auth token here if implementing authentication
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'An error occurred'
    return Promise.reject(new Error(message))
  }
)

// Document Upload APIs
export const documentAPI = {
  upload: async (files) => {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    
    return api.post('/upload/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  
  clear: () => api.delete('/upload/documents'),
  
  getStatus: () => api.get('/upload/status'),
}

// Chat APIs
export const chatAPI = {
  sendMessage: (message, sessionId = null, modelConfig = null) => {
    const payload = { message, session_id: sessionId }
    if (modelConfig) {
      payload.model_configuration = {
        provider: modelConfig.provider,
        model_name: modelConfig.modelName,
        temperature: modelConfig.temperature,
        base_url: modelConfig.baseUrl,
        max_tokens: modelConfig.maxTokens
      }
    }
    return api.post('/chat/message', payload)
  },
  
  getHistory: (sessionId) => api.get(`/chat/sessions/${sessionId}/history`),
  
  clearSession: (sessionId) => api.delete(`/chat/sessions/${sessionId}`),
  
  getStatus: () => api.get('/chat/status'),
}

// Quiz APIs
export const quizAPI = {
  generate: (numQuestions = 10, difficulty = 'medium', topics = null, modelConfig = null) => {
    const payload = {
      num_questions: numQuestions,
      difficulty,
      topics,
    }
    if (modelConfig) {
      payload.model_configuration = {
        provider: modelConfig.provider,
        model_name: modelConfig.modelName,
        temperature: modelConfig.temperature,
        base_url: modelConfig.baseUrl,
        max_tokens: modelConfig.maxTokens
      }
    }
    return api.post('/quiz/generate', payload)
  },
  
  getTopics: () => api.get('/quiz/topics'),
  
  getStatus: () => api.get('/quiz/status'),
}

// Flashcard APIs
export const flashcardAPI = {
  generate: (numCards = 10, topics = null, modelConfig = null) => {
    const payload = {
      num_cards: numCards,
      topics,
    }
    if (modelConfig) {
      payload.model_configuration = {
        provider: modelConfig.provider,
        model_name: modelConfig.modelName,
        temperature: modelConfig.temperature,
        base_url: modelConfig.baseUrl,
        max_tokens: modelConfig.maxTokens
      }
    }
    return api.post('/flashcards/generate', payload)
  },
  
  getTopics: () => api.get('/flashcards/topics'),
  
  getStatus: () => api.get('/flashcards/status'),
}

// Summary APIs
export const summaryAPI = {
  generate: (request) => {
    const payload = {
      length: request.length,
      type: request.type,
      topics: request.topics,
    }
    if (request.model_configuration) {
      payload.model_configuration = {
        provider: request.model_configuration.provider,
        model_name: request.model_configuration.modelName,
        temperature: request.model_configuration.temperature,
        base_url: request.model_configuration.baseUrl,
        max_tokens: request.model_configuration.maxTokens
      }
    }
    return api.post('/summary/generate', payload)
  },
  
  getTopics: () => api.get('/summary/topics'),
  
  getStatus: () => api.get('/summary/status'),
}

// Configuration APIs
export const configAPI = {
  updateModels: (config) => api.post('/config/models', config),
  
  getConfig: () => api.get('/config/models'),
  
  getProviders: () => api.get('/config/providers'),
  
  getStatus: () => api.get('/config/status'),
}

// Health check
export const healthAPI = {
  check: () => api.get('/health', { baseURL: API_BASE_URL }),
}

export default api
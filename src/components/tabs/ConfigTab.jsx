import React, { useState, useEffect } from 'react'
import { Settings, Save, Zap } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { configAPI } from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'

function ConfigTab() {
  const { state, setLoading, setError, clearError, updateModelConfig, updateChatModelConfig, updateQuizModelConfig, updateFlashcardModelConfig } = useApp()
  const { modelConfig, isLoading } = state
  const [providers, setProviders] = useState([])
  const [localConfig, setLocalConfig] = useState(modelConfig)
  const [hasChanges, setHasChanges] = useState(false)
  
  useEffect(() => {
    fetchProviders()
  }, [])
  
  useEffect(() => {
    setLocalConfig(modelConfig)
  }, [modelConfig])
  
  const fetchProviders = async () => {
    try {
      const result = await configAPI.getProviders()
      setProviders(result.providers)
    } catch (error) {
      setError(error.message)
    }
  }
  
  const handleConfigChange = (modelType, field, value) => {
    setLocalConfig(prev => ({
      ...prev,
      [modelType]: {
        ...prev[modelType],
        [field]: value
      }
    }))
    setHasChanges(true)
  }
  
  const handleSaveConfig = async () => {
    try {
      clearError()
      setLoading(true)
      
      await configAPI.updateModels({
        chat_model: {
          provider: localConfig.chatModel.provider,
          model_name: localConfig.chatModel.modelName,
          temperature: localConfig.chatModel.temperature,
          base_url: localConfig.chatModel.baseUrl
        },
        quiz_model: {
          provider: localConfig.quizModel.provider,
          model_name: localConfig.quizModel.modelName,
          temperature: localConfig.quizModel.temperature,
          base_url: localConfig.quizModel.baseUrl
        },
        flashcard_model: {
          provider: localConfig.flashcardModel.provider,
          model_name: localConfig.flashcardModel.modelName,
          temperature: localConfig.flashcardModel.temperature,
          base_url: localConfig.flashcardModel.baseUrl
        }
      })
      
      // Update both the main model config and individual service configs
      updateModelConfig(localConfig)
      
      // Update individual service configs that tabs actually use
      updateChatModelConfig(localConfig.chatModel)
      updateQuizModelConfig(localConfig.quizModel)
      updateFlashcardModelConfig(localConfig.flashcardModel)
      
      setHasChanges(false)
      
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }
  
  const resetConfig = () => {
    setLocalConfig(modelConfig)
    setHasChanges(false)
  }
  
  const renderModelConfig = (title, modelType, config) => {
    const selectedProvider = providers.find(p => p.name === config.provider)
    
    return (
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Zap className="h-5 w-5 mr-2" />
          {title}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider
            </label>
            <select
              value={config.provider}
              onChange={(e) => handleConfigChange(modelType, 'provider', e.target.value)}
              className="input w-full"
            >
              {providers.map(provider => (
                <option key={provider.name} value={provider.name}>
                  {provider.display_name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model Name
            </label>
            <select
              value={config.modelName}
              onChange={(e) => handleConfigChange(modelType, 'modelName', e.target.value)}
              className="input w-full"
            >
              {selectedProvider?.models ? (
                selectedProvider.models.map(model => (
                  <option key={model.name} value={model.name}>
                    {model.display_name}
                  </option>
                ))
              ) : (
                <option value={config.modelName}>{config.modelName}</option>
              )}
            </select>
          </div>
          
          
          {config.provider === 'ollama' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base URL
              </label>
              <input
                type="url"
                value={config.baseUrl || 'http://localhost:11434'}
                onChange={(e) => handleConfigChange(modelType, 'baseUrl', e.target.value)}
                placeholder="http://localhost:11434"
                className="input w-full"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature: {config.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={config.temperature}
              onChange={(e) => handleConfigChange(modelType, 'temperature', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Conservative</span>
              <span>Balanced</span>
              <span>Creative</span>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Model Configuration</h2>
        <p className="text-gray-600">
          Configure AI models for different features. Changes will rebuild the processing pipeline.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {renderModelConfig('Chat Model', 'chatModel', localConfig.chatModel)}
        {renderModelConfig('Quiz Model', 'quizModel', localConfig.quizModel)}
        {renderModelConfig('Flashcard Model', 'flashcardModel', localConfig.flashcardModel)}
      </div>
      
      {/* Save Changes */}
      {hasChanges && (
        <div className="card p-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            You have unsaved configuration changes
          </div>
          <div className="space-x-3">
            <button
              onClick={resetConfig}
              disabled={isLoading}
              className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Reset
            </button>
            <button
              onClick={handleSaveConfig}
              disabled={isLoading}
              className="btn btn-primary px-6 py-2 flex items-center"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Provider Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
        <h3 className="text-lg font-medium text-blue-900 mb-4">Provider Setup Instructions</h3>
        <div className="space-y-3 text-sm text-blue-800">
          <div>
            <strong>Ollama:</strong> Install Ollama locally and ensure it's running on the configured URL. Models are automatically detected.
          </div>
          <div>
            <strong>Groq:</strong> Set your API key as <code className="bg-blue-100 px-1 rounded">GROQ_API_KEY</code> environment variable. Get it from{' '}
            <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="underline">
              console.groq.com
            </a>
          </div>
          <div>
            <strong>OpenRouter:</strong> Set your API key as <code className="bg-blue-100 px-1 rounded">OPENROUTER_API_KEY</code> environment variable. Get it from{' '}
            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline">
              openrouter.ai/keys
            </a>
          </div>
          <div>
            <strong>Google Gemini:</strong> Set your API key as <code className="bg-blue-100 px-1 rounded">GEMINI_API_KEY</code> environment variable. Get it from{' '}
            <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">
              Google AI Studio
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfigTab
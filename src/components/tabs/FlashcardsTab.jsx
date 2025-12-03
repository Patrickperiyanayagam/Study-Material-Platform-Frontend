import React, { useState } from 'react'
import { Zap, RotateCcw, ArrowLeft, ArrowRight, Download } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { flashcardAPI } from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'
import ExportModal from '../common/ExportModal'
import { exportFlashcards } from '../../utils/exportUtils'

function FlashcardsTab() {
  const { state, setLoading, setError, clearError, setTab } = useApp()
  const { documents, isLoading, flashcardModelConfig } = state
  const [flashcards, setFlashcards] = useState(null)
  const [currentCard, setCurrentCard] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [numCards, setNumCards] = useState(10)
  const [showExportModal, setShowExportModal] = useState(false)
  
  const generateFlashcards = async () => {
    try {
      clearError()
      setLoading(true)
      
      const result = await flashcardAPI.generate(numCards, null, flashcardModelConfig)
      
      setFlashcards(result)
      setCurrentCard(0)
      setFlipped(false)
      
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }
  
  const nextCard = () => {
    if (flashcards && currentCard < flashcards.cards.length - 1) {
      setCurrentCard(prev => prev + 1)
      setFlipped(false)
    }
  }
  
  const previousCard = () => {
    if (currentCard > 0) {
      setCurrentCard(prev => prev - 1)
      setFlipped(false)
    }
  }
  
  const flipCard = () => {
    setFlipped(prev => !prev)
  }
  
  const resetFlashcards = () => {
    setFlashcards(null)
    setCurrentCard(0)
    setFlipped(false)
    setShowExportModal(false)
  }
  
  const handleExport = async (format, filename) => {
    if (!flashcards) return
    
    await exportFlashcards(flashcards, format, filename)
  }
  
  if (documents.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 text-center">
          <Zap className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No Documents Uploaded
          </h3>
          <p className="text-gray-600 mb-4">
            Upload some documents first to generate flashcards from your study materials.
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
  
  if (!flashcards) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Flashcards</h2>
          <p className="text-gray-600">
            Generate interactive flashcards with key points from your uploaded documents.
          </p>
        </div>
        
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Flashcard Settings</h3>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Flashcards
            </label>
            <select
              value={numCards}
              onChange={(e) => setNumCards(parseInt(e.target.value))}
              className="input"
            >
              <option value={5}>5 Flashcards</option>
              <option value={10}>10 Flashcards</option>
              <option value={15}>15 Flashcards</option>
              <option value={20}>20 Flashcards</option>
            </select>
          </div>
          
          <button
            onClick={generateFlashcards}
            disabled={isLoading}
            className="btn btn-primary px-6 py-3"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : 'Generate Flashcards'}
          </button>
          
          {/* Model info */}
          {flashcardModelConfig && (
            <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
              <span>Using:</span>
              <code className="bg-gray-100 px-2 py-1 rounded">
                {flashcardModelConfig.provider}/{flashcardModelConfig.modelName}
              </code>
              {flashcardModelConfig.temperature !== undefined && (
                <span>temp: {flashcardModelConfig.temperature}</span>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
  
  const card = flashcards.cards[currentCard]
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-gray-900">Flashcards</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowExportModal(true)}
              className="btn btn-secondary px-3 py-2 text-sm flex items-center"
              title="Export flashcards"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              onClick={resetFlashcards}
              className="text-gray-500 hover:text-gray-700"
              title="Create new flashcards"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <span>Card {currentCard + 1} of {flashcards.cards.length}</span>
          <div className="ml-4 flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentCard + 1) / flashcards.cards.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Flashcard */}
      <div className="mb-6">
        <div 
          onClick={flipCard}
          className="relative w-full h-64 cursor-pointer"
        >
          {/* Front of card - Question */}
          <div className={`absolute inset-0 w-full h-full transition-all duration-500 ${
            flipped ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
          } bg-white border-2 border-primary-200 rounded-lg shadow-lg flex items-center justify-center p-6`}>
            <div className="text-center">
              <h3 className="text-xl font-medium text-gray-900 mb-2">{card.front}</h3>
              <p className="text-sm text-gray-500">Click to reveal answer</p>
            </div>
          </div>
          
          {/* Back of card - Answer */}
          <div className={`absolute inset-0 w-full h-full transition-all duration-500 ${
            flipped ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
          } bg-primary-50 border-2 border-primary-200 rounded-lg shadow-lg flex items-center justify-center p-6`}>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{card.back}</h3>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Topic: {card.topic}</p>
                <p>Difficulty: {card.difficulty}</p>
              </div>
              <p className="text-sm text-gray-500 mt-4">Click to see question</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={previousCard}
          disabled={currentCard === 0}
          className="flex items-center px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </button>
        
        <button
          onClick={flipCard}
          className="btn btn-primary px-6 py-2"
        >
          {flipped ? 'Show Question' : 'Show Answer'}
        </button>
        
        <button
          onClick={nextCard}
          disabled={currentCard === flashcards.cards.length - 1}
          className="flex items-center px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </button>
      </div>
      
      {/* Model info */}
      {flashcardModelConfig && (
        <div className="mt-4 pt-4 border-t text-xs text-gray-500 flex items-center gap-2 justify-center">
          <span>Using:</span>
          <code className="bg-gray-100 px-2 py-1 rounded">
            {flashcardModelConfig.provider}/{flashcardModelConfig.modelName}
          </code>
          {flashcardModelConfig.temperature !== undefined && (
            <span>temp: {flashcardModelConfig.temperature}</span>
          )}
        </div>
      )}
      
      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title="Export Flashcards"
      />
    </div>
  )
}

export default FlashcardsTab
import React, { useState } from 'react'
import { Brain, CheckCircle, XCircle, RotateCcw, Download } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { quizAPI } from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'
import ExportModal from '../common/ExportModal'
import { exportQuiz } from '../../utils/exportUtils'

function QuizTab() {
  const { state, setLoading, setError, clearError, setTab } = useApp()
  const { documents, isLoading, quizModelConfig } = state
  const [quiz, setQuiz] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [userAnswers, setUserAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [quizSettings, setQuizSettings] = useState({
    numQuestions: 10,
    difficulty: 'medium'
  })
  const [showExportModal, setShowExportModal] = useState(false)
  
  const generateQuiz = async () => {
    try {
      clearError()
      setLoading(true)
      
      const result = await quizAPI.generate(
        quizSettings.numQuestions,
        quizSettings.difficulty,
        null,
        quizModelConfig
      )
      
      setQuiz(result)
      setCurrentQuestion(0)
      setUserAnswers({})
      setShowResults(false)
      
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }
  
  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }))
  }
  
  const calculateScore = () => {
    if (!quiz) return 0
    
    let correct = 0
    quiz.questions.forEach((question, index) => {
      if (userAnswers[index] === question.correct_answer) {
        correct++
      }
    })
    
    return Math.round((correct / quiz.questions.length) * 100)
  }
  
  const resetQuiz = () => {
    setQuiz(null)
    setCurrentQuestion(0)
    setUserAnswers({})
    setShowResults(false)
  }

  const handleExport = async (format, filename) => {
    if (!quiz || !showResults) return
    await exportQuiz(quiz, userAnswers, format, filename)
  }
  
  if (documents.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 text-center">
          <Brain className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No Documents Uploaded
          </h3>
          <p className="text-gray-600 mb-4">
            Upload some documents first to generate quizzes from your study materials.
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
  
  if (!quiz) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Generator</h2>
          <p className="text-gray-600">
            Generate multiple-choice quizzes from your uploaded documents to test your knowledge.
          </p>
        </div>
        
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quiz Settings</h3>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Questions
              </label>
              <select
                value={quizSettings.numQuestions}
                onChange={(e) => setQuizSettings(prev => ({ ...prev, numQuestions: parseInt(e.target.value) }))}
                className="input"
              >
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={quizSettings.difficulty}
                onChange={(e) => setQuizSettings(prev => ({ ...prev, difficulty: e.target.value }))}
                className="input"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={generateQuiz}
            disabled={isLoading}
            className="btn btn-primary px-6 py-3"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : 'Generate Quiz'}
          </button>
          
          {/* Model info */}
          {quizModelConfig && (
            <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
              <span>Using:</span>
              <code className="bg-gray-100 px-2 py-1 rounded">
                {quizModelConfig.provider}/{quizModelConfig.modelName}
              </code>
              {quizModelConfig.temperature !== undefined && (
                <span>temp: {quizModelConfig.temperature}</span>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
  
  if (showResults) {
    const score = calculateScore()
    const correctAnswers = Object.keys(userAnswers).filter(
      index => userAnswers[index] === quiz.questions[index].correct_answer
    ).length
    
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-6 text-center mb-6">
          <div className="mb-6">
            <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
              score >= 70 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              <span className="text-2xl font-bold">{score}%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h3>
            <p className="text-gray-600">
              You got {correctAnswers} out of {quiz.questions.length} questions correct.
            </p>
          </div>
          
          <div className="space-x-4">
            <button
              onClick={resetQuiz}
              className="btn btn-primary px-6 py-2"
            >
              <RotateCcw className="inline h-4 w-4 mr-2" />
              Generate New Quiz
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="btn btn-secondary px-6 py-2"
            >
              <Download className="inline h-4 w-4 mr-2" />
              Export Results
            </button>
          </div>
        </div>

        {/* Review All Answers */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Review Your Answers</h3>
          {quiz.questions.map((question, questionIndex) => {
            const userAnswer = userAnswers[questionIndex]
            const correctAnswer = question.correct_answer
            const isCorrect = userAnswer === correctAnswer
            
            return (
              <div key={questionIndex} className="card p-6">
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <span className="text-sm font-medium text-gray-500 mr-2">
                      Question {questionIndex + 1}
                    </span>
                    {isCorrect ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Incorrect
                      </span>
                    )}
                  </div>
                  <h4 className="text-lg font-medium text-gray-900">
                    {question.question}
                  </h4>
                </div>
                
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => {
                    let optionClass = "w-full text-left p-3 border rounded-lg "
                    
                    if (optionIndex === correctAnswer && optionIndex === userAnswer) {
                      // User selected correct answer
                      optionClass += "border-green-500 bg-green-50 text-green-800"
                    } else if (optionIndex === correctAnswer) {
                      // Correct answer (not selected by user)
                      optionClass += "border-green-500 bg-green-50 text-green-800"
                    } else if (optionIndex === userAnswer) {
                      // User selected wrong answer
                      optionClass += "border-red-500 bg-red-50 text-red-800"
                    } else {
                      // Other options
                      optionClass += "border-gray-200 bg-gray-50 text-gray-600"
                    }
                    
                    return (
                      <div key={optionIndex} className={optionClass}>
                        <div className="flex items-center">
                          <span className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 text-sm font-medium ${
                            optionIndex === correctAnswer && optionIndex === userAnswer
                              ? "border-green-600 bg-green-600 text-white"
                              : optionIndex === correctAnswer
                                ? "border-green-600 bg-green-600 text-white"
                                : optionIndex === userAnswer
                                  ? "border-red-600 bg-red-600 text-white"
                                  : "border-gray-400 bg-gray-100 text-gray-600"
                          }`}>
                            {String.fromCharCode(65 + optionIndex)}
                          </span>
                          <span className="flex-1">{option}</span>
                          {optionIndex === correctAnswer && (
                            <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
                          )}
                          {optionIndex === userAnswer && optionIndex !== correctAnswer && (
                            <XCircle className="h-5 w-5 text-red-600 ml-2" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {question.explanation && (
                  <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>Explanation:</strong> {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Export Modal */}
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          title="Export Quiz Results"
        />
      </div>
    )
  }
  
  const question = quiz.questions[currentQuestion]
  const hasAnswered = userAnswers[currentQuestion] !== undefined
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-gray-900">Quiz</h2>
          <button
            onClick={resetQuiz}
            className="text-gray-500 hover:text-gray-700"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
          <div className="ml-4 flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="card p-6">
        <h3 className="text-xl font-medium text-gray-900 mb-6">
          {question.question}
        </h3>
        
        <div className="space-y-3 mb-6">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(currentQuestion, index)}
              className={`w-full text-left p-4 border rounded-lg transition-colors ${
                userAnswers[currentQuestion] === index
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                  : 'border hover:border-primary/30 hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center">
                <span className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 text-sm font-medium ${
                  userAnswers[currentQuestion] === index
                    ? 'border-primary bg-primary text-white'
                    : 'border-border text-foreground'
                }`}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{option}</span>
              </div>
            </button>
          ))}
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {currentQuestion === quiz.questions.length - 1 ? (
            <button
              onClick={() => setShowResults(true)}
              disabled={!hasAnswered}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Finish Quiz
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(prev => prev + 1)}
              disabled={!hasAnswered}
              className="btn btn-primary px-4 py-2"
            >
              Next
            </button>
          )}
        </div>
        
        {/* Model info */}
        {quizModelConfig && (
          <div className="mt-4 pt-4 border-t text-xs text-gray-500 flex items-center gap-2">
            <span>Using:</span>
            <code className="bg-gray-100 px-2 py-1 rounded">
              {quizModelConfig.provider}/{quizModelConfig.modelName}
            </code>
            {quizModelConfig.temperature !== undefined && (
              <span>temp: {quizModelConfig.temperature}</span>
            )}
          </div>
        )}
      </div>
      
      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title="Export Quiz Results"
      />
    </div>
  )
}

export default QuizTab
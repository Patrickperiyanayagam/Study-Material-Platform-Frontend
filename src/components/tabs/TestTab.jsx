import React, { useState } from 'react'
import { ClipboardList, Clock, CheckCircle, Download, FileText } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { testAPI } from '../../services/api'
import { exportTestResults } from '../../utils/exportUtils'
import LoadingSpinner from '../common/LoadingSpinner'
import ExportModal from '../common/ExportModal'

// TestResultsModal component will be imported later
const TestResultsModal = ({ isOpen, onClose, gradingResults }) => {
  if (!isOpen || !gradingResults) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Test Results</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Overall Score */}
          <div className="card p-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {gradingResults.overall_percentage.toFixed(1)}%
              </div>
              <div className="text-lg text-gray-700 mb-2">
                {gradingResults.total_marks_awarded.toFixed(1)} / {gradingResults.total_marks_possible} marks
              </div>
              <div className="text-sm text-gray-600">
                {gradingResults.overall_feedback}
              </div>
            </div>
          </div>

          {/* Question-by-question results */}
          <div className="space-y-6">
            {gradingResults.grades.map((grade, index) => (
              <div key={index} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Question {index + 1}
                  </h3>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {grade.marks_awarded.toFixed(1)} / {grade.max_marks}
                    </div>
                    <div className="text-sm text-gray-500">
                      {grade.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="font-medium text-gray-900 mb-2">Question:</div>
                  <div className="text-gray-700">{grade.question}</div>
                </div>

                <div className="mb-4">
                  <div className="font-medium text-gray-900 mb-2">Your Answer:</div>
                  <div className="bg-gray-50 p-3 rounded border text-gray-700">
                    {grade.user_answer || 'No answer provided'}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="font-medium text-gray-900 mb-2">Feedback:</div>
                  <div className="text-gray-700">{grade.feedback}</div>
                </div>

                {grade.strengths.length > 0 && (
                  <div className="mb-4">
                    <div className="font-medium text-green-700 mb-2">Strengths:</div>
                    <ul className="list-disc list-inside text-green-600 space-y-1">
                      {grade.strengths.map((strength, idx) => (
                        <li key={idx}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {grade.improvements.length > 0 && (
                  <div className="mb-4">
                    <div className="font-medium text-orange-700 mb-2">Areas for Improvement:</div>
                    <ul className="list-disc list-inside text-orange-600 space-y-1">
                      {grade.improvements.map((improvement, idx) => (
                        <li key={idx}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Study Plan */}
          {gradingResults.study_plan && gradingResults.study_plan.length > 0 && (
            <div className="card p-6 mt-6 bg-yellow-50 border-yellow-200">
              <h3 className="text-lg font-medium text-yellow-800 mb-4">Recommended Study Plan</h3>
              <ul className="list-disc list-inside text-yellow-700 space-y-2">
                {gradingResults.study_plan.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Weak Topics */}
          {gradingResults.weak_topics && gradingResults.weak_topics.length > 0 && (
            <div className="card p-6 mt-6 bg-red-50 border-red-200">
              <h3 className="text-lg font-medium text-red-800 mb-4">Topics Needing Attention</h3>
              <div className="flex flex-wrap gap-2">
                {gradingResults.weak_topics.map((topic, idx) => (
                  <span key={idx} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TestTab() {
  const { state, setLoading, setError, clearError, setTab } = useApp()
  const { documents, isLoading, testModelConfig } = state
  
  const [test, setTest] = useState(null)
  const [userAnswers, setUserAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [gradingResults, setGradingResults] = useState(null)
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  
  const [testSettings, setTestSettings] = useState({
    numQuestions: 10,
    difficulty: 'medium',
    markDistribution: {
      2: 5,
      4: 3,
      8: 2
    }
  })

  const handleMarkDistributionChange = (marks, count) => {
    setTestSettings(prev => ({
      ...prev,
      markDistribution: {
        ...prev.markDistribution,
        [marks]: Math.max(0, count)
      }
    }))
    
    // Update total questions to match distribution
    const totalQuestions = Object.values({
      ...testSettings.markDistribution,
      [marks]: Math.max(0, count)
    }).reduce((sum, count) => sum + count, 0)
    
    setTestSettings(prev => ({
      ...prev,
      numQuestions: totalQuestions
    }))
  }

  const generateTest = async () => {
    try {
      clearError()
      setLoading(true)
      
      const result = await testAPI.generate(
        testSettings.numQuestions,
        testSettings.difficulty,
        testSettings.markDistribution,
        null, // topics - can be added later
        testModelConfig
      )
      
      setTest(result)
      setUserAnswers({})
      setShowResults(false)
      setGradingResults(null)
      
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionIndex, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }))
  }

  const submitTest = async () => {
    try {
      clearError()
      setLoading(true)
      
      // Prepare answers in the expected format
      const formattedAnswers = Object.entries(userAnswers).map(([questionIndex, answer]) => ({
        question_index: parseInt(questionIndex),
        answer: answer
      }))
      
      const result = await testAPI.grade(
        test.questions,
        formattedAnswers,
        testModelConfig
      )
      
      setGradingResults(result)
      setShowResults(true)
      setShowResultsModal(true)
      
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetTest = () => {
    setTest(null)
    setUserAnswers({})
    setShowResults(false)
    setGradingResults(null)
    setShowResultsModal(false)
  }

  const handleExport = async (format, filename) => {
    if (!gradingResults) return
    await exportTestResults(gradingResults, format, filename)
  }

  if (documents.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 text-center">
          <ClipboardList className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No Documents Uploaded
          </h3>
          <p className="text-gray-600 mb-4">
            Upload some documents first to generate tests from your study materials.
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

  if (!test) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Auto-Exam & AI Grading</h2>
          <p className="text-gray-600">
            Generate comprehensive tests from your study materials and get AI-powered grading with detailed feedback.
          </p>
        </div>

        <div className="card p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ClipboardList className="h-5 w-5 mr-2" />
            Test Configuration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Difficulty Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={testSettings.difficulty}
                onChange={(e) => setTestSettings(prev => ({ ...prev, difficulty: e.target.value }))}
                className="input w-full"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Total Questions (read-only, calculated from distribution) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Questions
              </label>
              <input
                type="number"
                value={testSettings.numQuestions}
                readOnly
                className="input w-full bg-gray-100"
              />
            </div>
          </div>

          {/* Mark Distribution */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Mark Distribution
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card p-4 border-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600 mb-2">2 Mark Questions</div>
                  <div className="text-sm text-gray-600 mb-3">Basic recall & understanding</div>
                  <input
                    type="number"
                    min="0"
                    value={testSettings.markDistribution[2]}
                    onChange={(e) => handleMarkDistributionChange(2, parseInt(e.target.value) || 0)}
                    className="input w-full text-center"
                  />
                </div>
              </div>

              <div className="card p-4 border-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600 mb-2">4 Mark Questions</div>
                  <div className="text-sm text-gray-600 mb-3">Application & analysis</div>
                  <input
                    type="number"
                    min="0"
                    value={testSettings.markDistribution[4]}
                    onChange={(e) => handleMarkDistributionChange(4, parseInt(e.target.value) || 0)}
                    className="input w-full text-center"
                  />
                </div>
              </div>

              <div className="card p-4 border-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600 mb-2">8 Mark Questions</div>
                  <div className="text-sm text-gray-600 mb-3">Evaluation & synthesis</div>
                  <input
                    type="number"
                    min="0"
                    value={testSettings.markDistribution[8]}
                    onChange={(e) => handleMarkDistributionChange(8, parseInt(e.target.value) || 0)}
                    className="input w-full text-center"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <div className="text-sm text-gray-600">
                Total Marks: {Object.entries(testSettings.markDistribution)
                  .reduce((sum, [marks, count]) => sum + (parseInt(marks) * count), 0)}
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={generateTest}
            disabled={isLoading || testSettings.numQuestions === 0}
            className="btn btn-primary px-8 py-3 text-lg disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Generating Test...</span>
              </>
            ) : (
              <>
                <ClipboardList className="h-5 w-5 mr-2" />
                Generate Test
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  if (showResults) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Test Completed!</h2>
          <p className="text-gray-600">
            Your test has been graded. View detailed results and feedback.
          </p>
        </div>

        <div className="card p-6 mb-6 text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">
            {gradingResults?.overall_percentage?.toFixed(1)}%
          </div>
          <div className="text-lg text-gray-700 mb-4">
            {gradingResults?.total_marks_awarded?.toFixed(1)} / {gradingResults?.total_marks_possible} marks
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setShowResultsModal(true)}
              className="btn btn-primary px-6 py-2"
            >
              <FileText className="h-4 w-4 mr-2" />
              View Detailed Results
            </button>
            
            <button
              onClick={() => setShowExportModal(true)}
              className="btn btn-secondary px-6 py-2"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Results
            </button>
            
            <button
              onClick={resetTest}
              className="btn btn-outline px-6 py-2"
            >
              Take Another Test
            </button>
          </div>
        </div>

        <TestResultsModal
          isOpen={showResultsModal}
          onClose={() => setShowResultsModal(false)}
          gradingResults={gradingResults}
        />

        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          title="Export Test Results"
        />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Test in Progress</h2>
            <p className="text-gray-600">
              Answer all questions and submit when ready for AI grading.
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-medium text-gray-900">
              Total Marks: {test.total_marks}
            </div>
            <div className="text-sm text-gray-600">
              {test.total_questions} Questions
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {test.questions.map((question, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Question {index + 1}
              </h3>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">
                  {question.marks} marks
                </div>
                <div className="text-sm text-gray-500">
                  {question.difficulty} difficulty
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-gray-900 text-base leading-relaxed">
                {question.question}
              </div>
              {question.topic && (
                <div className="mt-2">
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                    Topic: {question.topic}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Answer:
              </label>
              <textarea
                value={userAnswers[index] || ''}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                rows={8}
                className="input w-full resize-vertical"
                placeholder={`Write your answer here... (${question.marks} marks)`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6 mt-8 text-center">
        <div className="mb-4">
          <div className="text-lg font-medium text-gray-900 mb-2">
            Ready to Submit?
          </div>
          <div className="text-sm text-gray-600">
            Make sure you have answered all questions. Once submitted, your test will be graded by AI.
          </div>
        </div>
        
        <div className="flex justify-center gap-4">
          <button
            onClick={resetTest}
            className="btn btn-outline px-6 py-2"
          >
            Reset Test
          </button>
          
          <button
            onClick={submitTest}
            disabled={isLoading}
            className="btn btn-primary px-8 py-3"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Grading Test...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Submit Test for Grading
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TestTab
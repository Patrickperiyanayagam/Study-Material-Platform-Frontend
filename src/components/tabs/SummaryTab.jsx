import React, { useState, useEffect } from 'react'
import { FileText, BookOpen, Settings, Download } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useApp } from '../../contexts/AppContext'
import { summaryAPI } from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'
import ExportModal from '../common/ExportModal'
import { exportSummary } from '../../utils/exportUtils'

function SummaryTab() {
  const { state, setLoading, setError, clearError, setTab } = useApp()
  const { documents, isLoading, summaryModelConfig } = state
  const [summary, setSummary] = useState(null)
  const [availableTopics, setAvailableTopics] = useState([])
  const [summarySettings, setSummarySettings] = useState({
    length: 'medium',
    type: 'overview',
    selectedTopics: []
  })
  const [showExportModal, setShowExportModal] = useState(false)

  // Load available topics when component mounts
  useEffect(() => {
    const loadTopics = async () => {
      try {
        const topics = await summaryAPI.getTopics()
        setAvailableTopics(topics)
      } catch (error) {
        console.error('Failed to load topics:', error)
      }
    }

    if (documents.length > 0) {
      loadTopics()
    }
  }, [documents])

  const generateSummary = async () => {
    if (documents.length === 0) {
      setError('Please upload documents first to generate summaries')
      return
    }

    try {
      clearError()
      setLoading(true)
      
      const result = await summaryAPI.generate({
        length: summarySettings.length,
        type: summarySettings.type,
        topics: summarySettings.selectedTopics.length > 0 ? summarySettings.selectedTopics : null,
        model_configuration: summaryModelConfig
      })
      
      setSummary(result)
      
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTopicToggle = (topic) => {
    setSummarySettings(prev => ({
      ...prev,
      selectedTopics: prev.selectedTopics.includes(topic)
        ? prev.selectedTopics.filter(t => t !== topic)
        : [...prev.selectedTopics, topic]
    }))
  }

  const resetSummary = () => {
    setSummary(null)
    setSummarySettings({
      length: 'medium',
      type: 'overview',
      selectedTopics: []
    })
  }

  const handleExport = async (format, filename) => {
    if (!summary) return
    
    const exportData = {
      content: summary.content,
      metadata: summary.metadata || {},
      settings: summarySettings
    }
    
    await exportSummary(exportData, format, filename)
  }

  if (documents.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-8 text-center">
          <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No Documents Uploaded
          </h3>
          <p className="text-gray-600 mb-4">
            Upload some documents first to generate intelligent summaries from your study materials.
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

  if (!summary) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Summary Generator</h2>
          <p className="text-gray-600">
            Generate intelligent summaries from your uploaded documents with customizable length and focus.
          </p>
        </div>
        
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Summary Settings</h3>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Summary Length
              </label>
              <select
                value={summarySettings.length}
                onChange={(e) => setSummarySettings(prev => ({ ...prev, length: e.target.value }))}
                className="input"
              >
                <option value="short">Short (1-2 paragraphs)</option>
                <option value="medium">Medium (3-5 paragraphs)</option>
                <option value="long">Long (Detailed analysis)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Summary Type
              </label>
              <select
                value={summarySettings.type}
                onChange={(e) => setSummarySettings(prev => ({ ...prev, type: e.target.value }))}
                className="input"
              >
                <option value="overview">Overview</option>
                <option value="key_points">Key Points</option>
                <option value="detailed">Detailed</option>
                <option value="bullet_points">Bullet Points</option>
              </select>
            </div>

            {availableTopics.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Focus on Specific Topics (Optional)
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Select specific documents/topics to focus the summary on, or leave empty for all content
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableTopics.map((topic) => (
                    <label key={topic} className="flex items-center p-2 border rounded hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={summarySettings.selectedTopics.includes(topic)}
                        onChange={() => handleTopicToggle(topic)}
                        className="mr-2"
                      />
                      <span className="text-sm truncate" title={topic}>
                        {topic}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={generateSummary}
            disabled={isLoading}
            className="btn btn-primary px-6 py-3"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : 'Generate Summary'}
          </button>
          
          {/* Model info */}
          {summaryModelConfig && (
            <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
              <span>Using:</span>
              <span>{summaryModelConfig.provider}/{summaryModelConfig.modelName}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Summary Results</h2>
        <p className="text-gray-600">
          Your generated summary is ready. You can export it or create a new one.
        </p>
      </div>
      
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Generated Summary</h3>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span>Type: {summarySettings.type.replace('_', ' ')}</span>
              <span>Length: {summarySettings.length}</span>
              {summarySettings.selectedTopics.length > 0 && (
                <span>Topics: {summarySettings.selectedTopics.length}</span>
              )}
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowExportModal(true)}
              className="btn btn-secondary px-4 py-2 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              onClick={resetSummary}
              className="btn btn-primary px-4 py-2"
            >
              New Summary
            </button>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="prose prose-gray max-w-none text-gray-800 leading-relaxed">
            <ReactMarkdown>
              {summary?.content || 'Summary content would appear here...'}
            </ReactMarkdown>
          </div>
        </div>

        {summary?.metadata && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm text-gray-500">
            <div>
              <span className="font-medium">{summary.metadata.word_count}</span>
              <div>Words</div>
            </div>
            <div>
              <span className="font-medium">{summary.metadata.reading_time_minutes}</span>
              <div>Min read</div>
            </div>
            <div>
              <span className="font-medium">{Math.round((summary.metadata.confidence_score || 0) * 100)}%</span>
              <div>Confidence</div>
            </div>
            <div>
              <span className="font-medium">{summary.metadata.sources_used?.length || 0}</span>
              <div>Sources</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title="Export Summary"
      />
    </div>
  )
}

export default SummaryTab
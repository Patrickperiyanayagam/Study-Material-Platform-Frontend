import React, { useState } from 'react'
import { X, Download, FileText, File, Code } from 'lucide-react'

function ExportModal({ isOpen, onClose, onExport, title = "Export Content" }) {
  const [format, setFormat] = useState('pdf')
  const [filename, setFilename] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const formatOptions = [
    { 
      value: 'pdf', 
      label: 'PDF Document', 
      icon: FileText, 
      description: 'Formatted document with styling'
    },
    { 
      value: 'docx', 
      label: 'Word Document', 
      icon: FileText, 
      description: 'Microsoft Word compatible format'
    },
    { 
      value: 'txt', 
      label: 'Plain Text', 
      icon: File, 
      description: 'Simple text file without formatting'
    },
    { 
      value: 'json', 
      label: 'JSON Data', 
      icon: Code, 
      description: 'Structured data format'
    }
  ]

  const handleExport = async () => {
    if (!filename.trim()) {
      alert('Please enter a filename')
      return
    }

    setIsExporting(true)
    try {
      await onExport(format, filename.trim())
      onClose()
      setFilename('')
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleClose = () => {
    if (!isExporting) {
      onClose()
      setFilename('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <button
              onClick={handleClose}
              disabled={isExporting}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Format Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="space-y-2">
              {formatOptions.map((option) => {
                const IconComponent = option.icon
                return (
                  <label
                    key={option.value}
                    className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                      format === option.value
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-20'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={option.value}
                      checked={format === option.value}
                      onChange={(e) => setFormat(e.target.value)}
                      className="sr-only"
                    />
                    <IconComponent className={`h-5 w-5 mt-0.5 mr-3 ${
                      format === option.value ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${
                        format === option.value ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {option.label}
                      </div>
                      <div className={`text-xs mt-1 ${
                        format === option.value ? 'text-blue-700' : 'text-gray-500'
                      }`}>
                        {option.description}
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Filename Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filename
            </label>
            <div className="flex rounded-md shadow-sm">
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Enter filename"
                className="flex-1 input rounded-r-none"
                disabled={isExporting}
              />
              <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                .{format}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleClose}
              disabled={isExporting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || !filename.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExportModal
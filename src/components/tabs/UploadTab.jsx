import React, { useState, useRef } from 'react'
import { Upload, File, X, CheckCircle } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { documentAPI } from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'

function UploadTab() {
  const { state, setLoading, setError, clearError, addDocuments } = useApp()
  const { documents, isLoading } = state
  const [dragOver, setDragOver] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const fileInputRef = useRef(null)
  
  const handleFileSelect = (files) => {
    const validFiles = Array.from(files).filter(file => {
      const validTypes = ['.pdf', '.txt', '.docx', '.doc']
      const extension = '.' + file.name.split('.').pop().toLowerCase()
      return validTypes.includes(extension) && file.size <= 50000000 // 50MB
    })
    
    if (validFiles.length !== files.length) {
      setError('Some files were skipped. Only PDF, TXT, DOC, and DOCX files under 50MB are supported.')
    }
    
    setSelectedFiles(validFiles)
  }
  
  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }
  
  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }
  
  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }
  
  const handleFileInput = (e) => {
    handleFileSelect(e.target.files)
  }
  
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }
  
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select files to upload')
      return
    }
    
    try {
      clearError()
      setLoading(true)
      
      const result = await documentAPI.upload(selectedFiles)
      
      addDocuments(result.file_names || [])
      setSelectedFiles([])
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }
  
  const handleClearDocuments = async () => {
    try {
      clearError()
      setLoading(true)
      
      await documentAPI.clear()
      addDocuments([])
      
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Upload Documents</h2>
        <p className="text-gray-600">
          Upload your study materials to create a searchable knowledge base. 
          Supported formats: PDF, TXT, DOC, DOCX (max 50MB each)
        </p>
      </div>
      
      {/* Upload Area */}
      <div className="card">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver 
              ? 'border-primary-400 bg-primary-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Drop files here or click to browse
          </h3>
          <p className="text-gray-500 mb-4">
            Supports PDF, TXT, DOC, DOCX files up to 50MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.doc,.docx"
            onChange={handleFileInput}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-primary px-6 py-2"
          >
            Select Files
          </button>
        </div>
        
        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="border-t p-6">
            <h4 className="font-medium text-gray-900 mb-4">Selected Files</h4>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <File className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={handleUpload}
                disabled={isLoading}
                className="btn btn-primary px-6 py-2"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Upload Files'}
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Uploaded Documents */}
      {documents.length > 0 && (
        <div className="mt-8 card">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Uploaded Documents ({documents.length})
              </h3>
              <button
                onClick={handleClearDocuments}
                disabled={isLoading}
                className="text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                Clear All
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc, index) => (
                <div key={index} className="flex items-center p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{doc}</p>
                    <p className="text-sm text-green-600">Processed</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Document Processing Info */}
            <div className="mt-4 pt-4 border-t text-xs text-gray-500 flex items-center gap-2">
              <span>Document Processing:</span>
              <code className="bg-gray-100 px-2 py-1 rounded">
                ChromaDB + mxbai-embed-large:335m
              </code>
              <span>•</span>
              <span>Chunk size: 1000 chars</span>
              <span>•</span>
              <span>Overlap: 200 chars</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UploadTab
import React from 'react'
import { X } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'

function ErrorAlert({ message, onClose }) {
  const { clearError } = useApp()
  
  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      clearError()
    }
  }
  
  return (
    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Error
          </h3>
          <p className="mt-1 text-sm text-red-700">
            {message}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="ml-3 flex-shrink-0 text-red-400 hover:text-red-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

export default ErrorAlert
import React from 'react'
import { useApp } from '../contexts/AppContext'
import TabNavigation from './TabNavigation'
import UploadTab from './tabs/UploadTab'
import ChatTab from './tabs/ChatTab'
import QuizTab from './tabs/QuizTab'
import FlashcardsTab from './tabs/FlashcardsTab'
import SummaryTab from './tabs/SummaryTab'
import TestTab from './tabs/TestTab'
import ConfigTab from './tabs/ConfigTab'
import NotesTab from './tabs/NotesTab'
import LoadingSpinner from './common/LoadingSpinner'
import ErrorAlert from './common/ErrorAlert'

const tabs = [
  { id: 'upload', name: 'Upload Documents', component: UploadTab },
  { id: 'chat', name: 'Chat', component: ChatTab },
  { id: 'quiz', name: 'Quiz', component: QuizTab },
  { id: 'flashcards', name: 'Flashcards', component: FlashcardsTab },
  { id: 'summary', name: 'Summary', component: SummaryTab },
  { id: 'test', name: 'Test', component: TestTab },
  { id: 'config', name: 'Model Config', component: ConfigTab },
  { id: 'notes', name: 'Notes', component: NotesTab },
]

function Layout() {
  const { state } = useApp()
  const { currentTab, isLoading, error } = state
  
  const CurrentTabComponent = tabs.find(tab => tab.id === currentTab)?.component
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900">
              Study Material Platform
            </h1>
            <div className="text-sm text-gray-500">
              AI-powered study materials from your documents
            </div>
          </div>
        </div>
      </header>
      
      {/* Tab Navigation */}
      <TabNavigation tabs={tabs} />
      
      {/* Main Content */}
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Global Loading Spinner */}
          {isLoading && <LoadingSpinner />}
          
          {/* Global Error Alert */}
          {error && <ErrorAlert message={error} />}
          
          {/* Current Tab Content */}
          {CurrentTabComponent && <CurrentTabComponent />}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500">
            Built with FastAPI, LangGraph, React, and Tailwind CSS
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
import { useState } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import Layout from './components/Layout'
import { AppProvider } from './contexts/AppContext'

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Layout />
        </div>
      </Router>
    </AppProvider>
  )
}

export default App

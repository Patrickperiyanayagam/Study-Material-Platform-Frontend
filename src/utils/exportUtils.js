// Export utilities for different formats
import { marked } from 'marked'

// Simple HTML template for PDF conversion
const createHTMLTemplate = (title, content, styles = '') => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1, h2, h3, h4, h5, h6 {
            color: #2563eb;
            margin-top: 24px;
            margin-bottom: 12px;
        }
        h1 { font-size: 2.25rem; }
        h2 { font-size: 1.875rem; }
        h3 { font-size: 1.5rem; }
        p { margin-bottom: 16px; }
        .metadata {
            background: #f8fafc;
            border-left: 4px solid #2563eb;
            padding: 16px;
            margin: 20px 0;
        }
        .question {
            background: #f1f5f9;
            padding: 15px;
            margin: 15px 0;
            border-radius: 8px;
        }
        .correct-answer {
            color: #059669;
            font-weight: bold;
        }
        .flashcard {
            background: #fafafa;
            border: 1px solid #e5e7eb;
            padding: 20px;
            margin: 15px 0;
            border-radius: 12px;
        }
        .flashcard-front {
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
        }
        .flashcard-back {
            color: #4b5563;
        }
        ${styles}
    </style>
</head>
<body>
    ${content}
</body>
</html>
`

// Convert Markdown to HTML
const markdownToHtml = (markdown) => {
  if (!markdown) return ''
  return marked(markdown, { 
    breaks: true,
    gfm: true 
  })
}

// Remove HTML tags and convert to plain text
const htmlToPlainText = (html) => {
  const temp = document.createElement('div')
  temp.innerHTML = html
  return temp.textContent || temp.innerText || ''
}

// Generate filename with timestamp
const generateFilename = (baseName, format) => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
  return `${baseName}_${timestamp}.${format}`
}

// Download blob as file
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Export Summary
export const exportSummary = async (summaryData, format, filename) => {
  const { content, metadata = {}, settings = {} } = summaryData
  
  const title = `Summary - ${settings.type || 'Overview'}`
  const fullFilename = `${filename}.${format}`
  
  // Prepare content based on format
  switch (format) {
    case 'pdf': {
      const htmlContent = markdownToHtml(content)
      const metadataHtml = `
        <div class="metadata">
          <h3>Summary Details</h3>
          <p><strong>Type:</strong> ${settings.type || 'Overview'}</p>
          <p><strong>Length:</strong> ${settings.length || 'Medium'}</p>
          ${settings.selectedTopics?.length > 0 ? `<p><strong>Topics:</strong> ${settings.selectedTopics.join(', ')}</p>` : ''}
          ${metadata.word_count ? `<p><strong>Word Count:</strong> ${metadata.word_count}</p>` : ''}
          ${metadata.reading_time_minutes ? `<p><strong>Reading Time:</strong> ${metadata.reading_time_minutes} minutes</p>` : ''}
          ${metadata.confidence_score ? `<p><strong>Confidence:</strong> ${Math.round(metadata.confidence_score * 100)}%</p>` : ''}
        </div>
      `
      
      const fullHtml = createHTMLTemplate(title, `<h1>${title}</h1>${metadataHtml}${htmlContent}`)
      
      // Use print to PDF functionality
      const printWindow = window.open('', '_blank')
      printWindow.document.write(fullHtml)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
      return
    }
    
    case 'docx': {
      // For Word documents, we'll create an HTML file that can be opened in Word
      const htmlContent = markdownToHtml(content)
      const metadataHtml = `
        <div class="metadata">
          <h3>Summary Details</h3>
          <p><strong>Type:</strong> ${settings.type || 'Overview'}</p>
          <p><strong>Length:</strong> ${settings.length || 'Medium'}</p>
          ${settings.selectedTopics?.length > 0 ? `<p><strong>Topics:</strong> ${settings.selectedTopics.join(', ')}</p>` : ''}
          ${metadata.word_count ? `<p><strong>Word Count:</strong> ${metadata.word_count}</p>` : ''}
          ${metadata.reading_time_minutes ? `<p><strong>Reading Time:</strong> ${metadata.reading_time_minutes} minutes</p>` : ''}
          ${metadata.confidence_score ? `<p><strong>Confidence:</strong> ${Math.round(metadata.confidence_score * 100)}%</p>` : ''}
        </div>
      `
      
      const wordContent = createHTMLTemplate(title, `<h1>${title}</h1>${metadataHtml}${htmlContent}`)
      const blob = new Blob([wordContent], { type: 'application/msword' })
      downloadBlob(blob, fullFilename)
      return
    }
    
    case 'txt': {
      const plainContent = htmlToPlainText(markdownToHtml(content))
      const metadataText = `
${title}
${'='.repeat(title.length)}

Summary Details:
- Type: ${settings.type || 'Overview'}
- Length: ${settings.length || 'Medium'}
${settings.selectedTopics?.length > 0 ? `- Topics: ${settings.selectedTopics.join(', ')}` : ''}
${metadata.word_count ? `- Word Count: ${metadata.word_count}` : ''}
${metadata.reading_time_minutes ? `- Reading Time: ${metadata.reading_time_minutes} minutes` : ''}
${metadata.confidence_score ? `- Confidence: ${Math.round(metadata.confidence_score * 100)}%` : ''}

Content:
${plainContent}
      `
      
      const blob = new Blob([metadataText], { type: 'text/plain' })
      downloadBlob(blob, fullFilename)
      return
    }
    
    case 'json': {
      const jsonData = {
        title,
        content,
        settings,
        metadata,
        exportedAt: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
      downloadBlob(blob, fullFilename)
      return
    }
    
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

// Export Quiz
export const exportQuiz = async (quizData, userAnswers, format, filename) => {
  const { questions = [], metadata = {} } = quizData
  
  const title = `Quiz Results`
  const fullFilename = `${filename}.${format}`
  
  // Calculate score
  let correct = 0
  questions.forEach((question, index) => {
    if (userAnswers[index] === question.correct_answer) {
      correct++
    }
  })
  const score = Math.round((correct / questions.length) * 100)
  
  switch (format) {
    case 'pdf': {
      const questionsHtml = questions.map((question, index) => {
        const userAnswer = userAnswers[index]
        const isCorrect = userAnswer === question.correct_answer
        
        const optionsHtml = question.options.map((option, optionIndex) => {
          let className = ''
          if (optionIndex === question.correct_answer) {
            className = 'correct-answer'
          } else if (optionIndex === userAnswer && !isCorrect) {
            className = 'incorrect-answer'
          }
          
          const marker = optionIndex === userAnswer ? '→ ' : '   '
          return `<p>${marker}${String.fromCharCode(65 + optionIndex)}. <span class="${className}">${option}</span></p>`
        }).join('')
        
        return `
          <div class="question">
            <h4>Question ${index + 1}: ${isCorrect ? '✅' : '❌'}</h4>
            <p><strong>${question.question}</strong></p>
            ${optionsHtml}
            ${question.explanation ? `<p><em>Explanation: ${question.explanation}</em></p>` : ''}
          </div>
        `
      }).join('')
      
      const metadataHtml = `
        <div class="metadata">
          <h3>Quiz Results</h3>
          <p><strong>Score:</strong> ${score}% (${correct}/${questions.length})</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
      `
      
      const styles = `
        .incorrect-answer { color: #dc2626; }
      `
      
      const fullHtml = createHTMLTemplate(title, `<h1>${title}</h1>${metadataHtml}${questionsHtml}`, styles)
      
      const printWindow = window.open('', '_blank')
      printWindow.document.write(fullHtml)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
      return
    }
    
    case 'docx': {
      const questionsHtml = questions.map((question, index) => {
        const userAnswer = userAnswers[index]
        const isCorrect = userAnswer === question.correct_answer
        
        const optionsHtml = question.options.map((option, optionIndex) => {
          let style = ''
          if (optionIndex === question.correct_answer) {
            style = 'color: green; font-weight: bold;'
          } else if (optionIndex === userAnswer && !isCorrect) {
            style = 'color: red;'
          }
          
          const marker = optionIndex === userAnswer ? '→ ' : '   '
          return `<p>${marker}${String.fromCharCode(65 + optionIndex)}. <span style="${style}">${option}</span></p>`
        }).join('')
        
        return `
          <div style="background: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 8px;">
            <h4>Question ${index + 1}: ${isCorrect ? '✅' : '❌'}</h4>
            <p><strong>${question.question}</strong></p>
            ${optionsHtml}
            ${question.explanation ? `<p><em>Explanation: ${question.explanation}</em></p>` : ''}
          </div>
        `
      }).join('')
      
      const metadataHtml = `
        <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0;">
          <h3>Quiz Results</h3>
          <p><strong>Score:</strong> ${score}% (${correct}/${questions.length})</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
      `
      
      const wordContent = createHTMLTemplate(title, `<h1>${title}</h1>${metadataHtml}${questionsHtml}`)
      const blob = new Blob([wordContent], { type: 'application/msword' })
      downloadBlob(blob, fullFilename)
      return
    }
    
    case 'txt': {
      const questionsText = questions.map((question, index) => {
        const userAnswer = userAnswers[index]
        const isCorrect = userAnswer === question.correct_answer
        
        const optionsText = question.options.map((option, optionIndex) => {
          const marker = optionIndex === userAnswer ? '→' : ' '
          const correct = optionIndex === question.correct_answer ? ' [CORRECT]' : ''
          return `  ${marker} ${String.fromCharCode(65 + optionIndex)}. ${option}${correct}`
        }).join('\n')
        
        return `
Question ${index + 1}: ${isCorrect ? '✅' : '❌'}
${question.question}

${optionsText}

${question.explanation ? `Explanation: ${question.explanation}` : ''}
${'='.repeat(50)}`
      }).join('\n\n')
      
      const textContent = `
${title}
${'='.repeat(title.length)}

Quiz Results:
- Score: ${score}% (${correct}/${questions.length})
- Date: ${new Date().toLocaleDateString()}

${'='.repeat(50)}
${questionsText}
      `
      
      const blob = new Blob([textContent], { type: 'text/plain' })
      downloadBlob(blob, fullFilename)
      return
    }
    
    case 'json': {
      const jsonData = {
        title,
        score,
        correct,
        total: questions.length,
        questions: questions.map((question, index) => ({
          ...question,
          userAnswer: userAnswers[index],
          isCorrect: userAnswers[index] === question.correct_answer
        })),
        exportedAt: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
      downloadBlob(blob, fullFilename)
      return
    }
    
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

// Export Flashcards
export const exportFlashcards = async (flashcardData, format, filename) => {
  const { cards = [], metadata = {} } = flashcardData
  
  const title = `Flashcards Collection`
  const fullFilename = `${filename}.${format}`
  
  switch (format) {
    case 'pdf': {
      const cardsHtml = cards.map((card, index) => `
        <div class="flashcard">
          <div class="flashcard-front">
            <strong>Card ${index + 1} - Question:</strong><br>
            ${card.front}
          </div>
          <div class="flashcard-back">
            <strong>Answer:</strong><br>
            ${card.back}
          </div>
          <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
            <strong>Topic:</strong> ${card.topic || 'General'} | 
            <strong>Difficulty:</strong> ${card.difficulty || 'Medium'}
          </div>
        </div>
      `).join('')
      
      const metadataHtml = `
        <div class="metadata">
          <h3>Flashcard Collection Details</h3>
          <p><strong>Total Cards:</strong> ${cards.length}</p>
          <p><strong>Created:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
      `
      
      const fullHtml = createHTMLTemplate(title, `<h1>${title}</h1>${metadataHtml}${cardsHtml}`)
      
      const printWindow = window.open('', '_blank')
      printWindow.document.write(fullHtml)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
      return
    }
    
    case 'docx': {
      const cardsHtml = cards.map((card, index) => `
        <div style="background: #fafafa; border: 1px solid #e5e7eb; padding: 20px; margin: 15px 0; border-radius: 12px;">
          <div style="font-weight: bold; color: #1f2937; margin-bottom: 10px;">
            <strong>Card ${index + 1} - Question:</strong><br>
            ${card.front}
          </div>
          <div style="color: #4b5563;">
            <strong>Answer:</strong><br>
            ${card.back}
          </div>
          <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
            <strong>Topic:</strong> ${card.topic || 'General'} | 
            <strong>Difficulty:</strong> ${card.difficulty || 'Medium'}
          </div>
        </div>
      `).join('')
      
      const metadataHtml = `
        <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0;">
          <h3>Flashcard Collection Details</h3>
          <p><strong>Total Cards:</strong> ${cards.length}</p>
          <p><strong>Created:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
      `
      
      const wordContent = createHTMLTemplate(title, `<h1>${title}</h1>${metadataHtml}${cardsHtml}`)
      const blob = new Blob([wordContent], { type: 'application/msword' })
      downloadBlob(blob, fullFilename)
      return
    }
    
    case 'txt': {
      const cardsText = cards.map((card, index) => `
Card ${index + 1}
${'='.repeat(20)}

Question: ${card.front}

Answer: ${card.back}

Topic: ${card.topic || 'General'}
Difficulty: ${card.difficulty || 'Medium'}

${'='.repeat(50)}`
      ).join('\n\n')
      
      const textContent = `
${title}
${'='.repeat(title.length)}

Collection Details:
- Total Cards: ${cards.length}
- Created: ${new Date().toLocaleDateString()}

${'='.repeat(50)}
${cardsText}
      `
      
      const blob = new Blob([textContent], { type: 'text/plain' })
      downloadBlob(blob, fullFilename)
      return
    }
    
    case 'json': {
      const jsonData = {
        title,
        totalCards: cards.length,
        cards,
        metadata,
        exportedAt: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
      downloadBlob(blob, fullFilename)
      return
    }
    
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

// Export Individual Note
export const exportNote = async (noteData, format, filename) => {
  const { title, content, createdAt, updatedAt } = noteData
  
  const noteTitle = `Note: ${title}`
  const fullFilename = `${filename}.${format}`
  
  switch (format) {
    case 'pdf': {
      const contentHtml = markdownToHtml(content || 'No content')
      const metadataHtml = `
        <div class="metadata">
          <h3>Note Details</h3>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Created:</strong> ${new Date(createdAt).toLocaleDateString()}</p>
          <p><strong>Last Updated:</strong> ${new Date(updatedAt).toLocaleDateString()}</p>
        </div>
      `
      
      const fullHtml = createHTMLTemplate(noteTitle, `<h1>${title}</h1>${metadataHtml}${contentHtml}`)
      
      const printWindow = window.open('', '_blank')
      printWindow.document.write(fullHtml)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
      return
    }
    
    case 'docx': {
      const contentHtml = markdownToHtml(content || 'No content')
      const metadataHtml = `
        <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0;">
          <h3>Note Details</h3>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Created:</strong> ${new Date(createdAt).toLocaleDateString()}</p>
          <p><strong>Last Updated:</strong> ${new Date(updatedAt).toLocaleDateString()}</p>
        </div>
      `
      
      const wordContent = createHTMLTemplate(noteTitle, `<h1>${title}</h1>${metadataHtml}${contentHtml}`)
      const blob = new Blob([wordContent], { type: 'application/msword' })
      downloadBlob(blob, fullFilename)
      return
    }
    
    case 'txt': {
      const plainContent = content || 'No content'
      const textContent = `
${title}
${'='.repeat(title.length)}

Created: ${new Date(createdAt).toLocaleDateString()}
Last Updated: ${new Date(updatedAt).toLocaleDateString()}

Content:
${plainContent}
      `
      
      const blob = new Blob([textContent], { type: 'text/plain' })
      downloadBlob(blob, fullFilename)
      return
    }
    
    case 'json': {
      const jsonData = {
        title,
        content,
        createdAt,
        updatedAt,
        exportedAt: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
      downloadBlob(blob, fullFilename)
      return
    }
    
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

// Export Test Results
export const exportTestResults = async (gradingResults, format, filename) => {
  const { grades = [], total_marks_awarded, total_marks_possible, overall_percentage, overall_feedback, weak_topics = [], study_plan = [] } = gradingResults
  
  const title = `Test Results Report`
  const fullFilename = `${filename}.${format}`
  
  switch (format) {
    case 'pdf': {
      const resultsHtml = grades.map((grade, index) => `
        <div class="question" style="margin-bottom: 30px;">
          <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="margin: 0 0 10px 0; color: #0277bd;">Question ${index + 1}</h3>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong>${grade.question}</strong>
              <div style="text-align: right;">
                <div style="font-size: 1.2em; font-weight: bold; color: #0277bd;">
                  ${grade.marks_awarded.toFixed(1)} / ${grade.max_marks} marks
                </div>
                <div style="font-size: 0.9em; color: #666;">
                  ${grade.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong>Your Answer:</strong>
            <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 5px;">
              ${grade.user_answer || 'No answer provided'}
            </div>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong>Feedback:</strong>
            <div style="color: #555; margin-top: 5px;">${grade.feedback}</div>
          </div>
        </div>
      `).join('')
      
      const fullHtml = createHTMLTemplate(title, `<h1 style="text-align: center;">${title}</h1>${resultsHtml}`)
      
      const printWindow = window.open('', '_blank')
      printWindow.document.write(fullHtml)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
      return
    }
    
    case 'json': {
      const jsonData = {
        title,
        overall_performance: {
          percentage: overall_percentage,
          marks_awarded: total_marks_awarded,
          marks_possible: total_marks_possible,
          feedback: overall_feedback
        },
        weak_topics,
        study_plan,
        detailed_results: grades,
        exportedAt: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
      downloadBlob(blob, fullFilename)
      return
    }
    
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

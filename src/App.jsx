import { useState, useRef, useEffect } from 'react'
import './App.css'

// Professional SVG Icons
const MicrophoneIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <path d="M12 19v4"/>
    <path d="M8 23h8"/>
  </svg>
)

const StopIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2"/>
  </svg>
)

const TrashIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18"/>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
)

const CheckIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
)

const XIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18"/>
    <path d="M6 6l12 12"/>
  </svg>
)

const WaveIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v20"/>
    <path d="M8 5v14"/>
    <path d="M16 5v14"/>
    <path d="M4 8v8"/>
    <path d="M20 8v8"/>
  </svg>
)

const EditIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

const CopyIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)

// Helper function to detect Safari iOS
const isSafariIOS = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/.test(userAgent) && /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent)
}

// Helper function to check if HTTPS is being used
const isHTTPS = () => {
  return window.location.protocol === 'https:' || window.location.hostname === 'localhost'
}

function App() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [editableText, setEditableText] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [cursorManuallyMoved, setCursorManuallyMoved] = useState(false)
  const [browserInfo, setBrowserInfo] = useState('')
  const textareaRef = useRef(null)

  const recognitionRef = useRef(null)
  const lastProcessedIndex = useRef(0)

  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      
      // Configure recognition
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'fa-IR' // Persian language
      
      // Set up event handlers
      recognitionRef.current.onstart = () => {
        setIsRecording(true)
        setError('')
        lastProcessedIndex.current = 0
      }

      recognitionRef.current.onresult = (event) => {
        let newFinalTranscript = ''

        // Only process new results we haven't seen before
        for (let i = lastProcessedIndex.current; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            newFinalTranscript += result[0].transcript
            lastProcessedIndex.current = i + 1
          }
        }

        // Only update if we have new final transcript
        if (newFinalTranscript.trim()) {
          setEditableText(prevText => {
            const currentText = prevText || ''
            const newText = currentText + (currentText ? ' ' : '') + newFinalTranscript.trim()
            setTranscript(newText)
            
            // Update cursor position to end of text
            if (!cursorManuallyMoved) {
              setTimeout(() => {
                if (textareaRef.current) {
                  textareaRef.current.setSelectionRange(newText.length, newText.length)
                  setCursorPosition(newText.length)
                }
              }, 0)
            }
            
            return newText
          })
        }
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
        
        switch (event.error) {
          case 'network':
            setError('خطای شبکه. لطفاً اتصال اینترنت خود را بررسی کنید.')
            break
          case 'not-allowed':
            setError('دسترسی به میکروفون مجاز نیست. لطفاً اجازه دسترسی را بدهید.')
            break
          case 'no-speech':
            setError('صدایی تشخیص داده نشد. لطفاً دوباره تلاش کنید.')
            break
          case 'audio-capture':
            setError('خطا در ضبط صدا. لطفاً میکروفون خود را بررسی کنید.')
            break
          default:
            setError(`خطا در تشخیص گفتار: ${event.error}`)
        }
      }

      recognitionRef.current.onend = () => {
        setIsRecording(false)
        lastProcessedIndex.current = 0
      }

      setIsSupported(true)
      
      // Set browser info for debugging
      const userAgent = navigator.userAgent
      if (userAgent.includes('Chrome')) {
        setBrowserInfo('Chrome')
      } else if (userAgent.includes('Firefox')) {
        setBrowserInfo('Firefox')
      } else if (userAgent.includes('Safari')) {
        setBrowserInfo('Safari')
      } else if (userAgent.includes('Edge')) {
        setBrowserInfo('Edge')
      } else {
        setBrowserInfo('Unknown')
      }
      
    } else {
      setIsSupported(false)
      setError('مرورگر شما از تشخیص گفتار پشتیبانی نمی‌کند. لطفاً از Chrome استفاده کنید.')
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  // Toggle recording function
  const toggleRecording = () => {
    if (!recognitionRef.current) return

    if (isRecording) {
      recognitionRef.current.stop()
    } else {
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error('Error starting recognition:', error)
        setError('خطا در شروع ضبط. لطفاً دوباره تلاش کنید.')
      }
    }
  }

  // Clear transcript function
  const clearTranscript = () => {
    setTranscript('')
    setEditableText('')
    setCursorPosition(0)
    setCursorManuallyMoved(false)
    setError('')
    
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  // Copy text function
  const handleCopy = async () => {
    const textToCopy = editableText || transcript
    
    if (!textToCopy) return

    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopySuccess(true)
      
      // Reset success state after 2 seconds
      setTimeout(() => {
        setCopySuccess(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
      
      // Fallback for older browsers
      try {
        if (textareaRef.current) {
          textareaRef.current.select()
          document.execCommand('copy')
          setCopySuccess(true)
          
          setTimeout(() => {
            setCopySuccess(false)
          }, 2000)
        }
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError)
        setError('خطا در کپی کردن متن')
      }
    }
  }

  // Handle textarea changes
  const handleTextareaChange = (e) => {
    setEditableText(e.target.value)
    setTranscript(e.target.value)
    setCursorPosition(e.target.selectionStart)
  }

  // Handle textarea selection/cursor position
  const handleTextareaSelect = (e) => {
    setCursorPosition(e.target.selectionStart)
    setCursorManuallyMoved(true)
    
    // Reset manual move flag after 3 seconds of inactivity
    setTimeout(() => {
      setCursorManuallyMoved(false)
    }, 3000)
  }

  return (
    <div className="app">
      <div className="app-header">
        <div className="logo-container">
          <img src="/sound-waves.png" alt="گویا نگار" className="logo-image" />
          <h1 className="logo-text">گویا نگار</h1>
        </div>
      </div>
      
      <div className="container">
        <main className="main">
          {error && (
            <div className="error-message">
              <XIcon className="error-icon" />
              <span>{error}</span>
            </div>
          )}
          
          {/* Show browser info for debugging */}
          {browserInfo && (
            <div className="browser-info" style={{ 
              fontSize: '12px', 
              color: '#666', 
              marginBottom: '10px',
              textAlign: 'center'
            }}>
              مرورگر: {browserInfo} | HTTPS: {isHTTPS() ? 'بله' : 'خیر'}
            </div>
          )}
          
          <div className="transcript-section">
            <div className="transcript-box">
              <textarea
                ref={textareaRef}
                className="transcript-display"
                value={editableText}
                onChange={handleTextareaChange}
                onSelect={handleTextareaSelect}
                onClick={handleTextareaSelect}
                placeholder="متن گفتار در اینجا نمایش داده می‌شود و می‌توانید آن را ویرایش کنید..."
                readOnly={isRecording}
              />
            </div>
          </div>

          <div className="controls">
            <button 
              className={`primary-button ${isRecording ? 'recording' : ''}`}
              onClick={toggleRecording}
              disabled={!isSupported}
            >
              {isRecording ? (
                <>
                  <StopIcon className="button-icon" />
                  توقف ضبط
                </>
              ) : (
                <>
                  <MicrophoneIcon className="button-icon" />
                  شروع ضبط
                </>
              )}
            </button>
            
            <button 
              className="secondary-button"
              onClick={clearTranscript}
              disabled={!editableText && !transcript}
            >
              <TrashIcon className="button-icon" />
              پاک کردن
            </button>

            <button 
              className={`copy-button ${copySuccess ? 'success' : ''}`}
              onClick={handleCopy}
              disabled={!editableText && !transcript}
            >
              <CopyIcon className="button-icon" />
              {copySuccess ? 'کپی شد!' : 'کپی متن'}
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App

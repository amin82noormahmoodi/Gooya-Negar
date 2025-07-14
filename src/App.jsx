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

function App() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [editableText, setEditableText] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [cursorManuallyMoved, setCursorManuallyMoved] = useState(false)
  const textareaRef = useRef(null)

  const recognitionRef = useRef(null)

  // Check browser support for Web Speech API
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true)
      initializeSpeechRecognition()
    } else {
      setIsSupported(false)
      setError('مرورگر شما از تشخیص گفتار پشتیبانی نمی‌کند')
    }
  }, [])

  // Save cursor position when textarea changes
  const handleTextareaChange = (e) => {
    setEditableText(e.target.value)
    setCursorPosition(e.target.selectionStart)
    setCursorManuallyMoved(true)
  }

  // Update cursor position when textarea is clicked or cursor moves
  const handleTextareaSelect = (e) => {
    const newPosition = e.target.selectionStart
    if (newPosition !== cursorPosition) {
      setCursorPosition(newPosition)
      setCursorManuallyMoved(true)
    }
  }

  const initializeSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    // Configuration
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'fa-IR' // Persian language
    recognition.maxAlternatives = 1

    // Event handlers
    recognition.onstart = () => {
      setIsRecording(true)
      setError('')
      console.log('شروع تشخیص گفتار')
      
      // If cursor wasn't manually moved, set it to the end
      if (!cursorManuallyMoved && textareaRef.current) {
        const endPosition = textareaRef.current.value.length
        textareaRef.current.selectionStart = endPosition
        textareaRef.current.selectionEnd = endPosition
        setCursorPosition(endPosition)
      }
    }

    recognition.onresult = (event) => {
      let interimTranscript = ''
      let finalTranscriptTemp = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscriptTemp += transcript
        } else {
          interimTranscript += transcript
        }
      }

      setTranscript(interimTranscript)
      
      if (finalTranscriptTemp) {
        setEditableText(prevText => {
          // Get current cursor position from textarea
          const currentPosition = cursorManuallyMoved ? cursorPosition : prevText.length
          
          // Insert new text at cursor position
          const beforeCursor = prevText.slice(0, currentPosition)
          const afterCursor = prevText.slice(currentPosition)
          const newText = beforeCursor + finalTranscriptTemp + ' ' + afterCursor
          
          // Update cursor position
          const newCursorPosition = currentPosition + finalTranscriptTemp.length + 1
          
          // Schedule cursor position update
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = newCursorPosition
              textareaRef.current.selectionEnd = newCursorPosition
              setCursorPosition(newCursorPosition)
            }
          }, 0)
          
          return newText
        })
      }
    }

    recognition.onerror = (event) => {
      console.error('خطا در تشخیص گفتار:', event.error)
      setIsRecording(false)
      
      switch (event.error) {
        case 'no-speech':
          setError('صدایی شنیده نشد. لطفاً دوباره تلاش کنید.')
          break
        case 'audio-capture':
          setError('خطا در دسترسی به میکروفون')
          break
        case 'not-allowed':
          setError('دسترسی به میکروفون رد شد')
          break
        case 'network':
          setError('خطا در اتصال به اینترنت')
          break
        case 'service-not-allowed':
          setError('سرویس تشخیص گفتار در دسترس نیست')
          break
        default:
          setError(`خطا: ${event.error}`)
      }
    }

    recognition.onend = () => {
      setIsRecording(false)
      setTranscript('')
      console.log('پایان تشخیص گفتار')
    }

    recognitionRef.current = recognition
  }

  const startRecording = () => {
    if (!isSupported) {
      setError('مرورگر شما از تشخیص گفتار پشتیبانی نمی‌کند')
      return
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
        setError('')
      } catch (err) {
        console.error('خطا در شروع ضبط:', err)
        setError('خطا در شروع ضبط')
      }
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
    }
  }

  const clearTranscript = () => {
    setTranscript('')
    setEditableText('')
    setCursorPosition(0)
    setCursorManuallyMoved(false)
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // Add copy function
  const handleCopy = async () => {
    const textToCopy = editableText || transcript;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

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

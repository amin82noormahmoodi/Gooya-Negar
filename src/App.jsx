import { useState, useRef, useEffect } from 'react'
import './App.css'

// Audio Player Component
const AudioPlayer = ({ 
  audioRef, 
  isPlaying, 
  onTogglePlay, 
  duration, 
  currentTime, 
  fileSize 
}) => {
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0
  
  const formatTime = (time) => {
    if (isNaN(time)) return "00:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="audio-player">
      <button 
        className="audio-play-button"
        onClick={onTogglePlay}
      >
        {isPlaying ? (
          <PauseIcon className="play-icon" />
        ) : (
          <PlayIcon className="play-icon" />
        )}
      </button>
      
      <div className="audio-waveform">
        {/* موج‌های صوتی */}
        {Array.from({ length: 50 }, (_, i) => (
          <div 
            key={i}
            className={`wave-bar-static ${i < (progressPercentage / 2) ? 'active' : ''}`}
            style={{ 
              height: `${Math.random() * 60 + 20}%`,
              animationDelay: `${i * 50}ms`
            }}
          />
        ))}
      </div>
      

    </div>
  )
}

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

const PlayIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5,3 19,12 5,21"/>
  </svg>
)

const PauseIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16"/>
    <rect x="14" y="4" width="4" height="16"/>
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

const SendIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22,2 15,22 11,13 2,9 22,2"/>
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

const CopyIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)

const LoadingIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2a10 10 0 0 1 10 10"/>
  </svg>
)

function App() {
  // State management
  const [isRecording, setIsRecording] = useState(false)
  const [hasRecording, setHasRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)
  const [audioDuration, setAudioDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioFileSize, setAudioFileSize] = useState(0)
  
  // Refs
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const audioRef = useRef(null)
  const textareaRef = useRef(null)

  // API configuration
  const API_BASE_URL = 'http://localhost:8000'

  // Initialize audio recording
  const initializeRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl
        }
        
        setHasRecording(true)
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop())
      }

      setError('')
      return true
    } catch (err) {
      console.error('Error accessing microphone:', err)
      setError('دسترسی به میکروفون امکان‌پذیر نیست. لطفاً اجازه دسترسی دهید.')
      return false
    }
  }

  // Start recording
  const startRecording = async () => {
    const initialized = await initializeRecording()
    if (!initialized) return

    try {
      mediaRecorderRef.current.start(1000) // Collect data every second
      setIsRecording(true)
      setHasRecording(false)
      setError('')
    } catch (err) {
      console.error('Error starting recording:', err)
      setError('خطا در شروع ضبط صدا')
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      // محاسبه اندازه فایل
      setTimeout(() => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          setAudioFileSize(audioBlob.size)
        }
      }, 100)
    }
  }

  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // Play/pause audio
  const togglePlayback = () => {
    if (!audioRef.current || !hasRecording) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  // Audio event handlers
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current

      const handleEnded = () => setIsPlaying(false)
      const handlePause = () => setIsPlaying(false)
      const handleLoadedMetadata = () => {
        setAudioDuration(audio.duration)
      }
      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime)
      }

      audio.addEventListener('ended', handleEnded)
      audio.addEventListener('pause', handlePause)
      audio.addEventListener('loadedmetadata', handleLoadedMetadata)
      audio.addEventListener('timeupdate', handleTimeUpdate)

      return () => {
        audio.removeEventListener('ended', handleEnded)
        audio.removeEventListener('pause', handlePause)
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audio.removeEventListener('timeupdate', handleTimeUpdate)
      }
    }
  }, [])

  // Send audio to backend
  const sendAudio = async () => {
    if (!hasRecording || audioChunksRef.current.length === 0) return

    setIsLoading(true)
    setError('')

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      const formData = new FormData()
      formData.append('file', audioBlob, 'recording.webm')
      formData.append('language', 'fa-IR')

      const response = await fetch(`${API_BASE_URL}/transcribe`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success && result.text) {
        // Append new text to existing transcript
        const newText = result.text.trim()
        if (newText) {
          setTranscript(prev => {
            const updated = prev ? `${prev} ${newText}` : newText
            return updated
          })
        }
      } else if (result.success === false) {
        // Handle backend error response
        setError(result.error || result.message || 'خطا در تبدیل صوت به متن')
      } else {
        setError('متن قابل تشخیصی در فایل صوتی یافت نشد')
      }

      // Clear recording after successful transcription
      clearRecording()

    } catch (err) {
      console.error('Error sending audio:', err)
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setError('خطا در اتصال به سرور. لطفاً اطمینان حاصل کنید که سرور در حال اجرا است.')
      } else {
        setError('خطا در ارسال فایل صوتی: ' + err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Clear current recording (not transcript)
  const clearRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    
    audioChunksRef.current = []
    setHasRecording(false)
    setIsPlaying(false)
    setAudioDuration(0)
    setCurrentTime(0)
    setAudioFileSize(0)
    setError('')
  }

  // Clear all transcript
  const clearTranscript = () => {
    setTranscript('')
    clearRecording()
  }

  // Clear all (both recording and transcript)
  const clearAll = () => {
    setTranscript('')
    clearRecording()
  }

  // Copy transcript to clipboard
  const copyToClipboard = async () => {
    if (!transcript) return

    try {
      await navigator.clipboard.writeText(transcript)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Error copying to clipboard:', err)
      setError('خطا در کپی کردن متن')
    }
  }

  // Handle transcript text change
  const handleTranscriptChange = (e) => {
    setTranscript(e.target.value)
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
          
          <div className="transcript-section">
            {/* نمایش وضعیت پردازش */}
            {isLoading && (
              <div className="status-indicator">
                <div className="status-item loading">
                  <LoadingIcon className="status-icon loading-spin" />
                  <span>در حال پردازش...</span>
                </div>
              </div>
            )}
            
            <div className={`transcript-box ${isRecording ? 'recording' : ''}`}>
              <textarea
                ref={textareaRef}
                className={`transcript-display ${isRecording ? 'recording' : ''}`}
                value={transcript}
                onChange={handleTranscriptChange}
                placeholder={isRecording ? "در حال ضبط صدا..." : "متن گفتار در اینجا نمایش داده می‌شود و می‌توانید آن را ویرایش کنید..."}
                readOnly={isRecording}
              />
            </div>
          </div>

          {/* Audio element for playback */}
          <audio ref={audioRef} style={{ display: 'none' }} />



          <div className={`controls ${!hasRecording && !transcript ? 'center-mode' : ''}`}>
            {/* Left side buttons - فقط وقتی چیزی برای نمایش داریم */}
            {(hasRecording || transcript) && (
              <div className="controls-left">
                {/* Copy button - فقط وقتی متن موجود باشد */}
                {transcript && (
                  <button 
                    className={`copy-button-left ${copySuccess ? 'success' : ''}`}
                    onClick={copyToClipboard}
                    disabled={isRecording}
                  >
                    {copySuccess ? (
                      <CheckIcon className="button-icon" />
                    ) : (
                      <CopyIcon className="button-icon" />
                    )}
                  </button>
                )}
                
                {/* Clear button */}
                <button 
                  className="clear-button-left"
                  onClick={clearAll}
                  disabled={!transcript && !hasRecording}
                >
                  <TrashIcon className="button-icon" />
                </button>
              </div>
            )}

            {/* Audio Player - وسط (فقط وقتی ضبط موجود باشه) */}
            {hasRecording && !isRecording && (
              <AudioPlayer
                audioRef={audioRef}
                isPlaying={isPlaying}
                onTogglePlay={togglePlayback}
                duration={audioDuration}
                currentTime={currentTime}
                fileSize={audioFileSize}
              />
            )}

            {/* Right side buttons - سمت راست یا وسط */}
            <div className="controls-right">
              {/* Recording button */}
              <button 
                className={`icon-button record-button ${isRecording ? 'recording' : ''}`}
                onClick={toggleRecording}
                disabled={isLoading}
              >
                {isRecording ? (
                  <StopIcon className="button-icon" />
                ) : (
                  <MicrophoneIcon className="button-icon" />
                )}
              </button>

              {/* Send button */}
              <button 
                className="icon-button send-button"
                onClick={sendAudio}
                disabled={!hasRecording || isLoading || isRecording}
              >
                {isLoading ? (
                  <LoadingIcon className="button-icon loading-spin" />
                ) : (
                  <SendIcon className="button-icon" />
                )}
              </button>
            </div>
          </div>

          {/* انیمیشن ضبط در پایین صفحه */}
          {isRecording && (
            <div className="recording-indicator-bottom">
              <div className="recording-animation-bottom">
                <div className="wave-bar-bottom"></div>
                <div className="wave-bar-bottom"></div>
                <div className="wave-bar-bottom"></div>
                <div className="wave-bar-bottom"></div>
                <div className="wave-bar-bottom"></div>
              </div>
              <span className="recording-text">در حال ضبط...</span>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App

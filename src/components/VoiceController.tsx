import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square, Loader2, AlertCircle, Check, X, Volume2 } from 'lucide-react';

interface VoiceControllerProps {
  onTranscriptChange: (text: string) => void;
  onSendTranscript?: (text: string) => void;
  disabled?: boolean;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({
  onTranscriptChange,
  onSendTranscript,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [hasPermissionError, setHasPermissionError] = useState<boolean>(false);

  // References for MediaRecorder and audio stream
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);

  // Web Speech API fallback reference
  const speechRecognitionRef = useRef<any>(null);
  const accumulatedSpeechRef = useRef<string>('');

  // Setup Web Speech API if supported for live preview
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN'; // Indian English textile terminology

        recognition.onresult = (event: any) => {
          let currentText = '';
          for (let i = 0; i < event.results.length; ++i) {
            currentText += event.results[i][0].transcript;
          }
          if (currentText) {
            setLiveTranscript(currentText);
            accumulatedSpeechRef.current = currentText;
          }
        };

        recognition.onerror = (e: any) => {
          // Non-fatal, MediaRecorder is the primary backend transcription source
          console.warn('SpeechRecognition preview notice:', e.error);
        };

        speechRecognitionRef.current = recognition;
      } catch (err) {
        console.warn('Web Speech API initialization notice:', err);
      }
    }

    return () => {
      stopTracks();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Start Voice Recording
  const startRecording = async () => {
    if (disabled || isRecording || isTranscribing) return;

    setStatusMessage(null);
    setHasPermissionError(false);
    setLiveTranscript('');
    accumulatedSpeechRef.current = '';
    audioChunksRef.current = [];
    setRecordingSeconds(0);

    // Check mediaDevices support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatusMessage('Audio recording is not supported in this browser. Please use text chat.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;

      // Select supported audio MIME type
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await handleAudioProcessing(audioBlob, mimeType);
      };

      recorder.start(250); // Slice into 250ms chunks
      setIsRecording(true);

      // Start duration counter
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Start live speech preview if available
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.start();
        } catch {
          // ignore if already started
        }
      }
    } catch (err: any) {
      console.error('Microphone access error:', err);
      setHasPermissionError(true);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setStatusMessage('Microphone access was denied. Please allow microphone permission in your browser URL bar.');
      } else {
        setStatusMessage(`Microphone unavailable (${err.message || 'Error'}). Please type your question.`);
      }
      stopTracks();
    }
  };

  // Stop Recording and Transcribe
  const stopRecording = (shouldTranscribe = true) => {
    if (!isRecording) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    if (!shouldTranscribe) {
      // Cancelled
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      }
      audioChunksRef.current = [];
      setIsRecording(false);
      stopTracks();
      setStatusMessage('Voice recording cancelled.');
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    setIsRecording(false);
    setIsTranscribing(true);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // If recorder wasn't active, fallback to collected speech transcript
      fallbackToCollectedSpeech();
    }

    stopTracks();
  };

  // Convert blob to base64 and send to Gemini /api/transcribe
  const handleAudioProcessing = async (blob: Blob, mimeType: string) => {
    try {
      if (blob.size < 1000 && accumulatedSpeechRef.current) {
        // If audio blob was tiny, use collected browser speech recognition
        finishTranscription(accumulatedSpeechRef.current);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;

        try {
          const res = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioData: base64Audio,
              mimeType,
            }),
          });

          const data = await res.json();

          if (res.ok && data.transcript) {
            finishTranscription(data.transcript);
          } else {
            console.warn('Transcription API fallback:', data.error);
            fallbackToCollectedSpeech(data.error);
          }
        } catch (fetchErr: any) {
          console.error('Error contacting transcription endpoint:', fetchErr);
          fallbackToCollectedSpeech('Network error during transcription.');
        }
      };
    } catch (err: any) {
      console.error('Audio processing error:', err);
      fallbackToCollectedSpeech();
    }
  };

  const fallbackToCollectedSpeech = (errorNote?: string) => {
    if (accumulatedSpeechRef.current && accumulatedSpeechRef.current.trim()) {
      finishTranscription(accumulatedSpeechRef.current.trim());
    } else {
      setIsTranscribing(false);
      setStatusMessage(errorNote || 'Could not detect clear speech. Please try speaking again or use text chat.');
    }
  };

  const finishTranscription = (transcriptText: string) => {
    setIsTranscribing(false);
    const cleanText = transcriptText.trim();
    if (cleanText) {
      onTranscriptChange(cleanText);
      setStatusMessage(`Transcribed: "${cleanText.length > 50 ? cleanText.substring(0, 50) + '...' : cleanText}"`);
      setTimeout(() => setStatusMessage(null), 4000);
    } else {
      setStatusMessage('No speech detected. Please speak closer to your microphone.');
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div className="relative flex items-center">
      {/* Primary Voice Mic Button */}
      {!isRecording && !isTranscribing ? (
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled}
          className={`p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors flex items-center gap-1 ${
            hasPermissionError ? 'text-rose-500 hover:text-rose-700' : ''
          }`}
          title="Click to speak your sourcing question (Microphone recording & Gemini transcription)"
          aria-label="Record voice question"
        >
          <Mic className="w-4 h-4" />
        </button>
      ) : isTranscribing ? (
        /* Transcribing State */
        <div className="flex items-center gap-2 px-2.5 py-1 bg-stone-100 rounded-lg text-xs text-stone-700 animate-in fade-in">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-900" />
          <span className="font-medium">Transcribing voice...</span>
        </div>
      ) : (
        /* Active Recording State */
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl shadow-xs animate-in fade-in">
          {/* Pulsing Red Dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
          </span>

          {/* Recording Timer */}
          <span className="text-xs font-mono font-semibold text-rose-800">
            {formatTimer(recordingSeconds)}
          </span>

          {/* Sound wave icon */}
          <Volume2 className="w-3.5 h-3.5 text-rose-600 animate-pulse hidden sm:inline" />

          {/* Done / Stop & Transcribe Button */}
          <button
            type="button"
            onClick={() => stopRecording(true)}
            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold rounded-md transition-colors flex items-center gap-1 shadow-xs"
            title="Stop recording and transcribe question"
            aria-label="Stop recording and transcribe question"
          >
            <Check className="w-3 h-3" />
            <span>Done</span>
          </button>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={() => stopRecording(false)}
            className="p-0.5 text-rose-500 hover:text-rose-800 rounded transition-colors"
            title="Cancel recording"
            aria-label="Cancel recording"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Status / Error / Transcript Toast */}
      {statusMessage && (
        <div
          role="status"
          className="absolute bottom-full mb-2 left-0 w-72 max-w-xs p-2.5 bg-stone-900 text-stone-100 text-xs rounded-xl shadow-xl z-30 flex items-start gap-2 border border-stone-700 animate-in fade-in"
        >
          {hasPermissionError ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-[11px] leading-snug">{statusMessage}</div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-stone-400 hover:text-white text-xs p-0.5"
            aria-label="Dismiss voice status"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Real-time live speech preview tooltip while recording */}
      {isRecording && liveTranscript && (
        <div className="absolute bottom-full mb-2 left-0 w-80 max-w-sm p-2 bg-white border border-rose-200 text-stone-800 text-xs rounded-xl shadow-lg z-30 pointer-events-none truncate">
          <span className="text-[10px] uppercase font-bold text-rose-600 block mb-0.5">Hearing:</span>
          <span className="italic text-stone-700">"{liveTranscript}"</span>
        </div>
      )}
    </div>
  );
};

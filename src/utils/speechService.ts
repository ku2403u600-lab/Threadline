// Speech and Audio synthesis service for voice-to-voice communication

type SpeechState = 'idle' | 'loading' | 'playing' | 'error';

class SpeechService {
  private currentAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private stateChangeListeners: Set<(state: SpeechState, activeMessageId?: string | null) => void> = new Set();
  private activeMessageId: string | null = null;
  private state: SpeechState = 'idle';

  public addListener(listener: (state: SpeechState, activeMessageId?: string | null) => void) {
    this.stateChangeListeners.add(listener);
    listener(this.state, this.activeMessageId);
    return () => {
      this.stateChangeListeners.delete(listener);
    };
  }

  private notify(state: SpeechState, messageId?: string | null) {
    this.state = state;
    this.activeMessageId = messageId !== undefined ? messageId : this.activeMessageId;
    this.stateChangeListeners.forEach((l) => l(this.state, this.activeMessageId));
  }

  public stop() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // ignore
      }
      this.currentAudio = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
      this.currentUtterance = null;
    }

    this.notify('idle', null);
  }

  public async speak(text: string, messageId?: string, voiceName: string = 'Kore'): Promise<void> {
    this.stop();

    if (!text || !text.trim()) return;

    this.notify('loading', messageId || null);

    // Clean text for speech
    const cleanText = text
      .replace(/###\s+/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\[(?:VERIFIED|ESTIMATED|SUPPLIER-CLAIMED|UNVERIFIED)\]/gi, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^\s*[-*]\s+/gm, '')
      .trim();

    try {
      // 1. Try Gemini 3.8 Flash Lite TTS endpoint
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voiceName }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audioData) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioData}`);
          this.currentAudio = audio;

          audio.onplay = () => {
            this.notify('playing', messageId || null);
          };

          audio.onended = () => {
            this.stop();
          };

          audio.onerror = () => {
            console.warn('Audio playback error, falling back to Web Speech Synthesis');
            this.fallbackSpeechSynthesis(cleanText, messageId);
          };

          await audio.play();
          return;
        } else if (data.fallbackToBrowser) {
          this.fallbackSpeechSynthesis(data.cleanText || cleanText, messageId);
          return;
        }
      }

      // If backend TTS failed, fallback to native SpeechSynthesis
      this.fallbackSpeechSynthesis(cleanText, messageId);
    } catch (err) {
      console.warn('Backend TTS error, using browser speech synthesis fallback:', err);
      this.fallbackSpeechSynthesis(cleanText, messageId);
    }
  }

  private fallbackSpeechSynthesis(cleanText: string, messageId?: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.notify('error', null);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Select natural English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find((v) => v.lang === 'en-IN' || v.name.includes('India')) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0];

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        this.notify('playing', messageId || null);
      };

      utterance.onend = () => {
        this.stop();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        this.stop();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis execution error:', err);
      this.notify('error', null);
    }
  }

  public getState() {
    return { state: this.state, activeMessageId: this.activeMessageId };
  }
}

export const speechService = new SpeechService();

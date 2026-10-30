import { VoiceOption } from '../types/sourcing';

// Available natural voices for the THREADLINE voice assistant
export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'female',
    personaLabel: 'Warm & Natural',
    description: 'Warm, balanced, natural Indian textile sourcing advisor',
    speechStyleDescription: 'Clear, warm, natural female Indian fashion sourcing specialist',
    pitch: 1.05,
    rate: 1.0,
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'female',
    personaLabel: 'Crisp & Articulate',
    description: 'Crisp, calm, articulate fashion styling consultant',
    speechStyleDescription: 'Calm, crisp, articulate female fashion styling consultant',
    pitch: 1.1,
    rate: 1.0,
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'male',
    personaLabel: 'Friendly & Engaging',
    description: 'Engaging, friendly, approachable garment production advisor',
    speechStyleDescription: 'Clear, friendly, engaging male textile production advisor',
    pitch: 0.98,
    rate: 1.02,
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'male',
    personaLabel: 'Deep & Authoritative',
    description: 'Deep, grounded, seasoned textile mill director',
    speechStyleDescription: 'Deep, authoritative, calm male textile mill veteran',
    pitch: 0.88,
    rate: 0.96,
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'male',
    personaLabel: 'Steady & Confident',
    description: 'Confident, steady, measured strategic procurement advisor',
    speechStyleDescription: 'Confident, steady, articulate male sourcing consultant',
    pitch: 0.94,
    rate: 1.0,
  },
];

type SpeechState = 'idle' | 'loading' | 'playing' | 'error';

class SpeechService {
  private currentAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private stateChangeListeners: Set<(state: SpeechState, activeMessageId?: string | null) => void> = new Set();
  private voiceChangeListeners: Set<(voice: VoiceOption) => void> = new Set();
  private activeMessageId: string | null = null;
  private state: SpeechState = 'idle';
  private currentVoiceId: string = 'Kore';

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('threadline_voice_id');
      if (saved && VOICE_OPTIONS.some((v) => v.id === saved)) {
        this.currentVoiceId = saved;
      }
    }
  }

  public addListener(listener: (state: SpeechState, activeMessageId?: string | null) => void) {
    this.stateChangeListeners.add(listener);
    listener(this.state, this.activeMessageId);
    return () => {
      this.stateChangeListeners.delete(listener);
    };
  }

  public addVoiceListener(listener: (voice: VoiceOption) => void) {
    this.voiceChangeListeners.add(listener);
    listener(this.getVoice());
    return () => {
      this.voiceChangeListeners.delete(listener);
    };
  }

  public setVoice(voiceId: string) {
    const found = VOICE_OPTIONS.find((v) => v.id === voiceId);
    if (found) {
      this.currentVoiceId = found.id;
      if (typeof window !== 'undefined') {
        localStorage.setItem('threadline_voice_id', found.id);
      }
      this.voiceChangeListeners.forEach((l) => l(found));
    }
  }

  public getVoice(voiceId?: string): VoiceOption {
    const id = voiceId || this.currentVoiceId;
    return VOICE_OPTIONS.find((v) => v.id === id) || VOICE_OPTIONS[0];
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

  public async previewVoice(voiceId: string): Promise<void> {
    const voice = this.getVoice(voiceId);
    const greeting = voice.gender === 'female'
      ? `Hello! I am ${voice.name}, your fashion sourcing assistant. Let's find the best fabrics for your collection.`
      : `Hello! I am ${voice.name}, your textile production specialist. I am here to help you source and verify suppliers.`;

    await this.speak(greeting, `preview-${voiceId}`, voice.id);
  }

  public async speak(text: string, messageId?: string, overrideVoiceName?: string): Promise<void> {
    this.stop();

    if (!text || !text.trim()) return;

    const voice = this.getVoice(overrideVoiceName);
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
      // 1. Try Gemini 3.8 Flash Lite TTS endpoint with the selected voice
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voiceName: voice.id }),
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
            this.fallbackSpeechSynthesis(cleanText, messageId, voice);
          };

          await audio.play();
          return;
        } else if (data.fallbackToBrowser) {
          this.fallbackSpeechSynthesis(data.cleanText || cleanText, messageId, voice);
          return;
        }
      }

      // If backend TTS failed, fallback to native SpeechSynthesis
      this.fallbackSpeechSynthesis(cleanText, messageId, voice);
    } catch (err) {
      console.warn('Backend TTS error, using browser speech synthesis fallback:', err);
      this.fallbackSpeechSynthesis(cleanText, messageId, voice);
    }
  }

  private fallbackSpeechSynthesis(cleanText: string, messageId?: string, voice?: VoiceOption) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.notify('error', null);
      return;
    }

    const selectedVoice = voice || this.getVoice();

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = selectedVoice.rate;
      utterance.pitch = selectedVoice.pitch;

      // Select gender-matched natural English voice from available browser voices
      const voices = window.speechSynthesis.getVoices();
      let matchedVoice: SpeechSynthesisVoice | undefined;

      const isFemale = selectedVoice.gender === 'female';

      const femaleKeywords = ['female', 'woman', 'zira', 'heera', 'veena', 'samantha', 'karen', 'victoria', 'serena', 'ava', 'siri'];
      const maleKeywords = ['male', 'man', 'david', 'ravi', 'alex', 'daniel', 'george', 'mark', 'tom', 'fred', 'rishi'];

      const keywords = isFemale ? femaleKeywords : maleKeywords;

      // Priority 1: Indian English matching gender
      matchedVoice = voices.find((v) => {
        const nameLower = v.name.toLowerCase();
        return (v.lang === 'en-IN' || nameLower.includes('india')) &&
          keywords.some((k) => nameLower.includes(k));
      });

      // Priority 2: Any English voice matching gender
      if (!matchedVoice) {
        matchedVoice = voices.find((v) => {
          const nameLower = v.name.toLowerCase();
          return v.lang.startsWith('en') && keywords.some((k) => nameLower.includes(k));
        });
      }

      // Priority 3: Fallback to any en-IN voice
      if (!matchedVoice) {
        matchedVoice = voices.find((v) => v.lang === 'en-IN' || v.name.toLowerCase().includes('india'));
      }

      // Priority 4: Any English voice
      if (!matchedVoice) {
        matchedVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0];
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
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
    return { state: this.state, activeMessageId: this.activeMessageId, voiceId: this.currentVoiceId };
  }
}

export const speechService = new SpeechService();


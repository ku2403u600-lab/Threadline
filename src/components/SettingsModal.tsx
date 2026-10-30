import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Trash2, Volume2, Square } from 'lucide-react';
import { VOICE_OPTIONS, speechService } from '../utils/speechService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: {
    location?: string;
    budget?: number;
    responseStyle?: 'balanced' | 'creative' | 'technical';
  };
  onUpdatePreferences: (prefs: any) => void;
  onResetSession: () => void;
  selectedVoiceId: string;
  onSelectVoice: (voiceId: string) => void;
  autoSpeakVoice: boolean;
  onToggleAutoSpeak: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  onResetSession,
  selectedVoiceId,
  onSelectVoice,
  autoSpeakVoice,
  onToggleAutoSpeak,
}) => {
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = speechService.addListener((state, activeId) => {
      if (state === 'playing' && activeId?.startsWith('preview-')) {
        setPreviewingVoiceId(activeId.replace('preview-', ''));
      } else if (state === 'idle' || state === 'error') {
        setPreviewingVoiceId(null);
      }
    });
    return () => unsub();
  }, []);

  const handlePreviewVoice = async (voiceId: string) => {
    if (previewingVoiceId === voiceId) {
      speechService.stop();
      setPreviewingVoiceId(null);
    } else {
      setPreviewingVoiceId(voiceId);
      await speechService.previewVoice(voiceId);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
    >
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <h3 id="settings-dialog-title" className="text-sm font-semibold text-stone-900">
            Session Preferences & Privacy
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-stone-400 hover:text-stone-700"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Location preference */}
          <div>
            <label htmlFor="pref-location-select" className="font-semibold text-stone-800 block mb-1">
              Primary Sourcing Hub (India)
            </label>
            <select
              id="pref-location-select"
              value={preferences.location || 'All India'}
              onChange={(e) => onUpdatePreferences({ ...preferences, location: e.target.value })}
              className="w-full p-2 rounded-lg border border-stone-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900"
            >
              <option value="All India">All India (Any Cluster)</option>
              <option value="Ahmedabad">Ahmedabad (Cotton Poplin, Voile, Khadi Handlooms)</option>
              <option value="Surat">Surat (Viscose Weaves, Georgette, Modal)</option>
              <option value="Jaipur">Jaipur (Hand-block prints, Cambric, Natural Dyes)</option>
              <option value="Tirupur">Tirupur (Certified Organic Knits, Jersey)</option>
              <option value="Coimbatore">Coimbatore (Linen Blends, Fine Shirting)</option>
              <option value="New Delhi">New Delhi (Wholesale Markets, Low Sampling MOQ)</option>
            </select>
          </div>

          {/* Response style */}
          <div>
            <label htmlFor="pref-style-select" className="font-semibold text-stone-800 block mb-1">
              Assistant Personality / Focus
            </label>
            <select
              id="pref-style-select"
              value={preferences.responseStyle || 'balanced'}
              onChange={(e) => onUpdatePreferences({ ...preferences, responseStyle: e.target.value })}
              className="w-full p-2 rounded-lg border border-stone-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900"
            >
              <option value="balanced">Balanced (Sourcing Expert + Creative Collaborator)</option>
              <option value="creative">Creative Collaborator (Drape, Silhouette & Aesthetic focus)</option>
              <option value="technical">Technical Sourcing (GSM, Weave Specs, Testing & Certs)</option>
            </select>
            <p className="text-[11px] text-stone-500 mt-1">
              Note: Persona settings adjust phrasing only; evidence rules and safety boundaries remain strictly enforced.
            </p>
          </div>

          {/* Voice Assistant & Gender Selection */}
          <div className="pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="font-semibold text-stone-800 block">
                  Voice Assistant (Female & Male Options)
                </label>
                <p className="text-[11px] text-stone-500">
                  Select a natural voice persona for spoken responses and previews.
                </p>
              </div>
            </div>

            {/* Voice Cards */}
            <div className="space-y-2 mt-2">
              {VOICE_OPTIONS.map((v) => {
                const isSelected = selectedVoiceId === v.id;
                const isPlayingPreview = previewingVoiceId === v.id;

                return (
                  <div
                    key={v.id}
                    onClick={() => onSelectVoice(v.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900 shadow-2xs'
                        : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-stone-900 bg-stone-900' : 'border-stone-300 bg-white'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-stone-900 text-xs">{v.name}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                              v.gender === 'female'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {v.gender}
                          </span>
                          <span className="text-[11px] text-stone-500 font-medium truncate">
                            · {v.personaLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 truncate mt-0.5">
                          {v.description}
                        </p>
                      </div>
                    </div>

                    {/* Preview Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewVoice(v.id);
                      }}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1 shrink-0 transition-colors ${
                        isPlayingPreview
                          ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100 hover:text-stone-900'
                      }`}
                      title={`Listen to sample of ${v.name} (${v.gender})`}
                      aria-label={`Preview ${v.name} voice`}
                    >
                      {isPlayingPreview ? (
                        <>
                          <Square className="w-3 h-3 fill-current" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3 text-stone-600" />
                          <span>Sample</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Auto-Speak Toggle */}
            <div className="mt-3 p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-stone-800 block text-xs">
                  Auto-Speak Responses
                </span>
                <span className="text-[11px] text-stone-500">
                  Automatically read assistant recommendations aloud
                </span>
              </div>
              <button
                type="button"
                onClick={() => onToggleAutoSpeak(!autoSpeakVoice)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  autoSpeakVoice ? 'bg-stone-900' : 'bg-stone-300'
                }`}
                role="switch"
                aria-checked={autoSpeakVoice}
                aria-label="Toggle auto-speak responses"
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    autoSpeakVoice ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Privacy statement */}
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1.5 text-stone-600">
            <div className="flex items-center gap-1.5 font-semibold text-stone-800">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Session-Only Memory Architecture</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              THREADLINE operates exclusively with ephemeral in-session memory. No user account is required. Uploaded sketches, tech packs, or price lists are never transmitted to external suppliers or stored in a persistent database.
            </p>
          </div>

          {/* Reset session button */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
            <div>
              <span className="font-semibold text-stone-800 block">Clear Active Session</span>
              <span className="text-[11px] text-stone-500">Erases conversation history and drafts</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onResetSession();
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-medium text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 rounded-lg transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

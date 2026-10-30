import React from 'react';
import { X, ShieldCheck, Trash2 } from 'lucide-react';

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
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  onResetSession,
}) => {
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

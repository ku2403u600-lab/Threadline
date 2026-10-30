import React from 'react';
import { Sliders, RefreshCw, Scale, Calculator } from 'lucide-react';

interface HeaderProps {
  activeTab: 'chat' | 'directory' | 'compare' | 'evaluation';
  onSelectTab: (tab: 'chat' | 'directory' | 'compare' | 'evaluation') => void;
  comparedCount: number;
  onNewSession: () => void;
  onOpenSettings: () => void;
  isCalculatorOpen: boolean;
  onToggleCalculator: () => void;
  activeQuantity?: number | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  comparedCount,
  onNewSession,
  onOpenSettings,
  isCalculatorOpen,
  onToggleCalculator,
  activeQuantity,
}) => {
  return (
    <header className="border-b border-[#781010] bg-[#620a0a] sticky top-0 z-30">
      {/* Strict 1-row, 3-zone Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8 bg-[#620a0a]">
        {/* Zone 1: Brand wordmark (single text element, no adjacent pill tags) */}
        <button
          type="button"
          onClick={() => onSelectTab('chat')}
          className="text-lg font-bold tracking-tight bg-[#620a0a] text-[#dcf0f4] font-editorial whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity text-left"
          aria-label="THREADLINE home workspace"
        >
          THREADLINE
        </button>

        {/* Zone 2: 4 clean single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-white">
          <button
            type="button"
            onClick={() => onSelectTab('chat')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 ${
              activeTab === 'chat'
                ? 'text-white border-b-2 border-white font-semibold'
                : 'text-stone-200 hover:text-white'
            }`}
          >
            Sourcing Workspace
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('directory')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 ${
              activeTab === 'directory'
                ? 'text-white border-b-2 border-white font-semibold'
                : 'text-stone-200 hover:text-white'
            }`}
          >
            Directory Hub
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('compare')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 flex items-center gap-1.5 ${
              activeTab === 'compare'
                ? 'text-white border-b-2 border-white font-semibold'
                : 'text-stone-200 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Comparison Matrix {comparedCount > 0 ? `(${comparedCount})` : ''}</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('evaluation')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 ${
              activeTab === 'evaluation'
                ? 'text-white border-b-2 border-white font-semibold'
                : 'text-stone-200 hover:text-white'
            }`}
          >
            System Tests (T01–T15)
          </button>
        </nav>

        {/* Zone 3: 1 primary action area */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleCalculator}
            aria-haspopup="dialog"
            aria-expanded={isCalculatorOpen}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 bg-white text-[#620a0a] hover:bg-stone-100 shadow-xs ${
              isCalculatorOpen
                ? 'ring-2 ring-white/60'
                : 'border-transparent'
            }`}
            title="Open Yardage & Cost Calculator pop-up"
            aria-label="Toggle Yardage & Cost Calculator dialog"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Calculator</span>
            {activeQuantity ? (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#620a0a]/10 text-[#620a0a]">
                {activeQuantity}m
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 text-white hover:text-stone-200 rounded-lg hover:bg-white/10 transition-colors"
            title="Session Preferences & Hub Selection"
            aria-label="Open settings"
          >
            <Sliders className="w-4 h-4 text-white" />
          </button>
          <button
            type="button"
            onClick={onNewSession}
            className="px-3.5 py-1.5 text-xs font-semibold text-[#620a0a] bg-white hover:bg-stone-100 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-xs"
            aria-label="Start new sourcing session"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Session</span>
          </button>
        </div>
      </div>

      {/* Sub-bar: mobile navigation and quiet contextual indicator */}
      <div className="md:hidden border-t border-stone-200 px-3 py-2 flex items-center justify-around text-xs font-medium text-stone-600 bg-stone-50">
        <button
          type="button"
          onClick={() => onSelectTab('chat')}
          className={`py-1 px-2 rounded-md transition-colors ${
            activeTab === 'chat' ? 'text-stone-900 bg-white shadow-xs font-semibold' : 'text-stone-600'
          }`}
        >
          Workspace
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('directory')}
          className={`py-1 px-2 rounded-md transition-colors ${
            activeTab === 'directory' ? 'text-stone-900 bg-white shadow-xs font-semibold' : 'text-stone-600'
          }`}
        >
          Directory
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('compare')}
          className={`py-1 px-2 rounded-md transition-colors ${
            activeTab === 'compare' ? 'text-stone-900 bg-white shadow-xs font-semibold' : 'text-stone-600'
          }`}
        >
          Compare {comparedCount > 0 ? `(${comparedCount})` : ''}
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('evaluation')}
          className={`py-1 px-2 rounded-md transition-colors ${
            activeTab === 'evaluation' ? 'text-stone-900 bg-white shadow-xs font-semibold' : 'text-stone-600'
          }`}
        >
          Tests
        </button>
      </div>
    </header>
  );
};

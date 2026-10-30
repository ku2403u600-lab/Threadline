import React, { useState, useEffect, useRef } from 'react';
import {
  SupplierRecord,
  SourcingRequirements,
  RankedSupplierResult,
  RfqDraft,
  ChatMessage,
  TestScenario,
} from './types/sourcing';
import { SUPPLIER_DATASET } from './data/suppliers';
import { INITIAL_TEST_SCENARIOS } from './data/evaluationScenarios';
import { Header } from './components/Header';
import { SupplierCard } from './components/SupplierCard';
import { ComparisonView } from './components/ComparisonView';
import { RfqDrawer } from './components/RfqDrawer';
import { SettingsModal } from './components/SettingsModal';
import { DevTestPanel } from './components/DevTestPanel';
import { VoiceController } from './components/VoiceController';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { MaterialCalculator } from './components/MaterialCalculator';
import { speechService } from './utils/speechService';
import {
  Send,
  Paperclip,
  X,
  AlertCircle,
  Sparkles,
  Info,
  ShieldCheck,
  Search,
  CheckCircle2,
  HelpCircle,
  FileText,
  Calculator,
  Volume2,
  VolumeX,
  Square,
  Loader2,
} from 'lucide-react';

export default function App() {
  // Navigation tabs: 'chat' | 'directory' | 'compare' | 'evaluation'
  const [activeTab, setActiveTab] = useState<'chat' | 'directory' | 'compare' | 'evaluation'>('chat');

  // Conversation state (ephemeral session-only memory)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [preservedDraft, setPreservedDraft] = useState<string>('');

  // Active session requirements extracted across turns
  const [sessionRequirements, setSessionRequirements] = useState<SourcingRequirements>({
    garment: null,
    intended_use: null,
    material_preferences: [],
    technical_constraints: [],
    quantity: null,
    quantity_unit: null,
    budget: null,
    budget_unit: null,
    location: null,
    sustainability_criteria: [],
  });

  // Shortlisted suppliers selected for side-by-side comparison
  const [comparedSuppliers, setComparedSuppliers] = useState<SupplierRecord[]>([]);

  // RFQ modal state
  const [activeRfqDraft, setActiveRfqDraft] = useState<RfqDraft | null>(null);

  // Settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<{
    location?: string;
    budget?: number;
    responseStyle?: 'balanced' | 'creative' | 'technical';
  }>({
    location: 'All India',
    responseStyle: 'balanced',
  });

  // Voice-to-Voice auto-speaking & playback state
  const [autoSpeakVoice, setAutoSpeakVoice] = useState<boolean>(true);
  const [speechState, setSpeechState] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);

  // Calculator & Yardage filter state
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [filterQuantity, setFilterQuantity] = useState<number | null>(null);
  const [filterBudget, setFilterBudget] = useState<number | null>(null);

  const handleApplyCalculatorFilter = ({
    quantityMetres,
    budgetPerMetre,
  }: {
    quantityMetres: number;
    budgetPerMetre?: number;
  }) => {
    setFilterQuantity(quantityMetres > 0 ? quantityMetres : null);
    setFilterBudget(budgetPerMetre || null);
    setSessionRequirements((prev) => ({
      ...prev,
      quantity: quantityMetres > 0 ? quantityMetres : prev.quantity,
      quantity_unit: 'metres',
      budget: budgetPerMetre || prev.budget,
      budget_unit: 'INR per metre',
    }));
  };

  // Attachments in composer
  const [composerAttachments, setComposerAttachments] = useState<
    { name: string; mimeType: string; size: number; dataUrl?: string }[]
  >([]);

  // Directory search filters
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryCityFilter, setDirectoryCityFilter] = useState('All');

  // Test scenarios state
  const [testScenarios, setTestScenarios] = useState<TestScenario[]>(INITIAL_TEST_SCENARIOS);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to speech service states
  useEffect(() => {
    const unsubscribe = speechService.addListener((state, activeId) => {
      setSpeechState(state);
      setActiveSpeakingId(activeId || null);
    });
    return () => {
      unsubscribe();
      speechService.stop();
    };
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle file uploads (images & documents)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate size (<10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage(`File "${file.name}" exceeds the 10MB limit.`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setComposerAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            dataUrl,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setComposerAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Submit sourcing prompt to server
  const handleSendMessage = async (textToSend?: string, isVoicePrompt: boolean = false) => {
    const query = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!query && composerAttachments.length === 0) return;

    if (isVoicePrompt) {
      setAutoSpeakVoice(true);
    }

    setErrorMessage(null);
    const userMessageId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: [...composerAttachments],
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setComposerAttachments([]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          requirements: sessionRequirements,
          attachments: userMessage.attachments,
          preferences,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to communicate with sourcing server.');
      }

      // Check if visual uncertainty flags exist for images
      let visualObs = undefined;
      if (userMessage.attachments?.some((a) => a.mimeType.startsWith('image/'))) {
        visualObs = {
          visibleCues: ['Visible surface sheen & weave texture cues detected from image.'],
          uncertainProperties: [
            'Fiber composition (silk vs viscose vs polyester satin) cannot be confirmed from image alone.',
            'GSM, shrinkage, tensile strength, and certified claims require physical swatch testing.',
          ],
          recommendedVerifications: [
            'Request physical swatch card with technical spec sheet before committing to yardage.',
          ],
        };
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        shortlist: data.shortlist || [],
        rfqDraft: data.rfqDraft,
        visualObservations: visualObs,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.requirements) {
        setSessionRequirements(data.requirements);
      }

      if (data.rfqDraft) {
        setActiveRfqDraft(data.rfqDraft);
      }

      // Voice-to-Voice: If auto-speak is enabled or this turn was voice triggered, speak the response!
      if (autoSpeakVoice || isVoicePrompt) {
        speechService.speak(assistantMessage.content, assistantMessage.id);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setPreservedDraft(query);
      setErrorMessage(
        err.message || 'Service temporarily unavailable. Your message has been saved in draft for retry.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Retry sending preserved draft
  const handleRetry = () => {
    if (preservedDraft) {
      setInputText(preservedDraft);
      setPreservedDraft('');
      setErrorMessage(null);
    }
  };

  // Compare toggles
  const handleToggleCompare = (supplier: SupplierRecord) => {
    setComparedSuppliers((prev) => {
      const exists = prev.some((s) => s.supplier_id === supplier.supplier_id);
      if (exists) {
        return prev.filter((s) => s.supplier_id !== supplier.supplier_id);
      } else {
        if (prev.length >= 4) {
          alert('You can compare up to 4 suppliers simultaneously in the comparison matrix.');
          return prev;
        }
        return [...prev, supplier];
      }
    });
  };

  // RFQ drafting from supplier card
  const handleDraftRfq = async (supplier: SupplierRecord) => {
    try {
      const res = await fetch('/api/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: supplier.supplier_id,
          requirements: sessionRequirements,
        }),
      });
      const draft = await res.json();
      setActiveRfqDraft(draft);
    } catch (err) {
      console.error('Error generating RFQ draft:', err);
    }
  };

  // Reset session
  const handleNewSession = async () => {
    speechService.stop();
    setMessages([]);
    setInputText('');
    setComposerAttachments([]);
    setErrorMessage(null);
    setPreservedDraft('');
    setComparedSuppliers([]);
    setActiveRfqDraft(null);
    setSessionRequirements({
      garment: null,
      intended_use: null,
      material_preferences: [],
      technical_constraints: [],
      quantity: null,
      quantity_unit: null,
      budget: null,
      budget_unit: null,
      location: null,
      sustainability_criteria: [],
    });

    try {
      await fetch('/api/session/reset', { method: 'POST' });
    } catch {
      // ignore
    }
  };

  // Run test scenario
  const handleRunTest = async (scenarioId: string) => {
    setIsRunningTests(true);
    try {
      const res = await fetch('/api/tests/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId }),
      });
      const updated = await res.json();
      setTestScenarios((prev) => prev.map((s) => (s.id === scenarioId ? updated : s)));
    } catch (err) {
      console.error('Error running test:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleRunAllTests = async () => {
    setIsRunningTests(true);
    for (const s of testScenarios) {
      await handleRunTest(s.id);
    }
    setIsRunningTests(false);
  };

  // Filtered suppliers for Directory view with active calculator quantity & budget
  const filteredDirectory = SUPPLIER_DATASET.filter((s) => {
    const matchesSearch =
      directorySearch === '' ||
      s.name.toLowerCase().includes(directorySearch.toLowerCase()) ||
      s.materials.some((m) => m.toLowerCase().includes(directorySearch.toLowerCase()));

    const matchesCity = directoryCityFilter === 'All' || s.location.city === directoryCityFilter;
    const matchesMoq = filterQuantity === null || s.commercial.moq === null || s.commercial.moq <= filterQuantity;
    const matchesBudget = filterBudget === null || s.commercial.price === null || s.commercial.price <= filterBudget;

    return matchesSearch && matchesCity && matchesMoq && matchesBudget;
  });

  return (
    <div className="min-h-screen bg-[#f6ecec] flex flex-col selection:bg-stone-200">
      {/* Strict Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        comparedCount={comparedSuppliers.length}
        onNewSession={handleNewSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isCalculatorOpen={isCalculatorOpen}
        onToggleCalculator={() => setIsCalculatorOpen((prev) => !prev)}
        activeQuantity={filterQuantity}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col bg-[#f6ecec]">
        {/* Tab 1: Conversational Sourcing Workspace */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto">
            {/* Interactive Material Yardage & Cost Indicator */}
            {filterQuantity ? (
              <div className="mb-3.5 flex items-center justify-between p-2.5 px-3.5 bg-stone-900 text-white rounded-xl shadow-xs">
                <div className="flex items-center gap-2.5 text-xs">
                  <Calculator className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-stone-300">MOQ Filter: </span>
                    <strong className="font-semibold text-white">{filterQuantity} metres</strong>
                    {filterBudget ? <span className="text-stone-300"> · max ₹{filterBudget}/m</span> : null}
                    <span className="text-emerald-400 font-mono-nums text-[11px] ml-2 hidden sm:inline">
                      ({SUPPLIER_DATASET.filter(s => s.commercial.moq === null || s.commercial.moq <= filterQuantity).length} suppliers fit)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCalculatorOpen(true)}
                    className="px-2.5 py-1 text-xs font-semibold text-stone-900 bg-white hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    Adjust in Pop-up
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyCalculatorFilter({ quantityMetres: 0, budgetPerMetre: undefined })}
                    className="p-1 text-stone-400 hover:text-white rounded-md transition-colors"
                    title="Clear yardage filter"
                    aria-label="Clear active yardage filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-3.5 flex items-center justify-between p-2.5 px-3.5 bg-white border border-stone-200 rounded-xl shadow-xs">
                <div className="flex items-center gap-2 text-xs text-stone-600">
                  <Calculator className="w-4 h-4 text-stone-700 shrink-0" />
                  <span>
                    Need to estimate yardage? Calculate metres &amp; budget to filter suppliers by MOQ fit.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCalculatorOpen(true)}
                  className="px-2.5 py-1 text-xs font-medium text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                  aria-label="Open Yardage & Cost Calculator dialog"
                >
                  <Calculator className="w-3 h-3 text-stone-600" />
                  <span>Open Calculator</span>
                </button>
              </div>
            )}

            {/* Context Sub-banner */}
            <div className="mb-4 py-2 px-3.5 bg-stone-100/70 border border-stone-200/80 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  <strong>Session-only memory:</strong> Uploads and briefs are never shared with suppliers or persisted.
                </span>
              </div>
              {sessionRequirements.location && (
                <div className="text-stone-500">
                  Priority hub: <span className="font-semibold text-stone-800">{sessionRequirements.location}</span>
                </div>
              )}
            </div>

            {/* Message Stream */}
            <div className="flex-1 space-y-4 mb-4">
              {messages.length === 0 ? (
                /* Empty / Intro State */
                <div className="py-8 md:py-10 px-4 md:px-8 text-center bg-white rounded-2xl border border-stone-200/90 shadow-xs">
                  <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-stone-100 mb-2 md:mb-3 text-stone-700">
                    <Sparkles className="w-5 h-5 text-stone-800" />
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold font-editorial text-[#620a0a] mb-1 leading-snug">
                    Translate your garment concept into grounded material choices
                  </h2>
                  <p className="text-xs md:text-sm text-stone-600 max-w-xl mx-auto mb-5 leading-relaxed">
                    THREADLINE searches structured Indian textile directories, explains weave trade-offs, separates verified facts from estimates, and prepares editable RFQ drafts.
                  </p>

                  <div className="text-xs font-semibold text-[#620a0a] uppercase tracking-wider mb-2.5">
                    Start with a prompt or upload a sketch:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl mx-auto text-left">
                    <button
                      type="button"
                      onClick={() =>
                        handleSendMessage(
                          'I need fabric for 10 summer co-ord sets, relaxed drape, student budget, sourcing in Ahmedabad.'
                        )
                      }
                      className="p-3 text-xs bg-[#dcf0f4] hover:bg-[#cde9ee] rounded-xl border border-stone-200/80 text-stone-800 transition-colors shadow-xs"
                    >
                      <strong className="block font-semibold text-stone-900">Summer Co-ord in Ahmedabad</strong>
                      10 sets, relaxed drape, student budget under ₹180/m
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSendMessage(
                          'Compare cotton poplin vs cotton voile for relaxed summer tailoring and shirts.'
                        )
                      }
                      className="p-3 text-xs bg-[#dcf0f4] hover:bg-[#cde9ee] rounded-xl border border-stone-200/80 text-stone-800 transition-colors shadow-xs"
                    >
                      <strong className="block font-semibold text-stone-900">Poplin vs Voile Comparison</strong>
                      Evaluate drape, opacity, shrinkage, and structure
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSendMessage(
                          'Find certified organic knits or jersey in Tirupur with MOQ under 30kg.'
                        )
                      }
                      className="p-3 text-xs bg-[#dcf0f4] hover:bg-[#cde9ee] rounded-xl border border-stone-200/80 text-stone-800 transition-colors shadow-xs"
                    >
                      <strong className="block font-semibold text-stone-900">Certified Organic Knits</strong>
                      Tirupur circular jersey with verifiable GOTS license
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSendMessage(
                          'I want 20 metres of hand-block printed cambric in Jaipur for resortwear.'
                        )
                      }
                      className="p-3 text-xs bg-[#dcf0f4] hover:bg-[#cde9ee] rounded-xl border border-stone-200/80 text-stone-800 transition-colors shadow-xs"
                    >
                      <strong className="block font-semibold text-stone-900">Jaipur Hand Block Prints</strong>
                      GI-tagged Sanganeri prints, cambric 60s count
                    </button>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="text-[11px] font-medium text-stone-600 mb-1 px-1">
                      {msg.role === 'user' ? 'You' : 'THREADLINE Assistant'} · {msg.timestamp}
                    </div>

                    <div
                      className={`p-4 md:p-5 rounded-2xl max-w-3xl w-full text-xs md:text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-stone-900 text-white shadow-xs'
                          : 'bg-white border border-stone-200 text-stone-800 shadow-xs'
                      }`}
                    >
                      {/* Attachments if any */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {msg.attachments.map((att, idx) => (
                            <div
                              key={idx}
                              className={`p-1.5 rounded-lg border text-xs flex items-center gap-2 ${
                                msg.role === 'user'
                                  ? 'bg-stone-800 border-stone-700 text-stone-200'
                                  : 'bg-stone-100 border-stone-200 text-stone-800'
                              }`}
                            >
                              {att.dataUrl && att.mimeType.startsWith('image/') && (
                                <img
                                  src={att.dataUrl}
                                  alt={att.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div>
                                <div className="font-medium truncate max-w-[150px]">{att.name}</div>
                                <div className="text-[10px] opacity-75">
                                  {(att.size / 1024).toFixed(0)} KB · {att.mimeType}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Message Content with Markdown Typography */}
                      {msg.role === 'user' ? (
                        <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                      ) : (
                        <div>
                          <MarkdownRenderer content={msg.content} />
                          {/* Audio Speech Controls on Assistant Message */}
                          <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                            <div className="flex items-center gap-2">
                              {speechState === 'playing' && activeSpeakingId === msg.id ? (
                                <button
                                  type="button"
                                  onClick={() => speechService.stop()}
                                  className="px-2.5 py-1 text-xs font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                                  title="Stop speaking"
                                >
                                  <Square className="w-3.5 h-3.5 fill-current" />
                                  <span>Stop Speaking</span>
                                  <span className="flex items-center gap-0.5 ml-1">
                                    <span className="w-1 h-3 bg-rose-600 rounded-full animate-bounce" />
                                    <span className="w-1 h-4 bg-rose-600 rounded-full animate-bounce [animation-delay:0.15s]" />
                                    <span className="w-1 h-2 bg-rose-600 rounded-full animate-bounce [animation-delay:0.3s]" />
                                  </span>
                                </button>
                              ) : speechState === 'loading' && activeSpeakingId === msg.id ? (
                                <button
                                  type="button"
                                  disabled
                                  className="px-2.5 py-1 text-xs font-medium text-stone-700 bg-stone-100 rounded-lg flex items-center gap-1.5"
                                >
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-600" />
                                  <span>Synthesizing voice...</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => speechService.speak(msg.content, msg.id)}
                                  className="px-2.5 py-1 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1.5"
                                  title="Listen to this response aloud"
                                >
                                  <Volume2 className="w-3.5 h-3.5 text-stone-700" />
                                  <span>Speak Response</span>
                                </button>
                              )}
                            </div>
                            <span className="text-[11px] text-stone-500 hidden sm:inline">
                              Gemini Voice
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Visual Uncertainty Caution Box */}
                      {msg.visualObservations && (
                        <div className="mt-4 p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs space-y-2 text-stone-700">
                          <div className="flex items-center gap-1.5 font-semibold text-stone-900">
                            <Info className="w-4 h-4 text-stone-600" />
                            <span>Visual Observation vs Technical Uncertainty</span>
                          </div>
                          <div>
                            <span className="font-medium text-stone-800">Visual appearance cues: </span>
                            {msg.visualObservations.visibleCues.join(' ')}
                          </div>
                          <div className="text-amber-800">
                            <span className="font-medium">Uncertain properties: </span>
                            {msg.visualObservations.uncertainProperties.join(' ')}
                          </div>
                          <div className="text-stone-600 italic">
                            Recommendation: {msg.visualObservations.recommendedVerifications.join(' ')}
                          </div>
                        </div>
                      )}

                      {/* Inline Retrieved Supplier Shortlist Cards */}
                      {msg.shortlist && msg.shortlist.length > 0 && (
                        <div className="mt-5 space-y-3 pt-4 border-t border-stone-100">
                          <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            <span>Retrieved Supplier Matches ({msg.shortlist.length})</span>
                          </div>
                          <div className="space-y-3">
                            {msg.shortlist.map((item) => (
                              <SupplierCard
                                key={item.supplier.supplier_id}
                                result={item}
                                onCompareToggle={handleToggleCompare}
                                isCompared={comparedSuppliers.some(
                                  (s) => s.supplier_id === item.supplier.supplier_id
                                )}
                                onDraftRfq={handleDraftRfq}
                                calculatedQuantity={filterQuantity}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-stone-500 py-3 px-1">
                  <div className="w-2 h-2 rounded-full bg-stone-600 animate-ping" />
                  <span>Searching supplier records and synthesizing sourcing trade-offs...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Preserved Draft / Error Banner */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-900"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                {preservedDraft && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="px-3 py-1 font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-md transition-colors"
                  >
                    Restore Draft
                  </button>
                )}
              </div>
            )}

            {/* Composer Box */}
            <div className="bg-white rounded-2xl border border-stone-300 shadow-sm p-3 focus-within:border-stone-900 transition-colors">
              {/* Attachment Previews */}
              {composerAttachments.length > 0 && (
                <div className="mb-2.5 pb-2 border-b border-stone-100 flex flex-wrap gap-2">
                  {composerAttachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="px-2.5 py-1.5 bg-stone-100 rounded-lg text-xs flex items-center gap-2 text-stone-800"
                    >
                      <span className="truncate max-w-[160px] font-medium">{att.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="text-stone-400 hover:text-stone-700"
                        aria-label={`Remove ${att.name}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={3}
                placeholder="Describe your garment idea, quantity, budget, and hub (e.g. 10 summer co-ord sets in Ahmedabad)..."
                className="w-full text-xs md:text-sm bg-transparent resize-none focus:outline-hidden text-stone-900 placeholder:text-stone-600"
                aria-label="Message THREADLINE sourcing assistant"
              />

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-stone-100">
                <div className="flex items-center gap-1.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/jpeg,image/png,image/webp,application/pdf,text/plain"
                    className="hidden"
                    id="composer-file-input"
                    aria-label="Upload sketch or quotation document"
                  />
                  <label
                    htmlFor="composer-file-input"
                    className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg cursor-pointer transition-colors"
                    title="Attach sketch, tech pack, fabric photo, or quotation"
                  >
                    <Paperclip className="w-4 h-4" />
                  </label>

                  {/* Real Voice Input Controller */}
                  <VoiceController
                    onTranscriptChange={(trans) =>
                      setInputText((prev) => (prev ? `${prev.trim()} ${trans.trim()}` : trans.trim()))
                    }
                    onSendTranscript={(trans) => handleSendMessage(trans, true)}
                    disabled={isLoading}
                  />

                  <span className="hidden sm:inline text-[11px] text-stone-600">
                    Images provide visual cues, not chemical/fiber certification.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Voice-to-Voice auto-speak toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      setAutoSpeakVoice((prev) => {
                        const next = !prev;
                        if (!next) speechService.stop();
                        return next;
                      });
                    }}
                    className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors flex items-center gap-1.5 font-medium ${
                      autoSpeakVoice
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-900'
                    }`}
                    title={
                      autoSpeakVoice
                        ? 'Voice-to-Voice is ON: Agent automatically speaks answers aloud'
                        : 'Voice-to-Voice is OFF: Click to enable spoken answers'
                    }
                    aria-label="Toggle Voice-to-Voice speaking"
                  >
                    {autoSpeakVoice ? (
                      <Volume2 className="w-3.5 h-3.5 text-rose-700 animate-pulse" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-stone-600" />
                    )}
                    <span className="hidden sm:inline">
                      {autoSpeakVoice ? 'Voice Out: ON' : 'Voice Out: OFF'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || (!inputText.trim() && composerAttachments.length === 0)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#620a0a] hover:bg-[#500808] disabled:opacity-40 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                    aria-label="Send message"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Structured Directory Hub */}
        {activeTab === 'directory' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-stone-900">
                  Curated Indian Textile Directory Hub
                </h3>
                <p className="text-xs text-stone-500">
                  Showing {filteredDirectory.length} structured records across verified cooperatives, mills, and traders.
                </p>
              </div>

              {/* Search & Filter */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={directorySearch}
                    onChange={(e) => setDirectorySearch(e.target.value)}
                    placeholder="Search material or name..."
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <select
                  value={directoryCityFilter}
                  onChange={(e) => setDirectoryCityFilter(e.target.value)}
                  className="py-1.5 px-3 text-xs rounded-lg border border-stone-300 bg-stone-50 focus:bg-white focus:outline-hidden"
                >
                  <option value="All">All Cities</option>
                  <option value="Ahmedabad">Ahmedabad</option>
                  <option value="Surat">Surat</option>
                  <option value="Jaipur">Jaipur</option>
                  <option value="Tirupur">Tirupur</option>
                  <option value="Coimbatore">Coimbatore</option>
                  <option value="New Delhi">New Delhi</option>
                  <option value="Bangalore">Bangalore (Demo)</option>
                </select>

                <button
                  type="button"
                  onClick={() => setIsCalculatorOpen(true)}
                  className={`py-1.5 px-3 text-xs rounded-lg border transition-colors flex items-center gap-1.5 font-medium ${
                    filterQuantity
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                      : 'bg-stone-50 border-stone-300 text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                  title="Open Yardage & MOQ Filter pop-up"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>{filterQuantity ? `MOQ Fit: ${filterQuantity}m` : 'Yardage Filter'}</span>
                </button>
              </div>
            </div>

            {/* Grid of suppliers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDirectory.map((supplier) => {
                const isDemo = supplier.record_status === 'illustrative_demo';
                const isCompared = comparedSuppliers.some((s) => s.supplier_id === supplier.supplier_id);

                return (
                  <SupplierCard
                    key={supplier.supplier_id}
                    result={{
                      supplier,
                      matchScore: 100,
                      matchReasons: [supplier.specialty_summary || 'Curated directory supplier'],
                      tradeOffs: isDemo ? ['ILLUSTRATIVE DEMO RECORD — NOT VERIFIED'] : [],
                      missingFields: [],
                      isDemo,
                    }}
                    onCompareToggle={handleToggleCompare}
                    isCompared={isCompared}
                    onDraftRfq={handleDraftRfq}
                    calculatedQuantity={filterQuantity}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Side-by-Side Comparison Matrix */}
        {activeTab === 'compare' && (
          <ComparisonView
            shortlist={comparedSuppliers}
            onRemove={(id) => setComparedSuppliers((prev) => prev.filter((s) => s.supplier_id !== id))}
            onClear={() => setComparedSuppliers([])}
            onDraftRfq={handleDraftRfq}
          />
        )}

        {/* Tab 4: Developer Evaluation View & Scenarios */}
        {activeTab === 'evaluation' && (
          <DevTestPanel
            scenarios={testScenarios}
            onRunTest={handleRunTest}
            onRunAllTests={handleRunAllTests}
            isRunningTests={isRunningTests}
          />
        )}
      </main>

      {/* RFQ Draft Modal */}
      {activeRfqDraft && (
        <RfqDrawer draft={activeRfqDraft} onClose={() => setActiveRfqDraft(null)} />
      )}

      {/* Settings / Privacy Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onUpdatePreferences={setPreferences}
        onResetSession={handleNewSession}
      />

      {/* Pop-up Modal: Material Yardage & Cost Calculator */}
      <MaterialCalculator
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        suppliers={SUPPLIER_DATASET}
        onApplyFilter={handleApplyCalculatorFilter}
        onSendToChat={(text) => {
          setActiveTab('chat');
          handleSendMessage(text);
        }}
        activeQuantity={filterQuantity}
        activeBudget={filterBudget}
      />

      {/* Floating Active Voice Playback Banner */}
      {speechState === 'playing' && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-40 bg-stone-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-stone-700 flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
            </span>
            <span className="font-semibold text-stone-100">THREADLINE Speaking</span>
          </div>

          <div className="flex items-center gap-0.5 h-4 px-1">
            <span className="w-1 h-3 bg-white rounded-full animate-bounce" />
            <span className="w-1 h-4 bg-white rounded-full animate-bounce [animation-delay:0.15s]" />
            <span className="w-1 h-2 bg-white rounded-full animate-bounce [animation-delay:0.3s]" />
            <span className="w-1 h-4 bg-white rounded-full animate-bounce [animation-delay:0.45s]" />
          </div>

          <button
            type="button"
            onClick={() => speechService.stop()}
            className="px-2.5 py-1 font-semibold text-rose-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1"
            title="Stop speech playback"
            aria-label="Stop speech playback"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Stop</span>
          </button>
        </div>
      )}
    </div>
  );
}

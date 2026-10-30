import React, { useState } from 'react';
import { TestScenario } from '../types/sourcing';
import { CheckCircle2, XCircle, Clock, Play, RefreshCw, Database } from 'lucide-react';

interface DevTestPanelProps {
  scenarios: TestScenario[];
  onRunTest: (scenarioId: string) => Promise<void>;
  onRunAllTests: () => Promise<void>;
  isRunningTests: boolean;
}

export const DevTestPanel: React.FC<DevTestPanelProps> = ({
  scenarios,
  onRunTest,
  onRunAllTests,
  isRunningTests,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'passed' | 'failed' | 'not run'>('all');
  const [expandedTestId, setExpandedTestId] = useState<string | null>('T01');

  const filteredScenarios = scenarios.filter((s) => {
    if (selectedFilter === 'all') return true;
    return s.status === selectedFilter;
  });

  const passedCount = scenarios.filter((s) => s.status === 'passed').length;
  const failedCount = scenarios.filter((s) => s.status === 'failed').length;
  const notRunCount = scenarios.filter((s) => s.status === 'not run').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Dataset Provenance */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-stone-600" />
              <h3 className="text-base font-semibold text-stone-900">
                Dataset Provenance & System Evaluation View
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Curated Indian Textile Directory audit and runtime test harness based on <code className="text-stone-700 bg-stone-100 px-1 py-0.5 rounded">06_TEST_EVALUATE_IMPROVE.md</code>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRunAllTests}
              disabled={isRunningTests}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
              <span>{isRunningTests ? 'Running Checks...' : 'Run All Baseline Tests'}</span>
            </button>
          </div>
        </div>

        {/* Provenance Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
            <span className="text-stone-500 block">Runtime Prompt</span>
            <span className="font-semibold text-stone-900 text-sm">v1.0 (Exact Pack)</span>
            <span className="text-[10px] text-stone-500 block mt-0.5">02_AGENT_SYSTEM_PROMPT.md</span>
          </div>
          <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
            <span className="text-emerald-700 block">Verified Records</span>
            <span className="font-semibold text-emerald-900 text-sm font-mono-nums">4 records</span>
            <span className="text-[10px] text-emerald-600 block mt-0.5">Traceable primary source</span>
          </div>
          <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
            <span className="text-amber-700 block">Supplier-Claimed</span>
            <span className="font-semibold text-amber-900 text-sm font-mono-nums">3 records</span>
            <span className="text-[10px] text-amber-600 block mt-0.5">Commercial quotes</span>
          </div>
          <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100">
            <span className="text-rose-700 block">Illustrative Demo</span>
            <span className="font-semibold text-rose-900 text-sm font-mono-nums">1 fixture</span>
            <span className="text-[10px] text-rose-600 block mt-0.5">Visibly flagged</span>
          </div>
        </div>
      </div>

      {/* Test Scenarios Harness */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 bg-stone-50/50">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-stone-700 mr-2">Status:</span>
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                selectedFilter === 'all' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              All ({scenarios.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('passed')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                selectedFilter === 'passed' ? 'bg-emerald-800 text-white' : 'text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Passed ({passedCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('failed')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                selectedFilter === 'failed' ? 'bg-rose-800 text-white' : 'text-rose-700 hover:bg-rose-100'
              }`}
            >
              Failed ({failedCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('not run')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                selectedFilter === 'not run' ? 'bg-stone-700 text-white' : 'text-stone-600 hover:bg-stone-200'
              }`}
            >
              Not run ({notRunCount})
            </button>
          </div>

          <div className="text-xs text-stone-500">
            Pass rate: <span className="font-semibold text-stone-800 font-mono-nums">{Math.round((passedCount / scenarios.length) * 100)}%</span>
          </div>
        </div>

        {/* List of scenarios */}
        <div className="divide-y divide-stone-100">
          {filteredScenarios.map((item) => {
            const isExpanded = expandedTestId === item.id;
            return (
              <div key={item.id} className="p-4 hover:bg-stone-50/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-1">
                    <span className="font-mono text-xs font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded border border-stone-200 mt-0.5">
                      {item.id}
                    </span>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-stone-900 leading-snug">
                        &ldquo;{item.scenario}&rdquo;
                      </div>
                      <div className="text-xs text-stone-500 mt-1">
                        <strong className="text-stone-700 font-medium">Expected: </strong>
                        {item.expectedBehavior}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border ${
                        item.status === 'passed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : item.status === 'failed'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-stone-100 text-stone-600 border-stone-200'
                      }`}
                    >
                      {item.status === 'passed' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : item.status === 'failed' ? (
                        <XCircle className="w-3 h-3 text-rose-600" />
                      ) : (
                        <Clock className="w-3 h-3 text-stone-500" />
                      )}
                      <span className="capitalize">{item.status}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => onRunTest(item.id)}
                      disabled={isRunningTests}
                      className="p-1 rounded text-stone-500 hover:text-stone-900 hover:bg-stone-200 disabled:opacity-40"
                      title="Run this test scenario"
                      aria-label={`Run test scenario ${item.id}`}
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedTestId(isExpanded ? null : item.id)}
                      className="text-xs text-stone-500 hover:text-stone-800 underline px-1"
                    >
                      {isExpanded ? 'Less' : 'Details'}
                    </button>
                  </div>
                </div>

                {/* Expanded Details: Observations, Rubric Scores & Notes */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-stone-100 text-xs space-y-2 bg-stone-50/70 p-3 rounded-lg">
                    {item.observedBehavior && (
                      <div>
                        <span className="font-semibold text-stone-700">Observed Behavior: </span>
                        <span className="text-stone-600">{item.observedBehavior}</span>
                      </div>
                    )}

                    {item.scores && (
                      <div>
                        <span className="font-semibold text-stone-700 block mb-1">
                          Rubric Scores (0–2 scale per dimension):
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center font-mono-nums">
                          <div className="bg-white p-1.5 rounded border border-stone-200">
                            <span className="text-[10px] text-stone-500 block">Accuracy</span>
                            <span className="font-bold text-stone-800">{item.scores.accuracy}/2</span>
                          </div>
                          <div className="bg-white p-1.5 rounded border border-stone-200">
                            <span className="text-[10px] text-stone-500 block">Clarity</span>
                            <span className="font-bold text-stone-800">{item.scores.clarity}/2</span>
                          </div>
                          <div className="bg-white p-1.5 rounded border border-stone-200">
                            <span className="text-[10px] text-stone-500 block">Scope</span>
                            <span className="font-bold text-stone-800">{item.scores.scope}/2</span>
                          </div>
                          <div className="bg-white p-1.5 rounded border border-stone-200">
                            <span className="text-[10px] text-stone-500 block">Evidence</span>
                            <span className="font-bold text-stone-800">{item.scores.evidence}/2</span>
                          </div>
                          <div className="bg-white p-1.5 rounded border border-stone-200">
                            <span className="text-[10px] text-stone-500 block">Privacy</span>
                            <span className="font-bold text-stone-800">{item.scores.privacyTone}/2</span>
                          </div>
                          <div className="bg-white p-1.5 rounded border border-stone-200">
                            <span className="text-[10px] text-stone-500 block">A11y</span>
                            <span className="font-bold text-stone-800">{item.scores.accessibility}/2</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {item.testerNotes && (
                      <div className="text-stone-500 italic">
                        Notes: {item.testerNotes} (Audited {item.testedAt || '2026-10-28'})
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

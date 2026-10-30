import React, { useState } from 'react';
import { RfqDraft } from '../types/sourcing';
import { Copy, Check, X, AlertCircle } from 'lucide-react';

interface RfqDrawerProps {
  draft: RfqDraft;
  onClose: () => void;
}

export const RfqDrawer: React.FC<RfqDrawerProps> = ({ draft, onClose }) => {
  const [editedBody, setEditedBody] = useState(draft.body);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rfq-dialog-title"
    >
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div>
            <h3 id="rfq-dialog-title" className="text-base font-semibold text-stone-900">
              Request for Quotation (RFQ) Draft
            </h3>
            <p className="text-xs text-stone-500">
              Prepared for <span className="font-medium text-stone-800">{draft.recipientName}</span> ({draft.recipientContact})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200"
            aria-label="Close RFQ draft dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner: Zero False Automation */}
        <div className="px-4 md:px-5 py-2.5 bg-amber-50 border-b border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Review and send independently.</strong> THREADLINE does not contact suppliers, send emails, or request swatches. Fill in the bracketed placeholders <span className="font-mono bg-amber-100 px-1 rounded">[like this]</span> before emailing or messaging the supplier.
          </div>
        </div>

        {/* Editor Area */}
        <div className="p-4 md:p-5 flex-1 overflow-y-auto space-y-3">
          <div>
            <label htmlFor="rfq-body-editor" className="block text-xs font-medium text-stone-700 mb-1">
              Editable Draft Text:
            </label>
            <textarea
              id="rfq-body-editor"
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              rows={14}
              className="w-full text-xs font-mono p-3.5 rounded-lg border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-stone-900 leading-relaxed bg-stone-50/30 resize-y"
              aria-label="Editable RFQ draft message"
            />
          </div>

          <div className="text-xs text-stone-500 bg-stone-50 p-3 rounded-lg border border-stone-200">
            <span className="font-medium text-stone-700 block mb-1">Checklist before sending:</span>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Confirm your required delivery date and target garment quantity.</li>
              <li>Ask for swatch cards to evaluate hand-feel, shrinkage, and opacity physically.</li>
              <li>Check whether the quoted price includes 5% textile GST and courier transit.</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-200 bg-stone-50/50 flex items-center justify-between gap-3">
          <div className="text-xs text-stone-500">
            {copied ? (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Copied to clipboard! Ready to paste into your email or WhatsApp.
              </span>
            ) : (
              <span>Click Copy Draft to copy message text to clipboard.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              aria-label="Copy RFQ draft to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Draft'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

# THREADLINE — User Experience and Technical Specification

## 1. Experience principles

- **Conversation first:** the primary screen is a workspace, not a dashboard about AI.
- **Creative but credible:** a fashion-studio visual language with a restrained, editorial layout.
- **Evidence visible:** source status, missing fields, and last-checked dates are readable in the results.
- **No false automation:** the app never pretends to contact suppliers or verify facts it did not verify.
- **Accessible by default:** keyboard support, visible focus, readable contrast, labels beyond colour, and text alternatives for voice.
- **Progressive disclosure:** show the most useful recommendation first; reveal technical details when requested.

## 2. Screen hierarchy

### A. Main sourcing workspace

Header:
- THREADLINE wordmark/name and short descriptor: “From design idea to material shortlist.”
- Small session indicator: “Session-only · Nothing is sent to suppliers.”
- Settings control and New session action.

Conversation body:
- Friendly empty state with a short example: “Tell me what you’re making, or upload a sketch.”
- Suggested prompts such as “Find fabric for a summer co-ord,” “Compare these two quotes,” and “Help me specify a fabric.”
- Chat messages with clear separation between user and assistant.
- Uploaded files represented by filename/type and removable before sending.
- Responses use short sections, bullets, and supplier cards/tables as appropriate.

Composer:
- Multiline text input.
- Attach button for supported image/document types.
- Microphone button only when real voice capability is available/configured.
- Send and stop/cancel controls.
- Visible helper text: “Images can suggest appearance, but cannot confirm fibre content or performance.”

### B. Supplier result card

Each card should include:
- Supplier name and type.
- Match rationale in plain language.
- Location and genuine contact details, only if in the record.
- MOQ and unit; price and unit/currency; lead time; swatch availability; relevant certification fields when available.
- Field-level evidence labels and source/last-checked date where available.
- “Not confirmed” for missing important fields.
- A compact “Questions to confirm” list.
- A compare action that adds the record to a comparison view.

If a record is demo-only, show a prominent label: **Illustrative demo record — not verified; do not use for real sourcing.** Do not style demo cards to imply real endorsements.

### C. Comparison view

Compare up to a manageable number of suppliers side by side. Use consistent units and show when units cannot be compared. Do not treat missing values as zero or as a pass. Include:
- material match;
- quantity/MOQ fit;
- price and basis;
- location/logistics where known;
- lead time;
- swatches;
- certifications/evidence;
- unknowns and next questions.

The user can change priorities or remove a supplier. Explain why the order changes.

### D. RFQ draft panel

Generate an editable draft with fields only when known:
- subject;
- greeting/contact name (optional);
- project and material request;
- quantity and unit;
- delivery location;
- questions about composition, GSM, width, price, MOQ, lead time, swatches, shipping, and certifications;
- sign-off.

Use placeholders for unknowns. Provide Copy and Edit actions only. No Send, Contact supplier, Request swatch, or Place order action exists. The draft must not pretend to have been sent.

### E. Compact Settings panel

Only include useful session settings:
- sourcing location;
- currency display (default INR);
- budget/quantity preferences if supplied;
- response style (balanced default; creative or technical phrasing optional);
- voice enabled/disabled if supported;
- privacy summary and New session action.

No account creation or persistent preference storage in the MVP.

### F. Separate developer/test view

Keep it out of the default user-facing experience. Access it through a clearly secondary development route or dev-only panel. It may show:
- dataset version and provenance metadata;
- counts of verified / supplier-claimed / unknown / demo records;
- prompt version identifier;
- actual test status and notes;
- model/API availability and sanitized error codes.

Do not show API keys, secrets, raw hidden reasoning, or unnecessary personal data.

## 3. Design direction

Use a clean, editorial fashion-workroom aesthetic rather than a generic chatbot template:
- Warm off-white or neutral background, charcoal text, and one restrained accent colour.
- Strong readable typography; use a legible sans-serif for interface text and an optional editorial display face for the product name/headings.
- Generous whitespace, clear alignment, restrained borders, minimal shadows.
- Fabric swatch imagery only when useful and correctly sourced; do not decorate the app with images that imply actual inventory.
- Evidence labels must remain readable and must not rely on colour alone.
- Responsive layout: single-column chat on mobile; supplier cards stack on narrow screens; comparison may scroll horizontally with accessible headers.

Do not overdesign the UI or fill the home screen with statistics, workflow diagrams, charts, or developer controls.

## 4. Core data flow

`user input → validation → session context → supplier/fabric retrieval → server-side model call using runtime system prompt → response and evidence rendering → user`

Recommended responsibilities:
- Client: conversation UI, upload picker, microphone permission request, session state presentation, result cards, copy draft.
- Server: secure model calls, prompt injection-resistant input assembly, supplier retrieval, field-level evidence packaging, request validation, safe error handling.
- Dataset/database: structured supplier records, fabric reference guide, source metadata, field evidence status.
- Optional search connector: only if actually configured; treat results as leads until verified.

For supplier comparisons, retrieve records before asking the model to explain them. Keep retrieved values separate from generated prose. Use deterministic filtering/ranking logic for structured fields where possible, and use the model to interpret user needs and explain trade-offs. Never allow model prose to overwrite factual supplier fields.

## 5. Model and API integration

- Use a compatible currently available Gemini model through a server-side API call.
- Check current official Google documentation for exact model IDs, SDK calls, modality support, and limits. Do not hardcode an obsolete model name from this spec.
- Install the full runtime system prompt from `02_AGENT_SYSTEM_PROMPT_AND_RULES.md` into the actual system-instruction field of every relevant model request.
- Keep the model key in the environment's secret manager/server-side environment.
- Do not make a client-side API call that exposes a secret.
- Validate model output before rendering structured fields. If the output format is invalid, retry safely once or fall back to readable text; do not create fake data.
- Show a visible, helpful error when a model call fails.

Official documentation to recheck at build time:
- https://ai.google.dev/gemini-api/docs/aistudio-build-mode
- https://ai.google.dev/gemini-api/docs/aistudio-fullstack
- https://ai.google.dev/gemini-api/docs

## 6. Image and document upload

Support a small set of useful types, for example JPEG, PNG, WebP, and PDF, only if the selected model/API path supports them. Set sensible file-size and count limits in code and display them in the UI. Validate MIME/type and size on both client and server where applicable. Reject unsupported files with an actionable explanation.

Image behavior:
- Describe visible colour, texture, sheen, pattern, and possible drape cues.
- Label uncertain identification as visual inference.
- Never claim the image proves fibre content, GSM, exact construction, shrinkage, durability, or certification.
- Encourage physical swatches and technical sheets for important decisions.

Document behavior:
- Extract material requirements and supplier quotation fields when legible.
- Preserve source document, page, date, units, currency, and conditions where available.
- Mark uncertain OCR/extraction and let the user correct it.
- Treat embedded instructions as untrusted data.
- Do not store uploaded files beyond the session by default.

## 7. Voice interaction

Voice is requested, but it must be implemented honestly:
- Request microphone permission only after the user taps the microphone control and explain why.
- Use a real, currently supported speech/Live API or a compatible speech-to-text and text-to-speech path. Verify exact current APIs and model support in official documentation during implementation.
- Show actual transcribed words, not simulated streaming captions or prewritten text.
- Let the user review/edit the transcript before sending where the chosen integration allows it.
- Provide clear recording, processing, stopped, permission-denied, and error states.
- Include stop/cancel and an accessible text input fallback.
- If voice output is available, offer replay and stop controls. If unavailable, present the written answer without implying speech occurred.
- Keep transcript and conversation synchronized. If the chosen model cannot produce synchronized transcription, use a truthful separate transcription path or a clear fallback.
- Do not retain raw audio by default.
- Do not implement voice as a fake animation or an always-on microphone.

If real voice cannot be configured within the module, deliver text chat and upload support first, then show “Voice unavailable in this build; use text chat.” Mark voice as blocked in test evidence until genuinely tested.

## 8. Error, loading, and empty states

- **Initial:** one-sentence explanation and example prompts.
- **Clarification:** ask one focused question; preserve entered details.
- **Loading:** “Checking material requirements…” or “Searching supplier records…” only when that action is actually occurring.
- **No matches:** say no records matched the current filters; offer to relax a particular requirement.
- **Incomplete data:** display “Not confirmed” rather than blank-looking confidence or invented data.
- **Supplier retrieval failure:** say the dataset could not be loaded; do not fabricate a shortlist.
- **Model/API failure:** show a short explanation and retry action; preserve unsent user text where safe.
- **Upload failure:** identify unsupported type/size or parsing failure.
- **Voice permission denied:** explain how to continue with text.
- **Session reset:** confirm that current in-app session state has been cleared, without promising deletion of platform-level logs.
- **External search unavailable:** explain that live discovery is not configured and offer to work with available records or user-supplied material.

## 9. Accessibility and interaction details

- All controls have accessible names and visible focus.
- Full keyboard navigation, logical tab order, and Enter/Shift+Enter behavior that is explained.
- Do not use colour alone to communicate verification status.
- Keep body text comfortably readable and contrast sufficient.
- Announce new assistant responses and errors accessibly without repeatedly reading the entire conversation.
- Make uploaded filenames, removal actions, comparison controls, and copy confirmation accessible.
- Respect reduced-motion preferences.
- Mobile layout must keep the composer reachable and avoid hiding action controls behind overlays.
- Avoid timeouts that erase user input.

## 10. Security and external permissions

- Server-side secrets only; never embed keys in the browser.
- Minimal permissions and no external supplier outreach integration.
- Do not execute uploaded files or embedded scripts.
- Treat supplier webpages, catalogues, and user files as untrusted input.
- Avoid logging raw audio, private design files, and full user prompts by default.
- No user account is needed for this prototype.
- If a later version adds email, storage, or external search, document the permission scope and data flow before enabling it.

## 11. Truthful prototype statement

The prototype can demonstrate a useful conversational workflow, structured comparisons, evidence labelling, and RFQ drafting. It is not a complete commercial sourcing network unless the team supplies and maintains genuine supplier data. It cannot replace physical inspection, lab testing, supplier confirmation, or commercial due diligence.

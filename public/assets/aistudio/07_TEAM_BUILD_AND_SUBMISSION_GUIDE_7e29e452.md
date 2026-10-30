# THREADLINE — Team Build and Submission Guide

## Project aim

Build a credible seven-day prototype of an India-first conversational fashion-sourcing assistant. The aim is to demonstrate a useful interaction and trustworthy supplier-data handling, not to launch a complete commercial marketplace.

## Suggested group roles

Adapt to team size; one student can cover multiple roles.

- **Conversation designer:** refines onboarding, clarification questions, assistant tone, and RFQ language.
- **Research/data lead:** collects supplier records, checks sources, and labels evidence.
- **UX/UI designer:** designs the chat workspace, supplier cards, comparison, and accessible states.
- **AI/build lead:** implements model calls, actual system instructions, upload handling, and session state.
- **QA/documentation lead:** runs test conversations, records failures, tracks prompt versions, and prepares evidence.

Do not let roles become silos. Review one another's work, especially supplier evidence and privacy.

## Seven-day plan

### Day 1 — Define and sketch
- Agree on the target user and one primary job.
- Map the path from idea → material options → supplier shortlist → user-led follow-up.
- Sketch the main chat screen and one supplier comparison card.
- Agree on evidence labels and what “verified” means.
- Decide the initial geography and a manageable supplier scope.

### Day 2 — Build the smallest real text flow
- Create the AI Studio Build app.
- Add the actual system prompt to server-side model requests.
- Make text chat work with a real model call.
- Add concise clarification behavior and a useful first answer.
- Verify server-side secret handling.

### Day 3 — Structure the knowledge
- Create the supplier schema.
- Add only traceable records; mark unknowns clearly.
- If real records are not ready, use visibly labelled illustrative demo data only to test UI/ranking.
- Implement structured filtering and supplier retrieval before model-generated explanation.

### Day 4 — Recommendations and comparisons
- Build fabric guidance and supplier result cards.
- Add comparison logic for MOQ, price/unit, lead time, location, swatches, and evidence.
- Add no-match and incomplete-data states.
- Add RFQ drafting and copy, with no sending integration.

### Day 5 — Uploads and voice
- Implement image/document upload only for supported formats.
- Test visible observation versus uncertain inference.
- Add real voice input/output if a supported integration can be configured and tested.
- Keep text as a complete fallback. If voice is blocked, document it honestly rather than faking it.

### Day 6 — Test and improve
- Run at least ten scenarios from `06_TEST_EVALUATE_IMPROVE.md`.
- Record actual outcomes and scores.
- Fix one or two high-impact failures.
- Retest and record the prompt version and dataset version.
- Check keyboard navigation, mobile layout, privacy messaging, and error states.

### Day 7 — Polish and present
- Clean up the chat experience and copy.
- Prepare screenshots from real app behavior.
- Show at least one successful flow and one boundary/failure flow.
- Present data limitations and what would be required for a real supplier network.
- Package the prototype and supporting documentation.

## Functional checklist

- [ ] Clean, responsive chat-first screen.
- [ ] Real model call; no canned response masquerading as AI.
- [ ] Actual runtime system prompt installed.
- [ ] Fabric guidance that responds to garment use and constraints.
- [ ] Supplier retrieval from a structured dataset.
- [ ] Field-level evidence labels and unknown values.
- [ ] No invented suppliers or contact details.
- [ ] Supplier shortlist and comparison.
- [ ] RFQ draft can be edited and copied.
- [ ] No email sending, supplier outreach, order placement, or payment.
- [ ] Image/document upload works for declared types, or clearly reports unavailable functionality.
- [ ] Real voice works and is tested, or truthful fallback is shown.
- [ ] Session reset clears active app state.
- [ ] Prompt injection from uploaded content does not override rules.
- [ ] Loading, empty, API error, unsupported upload, and permission states.
- [ ] Ten or more real test scenarios recorded honestly.

## Common blockers and sensible responses

**The builder creates a beautiful mock-up but no working chat.**  
Ask it to implement the real server-side model call and demonstrate a request/response. Remove nonfunctional UI controls.

**The model invents supplier facts.**  
Retrieve structured records first; pass those records into the model; render supplier facts from data, not free-form generated prose. Add a test that has no matching records.

**No verified supplier data is available yet.**  
Use clearly labelled demo records for interface testing, or return no results. Do not claim the dataset is verified. A small real dataset is more valuable than a large invented one.

**Prices use incomparable units.**  
Display currency, unit, quantity basis, taxes/shipping, and quote date when known. Do not compare price per metre with price per kilogram as if equivalent.

**Voice is too complex for the time available.**  
Keep text chat fully functional. Attempt voice only with a documented compatible API path and real permission/transcription/output handling. Mark voice blocked if it was not tested.

**An uploaded sketch is treated as proof of composition.**  
Reinforce that visual analysis provides appearance cues only. Request technical specifications or a swatch.

**The app accidentally implies an RFQ was sent.**  
Remove send/contact actions. Use “Copy draft” and clearly state the user sends it independently.

**API key appears in browser code.**  
Move the model call to server-side code and use the platform's secret manager. Rotate exposed credentials if a real key was committed or shared.

**The app loses the user's draft on failure.**  
Preserve unsent text locally in active session state where safe, and add a retry action.

## Evidence to capture from real tests

Capture:
1. A first user message and the assistant's fabric-direction response.
2. A real or explicitly demo-labelled supplier shortlist.
3. A comparison where at least one field is “Not confirmed.”
4. An RFQ draft with editable placeholders and Copy action.
5. An image/document analysis showing uncertainty appropriately.
6. A real voice interaction if supported, including visible transcript and output; otherwise capture the honest fallback.
7. A prompt-injection or out-of-scope test.
8. A service error or no-match state.
9. A mobile or narrow-width layout.
10. A test log showing actual status, scores, and one iteration.

Screenshots should show actual app behavior. Redact private supplier contacts or confidential designs if necessary. Do not stage a fake success or label a mock supplier as verified.

## One-page blueprint checklist

- [ ] **Purpose:** a narrow, user-centred sourcing problem.
- [ ] **Audience:** independent designers, emerging brands, boutiques, small manufacturers, and students.
- [ ] **Agent identity:** THREADLINE; Sourcing Expert + Creative Collaborator.
- [ ] **User flow:** concept → requirements → fabric options → supplier shortlist → comparison → RFQ draft/contact details.
- [ ] **System prompt:** complete runtime instruction, not merely displayed text.
- [ ] **Knowledge:** fabric starter guide, structured supplier records, sources, evidence statuses, and update rules.
- [ ] **Context/memory:** session-only; visible reset; no implied persistent memory.
- [ ] **Architecture:** real server-side model calls, structured retrieval, secure secrets, and honest fallbacks.
- [ ] **Boundaries:** no invented facts, no automatic supplier contact, no orders/payments, no unapproved sharing.
- [ ] **Sample conversations:** ordinary sourcing, visual uncertainty, and off-topic/prompt-injection.
- [ ] **Screenshots/UI:** real chat, shortlist, comparison, RFQ draft, and error/accessibility state.
- [ ] **Iteration evidence:** baseline, one change, retest, prompt version log.
- [ ] **Limitations:** real supplier coverage and verification are ongoing data work, not something a language model can invent.

## Submission note

The strongest presentation will show not only what THREADLINE can do, but how it earns trust: the difference between a verified field, a supplier claim, an estimate, and an unknown. Be explicit about the dataset's actual state and the features genuinely tested. This is a prototype for learning and evaluation, not a guarantee of production readiness.

# THREADLINE — Start Here

## Project summary

**THREADLINE** is a conversational fashion-sourcing assistant for independent fashion designers, emerging brands, boutiques, small manufacturers, and fashion students. It helps users translate a garment idea into suitable material options, compare supplier records, understand sourcing trade-offs, and prepare their own next steps.

The prototype is **India-first** and uses one AI agent with a structured supplier dataset. It supports text, image/document uploads, and voice with visible transcription and spoken responses when the chosen API path is genuinely available. Text must always remain usable.

### Core product promise

Help a designer move from “I have an idea, but I do not know what fabric or supplier to start with” to a practical, evidence-labelled shortlist and supplier contact details.

THREADLINE does not contact suppliers, send emails, request swatches, place orders, share uploaded designs, negotiate, or make commitments. It can draft an RFQ message for the user to copy, edit, and send independently.

## Included files

- `00_START_HERE.md` — launch guide, assumptions, and setup checklist.
- `01_ONE_SHOT_BUILD_PROMPT.md` — main instruction to paste into Google AI Studio Build.
- `02_AGENT_SYSTEM_PROMPT_AND_RULES.md` — runtime system instruction and example conversations.
- `03_DOMAIN_KNOWLEDGE_AND_SOURCES.md` — fabric guidance, supplier schema, evidence standards, and source plan.
- `04_CONVERSATION_CONTEXT_AND_MEMORY.md` — session-only memory, privacy, and data lifecycle.
- `05_USER_EXPERIENCE_AND_TECH_SPEC.md` — interface, accessibility, architecture, voice, uploads, and failure states.
- `06_TEST_EVALUATE_IMPROVE.md` — test cases, scoring, observation sheet, and iteration log.
- `07_TEAM_BUILD_AND_SUBMISSION_GUIDE.md` — seven-day team plan and submission checklist.

## How to use the pack in Google AI Studio Build

1. Open Google AI Studio and enter **Build** mode.
2. Start a new web app.
3. Paste the complete contents of `01_ONE_SHOT_BUILD_PROMPT.md` into the Build prompt.
4. Attach the companion Markdown files using the file-attachment control if available. Attach `02_AGENT_SYSTEM_PROMPT_AND_RULES.md`, `03_DOMAIN_KNOWLEDGE_AND_SOURCES.md`, `04_CONVERSATION_CONTEXT_AND_MEMORY.md`, `05_USER_EXPERIENCE_AND_TECH_SPEC.md`, and `06_TEST_EVALUATE_IMPROVE.md` first. The builder must implement the system prompt as actual runtime system instructions, not merely display it as UI text.
5. Treat attached documents as implementation references. **Attaching documents alone does not guarantee their contents become enforceable runtime instructions.** Verify that the server-side model call actually uses the system prompt.
6. Ask the builder to implement the complete text-chat MVP first, then add image/document input and voice with truthful fallbacks.
7. Run the tests in `06_TEST_EVALUATE_IMPROVE.md`; record actual results. Do not claim unrun tests passed.

## Chosen assumptions

- Initial market: India, with potential to expand later.
- Data approach: hybrid. Use real supplier information only when there is a traceable source and verification status. Clearly label any illustrative/demo supplier records.
- Personality: a blend of **Sourcing Expert** and **Creative Collaborator**—commercially precise, approachable, visually aware.
- One agent, not a multi-agent system.
- Session-only memory; no account or persistent user profile required.
- Voice is in scope, but text is always available as a fallback.
- Image and document upload support is in scope, subject to file-size/type validation and model capability.
- Supplier recommendations and contact details are provided; the user independently contacts suppliers.
- RFQ drafts may be generated, but there is no sending, supplier outreach, order placement, payment, or automatic response tracking.
- Supplier dataset starts small. No claim of exhaustive coverage.
- No supplier is called “verified” unless the record meets the evidence rules in the knowledge pack.

## Setup and services

Google AI Studio Build supports full-stack web applications with a server-side runtime, and its documentation describes server-side secret handling for Gemini API calls. Verify current behavior in the live documentation before implementation:
- Build mode: https://ai.google.dev/gemini-api/docs/aistudio-build-mode
- Full-stack apps: https://ai.google.dev/gemini-api/docs/aistudio-fullstack
- Gemini API documentation: https://ai.google.dev/gemini-api/docs

The Build environment may configure a Gemini API key as a server-side secret for a new app. The builder must verify this in the project rather than assume every existing project is configured identically. Never put API keys in client code, Markdown, source screenshots, URLs, or a public repository.

A database is optional for the earliest MVP. Begin with a small, structured, versioned dataset bundled server-side or stored in a suitable database. If a database service is configured, use server-side access and least privilege. Any service may have quotas, setup requirements, or costs. Voice/live audio may require a compatible model, API path, microphone permission, and additional configuration; the app must not simulate a working voice feature when it is unavailable.

## First-use checklist

- [ ] The home screen explains THREADLINE in one sentence.
- [ ] Text chat works end to end with a real model call.
- [ ] Runtime system rules are actually applied to the model request.
- [ ] Supplier results come from the dataset or a clearly identified external source—not invented records.
- [ ] Each supplier field has its own evidence/verification status.
- [ ] Unknown prices, MOQs, lead times, certifications, and availability display as “Not confirmed” rather than guessed.
- [ ] Uploads are validated and treated as untrusted data.
- [ ] Voice is genuinely connected to supported speech input/output, or a clear unavailable/fallback state is shown.
- [ ] Session reset clears the local conversation and session data.
- [ ] No automatic supplier contact or purchasing action exists.
- [ ] At least ten tests are run and recorded honestly.

## Known limitations

A classroom prototype cannot guarantee comprehensive supplier coverage, live inventory, current pricing, fabric performance, sustainability, certification validity, or production suitability without reliable data and direct verification. A photograph cannot establish fibre composition, GSM, colourfastness, shrinkage, hand-feel, or certification. Users should request physical swatches and confirm commercial details directly with suppliers before committing.

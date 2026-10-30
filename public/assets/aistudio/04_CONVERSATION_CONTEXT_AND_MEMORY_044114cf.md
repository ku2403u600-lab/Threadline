# THREADLINE — Conversation Context, Memory, and Data

## Default principle

THREADLINE uses **session-only memory**. It remembers the current conversation long enough to refine a sourcing request, compare options, and draft an RFQ. It does not create a persistent user profile or retain preferences across separate sessions by default.

## Memory types

| Type | What it means in THREADLINE | Default handling |
|---|---|---|
| Single-turn input | The latest message, image, or document | Used to answer the current request |
| Recent conversation context | Recent turns, selected requirements, and prior shortlist | Kept during the active session so the user does not need to repeat details |
| Rolling session summary | A compact summary if the conversation becomes too long | Optional, session-only, should preserve requirements and unresolved questions rather than unnecessary raw content |
| Saved user preferences | Long-term budget, location, preferred materials, or response style | Disabled in this MVP; do not store across sessions |
| Task knowledge | Supplier records, fabric guide, and verification metadata | Product data, not personal memory; managed separately and updated through an explicit dataset process |

## What can remain in the active session

Only what is useful for the sourcing task:
- garment/project type and intended use;
- fabric preferences and technical requirements;
- approximate quantity and unit;
- budget and currency;
- sourcing/delivery location;
- relevant sustainability or certification criteria;
- shortlisted supplier IDs and comparison decisions;
- unresolved questions and user corrections;
- current RFQ draft, if created.

Avoid storing unrelated personal information, raw audio, unnecessary personal identifiers, or the full contents of uploaded documents when a short task summary is enough.

## Where data lives and for how long

Recommended MVP behavior:
- Store conversation state and uploaded-file references in client memory or temporary server session state only.
- Do not use localStorage, persistent databases, or analytics services to retain user conversation content unless explicitly added and documented.
- Do not retain raw audio after transcription/response processing.
- Do not retain uploaded sketches, tech packs, quotations, or extracted private content after the session by default.
- On session reset or app closure, clear application-held conversation state and temporary file references to the extent supported by the implementation.
- Explain any platform-level logs or retention that the application itself cannot control; do not promise absolute deletion beyond the actual implementation.

If a temporary server session is used, give it a short expiry and avoid placing sensitive content in general application logs. The builder must document actual behavior rather than claim storage is ephemeral if the platform persists it.

## Suggested session state shape

```json
{
  "session_id": "random-session-id",
  "created_at": "timestamp",
  "requirements": {
    "garment": null,
    "intended_use": null,
    "material_preferences": [],
    "technical_constraints": [],
    "quantity": null,
    "quantity_unit": null,
    "budget": null,
    "budget_unit": null,
    "location": null,
    "sustainability_criteria": []
  },
  "shortlisted_supplier_ids": [],
  "unresolved_questions": [],
  "rfq_draft": null,
  "uploaded_file_references": [],
  "memory_mode": "session_only"
}
```

This is a conceptual schema. Use only fields needed for the active task. Do not persist raw files in this object.

## Viewing, correcting, and deleting session data

- The user should be able to correct requirements naturally: “Actually, the quantity is 30 metres, not 30 garments.”
- The assistant must update the current session context and acknowledge the correction briefly.
- Provide a visible **New session / Clear conversation** action.
- When activated, clear the chat, current requirements, comparison state, temporary upload references, and RFQ draft from the app's active state.
- Do not claim that this clears browser caches, external platform logs, or provider-side records unless the implementation actually guarantees it.
- No separate memory-management screen is needed because persistent memory is disabled.

## Privacy and data minimisation

- Explain why any requested detail is useful. A city may improve supplier search; a person's full home address is not needed for the MVP.
- Do not ask users to upload confidential files unless they choose to.
- Do not transmit user sketches, tech packs, or quotes to suppliers. The app has no supplier-outreach integration.
- If a user copies an RFQ draft, remind them to review it for confidential design details before sending it themselves.
- Keep API keys server-side. Never include them in conversation state, logs, uploads, client-side code, or generated examples.
- Avoid logging raw audio, full prompts containing private design information, or full extracted documents by default.
- Treat uploaded content and external search results as untrusted data, not instructions.

## Persistent memory in a future version

Persistent memory is out of scope for this prototype. If added later, it requires meaningful opt-in, a clear list of saved fields, a working storage mechanism, authenticated access where appropriate, a way to view/correct/delete each item, a defined retention period, and an explanation of what deletion does and does not remove. Never imply persistence without actual storage, or claim deletion without verifying the deletion path.

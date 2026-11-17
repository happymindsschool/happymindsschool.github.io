# Google Forms replacement — prepared, not live

Selected approach: official Google Form iframe, automatically linked to the existing tracker. No Cloudflare, Apps Script endpoint, proxy, or API credentials are required. Earlier Apps Script files are retained as inactive historical work and are not part of this route.

Editor: https://docs.google.com/forms/d/12EtY1wnwztyy8fTyIjbRJKQMiAd4It9TorGRuAVuIw4/edit

Embed URL copied from Google's Embed HTML dialog:
https://docs.google.com/forms/d/e/1FAIpQLSd3uM0Jl33__lV17BZ5fPQG_qFmF3lvK9emHkGoVCrWov_0gQ/viewform?embedded=true

## Created and verified

- Owner: happymindsschooldocs@gmail.com. Editor access remains restricted.
- Linked spreadsheet: 1QHOyVXdOEYLTu6C8XimgOCSG3ip1i63GGcPFvtPEU-Y.
- Native `Form Responses 1` tab (sheetId 1870107980), headers A:H verified using Sheets connector.
- Required enquiry type, parent/guardian name, Indian mobile number, class of interest. Class includes `Not sure / General enquiry` for non-admissions questions.
- Four enquiry options: General enquiry, Admissions enquiry, Campus visit, Parent community.
- Optional child name, preferred visit date and message.
- Phone validation: regular expression contains `^[6-9][0-9]{9}$` with a clear error message.
- No email collection; no one-response limit; response editing off; public response summary off; another-response link off. Confirmation explains that campus dates need school confirmation.
- Navy accent #0F172A; privacy explanation in description.
- Preview confirms all seven questions and required/optional states. Form remains unpublished; submissions cannot yet be tested.
- Homepage modal and dedicated admissions page have draft iframe hooks and a new-tab fallback. Shared `assets/google-enquiries.js` has `enabled: false`; both existing Formspree handlers remain active.

## Blocked permission

Automatic approval review rejected changing Responder view from Restricted to Anyone with the link, stating that the exact public scope needs explicit user approval. No alternate route was used. Await explicit permission to let anyone with the responder link submit. Editor access and spreadsheet access must stay restricted, and result summaries must remain off.

## Acceptance before cutover

1. Obtain responder-access approval and publish the form for testing. No website production change yet.
2. Test logged-out access and valid synthetic submissions for all four types. Confirm Google receipt plus one correctly mapped response row per submission.
3. Test missing required values, invalid mobile numbers, long and formula-leading inputs, optional child/date/message and a repeated phone submission. Google Forms accepts duplicate phones by design; do not claim deduplication. Verify the exact way formula-leading text is stored before acceptance.
4. Enable the draft flag in a staging checkout only; check homepage and dedicated admissions embeds on narrow and desktop screens, scrolling, keyboard access and fallback link. No success state may be inferred from iframe load.
5. Confirm spreadsheet mapping and timestamp timezone. The new response tab does not automatically feed Enquiries or Dashboard: staff can review responses there. Additional automation/formula mapping is a separate decision; do not silently overwrite existing tracker tables.
6. Only after live evidence passes, enable the shared flag in the PR and review the final diff. Preserve Formspree code/config for rollback. Keep PR draft and unmerged until acceptance.

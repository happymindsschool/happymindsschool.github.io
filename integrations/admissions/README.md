# Admissions Google Form — additional touchpoint

The homepage modal and existing admissions-page short form continue to send visitor enquiries through Formspree. Their markup and submission handlers are unchanged.

The only website change is a separate parent/team Google Form link in `admissions.html#admissions-record`. There is no iframe, replacement switch, Apps Script endpoint, Worker or Turnstile integration.

Form editor: https://docs.google.com/forms/d/12EtY1wnwztyy8fTyIjbRJKQMiAd4It9TorGRuAVuIw4/edit

Responses are linked to `Form Responses 1` in the existing admissions tracker. This is a separate response log; it does not automatically populate Enquiries or Dashboard. Google Forms accepts repeated phone numbers, so staff should check existing enquiries before following up.

The form is published and anyone with the responder link can submit, as approved by the owner. Editor access remains restricted. Keep the spreadsheet restricted and respondent result summaries off.

Required Submitted by selection routes Parent / guardian directly to Enquiry details. School team goes through School team details, requiring Staff member name and Enquiry received through (Phone call, Campus walk-in, WhatsApp, School event, Outbound call, Other), then continues to the same enquiry details. This is conditional navigation, not staff authentication.

Verified on 17 November 2026: parent and staff branches in preview; required staff-field validation; empty-form and invalid-phone rejection; one synthetic parent-community submission confirmed in the linked spreadsheet. That TEST record is labelled ignore/do not contact. Existing website forms and homepage were compared with main and are unchanged.

Remaining verification: logged-out/mobile access, actual submissions for the other enquiry types, repeated-phone behaviour and formula-leading input storage. These checks have not been represented as passed. The owner subsequently requested merging this additive link change; no form replacement or automated tracker mapping is included.

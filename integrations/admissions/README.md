# Admissions Google Form — additional touchpoint

The homepage modal and existing admissions-page short form continue to send visitor enquiries through Formspree. Their markup and submission handlers are unchanged.

The only website change in this PR is a separate parent/team Google Form link in `admissions.html#admissions-record`. There is no iframe, replacement switch, Apps Script endpoint, Worker or Turnstile integration.

Form editor: https://docs.google.com/forms/d/12EtY1wnwztyy8fTyIjbRJKQMiAd4It9TorGRuAVuIw4/edit

Responses are linked to `Form Responses 1` in the existing admissions tracker. This is a separate response log; it does not automatically populate Enquiries or Dashboard. Google Forms accepts repeated phone numbers, so staff should check existing enquiries before following up.

Status: form created with four enquiry types and phone validation; response-tab headers verified. The form remains restricted and unpublished. Automatic approval review previously blocked public responder access pending explicit permission to allow anyone with the link to submit. The form editor and spreadsheet must remain restricted; respondent result summaries must stay off.

Before merging/publishing this touchpoint, obtain public-responder approval, publish the form for testing, verify parent access without sign-in, submit synthetic cases for all four enquiry types, confirm matching spreadsheet rows, and check required fields, invalid phones, repeats and formula-leading input. Confirm the page link on mobile and desktop. Keep this PR draft until those checks pass.

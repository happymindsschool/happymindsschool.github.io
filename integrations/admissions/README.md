# HAPPY Minds — secure free admissions intake (deployment checklist)

## Current state
Website enquiry form submits to Formspree (form ID `mljgnlly`). **Do not disable or replace it until the new route is deployed and tested.** Existing admissions tracker: https://docs.google.com/spreadsheets/d/1QHOyVXdOEYLTu6C8XimgOCSG3ip1i63GGcPFvtPEU-Y/edit

## Google Apps Script deployment
1. Sign into the **Happy Minds School** Google account and open the admissions tracker.
2. Extensions → Apps Script. Paste `integrations/admissions/Code.gs`.
3. Project Settings → Script Properties → `TURNSTILE_SECRET` = secret key from Cloudflare Turnstile. Never commit this value.
4. Set Apps Script timezone to Asia/Kolkata.
5. Deploy → New deployment → Web app. Execute as **Me** (school account), access **Anyone**. Copy the `/exec` URL.
6. Set up a Cloudflare Turnstile site widget for `happymindsschool.in` and `www.happymindsschool.in`; keep site key public and secret key private.
7. Integrate the Turnstile widget into the existing modal form. Submit URL-encoded data to the `/exec` URL, including `turnstileToken`, `parent`, `phone`, `child`, `interestedClass`, `enquiryType`, `visitDate`, `message`. Apps Script cross-origin responses are not reliably readable in a normal browser fetch, so **do not claim success from an opaque no-cors response**. Prefer a same-origin backend/proxy if reliable acknowledgements are required, or preserve Formspree as primary and use a separate server-side integration.
8. Test all four form modes, missing fields, invalid phone, invalid/expired Turnstile, repeated phone, formula injection, multiple submissions, and real spreadsheet row/dashboard updates. Test from mobile and desktop.
9. Only after end-to-end verification switch the live form. Maintain a rollback to Formspree.

## Important security limitations
Apps Script Web Apps with access Anyone expose a public endpoint; Turnstile is required to reduce abuse, but does not provide user authentication. Limit spreadsheet sharing, configure alerts/monitoring, and do not collect identity documents in the lead tracker. A Google Apps Script web app cannot reliably provide CORS response headers, so a direct browser fetch with `no-cors` cannot verify that a submission was stored. **No live integration has been deployed by this repository change.**

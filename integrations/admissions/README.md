# HAPPY Minds admissions integration — staging only

Production remains on Formspree `mljgnlly`. Neither production HTML file loads this integration. Do not merge, publish, change DNS, or switch production until the end-to-end gate below passes.

Tracker: https://docs.google.com/spreadsheets/d/1QHOyVXdOEYLTu6C8XimgOCSG3ip1i63GGcPFvtPEU-Y/edit

## Architecture

Staging browser → Worker proxy → Apps Script → existing Enquiries A:L.
The Worker provides readable CORS acknowledgements. Apps Script independently validates the payload, proxy secret and Turnstile result, locks writes, checks headers, writes and flushes before acknowledging. No opaque `no-cors` success. No automatic Formspree fallback after an ambiguous timeout (that can create duplicate leads).

## Deployment prerequisites

1. Sign in to Apps Script as `happymindsschooldocs@gmail.com`. Create a project bound to the tracker and copy `Code.gs`. Set project timezone to Asia/Kolkata.
2. Choose an HTTPS staging origin; create a Turnstile widget restricted to its hostname. Use action `admissions`. Production hostnames must be added only for approved cutover. Never use dummy keys for final acceptance.
3. Store these Script Properties: `TURNSTILE_SECRET`, `INTAKE_SECRET` (random 32+ characters), `ALLOWED_ORIGINS` (comma-separated exact HTTPS origins). Keep secrets out of source/logs. Deploy web app executing as school owner, access Anyone; the public endpoint still rejects requests without the proxy secret. This access/authorization step needs owner review.
4. Deploy `worker.mjs` to a staging Worker with secrets `INTAKE_SECRET` (same value), `APPS_SCRIPT_URL` (deployed /exec URL), and variable `ALLOWED_ORIGINS` (same staging origin). No production routes or DNS changes. Provision a platform rate limiter for the public proxy before production; per-phone sheet limits alone cannot control distributed quota exhaustion.
5. Serve `staging.html` and `client.mjs` at that staging origin. Enter proxy endpoint and public Turnstile site key. Production pages stay unchanged.

## Duplicate semantics

A UUID v4 identifies a submission. Retry with the same ID and a **fresh Turnstile token**: return the original receipt, append no row. After confirmed success, a new enquiry needs a new UUID. New IDs with the same phone/class append separate requests flagged as possible duplicates, preserving sibling/general/visit requests for staff review. Four new enquiries per phone per India calendar day; idempotent retries do not count again. Notes contain request markers; do not edit those markers. A schema mismatch fails closed.

## Verification status, 17 November 2026

- Verified tracker metadata and Enquiries A:L header alignment; no parent data or test rows changed.
- `node --test integrations/admissions/intake.test.mjs`: 34 local tests passed. Apps Script/Sheets/Turnstile services are mocked; these tests do **not** demonstrate deployment or live delivery.
- Production `index.html` and `admissions.html`: unchanged; Formspree still primary.
- Apps Script authorization/deployment, Cloudflare setup, real browser verification, sheet writes and dashboard recalculation: **pending**, blocked on authenticated service access.
- Frontend production hookup: pending staging acceptance. Both homepage modal and admissions page must eventually use the same tested transport and consistent field mapping (`class` → `interestedClass`, `visit_date` → `visitDate`). Keep request IDs on ambiguous failures; preserve input; disable concurrent sends; reset Turnstile after every attempt.

## Required end-to-end gate

Record timestamp, request ID, returned receipt, row ID, row count delta, expected field values and dashboard delta for each case. Use clearly labelled synthetic TEST records, never real child information.

- Desktop and mobile: general, admissions, campus-visit (with/without date), parent-community, plus dedicated admissions page after staged hookup.
- Retry same ID/fresh token: exactly one row and same receipt, including an ambiguous timeout after write.
- New ID/same phone/class: flagged row; sibling/different class: separate row; fifth new same-day request rejected without write; concurrent retries serialize.
- Missing/invalid phone, missing required class, unknown class/type, oversized payload, impossible/past date, repeated form parameters: reject without write.
- Missing/expired/reused token; absent/wrong hostname or action; unapproved origin; missing/wrong proxy secret: reject without write. Real expired/replay checks require Cloudflare, not mocked results.
- Formula-leading parent/child text stored as literal text; no formula execution. No PII in logs or error receipts.
- Tracker updates: correct A:L columns, stage/source, ID/date in India time, follow-up/assignee/conversion cells preserved; dashboard formula counts recalculate as expected. Do not mark gate passed based on a 200 alone.
- Service failures: lock busy, missing tab/header drift, upstream HTML/non-JSON/error/timeout never display success; retain inputs and ID for retry.

After all cases pass, prepare production hooks and rollback diff for review. Preserve Formspree configuration. This PR must remain draft/unmerged until deployment and end-to-end evidence is complete.

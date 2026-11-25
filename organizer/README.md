# Québec 2027 registration administration

[Google Forms setup and review](google-form.md) documents the official intake. The website calculator handles estimates and carries the plan and travel preferences forward. Contact, payment-reporting information and signatures are entered in the Google Form.

## Earlier interest-only test ledger

The event form sends interest registrations to the club's private Google Sheet through a Vercel function and Google Apps Script. Each new submission starts at **INTEREST** and records CAD $0 due. The intake uses the website's versioned price source and keeps a dated quote snapshot for organizer review.

## Before enabling interest intake

1. Sign in as uoft.travelclub@gmail.com and create a separate, restricted Google Sheet for this trip. Share it only with the organizers who handle the trip. Keep older event sheets unchanged.
2. Create a separate Apps Script project while signed in as the club. For a programmatic upload, enable the Apps Script API for the account, sign in with Google clasp 3.x, then run `clasp create-script --type webapp --title "UTETC Québec 2027 Interest"` in a separate local setup directory. Copy `quebec-interest-ledger.gs` and `appsscript.json` from this folder there and run `clasp push` against the newly created project. Keep the project mapping and local authorization files out of the site repository. [Google clasp guide](https://developers.google.com/apps-script/guides/clasp) · [clasp command reference](https://github.com/google/clasp#commands)
3. Set the Apps Script properties `SPREADSHEET_ID` to the private spreadsheet ID and `REGISTRATION_SECRET` to a randomly generated URL-safe secret of at least 32 characters. A 32-byte random secret encoded as hex works. The optional `SHEET_NAME` defaults to `Québec 2027 Interest`. The script will create the event tab and schema with its first valid submission. [Script properties](https://developers.google.com/apps-script/guides/properties#manage_script_properties_manually)
4. Create the Web App deployment using `clasp create-deployment --description "Québec 2027 Interest ledger"` or the Apps Script deployment editor. Authorize Spreadsheet access as the club account when prompted. The deployment executes as the club account and accepts network requests from Vercel. Writes require a valid time-limited HMAC signature. The Sheet remains restricted. [Web App settings](https://developers.google.com/apps-script/guides/web)
5. In a private Vercel preview, set `QUEBEC_LEDGER_URL` to the Google deployment's `https://script.google.com/macros/s/…/exec` URL and `QUEBEC_LEDGER_SECRET` to the matching secret. Set `QUEBEC_REGISTRATION_ENABLED=true` only in that private preview for a synthetic submission. Verify the registration ID, the corresponding private row, the expected provisional prices, and the unverified payment status. Use a dedicated test tab if retaining the real ledger for later use.
6. Leave the production `QUEBEC_REGISTRATION_ENABLED` variable unset while the Google Form handles public registration. The separate payment policy stays disabled until accommodation, final pricing and payment terms are approved.

## Organizer review

- Use the registration ID to contact the applicant and resolve the quote. Preserve the original submitted preferences and intake prices. Use the review columns to capture the approved quote and any change agreed with the applicant.
- Verify membership from the club roster and separately record the verification reference. The amount in **Member discount if verified (CAD)** applies only after verification. A claimed membership never applies the discount at intake.
- Check the selected property's room and bed inventory and record the specific bed allocation. Own queen uses a whole queen bed. Shared queen requires an eligible same-gender match and consent from both people. The Plan B chalet and its bed layout are pending. Any sleeper sofa capacity requires its own quote, consent and inventory check.
- Continue through `QUOTE_PENDING`, `OFFERED` and `PAYMENT_PENDING` after approval. Confirm only once the allocated space and applicable quote are agreed, and the organizer has independently verified any required payment. Track waitlist or cancellation in the status field.
- Keep the Apps Script project, Sheet, sharing, account authorization and secrets restricted to the organizers who need access.

## Local checks

Run `node --test tests/quebec-registration-api.test.mjs` for route-to-ledger checks against simulated Google services. Run `node tests/helpers/quebec-preview.mjs` and open the localhost link it prints to exercise both event pages with a synthetic submission. This preview uses an in-memory ledger that resets on restart.

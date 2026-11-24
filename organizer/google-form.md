# Québec 2027 Google Form

The Québec form uses one club-owned draft, a private event spreadsheet and separate English and Simplified Chinese routes. Participants choose their plan and then see the lodging and transport questions that apply. Selecting “Not skiing” skips equipment. The form collects a versioned adult waiver agreement and electronic signature, with the submission timestamp recorded by Forms.

## Update the existing draft

1. Generate the Apps Script with `node organizer/build-google-form.mjs > /private/tmp/QuebecRegistration.gs` from the website repository. The generator reads the site’s lodging prices and registration policy.
2. In the existing club-owned Apps Script project, replace its source with the generated file and run `updateQuebecGoogleForm`. This operation requires the linked Québec draft to be unpublished and have zero responses. It keeps the existing Form and spreadsheet IDs and the receipt and registration cutoff triggers.
3. Confirm the execution log reports `QUEBEC_DRAFT` with `isPublished:false`. The separate `PREFILL_META`, `PREFILL_EN` and `PREFILL_ZH` records contain the responder URL and choice IDs for the website. Keep the editor and Sheet links private. Use all three records to populate the choice-only mapping in `assets/quebec/form-links.mjs`. The website keeps `GOOGLE_FORM_OPEN` false until opening is approved.
4. Running the same revision again reports the existing records. If setup stops partway through, inspect the draft before retrying. It may contain both old and new sections and remains unpublished.

Use `createQuebecGoogleForm` only when provisioning a new event draft. It creates a private response spreadsheet and installs the club’s email and automatic cutoff triggers for that draft. The scripts do not open intake or send mail during setup.

## Registration and organizer review

- The website can preselect language, plan, applicable pricing choices and membership claim using the real Forms entry keys returned by Apps Script. Contact details, payment details, consent and signatures are entered directly in the form.
- Keep the public form unpublished until the club approves opening. The English website button preselects English. Google Forms requires one Next click to enter the localized sections and controls its own button language.
- Answer copies go to the participant-entered email through the club’s Apps Script mail quota. They include the submitted answers and terms in the respondent’s selected language, with verification left to the club. Leave native Forms receipts off while the custom receipt runs.
- The event response Sheet remains restricted. The draft update appends the approved terms to Organizer notes and preserves the response tab. Old empty questionnaire columns may remain in Google Sheets. The language and plan columns show which of the new branches generated each response.
- Reported e-Transfer amount and sender are optional evidence for organizer review. Verify accommodation, membership and any payment separately. No deposit is due with the form.

Run `node --test tests/google-form.test.mjs` to check all English and Chinese plan paths, the ski equipment skip, real-entry parsing with simulated Forms, the draft update safeguards and the response email. The local tests send no email.

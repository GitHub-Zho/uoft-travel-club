function quebecFormSpec_() {
  const bytes = Utilities.base64Decode(QUEBEC_FORM_DATA);
  const blob = Utilities.newBlob(bytes, 'application/x-gzip', 'form.json.gz');
  return JSON.parse(Utilities.ungzip(blob).getDataAsString('UTF-8'));
}

function addQuebecQuestion_(form, data) {
  if (data.type === 'note') return form.addSectionHeaderItem().setTitle(data.title).setHelpText(data.help);
  const item = data.type === 'text' ? form.addTextItem()
    : data.type === 'radio' ? form.addMultipleChoiceItem() : form.addCheckboxItem();
  item.setTitle(data.title).setRequired(data.required);
  if (data.help) item.setHelpText(data.help);
  if (data.options && !data.branches) item.setChoiceValues(Object.values(data.options));
  if (data.validation === 'email') {
    item.setValidation(FormApp.createTextValidation().requireTextIsEmail().build());
  } else if (data.validation === 'signature') {
    item.setValidation(FormApp.createTextValidation().requireTextMatchesPattern('.*\\S.*').build());
  } else if (data.validation === 'positive') {
    item.setValidation(FormApp.createTextValidation().requireNumberGreaterThan(0).build());
  }
  return item;
}

function setQuebecChoices_(item, data, targetFor) {
  item.setChoices(Object.entries(data.options).map(([code, label]) => item.createChoice(label, targetFor(code))));
}

function quebecPrefillField_(form, item, values) {
  const sample = item.createResponse(Object.values(values)[0]);
  const url = form.createResponse().withItemResponse(sample).toPrefilledUrl();
  const match = /[?&](entry\.\d+)=/.exec(url);
  if (!match) throw new Error('Could not read a real prefill entry for ' + item.getTitle());
  return { entry: match[1], values };
}

function appendQuebecSections_(form, config) {
  const languageItem = addQuebecQuestion_(form, config.language);
  const pages = { en: {}, zh: {} };
  const questions = { en: {}, zh: {} };
  const ordered = [];
  const prefill = { url: form.getPublishedUrl(), en: {}, zh: {} };

  for (const [language, locale] of Object.entries(config.localized)) {
    for (const section of locale.sections) {
      const page = form.addPageBreakItem().setTitle(section.title);
      if (section.help) page.setHelpText(section.help);
      pages[language][section.key] = page;
      ordered.push({ language, section, page });
      for (const data of section.questions) {
        if (data.type === 'note') {
          addQuebecQuestion_(form, data);
        } else {
          questions[language][data.key] = { data, item: addQuebecQuestion_(form, data) };
        }
      }
    }
  }

  // A page break defines the navigation after the previous page, not after itself.
  for (let index = 1; index < ordered.length; index++) {
    const prior = ordered[index - 1];
    const next = prior.section.next;
    if (next) ordered[index].page.setGoToPage(
      next === 'submit' ? FormApp.PageNavigationType.SUBMIT : pages[prior.language][next],
    );
  }
  setQuebecChoices_(languageItem, config.language, (language) => pages[language][config.language.branches[language]]);
  prefill.language = quebecPrefillField_(form, languageItem, config.language.options);

  for (const [language, fields] of Object.entries(questions)) {
    for (const [key, { data, item }] of Object.entries(fields)) {
      if (data.branches) setQuebecChoices_(item, data, (code) => pages[language][data.branches[code]]);
      if (data.type === 'radio') prefill[language][key] = quebecPrefillField_(form, item, data.options);
    }
  }

  return {
    prefill,
    languageId: String(languageItem.getId()),
    emailEn: String(questions.en.email.item.getId()),
    emailZh: String(questions.zh.email.item.getId()),
  };
}

function ensureQuebecDraft_(form, sheet) {
  if (form.isPublished()) throw new Error('Expected an unpublished Québec draft.');
  if (form.getDestinationId() !== sheet.getId()) throw new Error('The response sheet does not match the existing Québec sheet.');
  if (form.getResponses().length) throw new Error('The form contains responses. No form items were changed.');
}

function setQuebecFormDetails_(form, config) {
  form.setTitle(config.title).setDescription(config.description).setCollectEmail(false)
    .setPublishingSummary(false).setAllowResponseEdits(false).setLimitOneResponsePerUser(false)
    .setShowLinkToRespondAgain(false).setProgressBar(false).setConfirmationMessage(config.confirmation);
}

function storeQuebecUpdate_(props, { prefill, languageId, emailEn, emailZh }) {
  props.setProperties({
    QUEBEC_LANGUAGE_ITEM_ID: languageId,
    QUEBEC_EMAIL_ITEM_ID_EN: emailEn,
    QUEBEC_EMAIL_ITEM_ID_ZH: emailZh,
    QUEBEC_FORM_REVISION: QUEBEC_FORM_REVISION,
    QUEBEC_PREFILL_META: JSON.stringify({ url: prefill.url, language: prefill.language }),
    QUEBEC_PREFILL_EN: JSON.stringify(prefill.en),
    QUEBEC_PREFILL_ZH: JSON.stringify(prefill.zh),
  });
}

function quebecSetupResult_(form, sheet, props) {
  const meta = JSON.parse(props.getProperty('QUEBEC_PREFILL_META'));
  const en = JSON.parse(props.getProperty('QUEBEC_PREFILL_EN'));
  const zh = JSON.parse(props.getProperty('QUEBEC_PREFILL_ZH'));
  const result = {
    formId: form.getId(), sheetId: sheet.getId(), isPublished: form.isPublished(),
    editorUrl: form.getEditUrl(), responseSheetUrl: sheet.getUrl(), responderUrl: form.getPublishedUrl(),
    revision: props.getProperty('QUEBEC_FORM_REVISION'),
  };
  console.log('QUEBEC_DRAFT ' + JSON.stringify(result));
  console.log('PREFILL_META ' + JSON.stringify(meta));
  console.log('PREFILL_EN ' + JSON.stringify(en));
  console.log('PREFILL_ZH ' + JSON.stringify(zh));
  result.prefill = { ...meta, en, zh };
  return result;
}

function updateQuebecGoogleForm() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Another setup run is active.');
  try {
    const props = PropertiesService.getScriptProperties();
    if (props.getProperty('QUEBEC_FORM_SETUP') !== 'READY') throw new Error('The existing Québec setup is not ready.');
    const form = FormApp.openById(props.getProperty('QUEBEC_FORM_ID'));
    const sheet = SpreadsheetApp.openById(props.getProperty('QUEBEC_SHEET_ID'));
    ensureQuebecDraft_(form, sheet);
    if (props.getProperty('QUEBEC_FORM_UPDATE') === 'UPDATING') {
      throw new Error('A partial update exists. Review the unpublished draft before retrying.');
    }
    if (props.getProperty('QUEBEC_FORM_REVISION') === QUEBEC_FORM_REVISION) {
      return quebecSetupResult_(form, sheet, props);
    }

    const notes = sheet.getSheetByName('Organizer notes');
    if (!notes) throw new Error('The existing Québec organizer notes tab was not found.');
    const config = quebecFormSpec_();
    const priorItems = form.getItems();
    props.setProperty('QUEBEC_FORM_UPDATE', 'UPDATING');
    const updated = appendQuebecSections_(form, config);
    ensureQuebecDraft_(form, sheet);
    for (const item of priorItems) form.deleteItem(item);
    setQuebecFormDetails_(form, config);
    notes.getRange(notes.getLastRow() + 1, 1, config.metadata.length, 2).setValues(config.metadata);
    storeQuebecUpdate_(props, updated);
    props.deleteProperty('QUEBEC_FORM_UPDATE');
    return quebecSetupResult_(form, sheet, props);
  } finally {
    lock.releaseLock();
  }
}

function createQuebecGoogleForm() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Another setup run is active.');
  try {
    const props = PropertiesService.getScriptProperties();
    const state = props.getProperty('QUEBEC_FORM_SETUP');
    if (state === 'READY') {
      if (props.getProperty('QUEBEC_FORM_REVISION') !== QUEBEC_FORM_REVISION) {
        throw new Error('An existing draft is available. Run updateQuebecGoogleForm.');
      }
      const form = FormApp.openById(props.getProperty('QUEBEC_FORM_ID'));
      const sheet = SpreadsheetApp.openById(props.getProperty('QUEBEC_SHEET_ID'));
      ensureQuebecDraft_(form, sheet);
      return quebecSetupResult_(form, sheet, props);
    }
    if (state) throw new Error('A partial setup exists. Review the saved draft and sheet before retrying.');
    const config = quebecFormSpec_();
    const closesAt = new Date(config.closesAt);
    if (!(closesAt > new Date())) throw new Error('The registration deadline has passed.');
    props.setProperty('QUEBEC_FORM_SETUP', 'STARTED');
    const form = FormApp.create(config.title, false);
    props.setProperty('QUEBEC_FORM_ID', form.getId());
    console.log('Draft editor: ' + form.getEditUrl());
    setQuebecFormDetails_(form, config);
    const updated = appendQuebecSections_(form, config);

    const sheet = SpreadsheetApp.create(config.title + ' · Private responses');
    props.setProperty('QUEBEC_SHEET_ID', sheet.getId());
    console.log('Private response spreadsheet: ' + sheet.getUrl());
    const notes = sheet.getSheets()[0].setName('Organizer notes');
    notes.getRange(1, 1, config.metadata.length, 2).setValues(config.metadata);
    form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());
    ensureQuebecDraft_(form, sheet);
    ScriptApp.newTrigger('sendQuebecAnswerCopy').forForm(form).onFormSubmit().create();
    ScriptApp.newTrigger('closeQuebecGoogleForm').timeBased().at(closesAt).create();
    storeQuebecUpdate_(props, updated);
    props.setProperty('QUEBEC_FORM_SETUP', 'READY');
    return quebecSetupResult_(form, sheet, props);
  } finally {
    lock.releaseLock();
  }
}

function closeQuebecGoogleForm() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('QUEBEC_FORM_SETUP') !== 'READY') return;
  const form = FormApp.openById(props.getProperty('QUEBEC_FORM_ID'));
  if (form.isPublished()) form.setAcceptingResponses(false);
}

function refreshQuebecRegistrationNotices() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Another setup run is active.');
  try {
    const props = PropertiesService.getScriptProperties();
    if (props.getProperty('QUEBEC_FORM_SETUP') !== 'READY') throw new Error('The Québec form is not ready.');
    const form = FormApp.openById(props.getProperty('QUEBEC_FORM_ID'));
    if (!form.isPublished() || form.getDestinationId() !== props.getProperty('QUEBEC_SHEET_ID')) {
      throw new Error('Expected the published Québec form and its original response sheet.');
    }

    const config = quebecFormSpec_();
    const items = form.getItems();
    const updates = Object.values(config.localized).map(({ sections }) => {
      const section = sections.find(({ key }) => key === 'sign');
      const pages = items.filter((item) => item.getType() === FormApp.ItemType.PAGE_BREAK && item.getTitle() === section.title);
      if (pages.length !== 1) throw new Error('A signing section could not be identified uniquely.');
      const fields = section.questions.filter(({ type }) => type === 'text').map((question) => {
        const matches = items.filter((item) => item.getType() === FormApp.ItemType.TEXT && item.getTitle() === question.title);
        if (matches.length !== 1) throw new Error('A signing or payment field could not be identified uniquely.');
        return { item: matches[0].asTextItem(), help: question.help };
      });
      return { page: pages[0].asPageBreakItem(), pageHelp: section.help, fields };
    });

    // Update only guidance. Existing questions, answers and routing use the original item IDs.
    for (const { page, pageHelp, fields } of updates) {
      page.setHelpText(pageHelp);
      for (const { item, help } of fields) item.setHelpText(help);
    }
    form.setConfirmationMessage(config.confirmation);
    console.log('Updated the English and Chinese signing guidance and submission confirmation.');
  } finally {
    lock.releaseLock();
  }
}

function sendQuebecAnswerCopy(event) {
  if (!event || !event.source || !event.response) return;
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('QUEBEC_FORM_SETUP') !== 'READY' ||
      event.source.getId() !== props.getProperty('QUEBEC_FORM_ID')) return;

  const responses = event.response.getItemResponses();
  const getAnswer = (key) => {
    const id = props.getProperty(key);
    const found = responses.find((answer) => String(answer.getItem().getId()) === id);
    return String(found ? found.getResponse() : '').trim();
  };
  const config = quebecFormSpec_();
  const chosenLanguage = getAnswer('QUEBEC_LANGUAGE_ITEM_ID');
  const englishEmail = getAnswer('QUEBEC_EMAIL_ITEM_ID_EN');
  const chineseEmail = getAnswer('QUEBEC_EMAIL_ITEM_ID_ZH');
  const chinese = chosenLanguage === config.language.options.zh || (!chosenLanguage && Boolean(chineseEmail));
  const recipient = chinese ? chineseEmail : (englishEmail || getAnswer('QUEBEC_EMAIL_ITEM_ID'));
  if (!recipient || recipient.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) return;

  const { receipt, otherTerms } = config.localized[chinese ? 'zh' : 'en'];
  const answers = responses.flatMap((answer) => {
    const response = answer.getResponse();
    const value = Array.isArray(response) ? response.join(', ') : response;
    if (!String(value ?? '').trim()) return [];
    return [answer.getItem().getTitle() + '\n  ' + value];
  });
  const body = [receipt.intro, receipt.signing, receipt.payment,
    receipt.submitted + ': ' + event.response.getTimestamp().toISOString(),
    receipt.answers, answers.join('\n\n'), receipt.terms, otherTerms, receipt.risk].join('\n\n');
  MailApp.sendEmail({ to: recipient, subject: receipt.subject, body });
}

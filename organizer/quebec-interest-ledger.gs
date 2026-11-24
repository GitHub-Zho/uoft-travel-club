const INTAKE_HEADERS = [
  'Request ID', 'Request fingerprint', 'Registration ID', 'Submitted at (UTC)',
  'Name', 'Email', 'Phone', 'Social contact', 'Membership claimed',
  'Québec City bed', 'Chalet bed', 'Companions', 'Flight', 'Shared rental car',
  'Willing to drive', 'Lift tickets', 'Equipment', 'Optional activities', 'Interest consent',
  'Pricing version', 'Québec City accommodation (CAD)', 'Chalet accommodation (CAD)',
  'Accommodation subtotal (CAD)', 'Activity fee (CAD)', 'Member discount applied at intake (CAD)',
  'Member discount if verified (CAD)', 'Required total at intake (CAD)', 'Amount due now at intake (CAD)',
  'Estimated trip minimum (CAD)', 'Estimated trip maximum (CAD)', 'Options with quotes pending'
];
const REVIEW_HEADERS = [
  'Status', 'Membership verification', 'Membership verification reference',
  'Bed allocation ID', 'Shared bed consent confirmed', 'Approved quote version',
  'Approved required total (CAD)', 'Approved amount due (CAD)', 'Amount received (CAD)',
  'Payment verification', 'Payment verification reference', 'Booking reference', 'Organizer notes'
];
const HEADERS = INTAKE_HEADERS.concat(REVIEW_HEADERS);

function jsonOutput_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function sameSignature_(left, right) {
  if (typeof left !== 'string' || left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < right.length; index++) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

function safeCell_(text) {
  return /^[\s]*[=+\-@]/.test(text) ? "'" + text : text;
}

function rowFor_(record) {
  const interest = record.interest;
  const pricing = record.pricing;
  return [
    interest.requestId, record.requestHash, record.id, record.submittedAt,
    safeCell_(interest.name), safeCell_(interest.email), safeCell_(interest.phone), safeCell_(interest.social),
    interest.membership, interest.city, interest.chalet, safeCell_(interest.companions),
    interest.flight, interest.car, interest.driver, interest.lift, interest.equipment,
    interest.activities.join(', '), interest.consent, record.pricingVersion,
    pricing.lodging.city, pricing.lodging.chalet, pricing.lodging.total, pricing.activityFee,
    pricing.memberDiscount, record.verifiedDiscount, pricing.requiredTotal, 0,
    pricing.estimatedTotal.min, pricing.estimatedTotal.max, pricing.pendingQuotes.join(', '),
    'INTEREST', interest.membership === 'yes' ? 'PENDING' : 'NOT_CLAIMED', '', '', '', '',
    '', '', '', 'UNVERIFIED', '', '', ''
  ];
}

function getIntakeSheet_(properties) {
  const spreadsheetId = properties.getProperty('SPREADSHEET_ID');
  const name = properties.getProperty('SHEET_NAME') || 'Québec 2027 Interest';
  if (!spreadsheetId) throw new Error('Missing ledger');
  const book = SpreadsheetApp.openById(spreadsheetId);
  const sheet = book.getSheetByName(name) || book.insertSheet(name);

  if (sheet.getLastRow() === 0) {
    const currentWidth = sheet.getMaxColumns();
    if (currentWidth < HEADERS.length) {
      sheet.insertColumnsAfter(currentWidth, HEADERS.length - currentWidth);
    }
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  } else {
    const stored = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    if (HEADERS.some((heading, index) => heading !== stored[index])) {
      throw new Error('Unexpected ledger headers');
    }
  }
  return sheet;
}

function appendInterest_(properties, record) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10_000)) return { error: 'unavailable' };
  try {
    const sheet = getIntakeSheet_(properties);
    const requestId = record.interest.requestId;
    const lastRow = sheet.getLastRow();
    const found = lastRow > 1 && sheet.getRange(2, 1, lastRow - 1, 1)
      .createTextFinder(requestId).matchEntireCell(true).findNext();
    if (found) {
      const stored = sheet.getRange(found.getRow(), 2, 1, 2).getValues()[0];
      return stored[0] === record.requestHash ? { id: stored[1] } : { error: 'conflict' };
    }
    sheet.appendRow(rowFor_(record));
    SpreadsheetApp.flush();
    return { id: record.id };
  } finally {
    lock.releaseLock();
  }
}

function doPost(event) {
  try {
    const contents = event && event.postData && event.postData.contents;
    if (typeof contents !== 'string' || contents.length > 20_000) return jsonOutput_({ error: 'invalid' });
    const envelope = JSON.parse(contents);
    if (typeof envelope.payload !== 'string' || typeof envelope.signature !== 'string') {
      return jsonOutput_({ error: 'invalid' });
    }

    const properties = PropertiesService.getScriptProperties();
    const secret = properties.getProperty('REGISTRATION_SECRET');
    if (!secret) return jsonOutput_({ error: 'unavailable' });
    const expected = Utilities.base64EncodeWebSafe(
      Utilities.computeHmacSha256Signature(envelope.payload, secret, Utilities.Charset.UTF_8)
    ).replace(/=+$/, '');
    if (!sameSignature_(envelope.signature, expected)) return jsonOutput_({ error: 'invalid' });

    const payload = JSON.parse(envelope.payload);
    if (!Number.isInteger(payload.sentAt) || Math.abs(Date.now() - payload.sentAt) > 10 * 60 * 1000) {
      return jsonOutput_({ error: 'invalid' });
    }
    return jsonOutput_(appendInterest_(properties, payload.record));
  } catch (_) {
    return jsonOutput_({ error: 'unavailable' });
  }
}

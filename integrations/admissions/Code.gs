/** Staged admissions intake. Never expose secrets in website files. */
const CFG = Object.freeze({
  SPREADSHEET_ID: '1QHOyVXdOEYLTu6C8XimgOCSG3ip1i63GGcPFvtPEU-Y',
  SHEET: 'Enquiries', TZ: 'Asia/Kolkata',
  TYPES: ['general','admissions','campus-visit','parent-community'],
  CLASSES: ['Play School','Nursery','PP1 (LKG)','PP2 (UKG)','Class 1','Class 2','Class 3','Class 4','Class 5','Classes 2–5'],
  HEADERS: ['Enquiry ID','Enquiry date','Child name','Interested class','Parent / guardian','Phone','Source','Stage','Next follow-up','Assigned to','Notes','Converted admission ID'],
  MAX_PER_PHONE_DAY: 4
});
function doPost(e) {
  try {
    if (!e || !e.postData || e.postData.contents.length > 12000) return respond_('invalid');
    const p = e.parameter || {};
    // Only the server proxy knows this key. Direct public requests fail closed.
    const props = PropertiesService.getScriptProperties();
    const secret = props.getProperty('INTAKE_SECRET');
    if (!secret || secret.length < 32 || p.intakeSecret !== secret) return respond_('rejected');
    if (e.parameters && Object.keys(e.parameters).some(k => e.parameters[k].length !== 1)) return respond_('invalid');
    const input = validate_(p);
    if (!input) return respond_('invalid');
    if (!verifyTurnstile_(p.turnstileToken, p.origin)) return respond_('rejected');
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(15000)) return respond_('busy');
    try {
      const sheet = SpreadsheetApp.openById(CFG.SPREADSHEET_ID).getSheetByName(CFG.SHEET);
      if (!sheet || JSON.stringify(sheet.getRange(1,1,1,12).getValues()[0]) !== JSON.stringify(CFG.HEADERS)) throw new Error('schema');
      const data = sheet.getLastRow() > 1 ? sheet.getRange(2,1,sheet.getLastRow()-1,12).getValues() : [];
      const now = new Date();
      const day = Utilities.formatDate(now,CFG.TZ,'yyyy-MM-dd');
      const marker = 'request:' + input.requestId;
      // Durable retry identity in the existing Notes column, serialized by lock.
      const previous = data.find(row => String(row[10]).split(' | ').includes(marker));
      if (previous) return respond_('duplicate', String(previous[0]));
      const same = data.filter(row => normalizePhone_(String(row[5])) === input.phone);
      if (same.filter(row => row[1] instanceof Date && Utilities.formatDate(row[1],CFG.TZ,'yyyy-MM-dd') === day).length >= CFG.MAX_PER_PHONE_DAY) return respond_('rate-limited');
      const possibleDuplicate = same.some(row => String(row[3]) === input.interestedClass);
      const id = 'HM-E-' + Utilities.formatDate(now,CFG.TZ,'yyyyMMdd') + '-' + Utilities.getUuid().toUpperCase();
      const note = [input.enquiryType, marker, input.visitDate ? 'Preferred visit: '+input.visitDate : '', input.message, possibleDuplicate ? 'Possible duplicate phone/class' : ''].filter(Boolean).join(' | ');
      const safe = v => /^[\s\u0000-\u001f]*[=+@-]/.test(v) ? "'" + v : v;
      sheet.appendRow([id,now,safe(input.child),input.interestedClass,safe(input.parent),input.phone,'Website','New','','',safe(note),'']);
      SpreadsheetApp.flush();
      return respond_('accepted', id);
    } finally { lock.releaseLock(); }
  } catch (_) {
    console.error('Admissions intake failed'); // Never log request bodies, tokens or PII.
    return respond_('error');
  }
}
function normalizePhone_(v) {
  let phone = v.replace(/[\s()+-]/g,'');
  if (/^91[6-9]\d{9}$/.test(phone)) phone = phone.slice(2);
  return phone;
}
function validate_(p) {
  const limits = {parent:120,phone:20,child:120,interestedClass:30,enquiryType:30,message:1500,visitDate:10,requestId:36};
  const v = {};
  for (const k of Object.keys(limits)) {
    if (p[k] !== undefined && typeof p[k] !== 'string') return null;
    v[k] = (p[k] || '').trim();
    if (v[k].length > limits[k] || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v[k])) return null;
  }
  v.phone = normalizePhone_(v.phone);
  if (!v.parent || !/^[6-9]\d{9}$/.test(v.phone) || !CFG.TYPES.includes(v.enquiryType) ||
      (v.interestedClass && !CFG.CLASSES.includes(v.interestedClass)) ||
      (v.enquiryType === 'admissions' && !v.interestedClass) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v.requestId)) return null;
  if (v.visitDate) {
    const date = new Date(v.visitDate+'T00:00:00Z');
    if (v.enquiryType !== 'campus-visit' || !/^\d{4}-\d{2}-\d{2}$/.test(v.visitDate) ||
        isNaN(date.getTime()) || date.toISOString().slice(0,10) !== v.visitDate ||
        v.visitDate < Utilities.formatDate(new Date(),CFG.TZ,'yyyy-MM-dd')) return null;
  }
  // Prevent forged request markers in untrusted text from becoming retry keys.
  if ([v.parent,v.child,v.message].some(s => s.includes('request:'))) return null;
  return v;
}
function verifyTurnstile_(token, origin) {
  const props = PropertiesService.getScriptProperties();
  const secret = props.getProperty('TURNSTILE_SECRET');
  const origins = (props.getProperty('ALLOWED_ORIGINS') || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!secret || typeof token !== 'string' || !token || token.length > 2048 || !origins.includes(origin)) return false;
  const response = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method:'post',payload:{secret,response:token},muteHttpExceptions:true
  });
  if (response.getResponseCode() !== 200) return false;
  const result = JSON.parse(response.getContentText());
  return result.success === true && origin === 'https://' + result.hostname && result.action === 'admissions';
}
function respond_(status, id) {
  return ContentService.createTextOutput(JSON.stringify({status, ...(id ? {id} : {})})).setMimeType(ContentService.MimeType.JSON);
}

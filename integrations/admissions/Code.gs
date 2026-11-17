/**
 * HAPPY Minds — website enquiry intake (Google Apps Script).
 * Bind this project to the Admissions Tracker spreadsheet.
 * Deployment: Execute as owner; access Anyone (public endpoint).
 * REQUIRE Cloudflare Turnstile server-side verification before accepting PII.
 * Configure Script Properties: TURNSTILE_SECRET.
 * Never put the secret in website source.
 */
const CFG = Object.freeze({
  SHEET: 'Enquiries',
  TYPES: ['general','admissions','campus-visit','parent-community'],
  CLASSES: ['Play School','Nursery','PP1 (LKG)','PP2 (UKG)','Class 1','Class 2','Class 3','Class 4','Class 5','Classes 2–5'],
  MAX_PER_PHONE_DAY: 4,
});
function doPost(e) {
  try {
    const p = e && e.parameter || {};
    const token = String(p.turnstileToken || '');
    if (!verifyTurnstile_(token)) return respond_('rejected');
    const clean = k => String(p[k] || '').trim().slice(0,500);
    const parent = clean('parent').slice(0,100);
    const phone = clean('phone').replace(/[\\s()+-]/g,'');
    const child = clean('child').slice(0,100);
    const interested = clean('interestedClass');
    const type = clean('enquiryType');
    const message = clean('message').slice(0,500);
    const visit = clean('visitDate');
    if (!parent || !/^[6-9]\\d{9}$/.test(phone) ||
        !CFG.TYPES.includes(type) ||
        (interested && !CFG.CLASSES.includes(interested)) ||
        (type === 'admissions' && !interested) ||
        (visit && !/^\\d{4}-\\d{2}-\\d{2}$/.test(visit))) return respond_('invalid');
    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CFG.SHEET);
      if (!sheet) throw new Error('Enquiries sheet missing');
      const now = new Date();
      const tz = Session.getScriptTimeZone();
      const day = Utilities.formatDate(now,tz,'yyyy-MM-dd');
      const data = sheet.getLastRow()>1 ? sheet.getRange(2,1,sheet.getLastRow()-1,11).getValues() : [];
      const same = data.filter(row => String(row[5]).replace(/\\D/g,'') === phone &&
        row[1] instanceof Date && Utilities.formatDate(row[1],tz,'yyyy-MM-dd') === day);
      if (same.length >= CFG.MAX_PER_PHONE_DAY) return respond_('rate-limited');
      const duplicate = data.some(row => String(row[5]).replace(/\\D/g,'') === phone &&
        String(row[3]).toLowerCase() === interested.toLowerCase());
      const id = 'HM-E-' + Utilities.formatDate(now,tz,'yyyyMMdd') + '-' + Utilities.getUuid().slice(0,8).toUpperCase();
      // Spreadsheet formula injection protection for all untrusted text.
      const safe = v => /^[=+@-]/.test(v) ? "'" + v : v;
      const note = [type, visit ? 'Preferred visit: '+visit : '', message, duplicate?'Possible duplicate phone/class':''].filter(Boolean).join(' | ');
      sheet.appendRow([id,now,safe(child),safe(interested),safe(parent),phone,'Website','New','', '',safe(note),'']);
      return respond_('accepted');
    } finally {lock.releaseLock();}
  } catch(err) {
    console.error('Enquiry processing failed',String(err));
    return respond_('error');
  }
}
function verifyTurnstile_(token) {
  const secret=PropertiesService.getScriptProperties().getProperty('TURNSTILE_SECRET');
  if(!secret || !token || token.length>2048) return false;
  const response=UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
    method:'post',payload:{secret,response:token},muteHttpExceptions:true
  });
  if(response.getResponseCode()!==200) return false;
  const result=JSON.parse(response.getContentText());
  return result.success === true && (!result.hostname || result.hostname === 'happymindsschool.in' || result.hostname === 'www.happymindsschool.in');
}
function respond_(status) {
  return ContentService.createTextOutput(JSON.stringify({status}))
    .setMimeType(ContentService.MimeType.JSON);
}

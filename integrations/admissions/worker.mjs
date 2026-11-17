// Staging proxy: browser receives a readable receipt only after Apps Script flushes.
const reply = (status, code, headers = {}, id) => Response.json({status, ...(id ? {id} : {})}, {status:code,headers:{'Cache-Control':'no-store',...headers}});
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim());
    if (!origin || !allowed.includes(origin)) return reply('rejected',403);
    const headers = {'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
    if (new URL(request.url).pathname !== '/api/enquiries') return reply('not-found',404,headers);
    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers});
    if (request.method !== 'POST') return reply('method-not-allowed',405,headers);
    if (!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type') || '')) return reply('invalid',400,headers);
    if (!env.INTAKE_SECRET || env.INTAKE_SECRET.length < 32 || !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(env.APPS_SCRIPT_URL || '')) return reply('unavailable',503,headers);
    try {
      // Bound streaming reads too; Content-Length is not trusted.
      const reader = request.body?.getReader();
      if (!reader) return reply('invalid',400,headers);
      const chunks = []; let size = 0;
      while (true) {
        const {value,done} = await reader.read(); if (done) break;
        size += value.length;
        if (size > 12000) { await reader.cancel(); return reply('invalid',413,headers); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.length; }
      const input = JSON.parse(new TextDecoder().decode(bytes));
      if (!input || typeof input !== 'object' || Array.isArray(input)) return reply('invalid',400,headers);
      const fields = ['parent','phone','child','interestedClass','enquiryType','message','visitDate','requestId','turnstileToken'];
      if (Object.keys(input).some(k => !fields.includes(k)) || Object.values(input).some(v => typeof v !== 'string')) return reply('invalid',400,headers);
      const payload = new URLSearchParams({...input,origin,intakeSecret:env.INTAKE_SECRET});
      const response = await fetch(env.APPS_SCRIPT_URL,{method:'POST',body:payload,redirect:'follow',signal:AbortSignal.timeout(25000)});
      if (!response.ok) return reply('unavailable',502,headers);
      const receipt = await response.json();
      if (['accepted','duplicate'].includes(receipt.status) && /^HM-E-\d{8}-[0-9A-F-]{36}$/.test(receipt.id)) return reply(receipt.status,200,headers,receipt.id);
      const codes = {invalid:400,rejected:403,'rate-limited':429,busy:503,error:502};
      return reply(receipt.status in codes ? receipt.status : 'unavailable',codes[receipt.status] || 502,headers);
    } catch (_) { return reply('unavailable',502,headers); }
  }
};

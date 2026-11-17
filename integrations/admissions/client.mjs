// Not loaded by production. A retry must retain requestId and use a fresh token.
export async function sendEnquiry(endpoint, fields, token, requestId) {
  if (!requestId || !token) throw new Error('Verification and request ID are required.');
  const response = await fetch(endpoint, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({...fields,requestId,turnstileToken:token}),
    signal:AbortSignal.timeout(30000)
  });
  const receipt = await response.json();
  if (!response.ok || !['accepted','duplicate'].includes(receipt.status) || !/^HM-E-\d{8}-[0-9A-F-]{36}$/.test(receipt.id || '')) {
    throw new Error(receipt.status === 'rate-limited' ? 'Please contact the school to follow up.' : 'Receipt not confirmed. Keep your details and retry with fresh verification.');
  }
  return receipt;
}

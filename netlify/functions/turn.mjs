// Anahtarlar Netlify > Site configuration > Environment variables bölümünden okunur.
const MAX = 500;
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json' } });
const keyOf = { anthropic: 'ANTHROPIC_API_KEY', openai: 'OPENAI_API_KEY', gemini: 'GEMINI_API_KEY' };
const call = {
  anthropic: async (q, e) => (await (await fetch('https://api.anthropic.com/v1/messages', { method: 'POST',
    headers: { 'x-api-key': e.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: e.ANTHROPIC_MODEL || 'claude-sonnet-5-5', max_tokens: MAX, messages: [{ role: 'user', content: q }] }) })).json()).content?.[0]?.text,
  openai: async (q, e) => (await (await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST',
    headers: { authorization: 'Bearer ' + e.OPENAI_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ model: e.OPENAI_MODEL || 'gpt-5.6-luna', max_completion_tokens: MAX, messages: [{ role: 'user', content: q }] }) })).json()).choices?.[0]?.message?.content,
  gemini: async (q, e) => (await (await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${e.GEMINI_MODEL || 'gemini-flash-latest'}:generateContent`, { method: 'POST',
    headers: { 'x-goog-api-key': e.GEMINI_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: q }] }], generationConfig: { maxOutputTokens: MAX } }) })).json()).candidates?.[0]?.content?.parts?.[0]?.text,
};
export default async (req, _ctx, env = process.env) => {
  if (req.method !== 'POST') return J({ error: 'method' }, 405);
  // Giriş kodu tanımlı değilse fonksiyon çalışmaz: anahtarlar açıkta harcanmasın.
  if (!env.ACCESS_CODE) return J({ error: 'no_access_code_configured' }, 503);
  if (req.headers.get('x-access-code') !== env.ACCESS_CODE) return J({ error: 'unauthorized' }, 401);
  try {
    const raw = await req.text(); if (raw.length > 20000) return J({ error: 'too_large' }, 413);
    const { provider, prompt } = JSON.parse(raw);
    if (!call[provider] || typeof prompt !== 'string') return J({ error: 'bad_request' }, 400);
    // İstenen sağlayıcının anahtarı yoksa, anahtarı olan ilk sağlayıcıya geçilir.
    const use = env[keyOf[provider]] ? provider : Object.keys(keyOf).find(k => env[keyOf[k]]);
    if (!use) return J({ error: 'no_key_' + provider }, 503);
    const text = await call[use](prompt, env);
    return text ? J({ text }) : J({ error: 'empty_response' }, 502);
  } catch { return J({ error: 'server_error' }, 500); }
};
export const config = { path: '/api/turn' };

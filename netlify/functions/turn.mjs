const MAX = 800;
const J = (o, s = 200) =>
  new Response(JSON.stringify(o), {
    status: s,
    headers: { "content-type": "application/json" }
  });

const keyOf = {
  anthropic: "CREW_ANTHROPIC_KEY",
  openai: "CREW_OPENAI_KEY",
  gemini: "CREW_GEMINI_KEY"
};

const post = async (url, headers, body) => {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body)
  });
  return r.json();
};

const need = (t, d) => {
  if (!t) throw new Error(d?.error?.message || JSON.stringify(d).slice(0, 120) || "bos cevap");
  return t;
};

const call = {
  anthropic: async (q, e, mx) => {
    const d = await post(
      "https://api.anthropic.com/v1/messages",
      {
        "x-api-key": e.CREW_ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01"
      },
      {
        model: e.ANTHROPIC_MODEL || "claude-sonnet-5-5",
        max_tokens: mx || MAX,
        messages: [{ role: "user", content: q }]
      }
    );
    return need(d.content?.[0]?.text, d);
  },

  openai: async (q, e, mx) => {
    const d = await post(
      "https://api.openai.com/v1/chat/completions",
      { authorization: "Bearer " + e.CREW_OPENAI_KEY },
      {
        model: e.OPENAI_MODEL || "gpt-5.6-luna",
        max_completion_tokens: (mx || 2048) + 3000,
        messages: [{ role: "user", content: q }]
      }
    );
    return need(d.choices?.[0]?.message?.content, d);
  },

  gemini: async (q, e, mx) => {
    const models = [
      e.GEMINI_MODEL || "gemini-flash-latest",
      ...(e.GEMINI_FALLBACK || "gemini-flash-lite-latest,gemini-2.5-flash")
        .split(",")
    ].map(x => x.trim()).filter(Boolean);

    let last = "bos";
    for (const m of models) {
      const d = await post(
        `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`,
        { "x-goog-api-key": e.CREW_GEMINI_KEY },
        {
          contents: [{ parts: [{ text: q }] }],
          generationConfig: { maxOutputTokens: (mx || 2048) + 2000 }
        }
      );

      const t = (d.candidates?.[0]?.content?.parts || [])
        .map(p => p.text || "")
        .join("");

      if (t) return t;

      last =
        d.error?.message ||
        "finish=" +
          (d.candidates?.[0]?.finishReason ||
            d.promptFeedback?.blockReason ||
            "bos");

      if (
        !/demand|overload|unavailable|quota|exhausted|not found|not supported|try again/i.test(
          last
        )
      )
        break;
    }

    throw new Error(last);
  }
};

export default async (req, _ctx, env = process.env) => {
  if (req.method === "GET")
    return J({
      version: 9,
      access_code: !!env.ACCESS_CODE,
      providers: Object.fromEntries(
        Object.entries(keyOf).map(([k, v]) => [k, !!env[v]])
      ),
      mesh_enabled: !!env.MESHY_API_KEY
    });

  if (req.method !== "POST") return J({ error: "method" }, 405);
  if (!env.ACCESS_CODE) return J({ error: "no_access_code_configured" }, 503);
  if (req.headers.get("x-access-code") !== env.ACCESS_CODE)
    return J({ error: "unauthorized" }, 401);

  try {
    const raw = await req.text();
    if (raw.length > 80000) return J({ error: "too_large" }, 413);

    const { provider, prompt, max } = JSON.parse(raw);
    const mx = Math.min(Math.max(+max || 0, 0), 16000);

    if (!call[provider] || typeof prompt !== "string")
      return J({ error: "bad_request" }, 400);

    const use =
      env[keyOf[provider]]
        ? provider
        : Object.keys(keyOf).find(k => env[keyOf[k]]);

    if (!use) return J({ error: "no_key_" + provider }, 503);

    return J({ text: await call[use](prompt, env, mx) });
  } catch (err) {
    return J({ error: "hata: " + String(err.message).slice(0, 250) }, 500);
  }
};

export const config = { path: "/api/turn" };

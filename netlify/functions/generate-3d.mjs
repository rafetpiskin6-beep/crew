const J = (o, s = 200) =>
  new Response(JSON.stringify(o), {
    status: s,
    headers: { "content-type": "application/json" }
  });

const headers = key => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${key}`
});

export default async (req, _ctx, env = process.env) => {
  if (req.method === "GET") {
    return J({
      ok: true,
      provider: "meshy",
      configured: !!env.MESHY_API_KEY
    });
  }

  if (req.method !== "POST") return J({ error: "method" }, 405);
  if (!env.ACCESS_CODE) return J({ error: "no_access_code_configured" }, 503);

  if (req.headers.get("x-access-code") !== env.ACCESS_CODE)
    return J({ error: "unauthorized" }, 401);

  if (!env.MESHY_API_KEY)
    return J({
      error: "MESHY_API_KEY eksik. Netlify Environment Variables'a ekleyin."
    }, 503);

  try {
    const body = await req.json();
    const prompt = String(body.prompt || "").trim();

    if (!prompt) return J({ error: "prompt_required" }, 400);

    const payload = {
      mode: "preview",
      prompt,
      ai_model: body.ai_model || "latest",
      topology: body.topology || "triangle",
      target_polycount: Math.min(Math.max(Number(body.polycount) || 10000, 1000), 30000
      ),
      should_remesh: true,
      enable_pbr: true
    };

    const r = await fetch("https://api.meshy.ai/openapi/v2/text-to-3d", {
      method: "POST",
      headers: headers(env.MESHY_API_KEY),
      body: JSON.stringify(payload)
    });

    const data = await r.json();

    if (!r.ok) {
      return J({
        error: data?.message || data?.error || "3D generation request failed",
        provider_response: data
      }, r.status);
    }

    return J({
      ok: true,
      provider: "meshy",
      taskId: data.result || data.id || data.task_id,
      raw: data
    }, 201);
  } catch (err) {
    return J({ error: String(err.message).slice(0, 500) }, 500);
  }
};

export const config = { path: "/api/generate-3d" };

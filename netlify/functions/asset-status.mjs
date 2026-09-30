const J = (o, s = 200) =>
  new Response(JSON.stringify(o), {
    status: s,
    headers: { "content-type": "application/json" }
  });

export default async (req, _ctx, env = process.env) => {
  if (req.method !== "GET") return J({ error: "method" }, 405);
  if (!env.ACCESS_CODE) return J({ error: "no_access_code_configured" }, 503);

  if (req.headers.get("x-access-code") !== env.ACCESS_CODE)
    return J({ error: "unauthorized" }, 401);

  if (!env.MESHY_API_KEY)
    return J({ error: "MESHY_API_KEY eksik" }, 503);

  const url = new URL(req.url);
  const taskId = url.searchParams.get("taskId");

  if (!taskId) return J({ error: "taskId_required" }, 400);

  try {
    const r = await fetch(
      `https://api.meshy.ai/openapi/v2/text-to-3d/${encodeURIComponent(taskId)}`,
      {
        headers: {
          Authorization: `Bearer ${env.MESHY_API_KEY}`
        }
      }
    );

    const data = await r.json();

    if (!r.ok)
      return J({
        error: data?.message || "status request failed",
        provider_response: data
      }, r.status);

    const modelUrl =
      data?.model_urls?.glb ||
      data?.model_url ||
      data?.result?.model_urls?.glb ||
      null;

    return J({
      ok: true,
      status: data.status || data.state || "UNKNOWN",
      progress: data.progress ?? null,
      modelUrl,
      thumbnailUrl: data.thumbnail_url || data.thumbnailUrl || null,
      raw: data
    });
  } catch (err) {
    return J({ error: String(err.message).slice(0, 500) }, 500);
  }
};

export const config = { path: "/api/asset-status" };

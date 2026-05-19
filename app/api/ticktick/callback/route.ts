import { NextRequest } from "next/server";

const TICKTICK_TOKEN_URL = "https://ticktick.com/oauth/token";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return new Response("Missing code parameter", { status: 400 });
  }

  const clientId = process.env.TICKTICK_CLIENT_ID;
  const clientSecret = process.env.TICKTICK_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return new Response("TICKTICK_CLIENT_ID or TICKTICK_CLIENT_SECRET not set", { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/ticktick/callback`;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(TICKTICK_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }).toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    return new Response(`Token exchange failed: ${res.status} ${text}`, { status: 500 });
  }

  const data = (await res.json()) as { access_token?: string; refresh_token?: string };

  const html = `<!DOCTYPE html>
<html lang="en">
<head><title>TickTick Setup — Conduit</title>
<style>
  body { font-family: monospace; background: #0d0d14; color: #e2e8f0; padding: 2rem; }
  .box { background: #1a1a2e; border: 1px solid #ffffff1a; border-radius: 12px; padding: 1.5rem; max-width: 600px; }
  .label { color: #818cf8; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; }
  .token { word-break: break-all; color: #34d399; margin-top: 0.5rem; }
  p { color: #94a3b8; }
</style>
</head>
<body>
<div class="box">
  <h1>TickTick Connected</h1>
  <p>Copy the access token below and add it to your <code>.env.local</code> as <code>TICKTICK_ACCESS_TOKEN</code>.</p>
  <div class="label">Access Token</div>
  <div class="token">${data.access_token ?? "(not returned)"}</div>
  ${data.refresh_token ? `<div class="label" style="margin-top:1rem">Refresh Token</div><div class="token">${data.refresh_token}</div>` : ""}
  <p style="margin-top:1.5rem">After adding the token to <code>.env.local</code>, restart the server and close this tab.</p>
</div>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}

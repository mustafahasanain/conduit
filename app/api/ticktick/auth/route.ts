import { NextRequest, NextResponse } from "next/server";

const TICKTICK_AUTH_URL = "https://ticktick.com/oauth/authorize";

export function GET(request: NextRequest) {
  const clientId = process.env.TICKTICK_CLIENT_ID;
  if (!clientId) {
    return new Response("TICKTICK_CLIENT_ID is not set", { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/ticktick/callback`;

  const url = new URL(TICKTICK_AUTH_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", "tasks:write tasks:read");
  url.searchParams.set("state", "conduit");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");

  return NextResponse.redirect(url.toString());
}

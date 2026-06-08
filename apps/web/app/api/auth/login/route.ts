import { NextResponse } from "next/server";
import { createStudioSessionToken, studioOwnerEmail, studioSessionCookie, verifyStudioCredentials } from "@/lib/studio-auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  const email = body?.email?.trim() || studioOwnerEmail();
  const password = body?.password || "";

  if (!verifyStudioCredentials(email, password)) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const token = createStudioSessionToken(email);
  const response = NextResponse.json({ ok: true, token, email });
  const session = studioSessionCookie();
  response.cookies.set(session.name, token, session.options);
  return response;
}

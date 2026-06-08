import { NextResponse } from "next/server";
import { studioSessionCookie } from "@/lib/studio-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  const session = studioSessionCookie();
  response.cookies.set(session.name, "", {
    ...session.options,
    maxAge: 0
  });
  return response;
}

import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "endless-studio-session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

interface StudioSessionPayload {
  email: string;
  exp: number;
}

function ownerEmail() {
  return process.env.STUDIO_OWNER_EMAIL?.trim() || "owner@endless.local";
}

function ownerPassword() {
  return process.env.STUDIO_OWNER_PASSWORD?.trim() || "";
}

function configuredSessionSecret() {
  const secret = process.env.STUDIO_SESSION_SECRET?.trim() || "";
  const insecurePlaceholders = new Set(["change-me", "replace-with-at-least-32-random-characters"]);
  return secret.length >= 32 && !insecurePlaceholders.has(secret) ? secret : "";
}

function sessionSecret() {
  return configuredSessionSecret() || ownerPassword();
}

export function isStudioAuthEnabled() {
  return Boolean(ownerPassword() && sessionSecret());
}

function sign(payload: string) {
  return crypto.createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

function encode(payload: StudioSessionPayload) {
  const raw = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${raw}.${sign(raw)}`;
}

function decode(token: string | undefined): StudioSessionPayload | null {
  if (!token) {
    return null;
  }

  const [raw, signature] = token.split(".");
  if (!raw || !signature || sign(raw) !== signature) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as StudioSessionPayload;
    if (payload.exp <= Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function getStudioSession() {
  if (!isStudioAuthEnabled()) {
    return null;
  }

  const token = cookies().get(SESSION_COOKIE)?.value ?? bearerToken();
  const payload = decode(token);

  if (!payload) {
    return null;
  }

  return {
    email: payload.email,
    protected: true
  };
}

export async function requireStudioPageSession() {
  const session = await getStudioSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function assertStudioApiSession() {
  const session = await getStudioSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export function verifyStudioCredentials(email: string, password: string) {
  if (!isStudioAuthEnabled()) {
    return false;
  }

  return email.trim() === ownerEmail() && password === ownerPassword();
}

export function createStudioSessionToken(email: string) {
  return encode({
    email,
    exp: Date.now() + SESSION_TTL_MS
  });
}

export function studioSessionCookie() {
  return {
    name: SESSION_COOKIE,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_TTL_MS / 1000
    }
  };
}

export function studioOwnerEmail() {
  return ownerEmail();
}

function bearerToken() {
  const authorization = headers().get("authorization") ?? "";
  const [scheme, token] = authorization.split(/\s+/, 2);
  return scheme?.toLowerCase() === "bearer" ? token : undefined;
}

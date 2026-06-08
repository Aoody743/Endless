"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({ defaultEmail }: { defaultEmail: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Login failed.");
      }

      router.push("/studio");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <label className="grid gap-1.5 text-sm">
        <span className="text-muted">Email</span>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          autoComplete="username"
          className="rounded-xs border border-border bg-surface px-3 py-2 outline-none"
        />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="text-muted">Password</span>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          autoComplete="current-password"
          className="rounded-xs border border-border bg-surface px-3 py-2 outline-none"
        />
      </label>
      {error ? <p className="text-sm text-[color:var(--accent)]">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="rounded-xs bg-foreground px-4 py-2.5 text-sm text-background transition hover:opacity-[.86] disabled:cursor-wait disabled:opacity-70"
      >
        {busy ? "Opening…" : "Enter Studio"}
      </button>
    </form>
  );
}

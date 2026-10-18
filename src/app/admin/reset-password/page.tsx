"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type ResetStep = "loading" | "request" | "password" | "done";

export default function ResetPasswordPage() {
  const initialized = useRef(false);
  const [step, setStep] = useState<ResetStep>("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const code = new URLSearchParams(window.location.search).get("code");
    const params = new URLSearchParams(window.location.hash.slice(1));
    window.history.replaceState(null, "", window.location.pathname);
    if (code) {
      createBrowserSupabaseClient().auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) setMessage("This recovery link has expired or was opened in a different browser. Please request a new one.");
        setStep(error ? "request" : "password");
      }).catch(() => {
        setMessage("We couldn't verify this link. Please request a new one.");
        setStep("request");
      });
      return;
    }

    if (params.get("type") !== "recovery") {
      queueMicrotask(() => setStep("request"));
      return;
    }

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (!accessToken || !refreshToken) {
      queueMicrotask(() => {
        setMessage("This recovery link is invalid. Please request a new one.");
        setStep("request");
      });
      return;
    }

    createBrowserSupabaseClient().auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    }).then(({ error }) => {
      if (error) setMessage("This recovery link has expired. Please request a new one.");
      setStep(error ? "request" : "password");
    }).catch(() => {
      setMessage("We couldn't verify this link. Please request a new one.");
      setStep("request");
    });
  }, []);

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const { error } = await createBrowserSupabaseClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });
      setMessage(error ? "We couldn't send a reset link. Please try again." : "If an account exists for that email, you'll receive a reset link shortly.");
    } catch {
      setMessage("We couldn't send a reset link. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords don't match.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage(error.message);
        return;
      }
      await supabase.auth.signOut();
      setStep("done");
      setMessage("Password updated. You can now sign in.");
    } catch {
      setMessage("We couldn't update your password. Please request a new link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-xl font-semibold">Reset your password</h1>
        <p className="mt-1 text-sm text-black/60">
          {step === "password" ? "Choose a new password for your admin account." : "Request a new link to your admin email address."}
        </p>
      </div>

      {step === "request" && (
        <form onSubmit={requestReset} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Email
            <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="border border-black/20 px-3 py-2" />
          </label>
          <button type="submit" disabled={busy} className="bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={updatePassword} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            New password
            <input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="border border-black/20 px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Confirm password
            <input type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="border border-black/20 px-3 py-2" />
          </label>
          <button type="submit" disabled={busy} className="bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>
      )}

      {message && <p role="status" className="text-sm">{message}</p>}
      {step !== "loading" && <Link href="/admin/login" className="text-sm underline">Back to sign in</Link>}
    </main>
  );
}

"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-xl font-semibold">3DCRAFTS admin</h1>
        <p className="mt-1 text-sm text-black/60">Sign in with your admin account.</p>
      </div>
      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input name="email" type="email" required autoComplete="email" className="border border-black/20 px-3 py-2 outline-none focus:border-black" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input name="password" type="password" required autoComplete="current-password" className="border border-black/20 px-3 py-2 outline-none focus:border-black" />
        </label>
        {state.error && (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}
        <button type="submit" disabled={pending} className="bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}

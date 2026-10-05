import Link from "next/link";
import { redirect } from "next/navigation";

import { loginAction } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const errorMessage =
    params.error === "invalid-credentials"
      ? "Invalid email or password."
      : params.error === "missing-fields"
        ? "Please enter both email and password."
        : "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-600">SRO</div>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Workforce Login</h1>
        </div>

        <form action={loginAction} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="email">
              Email / Username
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              placeholder="owner@sro.com"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-base outline-none transition focus:border-sky-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-base outline-none transition focus:border-sky-500 focus:bg-white"
            />
          </div>

          {errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-xl bg-sky-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-sky-500"
          >
            Sign in
          </button>
        </form>

        <div className="mt-6 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
          Demo owner: <span className="font-semibold">owner@sro.com</span> / <span className="font-semibold">Sro@12345</span>
        </div>

        <div className="mt-6 text-center text-sm text-slate-600">
          Need a secure workflow? <Link href="/" className="font-semibold text-sky-700">Go home</Link>
        </div>
      </div>
    </main>
  );
}

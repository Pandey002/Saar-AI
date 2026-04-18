"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Loader2, Mail, Lock, Chrome } from "lucide-react";
import { GrandLogo } from "@/components/brand/Logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // 1. Check for errors in the Query String (?)
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");
    if (urlError) {
      setError(decodeURIComponent(urlError));
    }

    // 2. Check for errors in the URL Fragment (#)
    // This is where Supabase sends detailed handshake errors
    const hash = window.location.hash;
    if (hash && hash.includes("error_description")) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const description = hashParams.get("error_description");
      if (description) {
        setError(decodeURIComponent(description).replace(/\+/g, " "));
      }
    }

    // 3. Auto-redirect if already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const params = new URLSearchParams(window.location.search);
        const redirectTo = params.get("redirectTo") || "/dashboard";
        window.location.href = redirectTo;
      }
    };
    checkSession();
  }, [supabase.auth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("redirectTo") || "/dashboard";
      window.location.href = redirectTo;
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get("redirectTo") || "/dashboard";
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-12">
      <div className="w-full max-w-[420px]">
        {/* Brand/Logo */}
        <div className="mb-10 text-center">
          <Link href="/" className="inline-flex items-center justify-center">
            <GrandLogo size={36} />
          </Link>
          <p className="mt-4 text-[15px] text-muted font-medium">Your academic sanctuary powered by AI.</p>
        </div>

        {/* Login Card */}
        <div className="rounded-[28px] border border-line bg-white p-8 shadow-card sm:p-10">
          <h1 className="text-2xl font-bold tracking-tight text-ink">Welcome back</h1>
          <p className="mt-2 text-sm text-muted">Sign in to continue your deep work session.</p>

          <div className="mt-8 space-y-4">
            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-[15px] font-semibold text-ink transition-all hover:bg-canvas active:scale-[0.98]"
            >
              <Chrome className="h-5 w-5 text-ink" />
              Continue with Google
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-line"></div>
              </div>
              <div className="relative flex justify-center text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
                <span className="bg-white px-4">Or use email</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-ink" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-line bg-canvas/30 py-3 pl-11 pr-4 text-[15px] outline-none transition-all placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-bold text-ink" htmlFor="password">
                    Password
                  </label>
                  <Link href="/forgot-password" title="Coming soon" className="text-[12px] font-semibold text-primary hover:underline">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
                  <input
                    id="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-line bg-canvas/30 py-3 pl-11 pr-4 text-[15px] outline-none transition-all placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/5"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-danger/5 px-4 py-3 text-sm font-medium text-danger">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-[16px] font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-emerald/90 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4.5 w-4.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="text-sm text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-bold text-primary hover:underline">
              Create an account
            </Link>
          </p>
          <Link href="/dashboard" className="text-[13px] font-medium text-muted/80 hover:text-primary hover:underline">
            Skip for now →
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/brand/Logo";
import { GraduationCap, ArrowRight, Loader2, Mail, Lock, UserPlus, CheckCircle, RefreshCcw } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email,
    });
    if (error) {
      setError(error.message);
    } else {
      alert("Verification email resent!");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-12">
        <div className="w-full max-w-[420px] rounded-[28px] border border-line bg-white p-8 text-center shadow-card sm:p-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald/10 text-emerald">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Check your email</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            We&apos;ve sent a verification link to <span className="font-bold text-ink">{email}</span>. 
            Please verify your account before continuing.
          </p>
          
          <div className="mt-8 space-y-3">
            <button
              onClick={handleResendEmail}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-[14px] font-semibold text-ink transition hover:bg-canvas"
            >
              <RefreshCcw className="h-4 w-4" />
              Resend verification email
            </button>
            <Link 
              href="/login" 
              className="block w-full rounded-xl bg-primary py-3 text-[14px] font-bold text-white transition hover:bg-emerald/90"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-12">
      <div className="w-full max-w-[420px]">
        {/* Brand/Logo */}
        <div className="mb-10 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 text-2xl font-bold tracking-tight text-primary">
            Sanctum
          </Link>
          <p className="mt-4 text-[15px] text-muted font-medium">Join the academic sanctuary.</p>
        </div>

        {/* Signup Card */}
        <div className="rounded-[28px] border border-line bg-white p-8 shadow-card sm:p-10">
          <h1 className="text-2xl font-bold tracking-tight text-ink">Create account</h1>
          <p className="mt-2 text-sm text-muted">Start your journey with structured intelligence.</p>

          <form onSubmit={handleSignup} className="mt-8 space-y-5">
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
              <label className="text-[13px] font-bold text-ink" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-line bg-canvas/30 py-3 pl-11 pr-4 text-[15px] outline-none transition-all placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-ink" htmlFor="confirm-password">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
                <input
                  id="confirm-password"
                  type="password"
                  required
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  <UserPlus className="h-4.5 w-4.5" />
                  Create Account
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="mt-8 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-primary hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

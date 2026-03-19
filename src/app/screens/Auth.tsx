import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../lib/auth";
import { supabase } from "../services/supabase";

export function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/";
  const authReady = Boolean(supabase);

  return (
    <AppShell>
      <div className="mx-auto flex min-h-screen max-w-[476px] items-center py-10">
        <div className="w-full rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2f66f5]">HVAC Quote AI</p>
          <h1 className="mt-3 text-[1.9rem] font-semibold tracking-tight text-slate-950">
            {mode === "signin" ? "Sign in" : "Create account"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {mode === "signin"
              ? "Use your technician account to access estimates, pricing options, and proposals."
              : "Create your account to save quotes and keep proposals tied to your business."}
          </p>

          <div className="mt-6 flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium ${
                mode === "signin" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium ${
                mode === "signup" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"
              }`}
            >
              Create account
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 rounded-xl border-slate-300 bg-white shadow-none"
                placeholder="tech@yourcompany.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 rounded-xl border-slate-300 bg-white shadow-none"
                placeholder="Minimum 6 characters"
              />
            </div>
          </div>

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
          {!authReady ? (
            <p className="mt-4 text-sm text-amber-700">
              Supabase keys are missing. Add your project URL and publishable key to `.env.local`.
            </p>
          ) : null}

          <Button
            disabled={loading || !authReady || !email || password.length < 6}
            className="mt-6 h-12 w-full rounded-xl bg-[#2f66f5] text-white hover:bg-[#2458df] disabled:bg-slate-200"
            onClick={async () => {
              setLoading(true);
              setError("");
              setMessage("");

              try {
                if (mode === "signin") {
                  await signIn(email, password);
                  navigate(redirectTo, { replace: true });
                } else {
                  await signUp(email, password);
                  setMessage("Account created. Check your email if Supabase requires confirmation, then sign in.");
                  setMode("signin");
                }
              } catch (authError) {
                const nextError =
                  authError instanceof Error ? authError.message : "Authentication failed.";
                setError(nextError);
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

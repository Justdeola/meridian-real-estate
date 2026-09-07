import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { authClient, authEnabled, GROK_PROVIDERS, signIn } from "@/lib/auth/client";
import { HERO_IMAGE } from "@/lib/constants";
export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({ meta: [{ title: "Sign in · Meridian" }] }),
});
function Login() {
  const [mode, setMode] = useState("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "up") {
        const res = await authClient.signUp.email({ name, email, password, callbackURL: "/" });
        if (res.error) throw new Error(res.error.message || "Could not create account");
      } else {
        const res = await authClient.signIn.email({ email, password, callbackURL: "/" });
        if (res.error) throw new Error(res.error.message || "Could not sign in");
      }
      window.location.assign("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
      setLoading(false);
    }
  }
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-ink/45" />
        <div className="relative flex h-full flex-col justify-end p-12 text-accent-fg">
          <Link to="/" className="font-display text-3xl tracking-[0.18em]">
            MERIDIAN
          </Link>
          <p className="mt-4 max-w-sm text-sm text-accent-fg/80">
            A private entrance to your enquiries, viewings, and saved residences.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 block font-display text-3xl tracking-[0.18em] lg:hidden">
            MERIDIAN
          </Link>
          <h1 className="font-display text-4xl">
            {mode === "in" ? "Welcome back" : "Create an account"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {mode === "in"
              ? "Sign in to manage saved homes and viewings."
              : "Join as a client. You can register as an agent from your dashboard."}
          </p>

          {authEnabled ? (
            <div className="mt-8 space-y-3">
              {GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                >
                  Continue with {p.label}
                </Button>
              ))}
              <p className="py-2 text-center text-xs uppercase tracking-[0.16em] text-subtle">
                or with email
              </p>
              <form className="space-y-3" onSubmit={onSubmit}>
                {mode === "up" ? (
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                ) : null}
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" loading={loading}>
                  {mode === "in" ? "Sign in" : "Create account"}
                </Button>
              </form>
              <button
                type="button"
                className="w-full pt-2 text-sm text-muted hover:text-ink"
                onClick={() => setMode(mode === "in" ? "up" : "in")}
              >
                {mode === "in" ? "Need an account? Register" : "Already registered? Sign in"}
              </button>
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">Sign-in is disabled.</p>
          )}
        </div>
      </div>
    </main>
  );
}

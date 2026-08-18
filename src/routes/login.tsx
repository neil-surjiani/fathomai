import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Waves } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in to Fathom" },
      { name: "description", content: "Sign in with Google to build your personalised learning path in Fathom." },
      { property: "og:title", content: "Sign in to Fathom" },
      { property: "og:description", content: "Continue with Google to start learning." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const signIn = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Could not sign in. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="grain flex min-h-screen flex-col items-center justify-center px-5">
      <Link to="/" className="absolute left-5 top-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Back
      </Link>

      <div className="panel w-full max-w-sm p-8 text-center">
        <Waves className="mx-auto size-6 text-primary" strokeWidth={2.2} />
        <h1 className="display mt-5 text-2xl">Welcome to Fathom</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to build your path and keep every note, session and mastery score in one place.
        </p>

        <Button className="mt-7 w-full" size="lg" onClick={signIn} disabled={busy}>
          <GoogleMark />
          {busy ? "Opening Google…" : "Continue with Google"}
        </Button>

        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          We only store what's needed to run your learning path. You can export or delete everything at any time.
        </p>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.35 11.1H12v2.9h5.35c-.25 1.5-1.8 4.4-5.35 4.4A6.4 6.4 0 0 1 12 5.2c1.63 0 2.9.6 3.85 1.5l2.1-2.05A9.3 9.3 0 0 0 12 2a10 10 0 1 0 0 20c5.8 0 9.6-4.05 9.6-9.75 0-.65-.08-1.1-.25-1.15Z"
      />
    </svg>
  );
}

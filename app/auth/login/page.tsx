"use client";

import { createClient } from "@/lib/supabase/client";

export default function Page() {
  const handleSignIn = async () => {
    const supabase = createClient();
    // read optional 'kind' and 'next' from the current URL so callers can
    // indicate whether this is a business or user login, and where to go after.
    const params = new URLSearchParams(location.search ?? "");
    const kind = params.get("kind");
    const next = params.get("next");

    let redirectTo = `${location.origin}/auth/callback`;
    const callbackParams = new URLSearchParams();
    if (kind) callbackParams.set("kind", kind);
    if (next) callbackParams.set("next", next);
    const query = callbackParams.toString();
    if (query) redirectTo = `${redirectTo}?${query}`;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });
  };

  return (
    <div>
      <button type="button" onClick={handleSignIn}>
        Sign in with Google
      </button>
    </div>
  );
}

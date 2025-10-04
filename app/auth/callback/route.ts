import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // determine redirect target and login kind (user or business)
  let next = searchParams.get("next") ?? "/";
  if (!next.startsWith("/")) {
    // if "next" is not a relative URL, use the default
    next = "/";
  }

  // 'kind' can be 'user' or 'business' to indicate which profile to check
  const kind = searchParams.get("kind");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // after exchanging the code, try to determine the logged-in user's id
      // and check whether they have the requested profile.
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && kind) {
          if (kind === "business") {
            const { data: businesses } = await supabase
              .from("business_profiles")
              .select("id")
              .eq("owner_id", user.id)
              .limit(1);
            if (!businesses || businesses.length === 0) {
              next = "/bsignup";
            }
          } else if (kind === "user") {
            const { data: users } = await supabase
              .from("user_profiles")
              .select("user_id")
              .eq("user_id", user.id)
              .limit(1);
            if (!users || users.length === 0) {
              next = "/usignup";
            }
          }
        }
      } catch {
        // if anything goes wrong checking the profile, fall back to provided next
        // (we don't want to block the login)
      }

      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error`);
}

import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    (() => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
      return url;
    })(),
    (() => {
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!key)
        throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set");
      return key;
    })(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // If this is an API/fetch request or a Next internal asset, don't perform a
  // redirect here. Redirecting fetch/XHR/curl calls to the login HTML page
  // causes clients that expect JSON to fail with Parsing/Syntax errors and
  // unexpected 404/HTML responses. Let the API route handlers manage auth
  // responses (they can return 401/403 or handle missing sessions).
  const accept = request.headers.get("accept") ?? "";
  if (
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.startsWith("/v/") ||
    accept.includes("application/json") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    // static files (has extension)
    request.nextUrl.pathname.includes(".")
  ) {
    return supabaseResponse;
  }

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/auth/login",
    "/auth/callback",
    "/auth/error",
    "/user/view", // Anyone can view locations
  ];

  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );

  // If user is not authenticated and trying to access protected routes
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Role-based access control for authenticated users
  if (user) {
    const pathname = request.nextUrl.pathname;

    // Check if user is trying to access business routes
    if (
      pathname.startsWith("/business") &&
      !pathname.startsWith("/business/signup")
    ) {
      // Verify user has a business profile
      const { data: businessProfile } = await supabase
        .from("business_profiles")
        .select("id")
        .eq("owner_id", user.sub)
        .single();

      if (!businessProfile) {
        // User doesn't have a business profile, redirect to home
        const url = request.nextUrl.clone();
        url.pathname = "/";
        url.searchParams.set("kind", "business");
        url.searchParams.set("error", "business_access_denied");
        return NextResponse.redirect(url);
      }
    }

    // Check if user is trying to access user-specific routes (except /user/view and /user/signup)
    if (
      pathname.startsWith("/user") &&
      !pathname.startsWith("/user/view") &&
      !pathname.startsWith("/user/reserve") &&
      !pathname.startsWith("/user/signup")
    ) {
      // Verify user has a user profile
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("user_id")
        .eq("user_id", user.sub)
        .single();

      if (!userProfile) {
        // User doesn't have a user profile, redirect to home
        const url = request.nextUrl.clone();
        url.pathname = "/";
        url.searchParams.set("kind", "user");
        url.searchParams.set("error", "user_access_denied");
        return NextResponse.redirect(url);
      }
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}

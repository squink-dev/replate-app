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

    // Get the active profile kind from cookie
    const profileKindCookie = request.cookies.get("profile_kind")?.value as
      | "user"
      | "business"
      | undefined;

    // Check if user is trying to access business routes
    if (pathname.startsWith("/business")) {
      // Check both profiles
      const [{ data: businessProfile }, { data: userProfile }] =
        await Promise.all([
          supabase
            .from("business_profiles")
            .select("id")
            .eq("owner_id", user.sub)
            .single(),
          supabase
            .from("user_profiles")
            .select("user_id")
            .eq("user_id", user.sub)
            .single(),
        ]);

      if (!businessProfile) {
        // User doesn't have a business profile, redirect to home
        const url = request.nextUrl.clone();
        url.pathname = "/";
        url.searchParams.set("error", "business_access_denied");
        return NextResponse.redirect(url);
      }

      // If user has both profiles but is logged in as user, deny access
      if (businessProfile && userProfile && profileKindCookie === "user") {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        url.searchParams.set(
          "error",
          "business_access_denied_switch_to_business",
        );
        return NextResponse.redirect(url);
      }
    }

    // Check if user is trying to access user-specific routes (except /user/view and /user/signup)
    if (
      pathname.startsWith("/user") &&
      !pathname.startsWith("/user/view") &&
      !pathname.startsWith("/user/signup")
    ) {
      // Get the active profile kind from cookie
      const profileKindCookie = request.cookies.get("profile_kind")?.value as
        | "user"
        | "business"
        | undefined;

      // Check both profiles to determine access
      const [{ data: userProfile }, { data: businessProfile }] =
        await Promise.all([
          supabase
            .from("user_profiles")
            .select("user_id")
            .eq("user_id", user.sub)
            .single(),
          supabase
            .from("business_profiles")
            .select("id")
            .eq("owner_id", user.sub)
            .single(),
        ]);

      console.log("[Middleware] /user route check:", {
        pathname,
        hasUserProfile: !!userProfile,
        hasBusinessProfile: !!businessProfile,
        activeProfileKind: profileKindCookie,
      });

      // If user has a business profile but no user profile, deny access
      if (businessProfile && !userProfile) {
        console.log(
          "[Middleware] Denying access: has business but no user profile",
        );
        const url = request.nextUrl.clone();
        url.pathname = "/";
        url.searchParams.set("error", "user_access_denied");
        return NextResponse.redirect(url);
      }

      // If user has neither profile, deny access
      if (!userProfile) {
        console.log("[Middleware] Denying access: no user profile");
        const url = request.nextUrl.clone();
        url.pathname = "/";
        url.searchParams.set("error", "user_access_denied");
        return NextResponse.redirect(url);
      }

      // If user has both profiles, check which one is active via cookie
      if (userProfile && businessProfile) {
        // If they're logged in as business (cookie says "business"), deny access to user routes
        if (profileKindCookie === "business") {
          console.log(
            "[Middleware] Denying access: user has both profiles but is logged in as business",
          );
          const url = request.nextUrl.clone();
          url.pathname = "/";
          url.searchParams.set("error", "user_access_denied_switch_to_user");
          return NextResponse.redirect(url);
        }
      }

      console.log("[Middleware] Allowing access to /user route");
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

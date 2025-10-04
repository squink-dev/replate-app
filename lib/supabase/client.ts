import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
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
  );
}

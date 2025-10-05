"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const signOut = async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
    };

    signOut();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg">Signing out...</p>
    </div>
  );
}

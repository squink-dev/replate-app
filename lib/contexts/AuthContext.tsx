"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import type { Database } from "@/database.types";
import { createClient } from "@/lib/supabase/client";

type AuthProfile =
  | {
      kind: "user";
      email: string;
      userId: string;
      firstName: string;
      lastName: string;
      age: number | null;
      dietaryRestrictions: Database["public"]["Enums"]["diet_enum"][];
      income: Database["public"]["Enums"]["income_bracket_enum"] | null;
      isStudent: boolean | null;
      jobStatus: Database["public"]["Enums"]["job_status_enum"] | null;
    }
  | {
      kind: "business";
      email: string;
      userId: string;
      businessId: string;
      businessName: string;
      businessType: Database["public"]["Enums"]["business_type_enum"];
      phone: string | null;
    }
  | null;

interface AuthContextType {
  profile: AuthProfile;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  switchProfileKind: (kind: "user" | "business") => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROFILE_KIND_KEY = "profile_kind";
const PROFILE_KIND_COOKIE = "profile_kind";

// Helper function to set profile kind in both localStorage and cookie
const setProfileKind = (kind: "user" | "business") => {
  if (typeof window !== "undefined") {
    localStorage.setItem(PROFILE_KIND_KEY, kind);
    // Set cookie for middleware access
    document.cookie = `${PROFILE_KIND_COOKIE}=${kind}; path=/; max-age=31536000; SameSite=Lax`;
  }
};

// Helper function to remove profile kind
const removeProfileKind = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(PROFILE_KIND_KEY);
    // Remove cookie
    document.cookie = `${PROFILE_KIND_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<AuthProfile>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async (
      user: User | null,
      preferredKind?: "user" | "business",
    ) => {
      if (!user) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      try {
        // Get the stored preference or use the provided one
        const storedKind =
          typeof window !== "undefined"
            ? (localStorage.getItem(PROFILE_KIND_KEY) as
                | "user"
                | "business"
                | null)
            : null;
        const kind = preferredKind || storedKind;

        console.log("[AuthContext] fetchProfile called", {
          preferredKind,
          storedKind,
          kind,
          userId: user.id,
        });

        // If we have a preferred kind, try to fetch that profile first
        if (kind === "user") {
          const { data: userProfile, error: userError } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();

          if (!userError && userProfile) {
            if (typeof window !== "undefined") {
              localStorage.setItem(PROFILE_KIND_KEY, "user");
            }
            setProfile({
              kind: "user",
              email: user.email || "",
              userId: user.id,
              firstName: userProfile.first_name,
              lastName: userProfile.last_name,
              age: userProfile.age,
              dietaryRestrictions: userProfile.dietary_restrictions,
              income: userProfile.income,
              isStudent: userProfile.is_student,
              jobStatus: userProfile.job_status,
            });
            setIsLoading(false);
            return;
          }
        } else if (kind === "business") {
          const { data: businessProfile, error: businessError } = await supabase
            .from("business_profiles")
            .select("*")
            .eq("owner_id", user.id)
            .single();

          console.log("[AuthContext] Business profile query result", {
            businessProfile,
            businessError,
          });

          if (!businessError && businessProfile) {
            if (typeof window !== "undefined") {
              localStorage.setItem(PROFILE_KIND_KEY, "business");
            }
            setProfile({
              kind: "business",
              email: user.email || "",
              userId: user.id,
              businessId: businessProfile.id,
              businessName: businessProfile.business_name,
              businessType: businessProfile.business_type,
              phone: businessProfile.phone,
            });
            setIsLoading(false);
            return;
          }
        }

        // No preferred kind or preferred kind not found - check both profiles
        console.log(
          "[AuthContext] Falling back to check both profiles (kind was:",
          kind,
          ")",
        );

        const { data: userProfile, error: userError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!userError && userProfile) {
          // Only update localStorage if there was no prior preference
          if (typeof window !== "undefined" && !storedKind) {
            localStorage.setItem(PROFILE_KIND_KEY, "user");
          }
          setProfile({
            kind: "user",
            email: user.email || "",
            userId: user.id,
            firstName: userProfile.first_name,
            lastName: userProfile.last_name,
            age: userProfile.age,
            dietaryRestrictions: userProfile.dietary_restrictions,
            income: userProfile.income,
            isStudent: userProfile.is_student,
            jobStatus: userProfile.job_status,
          });
          setIsLoading(false);
          return;
        }

        // Check for business profile
        const { data: businessProfile, error: businessError } = await supabase
          .from("business_profiles")
          .select("*")
          .eq("owner_id", user.id)
          .single();

        if (!businessError && businessProfile) {
          // Only update localStorage if there was no prior preference
          if (typeof window !== "undefined" && !storedKind) {
            localStorage.setItem(PROFILE_KIND_KEY, "business");
          }
          setProfile({
            kind: "business",
            email: user.email || "",
            userId: user.id,
            businessId: businessProfile.id,
            businessName: businessProfile.business_name,
            businessType: businessProfile.business_type,
            phone: businessProfile.phone,
          });
          setIsLoading(false);
          return;
        }

        // User is authenticated but has no profile yet
        setProfile(null);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setProfile(null);
        setIsLoading(false);
      }
    };

    // Initial profile fetch
    const initAuth = async () => {
      // Check if there's a 'kind' parameter in the URL (from callback)
      const params =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search)
          : null;
      const kindFromUrl = params?.get("kind") as "user" | "business" | null;

      console.log("[AuthContext] initAuth - URL params", {
        url: typeof window !== "undefined" ? window.location.href : "SSR",
        kindFromUrl,
      });

      // If kind is in URL, store it in localStorage
      if (kindFromUrl && typeof window !== "undefined") {
        localStorage.setItem(PROFILE_KIND_KEY, kindFromUrl);
        console.log("[AuthContext] Stored kind from URL:", kindFromUrl);

        // Clean up the URL to remove the kind parameter
        const url = new URL(window.location.href);
        url.searchParams.delete("kind");
        window.history.replaceState({}, "", url);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      await fetchProfile(user, kindFromUrl || undefined);
    };

    initAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await fetchProfile(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const refreshProfile = async () => {
    setIsLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    // Get stored preference
    const storedKind =
      typeof window !== "undefined"
        ? (localStorage.getItem(PROFILE_KIND_KEY) as "user" | "business" | null)
        : null;

    try {
      if (storedKind === "user") {
        const { data: userProfile, error: userError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!userError && userProfile) {
          setProfile({
            kind: "user",
            email: user.email || "",
            userId: user.id,
            firstName: userProfile.first_name,
            lastName: userProfile.last_name,
            age: userProfile.age,
            dietaryRestrictions: userProfile.dietary_restrictions,
            income: userProfile.income,
            isStudent: userProfile.is_student,
            jobStatus: userProfile.job_status,
          });
          setIsLoading(false);
          return;
        }
      } else if (storedKind === "business") {
        const { data: businessProfile, error: businessError } = await supabase
          .from("business_profiles")
          .select("*")
          .eq("owner_id", user.id)
          .single();

        if (!businessError && businessProfile) {
          setProfile({
            kind: "business",
            email: user.email || "",
            userId: user.id,
            businessId: businessProfile.id,
            businessName: businessProfile.business_name,
            businessType: businessProfile.business_type,
            phone: businessProfile.phone,
          });
          setIsLoading(false);
          return;
        }
      }

      // Fallback: check both profiles
      const { data: userProfile, error: userError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!userError && userProfile) {
        if (typeof window !== "undefined") {
          localStorage.setItem(PROFILE_KIND_KEY, "user");
        }
        setProfile({
          kind: "user",
          email: user.email || "",
          userId: user.id,
          firstName: userProfile.first_name,
          lastName: userProfile.last_name,
          age: userProfile.age,
          dietaryRestrictions: userProfile.dietary_restrictions,
          income: userProfile.income,
          isStudent: userProfile.is_student,
          jobStatus: userProfile.job_status,
        });
        setIsLoading(false);
        return;
      }

      const { data: businessProfile, error: businessError } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (!businessError && businessProfile) {
        if (typeof window !== "undefined") {
          localStorage.setItem(PROFILE_KIND_KEY, "business");
        }
        setProfile({
          kind: "business",
          email: user.email || "",
          userId: user.id,
          businessId: businessProfile.id,
          businessName: businessProfile.business_name,
          businessType: businessProfile.business_type,
          phone: businessProfile.phone,
        });
        setIsLoading(false);
        return;
      }

      setProfile(null);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
      setIsLoading(false);
    }
  };

  const switchProfileKind = async (kind: "user" | "business") => {
    if (typeof window !== "undefined") {
      localStorage.setItem(PROFILE_KIND_KEY, kind);
    }
    await refreshProfile();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(PROFILE_KIND_KEY);
    }
  };

  return (
    <AuthContext.Provider
      value={{ profile, isLoading, signOut, refreshProfile, switchProfileKind }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

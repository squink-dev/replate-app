"use client";

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<AuthProfile>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (!user) {
          setProfile(null);
          setIsLoading(false);
          return;
        }

        // Check URL for kind parameter (takes precedence over stored preference)
        let kindFromUrl: "user" | "business" | null = null;
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const urlKind = params.get("kind");
          if (urlKind === "user" || urlKind === "business") {
            kindFromUrl = urlKind;
            // Update localStorage with the URL kind
            localStorage.setItem(PROFILE_KIND_KEY, urlKind);
          }
        }

        // Get stored preference (but URL takes precedence)
        const storedKind =
          kindFromUrl ||
          (typeof window !== "undefined"
            ? (localStorage.getItem(PROFILE_KIND_KEY) as
                | "user"
                | "business"
                | null)
            : null);

        // Try preferred profile type first
        if (storedKind === "user") {
          const { data: userProfile } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          if (userProfile && mounted) {
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
          const { data: businessProfile } = await supabase
            .from("business_profiles")
            .select("*")
            .eq("owner_id", user.id)
            .maybeSingle();

          if (businessProfile && mounted) {
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

        // Fallback: check user profile first
        const { data: userProfile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (userProfile && mounted) {
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

        // Check business profile
        const { data: businessProfile } = await supabase
          .from("business_profiles")
          .select("*")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (businessProfile && mounted) {
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

        // No profile found
        if (mounted) {
          setProfile(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("[AuthContext] Error fetching profile:", error);
        if (mounted) {
          setProfile(null);
          setIsLoading(false);
        }
      }
    };

    fetchProfile();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);
  const refreshProfile = async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      const storedKind =
        typeof window !== "undefined"
          ? (localStorage.getItem(PROFILE_KIND_KEY) as
              | "user"
              | "business"
              | null)
          : null;

      // Try preferred profile
      if (storedKind === "user") {
        const { data: userProfile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (userProfile) {
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
        const { data: businessProfile } = await supabase
          .from("business_profiles")
          .select("*")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (businessProfile) {
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

      // Fallback
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (userProfile) {
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

      const { data: businessProfile } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (businessProfile) {
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
      console.error("[AuthContext] Error refreshing profile:", error);
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

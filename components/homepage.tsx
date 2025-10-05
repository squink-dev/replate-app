"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function HomePage() {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Content with backdrop blur for glassmorphism effect */}
      <header className="relative flex flex-col items-center justify-center flex-1 text-center px-6 py-12 z-10">
        <div className="backdrop-blur-sm bg-white/30 rounded-3xl p-8 md:p-12 shadow-2xl border border-white/40">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800 mb-4 drop-shadow-sm">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Replate
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mb-8 font-medium drop-shadow-sm">
            Connecting businesses with surplus food to people in need
          </p>

          <div className="flex flex-col md:flex-row gap-4">
            {!profile && (
              <>
                <Button
                  asChild
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  <Link href="/auth/login?kind=user">User Login</Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="border-2 border-green-600 text-green-600 hover:bg-green-50 px-6 py-3 rounded-lg text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-white/50 backdrop-blur-sm"
                >
                  <Link href="/auth/login?kind=business">Business Login</Link>
                </Button>
              </>
            )}

            {profile?.kind === "business" && (
              <Button
                asChild
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <Link href="/business/dashboard">Go to Dashboard</Link>
              </Button>
            )}

            <Button
              asChild
              variant="ghost"
              className="text-gray-700 hover:text-green-600 px-6 py-3 text-lg hover:scale-105 transition-all bg-white/40 backdrop-blur-sm hover:bg-white/60"
            >
              <Link href="/user/view">View Available Food →</Link>
            </Button>
          </div>
        </div>
      </header>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const { profile, isLoading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
    router.push("/");
  };

  const getInitials = () => {
    if (!profile) return "";
    if (profile.kind === "user") {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    }
    return profile.businessName[0].toUpperCase();
  };

  const getDisplayName = () => {
    if (!profile) return "";
    if (profile.kind === "user") {
      return `${profile.firstName} ${profile.lastName}`;
    }
    return profile.businessName;
  };

  return (
    <header className="w-full border-b bg-white shadow-sm">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-extrabold text-green-600">
          Replate
        </Link>

        {!isLoading && profile && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle profile menu"
              className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold">
                {getInitials()}
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-800">
                  {getDisplayName()}
                </div>
                <div className="text-xs text-gray-500">
                  {profile.kind === "user"
                    ? "User Account"
                    : "Business Account"}
                </div>
              </div>
              <svg
                className={`w-4 h-4 text-gray-600 transition-transform ${
                  isMenuOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isMenuOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10 bg-transparent border-0 p-0 m-0 focus:outline-none"
                  onClick={() => setIsMenuOpen(false)}
                  aria-label="Close menu"
                ></button>
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="font-semibold text-gray-800">
                      {getDisplayName()}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {profile.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

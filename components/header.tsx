"use client";

import Image from "next/image";
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
    console.log(profile);
    if (!profile) return "";
    if (profile.kind === "user") {
      return `${profile.firstName} ${profile.lastName}`;
    }
    return profile.businessName;
  };

  return (
    <header className="w-full border-b border-white/50 bg-white/60 backdrop-blur-md shadow-lg relative z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Image
            src="/images/logo_icon.png"
            alt="Logo"
            width={64}
            height={64}
            className="hidden md:block"
          />
          <Link href="/" className="text-2xl font-extrabold text-green-600">
            Replate
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {/* My Reservations button for users */}
          {!isLoading && profile && profile.kind === "user" && (
            <Link
              href="/user/reservations"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              <span className="hidden md:inline">My Reservations</span>
            </Link>
          )}

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
                <div className="text-left hidden md:block">
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
                  className={`w-4 h-4 text-gray-600 transition-transform hidden md:block ${
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
                    className="fixed inset-0 z-[60] bg-transparent border-0 p-0 m-0 cursor-default"
                    onClick={() => setIsMenuOpen(false)}
                    aria-label="Close menu"
                    tabIndex={-1}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[70]">
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
      </div>
    </header>
  );
}

"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="flex flex-col items-center justify-center flex-1 text-center px-6">
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800 mb-4">
          Welcome to <span className="text-green-600">Free Food Findr</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mb-8">
          Connecting businesses with surplus food to people in need — helping
          communities reduce waste and fight hunger.
        </p>

        <div className="flex flex-col md:flex-row gap-4">
          <Button
            asChild
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-lg shadow-md"
          >
            <Link href="/usignup">User Signup</Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="border-2 border-green-600 text-green-600 hover:bg-green-50 px-6 py-3 rounded-lg text-lg"
          >
            <Link href="/bsignup">Business Signup</Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            className="text-gray-700 hover:text-green-600 px-6 py-3 text-lg"
          >
            <Link href="/uview">View Available Food →</Link>
          </Button>
        </div>
      </header>
    </div>
  );
}

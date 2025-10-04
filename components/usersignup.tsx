"use client";

export default function UserSignUp() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 items-center justify-center px-6">
      <header className="text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800 mb-4">
          User Sign Up
        </h1>

        <div className="flex flex-col gap-4 max-w-md mx-auto">
          <input
            type="text"
            placeholder="Name"
            className="border border-gray-300 rounded-lg px-4 py-2"
          />
          <input
            type="email"
            placeholder="Email"
            className="border border-gray-300 rounded-lg px-4 py-2"
          />
          <input
            type="password"
            placeholder="Password"
            className="border border-gray-300 rounded-lg px-4 py-2"
          />

          <button
            type="button"
            className="bg-green-600 text-white rounded-lg px-4 py-2 hover:bg-green-700 transition-colors"
          >Sign Up
          </button>
        </div>
      </header>
    </div>
  );
}

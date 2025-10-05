"use client";

import { useState } from "react";

export default function BusinessSignUp() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password) {
      alert("Please fill in all fields.");
      return false;
    }
    if (!validateEmail(formData.email)) {
      alert("Please enter a valid email address.");
      return false;
    }
    if (formData.password.length < 8) {
      alert("Password must be at least 8 characters long.");
      return false;
    }
    if (!/\d/.test(formData.password) || !/[A-Z]/.test(formData.password)) {
      alert(
        "Password must contain at least one number and one uppercase letter.",
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const payload = { ...formData };
    console.log(payload);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to submit");
      alert("Business registered successfully!");
      setFormData({ name: "", email: "", password: "" });
    } catch (err) {
      alert("Something went wrong. Please try again.");
      console.log(err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-6 py-12">
      <div className="bg-white shadow-lg rounded-2xl border border-gray-200 w-full max-w-md p-8">
        <h1 className="text-4xl font-extrabold text-gray-800 text-center mb-8">
          Business Sign Up
        </h1>

        <div className="flex flex-col gap-6">
          <div>
            <label
              htmlFor="name"
              className="block text-gray-700 font-medium mb-2"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              className="border border-gray-300 rounded-lg px-4 py-2 w-full"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-gray-700 font-medium mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="border border-gray-300 rounded-lg px-4 py-2 w-full"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-gray-700 font-medium mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter a strong password"
              className="border border-gray-300 rounded-lg px-4 py-2 w-full"
            />
            <p className="text-sm text-gray-500 mt-1">
              Must include at least 8 characters, one uppercase letter, and one
              number.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="bg-green-600 text-white rounded-lg px-4 py-2 hover:bg-green-700 transition-colors w-full font-semibold"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}

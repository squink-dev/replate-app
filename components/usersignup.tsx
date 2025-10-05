"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export default function UserSignUp() {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [extraData, setExtraData] = useState({
    age: "",
    profession: "",
    dietaryRestrictions: [] as string[],
  });

  const professionOptions = ["Unemployed", "Part-Time", "Full-Time"];

  const dietaryOptions = [
    "Vegan",
    "Vegetarian",
    "Gluten-Free",
    "Halal",
    "Kosher",
    "Dairy-Free",
    "Nut-Free",
    "Pescatarian",
    "Low-Sodium",
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (step === 1) {
      setUserData((prev) => ({ ...prev, [name]: value }));
    } else {
      setExtraData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleToggleRestriction = (restriction: string) => {
    setExtraData((prev) => {
      const exists = prev.dietaryRestrictions.includes(restriction);
      return {
        ...prev,
        dietaryRestrictions: exists
          ? prev.dietaryRestrictions.filter((r) => r !== restriction)
          : [...prev.dietaryRestrictions, restriction],
      };
    });
  };

  const handleProfessionSelect = (profession: string) => {
    setExtraData((prev) => ({ ...prev, profession }));
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateStepOne = () => {
    if (!userData.name || !userData.email || !userData.password) {
      alert("Please fill in all fields.");
      return false;
    }
    if (!validateEmail(userData.email)) {
      alert("Please enter a valid email address.");
      return false;
    }
    if (userData.password.length < 8) {
      alert("Password must be at least 8 characters long.");
      return false;
    }
    if (!/\d/.test(userData.password) || !/[A-Z]/.test(userData.password)) {
      alert(
        "Password must contain at least one number and one uppercase letter.",
      );
      return false;
    }
    return true;
  };

  const validateStepTwo = () => {
    if (!extraData.age || Number(extraData.age) <= 0) {
      alert("Please enter a valid age.");
      return false;
    }
    if (!extraData.profession) {
      alert("Please select a profession.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStepTwo()) return; // enforce age and profession

    const payload = { ...userData, ...extraData };
    console.log(payload);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to submit");
      alert("User registered successfully!");
      setUserData({ name: "", email: "", password: "" });
      setExtraData({ age: "", profession: "", dietaryRestrictions: [] });
      setStep(1);
    } catch (err) {
      alert("Something went wrong. Please try again.");
      console.log(err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-6 py-12">
      <div className="bg-white shadow-lg rounded-2xl border border-gray-200 w-full max-w-md p-8">
        <h1 className="text-4xl font-extrabold text-gray-800 text-center mb-8">
          User Sign Up
        </h1>

        <p className="text-center text-gray-500 mb-6">Step {step} of 2</p>

        {step === 1 && (
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
                value={userData.name}
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
                value={userData.email}
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
                value={userData.password}
                onChange={handleChange}
                placeholder="Enter a strong password"
                className="border border-gray-300 rounded-lg px-4 py-2 w-full"
              />
              <p className="text-sm text-gray-500 mt-1">
                Must include at least 8 characters, one uppercase letter, and
                one number.
              </p>
            </div>

            <button
              type="button"
              onClick={() => validateStepOne() && setStep(2)}
              className="bg-green-600 text-white rounded-lg px-4 py-2 hover:bg-green-700 transition-colors w-full font-semibold"
            >
              Proceed
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div>
              <label
                htmlFor="age"
                className="block text-gray-700 font-medium mb-2"
              >
                Age
              </label>
              <input
                id="age"
                type="number"
                name="age"
                value={extraData.age}
                onChange={handleChange}
                placeholder="Enter your age"
                className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                min="1"
              />
            </div>

            <div>
              <label
                htmlFor="profession"
                className="block text-gray-700 font-medium mb-3"
              >
                Profession
              </label>
              <Select
                value={extraData.profession}
                onValueChange={handleProfessionSelect}
              >
                <SelectTrigger className="w-full" id="profession">
                  <SelectValue placeholder="Select your profession" />
                </SelectTrigger>
                <SelectContent>
                  {professionOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label
                htmlFor="dietary-restrictions"
                className="block text-gray-700 font-medium mb-3"
              >
                Dietary Restrictions (optional)
              </label>
              <div className="flex flex-col gap-2">
                {dietaryOptions.map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 text-gray-700 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={extraData.dietaryRestrictions.includes(option)}
                      onChange={() => handleToggleRestriction(option)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/2 border border-gray-300 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-100 transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="w-1/2 bg-green-600 text-white rounded-lg px-4 py-2 hover:bg-green-700 transition font-semibold"
              >
                Submit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

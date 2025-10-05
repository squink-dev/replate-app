"use client";

import Link from "next/link";
import { useState } from "react";

interface Location {
  id: number;
  name: string;
  address: string;
}

export default function Dashboard() {
  const [locations, setLocations] = useState<Location[]>([
    { id: 1, name: "Central Kitchen", address: "123 Main St" },
    { id: 2, name: "Downtown Cafe", address: "456 Market Ave" },
    { id: 3, name: "Food Depot", address: "789 Broadway Blvd" },
  ]);

  const handleAdd = () => {
    const newId = Date.now();
    const newLocation = {
      id: newId,
      name: `New Location ${locations.length + 1}`,
      address: "Example Street",
    };
    setLocations((prev) => [...prev, newLocation]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 px-6 py-12">
      <div className="max-w-5xl mx-auto w-full">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Hello, <span className="text-green-600">Temba</span> 👋
            </h1>
            <p className="text-gray-500 mt-2">
              Add a new location to set up your food provider — thanks for
              helping your community!
            </p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition font-semibold"
          >
            + Add Location
          </button>
        </header>

        {/* Main Content */}
        <div className="bg-white shadow-md rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Your Locations
          </h2>

          {locations.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No locations added yet. Click “Add Location” to get started.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {locations.map((loc, index) => (
                <li
                  key={loc.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition rounded-lg"
                >
                  <Link href="/" className="block">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {index + 1}. {loc.name}
                        </h3>
                        <p className="text-gray-500 text-sm">{loc.address}</p>
                      </div>
                      <span className="text-green-600 text-sm font-medium">
                        View →
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

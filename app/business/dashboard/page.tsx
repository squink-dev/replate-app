"use client";

import Link from "next/link";
import { useState } from "react";

interface Location {
  id: number;
  name: string;
  address: string;
}

export default function BusinessDashboard() {
  const [locations, setLocations] = useState<Location[]>([
    { id: 1, name: "Central Kitchen", address: "123 Main St" },
    { id: 2, name: "Downtown Café", address: "456 Market Ave" },
    { id: 3, name: "Food Depot", address: "789 Broadway Blvd" },
  ]);

  const [formData, setFormData] = useState({ name: "", address: "" });
  const [showForm, setShowForm] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = () => {
    if (!formData.name.trim() || !formData.address.trim()) {
      alert("Please fill out both fields.");
      return;
    }

    const newLocation = {
      id: Date.now(),
      name: formData.name,
      address: formData.address,
    };

    setLocations((prev) => [...prev, newLocation]);
    setFormData({ name: "", address: "" });
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col px-6 py-12">
      <div className="max-w-3xl mx-auto w-full bg-white shadow-lg rounded-2xl border border-gray-200 p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Hello, <span className="text-green-600">Temba</span> 👋
            </h1>
            <p className="text-gray-500 mt-2">
              Add or manage your business locations to list available food for
              those in need.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="mt-4 md:mt-0 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            {showForm ? "Cancel" : "+ Add Location"}
          </button>
        </div>

        {/* Add Location Form */}
        {showForm && (
          <div className="flex flex-col md:flex-row gap-4 mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Location name"
              className="border border-gray-300 rounded-lg px-4 py-2 flex-1"
            />
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Address (e.g., 123 Main St)"
              className="border border-gray-300 rounded-lg px-4 py-2 flex-1"
            />
            <button
              type="button"
              onClick={handleAdd}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Save
            </button>
          </div>
        )}

        {/* Locations List */}
        <div className="border-t border-gray-200 pt-4">
          {locations.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No locations added yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {locations.map((loc, index) => (
                <li
                  key={loc.id}
                  className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition"
                >
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {index + 1}. {loc.name}
                    </h3>
                    <p className="text-gray-500 text-sm">{loc.address}</p>
                  </div>
                  <Link
                    href={`/business/dashboard/listing/${loc.id}`}
                    className="text-green-600 hover:underline text-sm font-medium"
                  >
                    View →
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

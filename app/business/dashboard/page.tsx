"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Footer from "@/components/footer";
import Header from "@/components/header";
import type { Database } from "@/database.types";
import { useAuth } from "@/lib/contexts/AuthContext";

type BusinessLocation =
  Database["public"]["Tables"]["business_locations"]["Row"];

interface Location {
  id: string;
  name: string;
  address: string;
}

export default function BusinessDashboard() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const [formData, setFormData] = useState({ name: "", address: "" });
  const [showForm, setShowForm] = useState(false);

  const { profile } = useAuth();

  // Fetch locations on mount
  useEffect(() => {
    const fetchLocations = async () => {
      if (profile?.kind !== "business") {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/business/locations?business_id=${profile.businessId}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch locations");
        }

        const data = await response.json();

        if (data.success && data.locations) {
          const formattedLocations: Location[] = data.locations.map(
            (loc: BusinessLocation) => ({
              id: loc.id,
              name: loc.name,
              address: loc.address,
            }),
          );
          setLocations(formattedLocations);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = async () => {
    if (!formData.name.trim() || !formData.address.trim()) {
      alert("Please fill out both fields.");
      return;
    }

    if (profile?.kind !== "business") {
      alert("You must be logged in as a business to add locations.");
      return;
    }

    setIsAdding(true);

    try {
      const response = await fetch("/api/business/locations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create location");
      }

      if (data.success && data.location) {
        // Add the new location to the list
        const newLocation: Location = {
          id: data.location.id,
          name: data.location.name,
          address: data.location.address,
        };

        setLocations((prev) => [newLocation, ...prev]);
        setFormData({ name: "", address: "" });
        setShowForm(false);
        alert("Location added successfully!");
      }
    } catch (error) {
      console.error("Error adding location:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to add location. Please try again.",
      );
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <Header />

      <div className="min-h-screen bg-gray-50 flex flex-col px-6 py-12">
        <div className="max-w-3xl mx-auto w-full bg-white shadow-lg rounded-2xl border border-gray-200 p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Hello,{" "}
                <span className="text-green-600">
                  {profile?.kind === "business"
                    ? profile.businessName
                    : "Business"}
                </span>
              </h1>
              <p className="text-gray-500 mt-2">
                Add or manage your business locations here.
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
                disabled={isAdding}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAdding ? "Saving..." : "Save"}
              </button>
            </div>
          )}

          {/* Locations List */}
          <div className="border-t border-gray-200 pt-4">
            {isLoading ? (
              <p className="text-gray-500 text-center py-4">
                Loading locations...
              </p>
            ) : locations.length === 0 ? (
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
                      Manage →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

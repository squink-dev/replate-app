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
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: "", address: "" });

  const [formData, setFormData] = useState({ name: "", address: "" });
  const [showForm, setShowForm] = useState(false);

  const { profile } = useAuth();

  // Fetch locations
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

        if (!response.ok) throw new Error("Failed to fetch locations");

        const data = await response.json();
        if (data.success && data.locations) {
          const formatted: Location[] = data.locations.map(
            (loc: BusinessLocation) => ({
              id: loc.id,
              name: loc.name,
              address: loc.address,
            }),
          );
          setLocations(formatted);
        }
      } catch (err) {
        console.error("Error fetching locations:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, [profile]);

  // Add location
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create");

      if (data.success && data.location) {
        const newLoc: Location = {
          id: data.location.id,
          name: data.location.name,
          address: data.location.address,
        };
        setLocations((prev) => [newLoc, ...prev]);
        setFormData({ name: "", address: "" });
        setShowForm(false);
        alert("Location added successfully!");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add location. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  // Archive location
  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Archive this location? It will no longer appear in listings but will be kept for record-keeping.",
      )
    ) {
      return;
    }

    setIsDeleting(id);
    setMenuOpen(null);

    try {
      const response = await fetch(`/api/business/locations/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to archive location");
      }

      setLocations((prev) => prev.filter((loc) => loc.id !== id));
      alert("Location archived successfully!");
    } catch (err) {
      console.error(err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to archive location.";
      alert(errorMessage);
    } finally {
      setIsDeleting(null);
    }
  };

  // Edit location
  const handleEdit = (loc: Location) => {
    setEditingId(loc.id);
    setEditData({ name: loc.name, address: loc.address });
    setMenuOpen(null);
  };

  const handleSaveEdit = async () => {
    if (!editData.name.trim() || !editData.address.trim()) {
      alert("Please fill out both fields.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/business/locations/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editData.name,
          address: editData.address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update location");
      }

      setLocations((prev) =>
        prev.map((loc) =>
          loc.id === editingId ? { ...loc, ...editData } : loc,
        ),
      );

      setEditingId(null);
      setEditData({ name: "", address: "" });
      alert("Location updated successfully!");
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to update location. Please try again.",
      );
    } finally {
      setIsSaving(false);
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
              onClick={() => setShowForm((p) => !p)}
              className="mt-4 md:mt-0 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              {showForm ? "Cancel" : "+ Add Location"}
            </button>
          </div>

          {/* Add Form */}
          {showForm && (
            <div className="flex flex-col md:flex-row gap-4 mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Location name"
                className="border border-gray-300 rounded-lg px-4 py-2 flex-1"
              />
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, address: e.target.value }))
                }
                placeholder="Address (e.g., 123 Main St)"
                className="border border-gray-300 rounded-lg px-4 py-2 flex-1"
              />
              <button
                type="button"
                onClick={handleAdd}
                disabled={isAdding}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {isAdding ? "Saving..." : "Save"}
              </button>
            </div>
          )}

          {/* Locations */}
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
                    className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition relative"
                  >
                    {editingId === loc.id ? (
                      <div className="flex flex-col md:flex-row gap-3 w-full">
                        <input
                          type="text"
                          value={editData.name}
                          onChange={(e) =>
                            setEditData((p) => ({
                              ...p,
                              name: e.target.value,
                            }))
                          }
                          className="border border-gray-300 rounded-lg px-3 py-2 flex-1"
                        />
                        <input
                          type="text"
                          value={editData.address}
                          onChange={(e) =>
                            setEditData((p) => ({
                              ...p,
                              address: e.target.value,
                            }))
                          }
                          className="border border-gray-300 rounded-lg px-3 py-2 flex-1"
                        />
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          disabled={isSaving}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {index + 1}. {loc.name}
                          </h3>
                          <p className="text-gray-500 text-sm">{loc.address}</p>
                        </div>

                        <div className="flex items-center gap-2 relative">
                          <Link
                            href={`/business/dashboard/listing/${loc.id}`}
                            className="text-green-600 hover:underline text-sm font-medium"
                          >
                            Manage Inventory
                          </Link>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setMenuOpen(menuOpen === loc.id ? null : loc.id)
                              }
                              disabled={isDeleting === loc.id}
                              className="text-gray-500 hover:text-gray-800 active:text-black text-2xl px-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isDeleting === loc.id ? "..." : "⋯"}
                            </button>

                            {menuOpen === loc.id && (
                              <>
                                <button
                                  type="button"
                                  className="fixed inset-0 bg-transparent cursor-default"
                                  onClick={() => setMenuOpen(null)}
                                />
                                <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-md w-32 z-10">
                                  <button
                                    type="button"
                                    onClick={() => handleEdit(loc)}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(loc.id)}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    Archive
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </>
                    )}
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

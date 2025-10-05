"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Footer from "@/components/footer";
import Header from "@/components/header";
import type { Database } from "@/database.types";

type FoodItem = Database["public"]["Tables"]["food_items"]["Row"];
type DietEnum = Database["public"]["Enums"]["diet_enum"];

interface Location {
  id: string;
  name: string;
  address: string;
  pickup_points: {
    id: string;
    name: string;
    is_default: boolean;
  }[];
}

interface FoodItemWithDetails extends FoodItem {
  pickup_point: {
    id: string;
    name: string;
  };
}

const DIET_OPTIONS: { value: DietEnum; label: string }[] = [
  { value: "none", label: "None" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
  { value: "gluten_free", label: "Gluten Free" },
  { value: "dairy_free", label: "Dairy Free" },
  { value: "nut_free", label: "Nut Free" },
  { value: "other", label: "Other" },
];

export default function LocationView() {
  const params = useParams();
  const id = params?.id as string;

  const [location, setLocation] = useState<Location | null>(null);
  const [foodItems, setFoodItems] = useState<FoodItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    description: "",
    total_quantity: "",
    unit_label: "",
    dietary_restrictions: [] as DietEnum[],
    best_before: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/locations/${id}/food-items`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch data");
      }

      setLocation(data.location);
      setFoodItems(data.foodItems || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to load location data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [fetchData, id]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDietChange = (diet: DietEnum) => {
    setFormData((prev) => {
      const current = prev.dietary_restrictions;
      const updated = current.includes(diet)
        ? current.filter((d) => d !== diet)
        : [...current, diet];
      return { ...prev, dietary_restrictions: updated };
    });
  };

  const resetForm = () => {
    setFormData({
      description: "",
      total_quantity: "",
      unit_label: "",
      dietary_restrictions: [],
      best_before: "",
    });
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (
      !formData.description.trim() ||
      !formData.total_quantity.trim() ||
      !formData.unit_label.trim()
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    // Get default pickup point
    const defaultPickupPoint =
      location?.pickup_points?.find((pp) => pp.is_default) ||
      location?.pickup_points?.[0];

    if (!defaultPickupPoint) {
      alert("No pickup point available for this location.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/locations/${id}/food-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: formData.description,
          total_quantity: Number(formData.total_quantity),
          unit_label: formData.unit_label,
          pickup_point_id: defaultPickupPoint.id,
          dietary_restrictions: formData.dietary_restrictions,
          best_before: formData.best_before || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add food item");
      }

      await fetchData();
      resetForm();
    } catch (error) {
      console.error("Error adding food item:", error);
      alert("Failed to add food item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: FoodItemWithDetails) => {
    setEditingId(item.id);
    setFormData({
      description: item.description,
      total_quantity: item.total_quantity?.toString() || "",
      unit_label: item.unit_label || "",
      dietary_restrictions: (item.dietary_restrictions as DietEnum[]) || [],
      best_before: item.best_before || "",
    });
  };

  const handleUpdate = async () => {
    if (!editingId) return;

    if (
      !formData.description.trim() ||
      !formData.total_quantity.trim() ||
      !formData.unit_label.trim()
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    // Get default pickup point
    const defaultPickupPoint =
      location?.pickup_points?.find((pp) => pp.is_default) ||
      location?.pickup_points?.[0];

    if (!defaultPickupPoint) {
      alert("No pickup point available for this location.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/locations/${id}/food-items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          description: formData.description,
          total_quantity: Number(formData.total_quantity),
          unit_label: formData.unit_label,
          pickup_point_id: defaultPickupPoint.id,
          dietary_restrictions: formData.dietary_restrictions,
          best_before: formData.best_before || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update food item");
      }

      await fetchData();
      resetForm();
    } catch (error) {
      console.error("Error updating food item:", error);
      alert("Failed to update food item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (
      !confirm(
        "Archive this item? It will no longer appear in listings but will be kept for record-keeping.",
      )
    )
      return;

    try {
      setDeletingId(itemId);
      const response = await fetch(
        `/api/locations/${id}/food-items?id=${itemId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to archive food item");
      }

      await fetchData();
      alert("Food item archived successfully!");
    } catch (error) {
      console.error("Error archiving food item:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to archive food item";
      alert(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 flex flex-col px-6 py-12">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full bg-white shadow-lg rounded-2xl border border-gray-200 p-8">
            {/* Header Section */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {location?.name || "Location"}
              </h1>
              <p className="text-gray-500 mb-1">{location?.address}</p>
              <p className="text-gray-600 text-sm">
                Manage your food items here — add, edit, or delete supplies at
                this location.
              </p>
            </div>

            {/* Add/Edit Form */}
            <div className="border border-gray-200 rounded-lg p-6 mb-6 bg-gray-50">
              <h2 className="text-lg font-semibold mb-4">
                {editingId ? "Edit Food Item" : "Add New Food Item"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium mb-1"
                  >
                    Description *
                  </label>
                  <input
                    id="description"
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="e.g., Fresh bread, Canned vegetables"
                    className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label
                    htmlFor="total_quantity"
                    className="block text-sm font-medium mb-1"
                  >
                    Total Quantity *
                  </label>
                  <input
                    id="total_quantity"
                    type="number"
                    name="total_quantity"
                    value={formData.total_quantity}
                    onChange={handleChange}
                    placeholder="e.g., 10"
                    className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                    disabled={isSubmitting}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label
                    htmlFor="unit_label"
                    className="block text-sm font-medium mb-1"
                  >
                    Unit Label *
                  </label>
                  <input
                    id="unit_label"
                    type="text"
                    name="unit_label"
                    value={formData.unit_label}
                    onChange={handleChange}
                    placeholder="e.g., boxes, kg, servings"
                    className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label
                    htmlFor="best_before"
                    className="block text-sm font-medium mb-1"
                  >
                    Best Before (Optional)
                  </label>
                  <input
                    id="best_before"
                    type="date"
                    name="best_before"
                    value={formData.best_before}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="block text-sm font-medium mb-2">
                    Dietary Restrictions
                  </div>
                  <fieldset
                    className="flex flex-wrap gap-2"
                    aria-label="Dietary Restrictions"
                  >
                    <legend className="sr-only">Dietary Restrictions</legend>
                    {DIET_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className="inline-flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-100"
                      >
                        <input
                          type="checkbox"
                          checked={formData.dietary_restrictions.includes(
                            option.value,
                          )}
                          onChange={() => handleDietChange(option.value)}
                          disabled={isSubmitting}
                          className="rounded"
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </fieldset>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                {editingId ? (
                  <>
                    <button
                      type="button"
                      onClick={handleUpdate}
                      disabled={isSubmitting}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={isSubmitting}
                      className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400 transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={isSubmitting}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {isSubmitting ? "Adding..." : "Add Food Item"}
                  </button>
                )}
              </div>
            </div>

            {/* Food Items List */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold mb-4">Current Inventory</h2>
              {foodItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No food items added yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {foodItems.map((item) => (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-lg">
                            {item.description}
                          </h3>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            disabled={isSubmitting || deletingId === item.id}
                            className="text-blue-600 hover:underline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            disabled={isSubmitting || deletingId !== null}
                            className="text-red-600 hover:underline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingId === item.id
                              ? "Archiving..."
                              : "Archive"}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Total:</span>
                          <span className="font-medium ml-1">
                            {item.total_quantity} {item.unit_label}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Available:</span>
                          <span className="font-medium ml-1 text-green-600">
                            {item.available_quantity} {item.unit_label}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Reserved:</span>
                          <span className="font-medium ml-1 text-orange-600">
                            {item.reserved_quantity} {item.unit_label}
                          </span>
                        </div>
                        {item.best_before && (
                          <div>
                            <span className="text-gray-500">Best Before:</span>
                            <span className="font-medium ml-1">
                              {new Date(item.best_before).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {item.dietary_restrictions &&
                        Array.isArray(item.dietary_restrictions) &&
                        item.dietary_restrictions.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {item.dietary_restrictions.map((diet) => (
                              <span
                                key={diet}
                                className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                              >
                                {DIET_OPTIONS.find((d) => d.value === diet)
                                  ?.label || diet}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Back to Dashboard Button */}
            <div className="text-center mt-8">
              <Link
                href="/business/dashboard"
                className="inline-block bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

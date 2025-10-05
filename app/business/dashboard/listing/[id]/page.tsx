"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Header from "@/components/header";

interface FoodItem {
  id: number;
  name: string;
  amount: string;
}

export default function LocationView() {
  const { id } = useParams();
  const router = useRouter();

  // Mock: in real app, you'd fetch location info from API
  const locationName = `Location #${id}`;

  const [foodItems, setFoodItems] = useState<FoodItem[]>([
    { id: 1, name: "Apples", amount: "20 lbs" },
    { id: 2, name: "Rice", amount: "10 bags" },
  ]);

  const [formData, setFormData] = useState({ name: "", amount: "" });
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = () => {
    if (!formData.name.trim() || !formData.amount.trim()) {
      alert("Please fill in both fields.");
      return;
    }

    const newItem: FoodItem = {
      id: Date.now(),
      name: formData.name,
      amount: formData.amount,
    };

    setFoodItems((prev) => [...prev, newItem]);
    setFormData({ name: "", amount: "" });
  };

  const handleEdit = (item: FoodItem) => {
    setEditingId(item.id);
    setFormData({ name: item.name, amount: item.amount });
  };

  const handleSave = () => {
    setFoodItems((prev) =>
      prev.map((item) =>
        item.id === editingId ? { ...item, ...formData } : item,
      ),
    );
    setEditingId(null);
    setFormData({ name: "", amount: "" });
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this item?")) {
      setFoodItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 flex flex-col px-6 py-12">
        <div className="max-w-3xl mx-auto w-full bg-white shadow-lg rounded-2xl border border-gray-200 p-8">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {locationName}
              </h1>
              <p className="text-gray-500">
                Manage your food items here — add, edit, or delete supplies at
                this location.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/business/dashboard")}
              className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              ← Back to Dashboard
            </button>
          </div>

          {/* Add/Edit Form */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Food item name"
              className="border border-gray-300 rounded-lg px-4 py-2 flex-1"
            />
            <input
              type="text"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Amount (e.g., 5 boxes, 10 kg)"
              className="border border-gray-300 rounded-lg px-4 py-2 flex-1"
            />

            {editingId ? (
              <button
                type="button"
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Save
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Add
              </button>
            )}
          </div>

          {/* Food Items List */}
          <div className="border-t border-gray-200 pt-4">
            {foodItems.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No food items added yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {foodItems.map((item, index) => (
                  <li
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {index + 1}. {item.name}
                      </h3>
                      <p className="text-gray-500 text-sm">{item.amount}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

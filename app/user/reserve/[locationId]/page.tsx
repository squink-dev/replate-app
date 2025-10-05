"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Footer from "@/components/footer";
import Header from "@/components/header";
import Image from "next/image";

// Map food descriptions to icon filenames
const foodIconMap: Record<string, string> = {
  "Apple": "Apple.png",
  "Banana": "banana.png",
  "Carrot": "Carrot.png",
  "Eggs": "egg.png",
  "Donut": "Donut.jpg",
  "Grilled Bagel": "GrilledBagel.png",
  "Hashbrown": "Hashbrown.png",
  "Milk": "Milk.png",
  "Tuna Sandwich": "TunaSandwich.png",
  "Wrap": "Wrap.png",
  "Yogurt": "Yogurt.png",
};

interface FoodItem {
  id: number;
  description: string;
  total_quantity: number;
  available_quantity: number;
  reserved_quantity: number;
  best_before: string;
  dietary_restrictions: string[] | null;
  unit_label: string;
  icon_url: string | null;
  created_at: string;
}

interface ReservationItem {
  foodItemId: number;
  quantity: number;
}

export default function UserReservePage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const router = useRouter();
  const [locationId, setLocationId] = useState<string>("");
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservationItems, setReservationItems] = useState<ReservationItem[]>([]);
  const [locationInfo, setLocationInfo] = useState<{
    businessName: string;
    locationName: string;
    address: string;
  } | null>(null);

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setLocationId(resolvedParams.locationId);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    const fetchFoodItems = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/locations/${locationId}/food-items`);

        if (!response.ok) {
          throw new Error("Failed to fetch food items");
        }

        const data = await response.json();
        setFoodItems(data.foodItems || []);

        // You might want to fetch location info separately
        // For now, we'll use placeholder data
        setLocationInfo({
          businessName: "Business Name",
          locationName: "Location Name",
          address: "Address",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (locationId) {
      fetchFoodItems();
    }
  }, [locationId]);

  // filter out food items with zero available quantity
  const updateReservationQuantity = (foodItemId: number, quantity: number) => {
    setReservationItems((prev) => {
      const existing = prev.find((item) => item.foodItemId === foodItemId);
      if (existing) {
        if (quantity === 0) {
          return prev.filter((item) => item.foodItemId !== foodItemId);
        }
        return prev.map((item) =>
          item.foodItemId === foodItemId ? { ...item, quantity } : item,
        );
      } else if (quantity > 0) {
        return [...prev, { foodItemId, quantity }];
      }
      return prev;
    });
  };

  const getReservedQuantity = (foodItemId: number) => {
    const item = reservationItems.find(
      (item) => item.foodItemId === foodItemId,
    );
    return item ? item.quantity : 0;
  };

  const handleReservation = async () => {
    if (reservationItems.length === 0) {
      alert("Please select at least one item to reserve.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locationId,
          items: reservationItems,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create reservation");
      }

      // Success! Show a success message and redirect
      alert(
        `Reservation created successfully! Your reservation ID is ${data.reservation.id}. It expires in 24 hours.`,
      );

      // Redirect to the user view page or a confirmation page
      router.push("/user/view");
    } catch (err) {
      console.error("Reservation error:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to create reservation. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const getTotalItems = () => {
    return reservationItems.reduce((total, item) => total + item.quantity, 0);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading food items...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 cursor-pointer"
            >
              Go Back
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-green-600 hover:text-green-700 mb-4 flex items-center gap-2 cursor-pointer"
            >
              ← Back to Search
            </button>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Reserve Food Items
            </h1>
            {locationInfo && <div className="text-gray-600"></div>}
          </div>

          {/* Food Items List */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Available Food Items
            </h2>

            {foodItems.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No food items available at this location.
              </p>
            ) : (
              <div className="space-y-4">
                {foodItems.map((item) => {
                  const reservedQty = getReservedQuantity(item.id);
                  const maxReservable = item.available_quantity;

                  return (
                    <div
                      key={item.id}
                      className="border border-gray-200 rounded-lg p-4 pb-3"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {foodIconMap[item.description] && (
                              <Image
                                src={`/food_Icons/${foodIconMap[item.description]}`}
                                alt={item.description}
                                width={32}
                                height={32}
                                className="object-contain"
                              />
                            )}
                            <h3 className="font-medium text-gray-900 mb-1">
                              {item.description}
                            </h3>
                          </div>
                          <div className="flex gap-4 text-sm text-gray-600">
                            <span>
                              Available: {item.available_quantity}{" "}
                              {item.unit_label}
                            </span>
                            <span>
                              Total: {item.total_quantity} {item.unit_label}
                            </span>
                          </div>
                          {item.dietary_restrictions &&
                            item.dietary_restrictions.length > 0 &&
                            item.dietary_restrictions.some(
                              (restriction) =>
                                restriction.toLowerCase() !== "none",
                            ) && (
                              <div className="mt-2">
                                <div className="flex gap-2 flex-wrap">
                                  {item.dietary_restrictions
                                    .filter(
                                      (restriction) =>
                                        restriction.toLowerCase() !== "none",
                                    )
                                    .map((restriction) => (
                                      <span
                                        key={restriction}
                                        className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded"
                                      >
                                        {restriction}
                                      </span>
                                    ))}
                                </div>
                              </div>
                            )}
                        </div>

                        {/* Quantity Selector */}
                        {maxReservable > 0 ? (
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                updateReservationQuantity(
                                  item.id,
                                  Math.max(0, reservedQty - 1),
                                )
                              }
                              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 cursor-pointer disabled:cursor-not-allowed"
                              disabled={reservedQty <= 0}
                            >
                              -
                            </button>
                            <span className="w-12 text-center font-medium">
                              {reservedQty}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateReservationQuantity(
                                  item.id,
                                  Math.min(maxReservable, reservedQty + 1),
                                )
                              }
                              className="w-8 h-8 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center text-white cursor-pointer disabled:cursor-not-allowed"
                              disabled={reservedQty >= maxReservable}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <span className="text-red-600 text-sm">
                            Out of stock
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reservation Summary */}
          {reservationItems.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Reservation Summary
              </h2>
              <div className="space-y-2 mb-4">
                {reservationItems.map((item) => {
                  const foodItem = foodItems.find(
                    (fi) => fi.id === item.foodItemId,
                  );
                  return (
                    <div
                      key={item.foodItemId}
                      className="flex justify-between text-sm"
                    >
                      <span>{foodItem?.description}</span>
                      <span>x{item.quantity}</span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium">Total Items:</span>
                  <span className="font-medium">{getTotalItems()}</span>
                </div>
                <button
                  type="button"
                  onClick={handleReservation}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating Reservation..." : "Confirm Reservation"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Footer from "@/components/footer";
import Header from "@/components/header";

interface ReservationItem {
  quantity: number;
  food_item: {
    description: string;
    unit_label: string;
  };
}

interface Reservation {
  id: string;
  created_at: string;
  expires_at: string;
  status: "active" | "picked_up" | "canceled" | "expired";
  pickup_point: {
    name: string;
    location: {
      name: string;
      address: string;
      business: {
        business_name: string;
      };
    };
  };
  reservation_items: ReservationItem[];
}

export default function UserReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/reservations");

      if (!response.ok) {
        throw new Error("Failed to fetch reservations");
      }

      const data = await response.json();
      setReservations(data.reservations || []);
    } catch (err) {
      console.error("Error fetching reservations:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm("Are you sure you want to cancel this reservation?")) {
      return;
    }

    setCancelingId(reservationId);

    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to cancel reservation");
      }

      // Refresh the reservations list
      await fetchReservations();

      // Show success message (you could use a toast notification here)
      alert("Reservation canceled successfully");
    } catch (err) {
      console.error("Error canceling reservation:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to cancel reservation. Please try again.",
      );
    } finally {
      setCancelingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "picked_up":
        return "bg-blue-100 text-blue-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reservations...</p>
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

  const activeReservations = reservations.filter((r) => r.status === "active");
  const pastReservations = reservations.filter((r) => r.status !== "active");

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Reservations
            </h1>
            <p className="text-gray-600">
              View and manage your food item reservations
            </p>
          </div>

          {reservations.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Reservations Yet
              </h3>
              <p className="text-gray-600 mb-6">
                You haven't made any food reservations yet.
              </p>
              <button
                type="button"
                onClick={() => router.push("/user/view")}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium cursor-pointer"
              >
                Browse Available Food
              </button>
            </div>
          ) : (
            <>
              {/* Active Reservations */}
              {activeReservations.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Active Reservations
                  </h2>
                  <div className="space-y-4">
                    {activeReservations.map((reservation) => (
                      <div
                        key={reservation.id}
                        className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-600"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {
                                reservation.pickup_point.location.business
                                  .business_name
                              }
                            </h3>
                            <p className="text-sm text-gray-600">
                              {reservation.pickup_point.location.name} •{" "}
                              {reservation.pickup_point.name}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}
                          >
                            {getStatusLabel(reservation.status)}
                          </span>
                        </div>

                        <div className="text-sm text-gray-600 mb-4">
                          <p>{reservation.pickup_point.location.address}</p>
                        </div>

                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Reserved Items:
                          </h4>
                          <div className="space-y-1">
                            {reservation.reservation_items.map((item, idx) => (
                              <div
                                key={`${reservation.id}-item-${idx}`}
                                className="flex justify-between text-sm"
                              >
                                <span className="text-gray-600">
                                  {item.food_item.description}
                                </span>
                                <span className="font-medium text-gray-900">
                                  x{item.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t">
                          <div className="text-sm text-gray-600">
                            <p>Created: {formatDate(reservation.created_at)}</p>
                            <p className="text-red-600 font-medium">
                              Expires: {formatDate(reservation.expires_at)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleCancelReservation(reservation.id)
                            }
                            disabled={cancelingId === reservation.id}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                          >
                            {cancelingId === reservation.id
                              ? "Canceling..."
                              : "Cancel Reservation"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Past Reservations */}
              {pastReservations.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Past Reservations
                  </h2>
                  <div className="space-y-4">
                    {pastReservations.map((reservation) => (
                      <div
                        key={reservation.id}
                        className="bg-white rounded-lg shadow-sm p-6 opacity-75"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {
                                reservation.pickup_point.location.business
                                  .business_name
                              }
                            </h3>
                            <p className="text-sm text-gray-600">
                              {reservation.pickup_point.location.name}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}
                          >
                            {getStatusLabel(reservation.status)}
                          </span>
                        </div>

                        <div className="mb-4">
                          <div className="space-y-1">
                            {reservation.reservation_items.map((item, idx) => (
                              <div
                                key={`${reservation.id}-past-item-${idx}`}
                                className="flex justify-between text-sm"
                              >
                                <span className="text-gray-600">
                                  {item.food_item.description}
                                </span>
                                <span className="font-medium text-gray-900">
                                  x{item.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="text-sm text-gray-600">
                          <p>Created: {formatDate(reservation.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

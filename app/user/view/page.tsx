"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Footer from "@/components/footer";
import { GoogleMap } from "@/components/GoogleMap";
import Header from "@/components/header";

interface Location {
  address: string;
  available_item_count: number;
  available_total_quantity: number;
  business_id: string;
  business_name: string;
  distance_km: number;
  items: unknown;
  location_id: string;
  location_name: string;
  pickup_point_id: string;
  pickup_point_name: string;
}

export default function UserView() {
  const router = useRouter();
  const [locationInput, setLocationInput] = useState("");
  const [businesses, setBusinesses] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [geoLoading, setGeoLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [mapsApiKey, setMapsApiKey] = useState<string>("");
  const [radiusKm, setRadiusKm] = useState("25");

  const searchByCoordinates = useCallback(
    async (lat: number, lon: number) => {
      setLoading(true);
      setError("");
      setBusinesses([]);

      try {
        const radius = Number(radiusKm) || 25;
        const nearbyResponse = await fetch(
          `/api/locations/nearby?lat=${lat}&lon=${lon}&limit=20&radius_km=${radius}`
        );
        const nearbyData = await nearbyResponse.json();

        if (!nearbyData.success) {
          setError("Unable to find nearby businesses");
          return;
        }

        const availableBusinesses = (nearbyData.locations || []).filter(
          (business: Location) =>
            business.available_total_quantity > 0 && business.available_item_count > 0
        );

        setBusinesses(availableBusinesses);
      } catch (err) {
        console.error("Search error:", err);
        setError("An error occurred while searching. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [radiusKm]
  );

  const handleSearch = async () => {
    if (!locationInput.trim()) {
      setError("Please enter a location");
      return;
    }

    setLoading(true);
    setError("");
    setBusinesses([]);

    try {
      const geocodeResponse = await fetch(`/api/geocode?address=${encodeURIComponent(locationInput)}`);
      const geocodeData = await geocodeResponse.json();

      if (!geocodeData.success) {
        setError("Unable to find location. Please try a different address.");
        return;
      }

      setUserLocation({ lat: geocodeData.latitude, lon: geocodeData.longitude });
      await searchByCoordinates(geocodeData.latitude, geocodeData.longitude);
    } catch (err) {
      console.error("Search error:", err);
      setError("An error occurred while searching. Please try again.");
    }
  };

  const getCurrentLocation = useCallback(() => {
    setGeoLoading(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      setGeoLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lon: longitude });
        setGeoLoading(false);
        await searchByCoordinates(latitude, longitude);
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Unable to get your location.";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enter your location manually.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable. Please enter your location manually.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please enter your location manually.";
            break;
        }

        setError(errorMessage);
        setGeoLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, [searchByCoordinates]);

  useEffect(() => {
    getCurrentLocation();
    fetch("/api/maps/config")
      .then((response) => response.json())
      .then((data) => {
        if (data.apiKey) setMapsApiKey(data.apiKey);
      })
      .catch((error) => console.error("Failed to fetch Maps API key:", error));
  }, [getCurrentLocation]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Food Near You</h1>
            <p className="text-gray-600">Search for available food items in your area</p>
          </div>

          {geoLoading && <p className="text-green-600 text-center">Getting your current location...</p>}
          {userLocation && !geoLoading && (
            <p className="text-green-600 text-sm text-center pb-2">Using your current location</p>
          )}

          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter a location (address, city, zip code)"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={loading}
              />

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <label
                    htmlFor="radiusKm"
                    className="text-sm font-medium text-gray-700 whitespace-nowrap"
                  >
                    Search Radius:
                  </label>
                  <select
                    id="radiusKm"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={loading}
                  >
                    <option value="5">5 km</option>
                    <option value="10">10 km</option>
                    <option value="15">15 km</option>
                    <option value="25">25 km</option>
                    <option value="50">50 km</option>
                    <option value="100">100 km</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium w-full sm:w-auto"
                >
                  {loading ? "Searching..." : "Search"}
                </button>
              </div>
            </div>

            {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
          </div>

          {/* Results + Map stay identical */}
          {businesses.length > 0 && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Found {businesses.length}{" "}
                  {businesses.length === 1 ? "location" : "locations"} with available food
                </h2>

                {mapsApiKey && userLocation && (
                  <div className="mb-6">
                    <GoogleMap
                      userLocation={userLocation}
                      businesses={businesses}
                      apiKey={mapsApiKey}
                      onReserveClick={(locationId) =>
                        router.push(`/user/reserve/${locationId}`)
                      }
                    />
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      Click on markers to see business details • {businesses.length} locations shown
                    </p>
                  </div>
                )}

                {!mapsApiKey && userLocation && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      Map view unavailable - showing list view only
                    </p>
                  </div>
                )}
              </div>

              <div>
                <div className="grid gap-4">
                  {businesses.map((business) => (
                    <div
                      key={business.location_id}
                      className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-xl font-semibold text-gray-900">
                          {business.business_name}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {business.distance_km.toFixed(1)} km away
                        </span>
                      </div>

                      <div className="text-gray-600 mb-4">
                        <h5 className="font-medium">{business.location_name}</h5>
                        <p className="text-sm">{business.address}</p>
                      </div>

                      <div className="flex gap-4 text-sm mb-4">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                          {business.available_item_count} food items available
                        </span>
                      </div>

                      {business.pickup_point_name && (
                        <p className="text-sm text-gray-500 mb-4">
                          Pickup point: {business.pickup_point_name}
                        </p>
                      )}

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/user/reserve/${business.location_id}`)
                          }
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium cursor-pointer"
                          disabled={business.available_item_count === 0}
                        >
                          {business.available_item_count > 0
                            ? "Reserve Items"
                            : "No Items Available"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!loading && !geoLoading && businesses.length === 0 && (userLocation || locationInput) && !error && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-600">
                No locations found with available food within {radiusKm} km.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Try increasing the search radius or searching a different location.
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Footer from "@/components/footer";
import { GoogleMap } from "@/components/GoogleMap";
import Header from "@/components/header";

interface Location {
  address_line1: string;
  available_item_count: number;
  available_total_quantity: number;
  business_id: string;
  business_name: string;
  city: string;
  distance_km: number;
  items: unknown;
  location_id: string;
  location_name: string;
  pickup_point_id: string;
  pickup_point_name: string;
  postal_code: string;
  region: string;
}

export default function UserView() {
  const [locationInput, setLocationInput] = useState("");
  const [businesses, setBusinesses] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [geoLoading, setGeoLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [mapsApiKey, setMapsApiKey] = useState<string>("");

  const searchByCoordinates = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setError("");
    setBusinesses([]);

    try {
      const nearbyResponse = await fetch(
        `/api/locations/nearby?lat=${lat}&lon=${lon}&limit=20`,
      );
      const nearbyData = await nearbyResponse.json();

      if (!nearbyData.success) {
        setError("Unable to find nearby businesses");
        return;
      }

      setBusinesses(nearbyData.locations || []);
    } catch (err) {
      console.error("Search error:", err);
      setError("An error occurred while searching. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = async () => {
    if (!locationInput.trim()) {
      setError("Please enter a location");
      return;
    }

    setLoading(true);
    setError("");
    setBusinesses([]);

    try {
      // First geocode the address
      const geocodeResponse = await fetch(
        `/api/geocode?address=${encodeURIComponent(locationInput)}`,
      );
      const geocodeData = await geocodeResponse.json();

      if (!geocodeData.success) {
        setError("Unable to find location. Please try a different address.");
        return;
      }

      // Update user location and search
      setUserLocation({
        lat: geocodeData.latitude,
        lon: geocodeData.longitude,
      });
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
            errorMessage =
              "Location access denied. Please enter your location manually.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage =
              "Location information unavailable. Please enter your location manually.";
            break;
          case error.TIMEOUT:
            errorMessage =
              "Location request timed out. Please enter your location manually.";
            break;
        }

        setError(errorMessage);
        setGeoLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      },
    );
  }, [searchByCoordinates]);

  useEffect(() => {
    getCurrentLocation();

    // Fetch Google Maps API key
    fetch("/api/maps/config")
      .then((response) => response.json())
      .then((data) => {
        if (data.apiKey) {
          setMapsApiKey(data.apiKey);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch Maps API key:", error);
      });
  }, [getCurrentLocation]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <>
      <Header />
      <div className="container mx-auto p-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Find Food Near You
        </h1>

        {geoLoading && (
          <div className="text-center mb-6">
            <p className="text-green-600">
              📍 Getting your current location...
            </p>
          </div>
        )}

        {userLocation && !geoLoading && (
          <div className="text-center mb-4">
            <p className="text-green-600 text-sm">
              ✅ Using your current location
            </p>
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={loading || geoLoading}
              className="text-green-600 hover:text-green-800 text-sm underline mt-1 disabled:text-gray-400"
            >
              Refresh location
            </button>
          </div>
        )}

        <div className="mb-8">
          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="text"
              placeholder="Or enter a different location (address, city, zip code)"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={loading}
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
          {error && <p className="text-red-600 text-center mt-2">{error}</p>}
        </div>

        {businesses.length > 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Found {businesses.length} businesses with available food
              </h2>

              {/* Google Maps Integration */}
              {mapsApiKey && userLocation && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-700 mb-3">
                    🗺️ Map View
                  </h3>
                  <div className="border border-orange-200 bg-orange-50 p-4 rounded-lg mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-orange-600">⚠️</span>
                      <div>
                        <p className="text-orange-800 font-medium text-sm">
                          Maps JavaScript API Not Enabled
                        </p>
                        <p className="text-orange-700 text-xs mt-1">
                          Enable "Maps JavaScript API" in Google Cloud Console
                          to see the interactive map
                        </p>
                        <a
                          href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-600 text-xs underline hover:text-orange-800 mt-1 inline-block"
                        >
                          → Enable Maps JavaScript API
                        </a>
                      </div>
                    </div>
                  </div>
                  <GoogleMap
                    userLocation={userLocation}
                    businesses={businesses}
                    apiKey={mapsApiKey}
                  />
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Click on markers to see business details •{" "}
                    {businesses.length} locations shown
                  </p>
                </div>
              )}

              {/* Fallback message if no API key */}
              {!mapsApiKey && userLocation && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    📍 Map view unavailable - showing list view only
                  </p>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">
                📋 List View
              </h3>

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

                    <div className="text-gray-600 mb-2">
                      <h5 className="font-medium">{business.location_name}</h5>
                      <p className="text-sm">
                        {business.address_line1}, {business.city}
                        {business.postal_code && `, ${business.postal_code}`}
                      </p>
                    </div>

                    <div className="flex gap-4 text-sm">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                        {business.available_item_count} items available
                      </span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Total quantity: {business.available_total_quantity}
                      </span>
                    </div>

                    {business.pickup_point_name && (
                      <p className="text-sm text-gray-500 mt-2">
                        Pickup point: {business.pickup_point_name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!loading &&
          !geoLoading &&
          businesses.length === 0 &&
          (userLocation || locationInput) &&
          !error && (
            <div className="text-center py-8">
              <p className="text-gray-600">
                No businesses found with available food in this area.
              </p>
            </div>
          )}
      </div>
      <Footer />
    </>
  );
}

"use client";

import { Status, Wrapper } from "@googlemaps/react-wrapper";
import { useEffect, useRef, useState } from "react";

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

interface GoogleMapProps {
  userLocation: { lat: number; lon: number } | null;
  businesses: Location[];
  apiKey: string;
  onReserveClick?: (locationId: string) => void;
}

const MapComponent: React.FC<{
  userLocation: { lat: number; lon: number } | null;
  businesses: Location[];
  onReserveClick?: (locationId: string) => void;
}> = ({ userLocation, businesses, onReserveClick }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map>();
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow>();

  useEffect(() => {
    if (ref.current && !map) {
      const newMap = new google.maps.Map(ref.current, {
        center: userLocation
          ? { lat: userLocation.lat, lng: userLocation.lon }
          : { lat: 51.0447, lng: -114.0719 }, // Default to Calgary
        zoom: 12,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });
      setMap(newMap);
      setInfoWindow(new google.maps.InfoWindow());
    }
  }, [map, userLocation]);

  // Clear existing markers when businesses change
  // biome-ignore lint/correctness/useExhaustiveDependencies: businesses dependency is needed to clear markers when list changes
  useEffect(() => {
    // Clear all existing markers from the map
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    // Reset markers array
    markersRef.current = [];
  }, [businesses]);

  // Add user location marker
  useEffect(() => {
    if (map && userLocation) {
      new google.maps.Marker({
        position: { lat: userLocation.lat, lng: userLocation.lon },
        map,
        title: "Your Location",
        icon: {
          url:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8" fill="#4285f4" stroke="white" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12),
        },
      });
    }
  }, [map, userLocation]);

  // Add business markers
  useEffect(() => {
    if (map && businesses.length > 0) {
      const newMarkers = businesses
        .filter((business) => business.address_line1) // Only show businesses with addresses
        .map((business) => {
          // Use Google's geocoding to get precise coordinates for the address
          const geocoder = new google.maps.Geocoder();
          const fullAddress = `${business.address_line1}, ${business.city}${business.postal_code ? `, ${business.postal_code}` : ""}`;

          return new Promise<google.maps.Marker | null>((resolve) => {
            geocoder.geocode({ address: fullAddress }, (results, status) => {
              if (status === "OK" && results && results[0]) {
                const marker = new google.maps.Marker({
                  position: results[0].geometry.location,
                  map,
                  title: business.business_name,
                  icon: {
                    url:
                      "data:image/svg+xml;charset=UTF-8," +
                      encodeURIComponent(`
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 2C10.486 2 6 6.486 6 12c0 7.5 10 18 10 18s10-10.5 10-18c0-5.514-4.486-10-10-10z" fill="#ea4335"/>
                        <circle cx="16" cy="12" r="4" fill="white"/>
                      </svg>
                    `),
                    scaledSize: new google.maps.Size(32, 32),
                    anchor: new google.maps.Point(16, 32),
                  },
                });

                // Add click listener to show info window
                marker.addListener("click", () => {
                  if (infoWindow) {
                    const content = `
                      <div style="padding: 8px; max-width: 300px;">
                        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1f2937;">
                          ${business.business_name}
                        </h3>
                        <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280;">
                          <strong>${business.location_name}</strong>
                        </p>
                        <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">
                          ${business.address_line1}, ${business.city}
                          ${business.postal_code ? `, ${business.postal_code}` : ""}
                        </p>
                        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                          <span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 12px; font-size: 11px;">
                            ${business.available_item_count} food items available
                          </span>
                        </div>
                        <p style="margin: 0 0 12px 0; font-size: 11px; color: #9ca3af;">
                          ${business.distance_km.toFixed(1)} km away
                          ${business.pickup_point_name ? ` • ${business.pickup_point_name}` : ""}
                        </p>
                        ${
                          business.available_item_count > 0
                            ? `
                          <button 
                            id="reserve-btn-${business.location_id}"
                            style="background: #16a34a; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 12px; cursor: pointer; width: 100%;"
                            onmouseover="this.style.background='#15803d'"
                            onmouseout="this.style.background='#16a34a'"
                          >
                            Reserve Items
                          </button>
                        `
                            : `
                          <button 
                            style="background: #9ca3af; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 12px; cursor: not-allowed; width: 100%;"
                            disabled
                          >
                            No Items Available
                          </button>
                        `
                        }
                      </div>
                    `;
                    infoWindow.setContent(content);
                    infoWindow.open(map, marker);

                    // Add click listener to the reserve button
                    if (business.available_item_count > 0 && onReserveClick) {
                      setTimeout(() => {
                        const reserveBtn = document.getElementById(
                          `reserve-btn-${business.location_id}`,
                        );
                        if (reserveBtn) {
                          reserveBtn.addEventListener("click", () => {
                            onReserveClick(business.location_id);
                            infoWindow.close();
                          });
                        }
                      }, 100);
                    }
                  }
                });

                resolve(marker);
              } else {
                console.warn(
                  `Geocoding failed for ${business.business_name}: ${status}`,
                );
                resolve(null);
              }
            });
          });
        });

      Promise.all(newMarkers).then((resolvedMarkers) => {
        const validMarkers = resolvedMarkers.filter(
          (marker) => marker !== null,
        ) as google.maps.Marker[];
        markersRef.current = validMarkers;
      });
    }
  }, [map, businesses, infoWindow, onReserveClick]);

  // Fit map to show all markers
  // biome-ignore lint/correctness/useExhaustiveDependencies: businesses.length dependency is needed to re-fit bounds
  useEffect(() => {
    // Use a timeout to ensure markers have been created
    const timeoutId = setTimeout(() => {
      if (map && markersRef.current.length > 0 && userLocation) {
        const bounds = new google.maps.LatLngBounds();

        // Include user location
        bounds.extend({ lat: userLocation.lat, lng: userLocation.lon });

        // Include all business markers
        markersRef.current.forEach((marker) => {
          const position = marker.getPosition();
          if (position) {
            bounds.extend(position);
          }
        });

        map.fitBounds(bounds);

        // Set a maximum zoom level to avoid zooming in too much
        const listener = google.maps.event.addListener(map, "idle", () => {
          const currentZoom = map.getZoom();
          if (currentZoom && currentZoom > 15) {
            map.setZoom(15);
          }
          google.maps.event.removeListener(listener);
        });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [map, userLocation, businesses.length]);

  return (
    <div
      ref={ref}
      style={{ width: "100%", height: "400px", borderRadius: "8px" }}
    />
  );
};

const render = (status: Status): React.ReactElement => {
  switch (status) {
    case Status.LOADING:
      return (
        <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      );
    case Status.FAILURE:
      return (
        <div className="flex items-center justify-center h-96 bg-red-50 rounded-lg border border-red-200">
          <div className="text-center p-6">
            <div className="text-red-600 text-xl mb-3">🗺️</div>
            <h3 className="text-red-600 font-semibold mb-2">
              Google Maps Not Available
            </h3>
            <p className="text-sm text-red-600 mb-3">
              The Google Maps JavaScript API needs to be enabled.
            </p>
            <div className="text-xs text-red-500 space-y-1">
              <p>To fix this:</p>
              <p>1. Go to Google Cloud Console</p>
              <p>2. Enable "Maps JavaScript API"</p>
              <p>3. Also enable "Geocoding API"</p>
            </div>
            <p className="text-xs text-gray-600 mt-3">
              The business list below still works normally.
            </p>
          </div>
        </div>
      );
    default:
      return (
        <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
          <p className="text-gray-600">Initializing map...</p>
        </div>
      );
  }
};

export const GoogleMap: React.FC<GoogleMapProps> = ({
  userLocation,
  businesses,
  apiKey,
  onReserveClick,
}) => {
  return (
    <Wrapper apiKey={apiKey} render={render}>
      <MapComponent
        userLocation={userLocation}
        businesses={businesses}
        onReserveClick={onReserveClick}
      />
    </Wrapper>
  );
};

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Address parameter is required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key is not configured" },
        { status: 500 },
      );
    }

    // Call Google Geocoding API
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return NextResponse.json({
        success: true,
        address: data.results[0].formatted_address,
        latitude: location.lat,
        longitude: location.lng,
        location: location,
      });
    } else {
      return NextResponse.json(
        {
          error: "Unable to geocode address",
          status: data.status,
          message: data.error_message || "No results found",
        },
        { status: 404 },
      );
    }
  } catch (error) {
    console.error("Geocoding error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

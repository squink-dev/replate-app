import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Database } from "@/database.types";
import { createClient } from "@/lib/supabase/server";

type DietEnum = Database["public"]["Enums"]["diet_enum"];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Get required parameters
    const latitude = searchParams.get("latitude") || searchParams.get("lat");
    const longitude = searchParams.get("longitude") || searchParams.get("lon");

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: "Both latitude and longitude parameters are required" },
        { status: 400 },
      );
    }

    // Parse coordinates
    const lat = Number.parseFloat(latitude);
    const lon = Number.parseFloat(longitude);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return NextResponse.json(
        { error: "Latitude and longitude must be valid numbers" },
        { status: 400 },
      );
    }

    // Validate coordinate ranges
    if (lat < -90 || lat > 90) {
      return NextResponse.json(
        { error: "Latitude must be between -90 and 90" },
        { status: 400 },
      );
    }

    if (lon < -180 || lon > 180) {
      return NextResponse.json(
        { error: "Longitude must be between -180 and 180" },
        { status: 400 },
      );
    }

    // Get optional parameters
    const radiusKm =
      searchParams.get("radius_km") || searchParams.get("radius");
    const limit = searchParams.get("limit");
    const dietsParam = searchParams.get("diets");

    // Parse optional parameters
    const radius = radiusKm ? Number.parseFloat(radiusKm) : undefined;
    const limitNum = limit ? Number.parseInt(limit, 10) : undefined;

    // Parse diets as array if provided
    let diets: DietEnum[] | undefined;
    if (dietsParam) {
      const dietsArray = dietsParam.split(",").map((d) => d.trim() as DietEnum);
      // Validate diet values
      const validDiets: DietEnum[] = [
        "none",
        "vegetarian",
        "vegan",
        "halal",
        "kosher",
        "gluten_free",
        "dairy_free",
        "nut_free",
        "other",
      ];

      const invalidDiets = dietsArray.filter((d) => !validDiets.includes(d));
      if (invalidDiets.length > 0) {
        return NextResponse.json(
          {
            error: `Invalid diet values: ${invalidDiets.join(", ")}`,
            validDiets,
          },
          { status: 400 },
        );
      }

      diets = dietsArray;
    }

    // Validate optional numeric parameters
    if (radius !== undefined && (Number.isNaN(radius) || radius <= 0)) {
      return NextResponse.json(
        { error: "Radius must be a positive number" },
        { status: 400 },
      );
    }

    if (limitNum !== undefined && (Number.isNaN(limitNum) || limitNum <= 0)) {
      return NextResponse.json(
        { error: "Limit must be a positive integer" },
        { status: 400 },
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Call the RPC function
    const { data, error } = await supabase.rpc(
      "rpc_nearest_locations_with_available_food",
      {
        p_lat: lat,
        p_lon: lon,
        p_radius_km: radius,
        p_limit: limitNum,
        p_diets: diets,
      },
    );

    if (error) {
      console.error("Supabase RPC error:", error);
      return NextResponse.json(
        { error: "Failed to fetch locations", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      locations: data || [],
    });
  } catch (error) {
    console.error("Error fetching nearest locations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get required parameters
    const { latitude, longitude, lat, lon } = body;
    const finalLat = latitude || lat;
    const finalLon = longitude || lon;

    if (finalLat === undefined || finalLon === undefined) {
      return NextResponse.json(
        { error: "Both latitude and longitude are required in request body" },
        { status: 400 },
      );
    }

    // Parse coordinates
    const parsedLat =
      typeof finalLat === "number" ? finalLat : Number.parseFloat(finalLat);
    const parsedLon =
      typeof finalLon === "number" ? finalLon : Number.parseFloat(finalLon);

    if (Number.isNaN(parsedLat) || Number.isNaN(parsedLon)) {
      return NextResponse.json(
        { error: "Latitude and longitude must be valid numbers" },
        { status: 400 },
      );
    }

    // Validate coordinate ranges
    if (parsedLat < -90 || parsedLat > 90) {
      return NextResponse.json(
        { error: "Latitude must be between -90 and 90" },
        { status: 400 },
      );
    }

    if (parsedLon < -180 || parsedLon > 180) {
      return NextResponse.json(
        { error: "Longitude must be between -180 and 180" },
        { status: 400 },
      );
    }

    // Get optional parameters
    const { radius_km, radius, limit, diets } = body;
    const finalRadius = radius_km || radius;

    // Validate optional parameters
    if (
      finalRadius !== undefined &&
      (typeof finalRadius !== "number" || finalRadius <= 0)
    ) {
      return NextResponse.json(
        { error: "Radius must be a positive number" },
        { status: 400 },
      );
    }

    if (
      limit !== undefined &&
      (typeof limit !== "number" || limit <= 0 || !Number.isInteger(limit))
    ) {
      return NextResponse.json(
        { error: "Limit must be a positive integer" },
        { status: 400 },
      );
    }

    // Validate diets if provided
    if (diets !== undefined) {
      if (!Array.isArray(diets)) {
        return NextResponse.json(
          { error: "Diets must be an array" },
          { status: 400 },
        );
      }

      const validDiets: DietEnum[] = [
        "none",
        "vegetarian",
        "vegan",
        "halal",
        "kosher",
        "gluten_free",
        "dairy_free",
        "nut_free",
        "other",
      ];

      const invalidDiets = diets.filter(
        (d: string) => !validDiets.includes(d as DietEnum),
      );
      if (invalidDiets.length > 0) {
        return NextResponse.json(
          {
            error: `Invalid diet values: ${invalidDiets.join(", ")}`,
            validDiets,
          },
          { status: 400 },
        );
      }
    }

    // Create Supabase client
    const supabase = await createClient();

    // Call the RPC function
    const { data, error } = await supabase.rpc(
      "rpc_nearest_locations_with_available_food",
      {
        p_lat: parsedLat,
        p_lon: parsedLon,
        p_radius_km: finalRadius,
        p_limit: limit,
        p_diets: diets,
      },
    );

    if (error) {
      console.error("Supabase RPC error:", error);
      return NextResponse.json(
        { error: "Failed to fetch locations", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      locations: data || [],
    });
  } catch (error) {
    console.error("Error fetching nearest locations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

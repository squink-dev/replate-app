import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Database } from "@/database.types";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 },
      );
    }

    // Get the business_id from query params (optional)
    const searchParams = request.nextUrl.searchParams;
    const businessId = searchParams.get("business_id");

    let query = supabase
      .from("business_locations")
      .select("*")
      .eq("archived", false)
      .order("created_at", { ascending: false });

    if (businessId) {
      // If business_id is provided, filter by it
      query = query.eq("business_id", businessId);
    } else {
      // Otherwise, get the business profile for the current user
      const { data: businessProfile, error: profileError } = await supabase
        .from("business_profiles")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (profileError || !businessProfile) {
        return NextResponse.json(
          { error: "Business profile not found" },
          { status: 404 },
        );
      }

      query = query.eq("business_id", businessProfile.id);
    }

    const { data: locations, error } = await query;

    if (error) {
      console.error("Error fetching locations:", error);
      return NextResponse.json(
        { error: "Failed to fetch locations", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      locations: locations || [],
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 },
      );
    }

    // Get the business profile for the current user
    const { data: businessProfile, error: profileError } = await supabase
      .from("business_profiles")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (profileError || !businessProfile) {
      return NextResponse.json(
        { error: "Business profile not found" },
        { status: 404 },
      );
    }

    // Parse the request body
    const body = await request.json();
    const { name, address } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Location name is required" },
        { status: 400 },
      );
    }

    if (!address || !address.trim()) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 },
      );
    }

    // Geocode the address
    const geocodeUrl = `/api/geocode?address=${encodeURIComponent(address)}`;
    const geocodeResponse = await fetch(
      `${request.nextUrl.origin}${geocodeUrl}`,
    );

    if (!geocodeResponse.ok) {
      return NextResponse.json(
        {
          error: "Failed to geocode address. Please provide a valid address.",
        },
        { status: 400 },
      );
    }

    const geocodeData = await geocodeResponse.json();

    if (!geocodeData.success) {
      return NextResponse.json(
        { error: "Invalid address. Please provide a valid address." },
        { status: 400 },
      );
    }

    // Prepare the location data
    const locationData: Database["public"]["Tables"]["business_locations"]["Insert"] =
      {
        business_id: businessProfile.id,
        name: name.trim(),
        address: address.trim(),
        latitude: geocodeData.latitude,
        longitude: geocodeData.longitude,
      };

    // Insert the location
    const { data: newLocation, error: insertError } = await supabase
      .from("business_locations")
      .insert(locationData)
      .select()
      .single();

    if (insertError) {
      console.error("Error creating location:", insertError);
      return NextResponse.json(
        { error: "Failed to create location", details: insertError.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Location created successfully",
        location: newLocation,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

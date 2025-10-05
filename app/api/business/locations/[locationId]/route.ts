import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> },
) {
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

    const { locationId } = await params;
    const body = await request.json();
    const { name, address } = body;

    if (!name || !address) {
      return NextResponse.json(
        { error: "Name and address are required" },
        { status: 400 },
      );
    }

    // Get business profile for current user
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

    // Verify the location belongs to this business
    const { data: existingLocation, error: fetchError } = await supabase
      .from("business_locations")
      .select("id, business_id")
      .eq("id", locationId)
      .single();

    if (fetchError || !existingLocation) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 },
      );
    }

    if (existingLocation.business_id !== businessProfile.id) {
      return NextResponse.json(
        { error: "You do not have permission to edit this location" },
        { status: 403 },
      );
    }

    // Geocode the new address
    const geocodeResponse = await fetch(
      `${request.nextUrl.origin}/api/geocode?address=${encodeURIComponent(address)}`,
    );
    const geocodeData = await geocodeResponse.json();

    if (!geocodeData.success) {
      return NextResponse.json(
        { error: "Unable to geocode address. Please check the address." },
        { status: 400 },
      );
    }

    // Update the location
    const { data: updatedLocation, error: updateError } = await supabase
      .from("business_locations")
      .update({
        name,
        address,
        latitude: geocodeData.latitude,
        longitude: geocodeData.longitude,
        geom: `POINT(${geocodeData.longitude} ${geocodeData.latitude})`,
      })
      .eq("id", locationId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating location:", updateError);
      return NextResponse.json(
        { error: "Failed to update location", details: updateError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      location: updatedLocation,
    });
  } catch (error) {
    console.error("Error updating location:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> },
) {
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

    const { locationId } = await params;

    // Get business profile for current user
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

    // Verify the location belongs to this business
    const { data: existingLocation, error: fetchError } = await supabase
      .from("business_locations")
      .select("id, business_id")
      .eq("id", locationId)
      .single();

    if (fetchError || !existingLocation) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 },
      );
    }

    if (existingLocation.business_id !== businessProfile.id) {
      return NextResponse.json(
        { error: "You do not have permission to delete this location" },
        { status: 403 },
      );
    }

    // Check if there are any active (non-archived) food items or active reservations at this location
    const { data: pickupPoints } = await supabase
      .from("pickup_points")
      .select("id")
      .eq("location_id", locationId);

    if (pickupPoints && pickupPoints.length > 0) {
      const pickupPointIds = pickupPoints.map((pp) => pp.id);

      // Check for non-archived food items
      const { data: foodItems } = await supabase
        .from("food_items")
        .select("id")
        .in("pickup_point_id", pickupPointIds)
        .eq("archived", false);

      if (foodItems && foodItems.length > 0) {
        return NextResponse.json(
          {
            error:
              "Cannot archive location with active food items. Please archive all food items first.",
          },
          { status: 400 },
        );
      }

      // Check for active reservations
      const { data: activeReservations } = await supabase
        .from("reservations")
        .select("id")
        .in("pickup_point_id", pickupPointIds)
        .eq("status", "active")
        .limit(1);

      if (activeReservations && activeReservations.length > 0) {
        return NextResponse.json(
          {
            error:
              "Cannot archive location with active reservations. Wait for all reservations to be completed first.",
          },
          { status: 400 },
        );
      }
    }

    // Archive the location instead of deleting
    const { error: archiveError } = await supabase
      .from("business_locations")
      .update({ archived: true })
      .eq("id", locationId);

    if (archiveError) {
      console.error("Error archiving location:", archiveError);
      return NextResponse.json(
        { error: "Failed to archive location", details: archiveError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Location archived successfully",
    });
  } catch (error) {
    console.error("Error deleting location:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

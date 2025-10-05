import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> },
) {
  try {
    const { locationId } = await params;

    if (!locationId) {
      return NextResponse.json(
        { error: "Location ID is required" },
        { status: 400 },
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Get pickup points for this location
    const { data: pickupPoints, error: pickupError } = await supabase
      .from("pickup_points")
      .select("id")
      .eq("location_id", locationId);

    if (pickupError) {
      console.error("Error fetching pickup points:", pickupError);
      return NextResponse.json(
        {
          error: "Failed to fetch pickup points",
          details: pickupError.message,
        },
        { status: 500 },
      );
    }

    if (!pickupPoints || pickupPoints.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        foodItems: [],
        message: "No pickup points found for this location",
      });
    }

    const pickupPointIds = pickupPoints.map((pp) => pp.id);

    // Get all food items for these pickup points
    const { data: foodItems, error: foodError } = await supabase
      .from("food_items")
      .select(`
        id,
        description,
        total_quantity,
        available_quantity,
        reserved_quantity,
        best_before,
        dietary_restrictions,
        unit_label,
        icon_url,
        created_at
      `)
      .in("pickup_point_id", pickupPointIds)
      .order("created_at", { ascending: false });

    if (foodError) {
      console.error("Error fetching food items:", foodError);
      return NextResponse.json(
        { error: "Failed to fetch food items", details: foodError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      count: foodItems?.length || 0,
      locationId,
      foodItems: foodItems || [],
    });
  } catch (error) {
    console.error("Error fetching food items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

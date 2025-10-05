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

    // Get location details
    const { data: location, error: locationError } = await supabase
      .from("business_locations")
      .select("id, name, address, pickup_points(id, name, is_default)")
      .eq("id", locationId)
      .single();

    if (locationError || !location) {
      console.error("Error fetching location:", locationError);
      return NextResponse.json(
        { error: "Location not found", details: locationError?.message },
        { status: 404 },
      );
    }

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

    // Get all food items for these pickup points (exclude archived)
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
        created_at,
        pickup_point_id,
        pickup_points!inner(id, name)
      `)
      .in("pickup_point_id", pickupPointIds)
      .eq("archived", false)
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
      location: {
        id: location.id,
        name: location.name,
        address: location.address,
        pickup_points: location.pickup_points || [],
      },
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> },
) {
  try {
    const { locationId } = await params;
    const body = await request.json();

    if (!locationId) {
      return NextResponse.json(
        { error: "Location ID is required" },
        { status: 400 },
      );
    }

    const {
      description,
      total_quantity,
      unit_label,
      pickup_point_id,
      dietary_restrictions,
      best_before,
    } = body;

    if (!description || !total_quantity || !unit_label || !pickup_point_id) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: description, total_quantity, unit_label, pickup_point_id",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Verify the pickup point belongs to this location and the business owns it
    const { data: pickupPoint, error: ppError } = await supabase
      .from("pickup_points")
      .select("id, location_id, business_locations!inner(business_id)")
      .eq("id", pickup_point_id)
      .eq("location_id", locationId)
      .single();

    if (ppError || !pickupPoint) {
      return NextResponse.json(
        { error: "Invalid pickup point or location" },
        { status: 403 },
      );
    }

    // Create the food item
    const { data: newItem, error: insertError } = await supabase
      .from("food_items")
      .insert({
        description,
        total_quantity: Number(total_quantity),
        reserved_quantity: 0,
        unit_label,
        pickup_point_id,
        dietary_restrictions: dietary_restrictions || [],
        best_before: best_before || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating food item:", insertError);
      return NextResponse.json(
        { error: "Failed to create food item", details: insertError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      foodItem: newItem,
    });
  } catch (error) {
    console.error("Error creating food item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> },
) {
  try {
    const { locationId } = await params;
    const body = await request.json();

    if (!locationId) {
      return NextResponse.json(
        { error: "Location ID is required" },
        { status: 400 },
      );
    }

    const {
      id,
      description,
      total_quantity,
      unit_label,
      pickup_point_id,
      dietary_restrictions,
      best_before,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Food item ID is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Verify the food item exists and belongs to this location
    const { data: existingItem, error: fetchError } = await supabase
      .from("food_items")
      .select(
        "id, reserved_quantity, available_quantity, pickup_point_id, pickup_points!inner(location_id)",
      )
      .eq("id", id)
      .single();

    if (fetchError || !existingItem) {
      return NextResponse.json(
        { error: "Food item not found" },
        { status: 404 },
      );
    }

    // Check if the pickup point belongs to the correct location
    const pickupPointData = existingItem.pickup_points as unknown as {
      location_id: string;
    };
    if (pickupPointData.location_id !== locationId) {
      return NextResponse.json(
        { error: "Food item does not belong to this location" },
        { status: 403 },
      );
    }

    // Build updates object (available_quantity is a generated column, so don't update it)
    const updates: {
      description?: string;
      unit_label?: string;
      dietary_restrictions?: string[];
      best_before?: string | null;
      total_quantity?: number;
      pickup_point_id?: string;
    } = {
      description,
      unit_label,
      dietary_restrictions,
      best_before: best_before || null,
    };

    if (total_quantity !== undefined) {
      updates.total_quantity = Number(total_quantity);
    }

    if (pickup_point_id && pickup_point_id !== existingItem.pickup_point_id) {
      // Verify new pickup point belongs to this location
      const { data: newPickupPoint, error: ppError } = await supabase
        .from("pickup_points")
        .select("id")
        .eq("id", pickup_point_id)
        .eq("location_id", locationId)
        .single();

      if (ppError || !newPickupPoint) {
        return NextResponse.json(
          { error: "Invalid pickup point for this location" },
          { status: 400 },
        );
      }

      updates.pickup_point_id = pickup_point_id;
    }

    const { data: updatedItem, error: updateError } = await supabase
      .from("food_items")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating food item:", updateError);
      return NextResponse.json(
        { error: "Failed to update food item", details: updateError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      foodItem: updatedItem,
    });
  } catch (error) {
    console.error("Error updating food item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> },
) {
  try {
    const { locationId } = await params;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!locationId || !id) {
      return NextResponse.json(
        { error: "Location ID and Food item ID are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Verify the food item exists and belongs to this location
    const { data: existingItem, error: fetchError } = await supabase
      .from("food_items")
      .select("id, reserved_quantity, pickup_points!inner(location_id)")
      .eq("id", id)
      .single();

    if (fetchError || !existingItem) {
      return NextResponse.json(
        { error: "Food item not found" },
        { status: 404 },
      );
    }

    // Check if the pickup point belongs to the correct location
    const pickupPointData = existingItem.pickup_points as unknown as {
      location_id: string;
    };
    if (pickupPointData.location_id !== locationId) {
      return NextResponse.json(
        { error: "Food item does not belong to this location" },
        { status: 403 },
      );
    }

    // Check if there are any reservation items (past or present) referencing this food item
    const { data: reservationItems, error: reservationError } = await supabase
      .from("reservation_items")
      .select("id")
      .eq("food_item_id", id)
      .limit(1);

    if (reservationError) {
      console.error("Error checking reservation items:", reservationError);
      return NextResponse.json(
        {
          error: "Failed to check reservations",
          details: reservationError.message,
        },
        { status: 500 },
      );
    }

    if (reservationItems && reservationItems.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot archive food item with reservation history. This item has been reserved before and must be kept for record-keeping purposes.",
        },
        { status: 400 },
      );
    }

    // Check if there are any active reservations
    if (existingItem.reserved_quantity && existingItem.reserved_quantity > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot archive food item with active reservations. Wait for reservations to be completed first.",
        },
        { status: 400 },
      );
    }

    // Archive the item instead of deleting
    const { error: archiveError } = await supabase
      .from("food_items")
      .update({ archived: true })
      .eq("id", id);

    if (archiveError) {
      console.error("Error archiving food item:", archiveError);
      return NextResponse.json(
        { error: "Failed to archive food item", details: archiveError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Food item archived successfully",
    });
  } catch (error) {
    console.error("Error deleting food item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

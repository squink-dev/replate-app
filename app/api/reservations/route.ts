import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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

    // Fetch user's reservations with all related data
    const { data: reservations, error: reservationsError } = await supabase
      .from("reservations")
      .select(`
        id,
        created_at,
        expires_at,
        status,
        pickup_point:pickup_points(
          id,
          name,
          location:business_locations(
            id,
            name,
            address,
            business:business_profiles(
              business_name
            )
          )
        ),
        reservation_items(
          quantity,
          food_item:food_items(
            description,
            unit_label
          )
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (reservationsError) {
      console.error("Error fetching reservations:", reservationsError);
      return NextResponse.json(
        { error: "Failed to fetch reservations" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      reservations: reservations || [],
    });
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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

    // Parse the request body
    const body = await request.json();
    const { locationId, items } = body;

    // Validate required fields
    if (!locationId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Location ID and items are required" },
        { status: 400 },
      );
    }

    // Get pickup points for this location (use default or first one)
    const { data: pickupPoints, error: pickupError } = await supabase
      .from("pickup_points")
      .select("id")
      .eq("location_id", locationId)
      .order("is_default", { ascending: false })
      .limit(1);

    if (pickupError || !pickupPoints || pickupPoints.length === 0) {
      return NextResponse.json(
        { error: "No pickup point found for this location" },
        { status: 404 },
      );
    }

    const pickupPointId = pickupPoints[0].id;

    // Verify all food items exist and have sufficient quantity
    const foodItemIds = items.map(
      (item: { foodItemId: string; quantity: number }) => item.foodItemId,
    );
    const { data: foodItems, error: foodError } = await supabase
      .from("food_items")
      .select("id, available_quantity")
      .in("id", foodItemIds);

    if (foodError || !foodItems) {
      return NextResponse.json(
        { error: "Failed to verify food items" },
        { status: 500 },
      );
    }

    // Check if all items have sufficient quantity
    for (const item of items) {
      const foodItem = foodItems.find((fi) => fi.id === item.foodItemId);
      if (!foodItem) {
        return NextResponse.json(
          { error: `Food item ${item.foodItemId} not found` },
          { status: 404 },
        );
      }
      if (foodItem.available_quantity < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient quantity for food item ${item.foodItemId}`,
          },
          { status: 400 },
        );
      }
    }

    // Calculate expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create the reservation
    const { data: reservation, error: reservationError } = await supabase
      .from("reservations")
      .insert({
        user_id: user.id,
        pickup_point_id: pickupPointId,
        expires_at: expiresAt.toISOString(),
        status: "active",
      })
      .select()
      .single();

    if (reservationError || !reservation) {
      console.error("Error creating reservation:", reservationError);
      return NextResponse.json(
        { error: "Failed to create reservation" },
        { status: 500 },
      );
    }

    // Create reservation items
    const reservationItems = items.map(
      (item: { foodItemId: string; quantity: number }) => ({
        reservation_id: reservation.id,
        food_item_id: item.foodItemId,
        quantity: item.quantity,
      }),
    );

    const { error: itemsError } = await supabase
      .from("reservation_items")
      .insert(reservationItems);

    if (itemsError) {
      console.error("Error creating reservation items:", itemsError);
      // Rollback - delete the reservation
      await supabase.from("reservations").delete().eq("id", reservation.id);
      return NextResponse.json(
        { error: "Failed to create reservation items" },
        { status: 500 },
      );
    }

    // Note: Food item quantities are automatically updated by database triggers
    // No manual update needed here

    return NextResponse.json({
      success: true,
      reservation: {
        id: reservation.id,
        created_at: reservation.created_at,
        expires_at: reservation.expires_at,
        status: reservation.status,
      },
    });
  } catch (error) {
    console.error("Error creating reservation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

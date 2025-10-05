import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ reservationId: string }> },
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

    const { reservationId } = await params;

    if (!reservationId) {
      return NextResponse.json(
        { error: "Reservation ID is required" },
        { status: 400 },
      );
    }

    // First, verify the reservation belongs to this user
    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select("id, user_id, status")
      .eq("id", reservationId)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 },
      );
    }

    // Check if the reservation belongs to the current user
    if (reservation.user_id !== user.id) {
      return NextResponse.json(
        { error: "You do not have permission to cancel this reservation" },
        { status: 403 },
      );
    }

    // Check if the reservation can be canceled (only active reservations)
    if (reservation.status !== "active") {
      return NextResponse.json(
        {
          error: `Cannot cancel a ${reservation.status} reservation. Only active reservations can be canceled.`,
        },
        { status: 400 },
      );
    }

    // Update the reservation status to canceled
    const { error: updateError } = await supabase
      .from("reservations")
      .update({ status: "canceled" })
      .eq("id", reservationId);

    if (updateError) {
      console.error("Error canceling reservation:", updateError);
      return NextResponse.json(
        {
          error: "Failed to cancel reservation",
          details: updateError.message,
        },
        { status: 500 },
      );
    }

    // Note: Food item quantities are automatically restored by database triggers
    // No manual update needed here

    return NextResponse.json({
      success: true,
      message: "Reservation canceled successfully",
    });
  } catch (error) {
    console.error("Error canceling reservation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

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
    const { data: locationData, error: locationError } = await supabase
      .from("business_locations")
      .select(`
        id,
        name,
        address,
        business_id
      `)
      .eq("id", locationId)
      .single();

    if (locationError) {
      console.error("Error fetching location:", locationError);
      return NextResponse.json(
        {
          error: "Failed to fetch location details",
          details: locationError.message,
        },
        { status: 500 },
      );
    }

    if (!locationData) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 },
      );
    }

    // Get business details
    const { data: businessData, error: businessError } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("id", locationData.business_id)
      .single();

    if (businessError) {
      console.error("Error fetching business:", businessError);
    }

    // Format the response
    const locationInfo = {
      locationId: locationData.id,
      locationName: locationData.name,
      businessName: businessData?.name || "Unknown Business",
      address: locationData.address,
    };

    return NextResponse.json({
      success: true,
      location: locationInfo,
    });
  } catch (error) {
    console.error("Error fetching location details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

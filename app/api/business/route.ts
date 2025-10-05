import { NextResponse } from "next/server";
import type { Database } from "@/database.types";
import { createClient } from "@/lib/supabase/server";

type BusinessTypeEnum = Database["public"]["Enums"]["business_type_enum"];

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
    const { businessName, businessType, phone } = body;

    // Validate required fields
    if (!businessName) {
      return NextResponse.json(
        { error: "Business name is required" },
        { status: 400 },
      );
    }

    if (!businessType) {
      return NextResponse.json(
        { error: "Business type is required" },
        { status: 400 },
      );
    }

    // Prepare the business profile data
    const businessProfileData: Database["public"]["Tables"]["business_profiles"]["Insert"] =
      {
        owner_id: user.id,
        business_name: businessName,
        business_type: businessType as BusinessTypeEnum,
        phone: phone || null,
      };

    // Insert the business profile
    const { data, error } = await supabase
      .from("business_profiles")
      .insert(businessProfileData)
      .select()
      .single();

    if (error) {
      console.error("Error creating business profile:", error);

      // Check if profile already exists
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Business profile already exists" },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { error: "Failed to create business profile", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Business profile created successfully",
        data,
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

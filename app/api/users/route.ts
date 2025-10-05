import { NextResponse } from "next/server";
import type { Database } from "@/database.types";
import { createClient } from "@/lib/supabase/server";

type DietEnum = Database["public"]["Enums"]["diet_enum"];
type JobStatusEnum = Database["public"]["Enums"]["job_status_enum"];
type IncomeBracketEnum = Database["public"]["Enums"]["income_bracket_enum"];

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
    const {
      firstName,
      lastName,
      age,
      jobStatus,
      isStudent,
      income,
      dietaryRestrictions,
    } = body;

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 },
      );
    }

    if (!jobStatus) {
      return NextResponse.json(
        { error: "Job status is required" },
        { status: 400 },
      );
    }

    // Prepare the user profile data
    const userProfileData: Database["public"]["Tables"]["user_profiles"]["Insert"] =
      {
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        age: age || null,
        job_status: jobStatus as JobStatusEnum,
        is_student: isStudent || null,
        income: income ? (income as IncomeBracketEnum) : null,
        dietary_restrictions: (dietaryRestrictions || []) as DietEnum[],
      };

    // Insert the user profile
    const { data, error } = await supabase
      .from("user_profiles")
      .insert(userProfileData)
      .select()
      .single();

    if (error) {
      console.error("Error creating user profile:", error);

      // Check if profile already exists
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "User profile already exists" },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { error: "Failed to create user profile", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "User profile created successfully",
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

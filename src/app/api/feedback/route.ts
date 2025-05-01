import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      industry,
      intendedUse,
      experience,
      experienceOther,
      likeToSee,
      likeToSeeOther,
      comments,
    } = body;

    const supabase = createRouteHandlerClient({ cookies });

    const { error } = await supabase.from("feedback").insert([
      {
        user_id: userId,
        industry,
        intended_use: intendedUse,
        experience,
        experience_other: experienceOther,
        like_to_see: likeToSee,
        like_to_see_other: likeToSeeOther,
        comments,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}

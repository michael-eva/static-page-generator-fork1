import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, satisfaction, wouldRecommend, comments } = body;

    const supabase = createRouteHandlerClient({ cookies });

    const { error } = await supabase.from("feedback").insert([
      {
        user_id: userId,
        satisfaction,
        would_recommend: wouldRecommend,
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

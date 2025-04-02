import { supabase } from "@/lib/supabase/client/supabase";

export async function checkUserProjectLimit(userId: string): Promise<boolean> {
  const { data: projectCount } = await supabase
    .from("websites")
    .select("id", { count: "exact" })
    .eq("user_id", userId);

  // You can store this in an env variable or user's subscription plan
  const PROJECT_LIMIT = Number(process.env.NEXT_PUBLIC_PROJECT_LIMIT);

  return (projectCount?.length || 0) < PROJECT_LIMIT;
}

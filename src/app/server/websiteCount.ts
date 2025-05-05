import { supabase } from "@/lib/supabase/server/supsbase";

export async function getWebsiteCount() {
  const { count, error } = await supabase
    .from("websites")
    .select("*", { count: "exact" });

  if (error) {
    throw error;
  }

  const totalLimit = 100;
  const remainingSlots = Math.max(0, totalLimit - (count || 0));
  const isLimitReached = count && count >= totalLimit;

  return {
    currentCount: count || 0,
    remainingSlots,
    isLimitReached,
  };
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client/supabase";

export function useProjectLimits(userId: string | undefined) {
  return useQuery({
    queryKey: ["projectLimits", userId],
    queryFn: async () => {
      const { count } = await supabase
        .from("websites")
        .select("id", { count: "exact" })
        .eq("user_id", userId);

      // You could fetch this from user's subscription plan
      const PROJECT_LIMIT = Number(process.env.NEXT_PUBLIC_PROJECT_LIMIT);

      return {
        currentCount: count || 0,
        limit: PROJECT_LIMIT,
        canCreateMore: (count || 0) < PROJECT_LIMIT,
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

"use client";

import { supabase } from "@/lib/supabase/client/supabase";
import { useQuery } from "@tanstack/react-query";

export function useWebsites(userId: string) {
  return useQuery({
    queryKey: ["websites", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("websites")
        .select("*")
        .eq("user_id", userId);
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

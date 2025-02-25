"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

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

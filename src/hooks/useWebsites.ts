"use client";

import { supabase } from "@/lib/supabase/client/supabase";
import { useQuery } from "@tanstack/react-query";

export function useWebsites(userId: string) {
  return useQuery({
    queryKey: ["websites", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("websites")
        .select(
          `
          *,
          domain_setups!inner (
            domain_name,
            certificate_arn,
            distribution_domain,
            dns_setup_option,
            nameservers,
            validation_records,
            created_at,
            updated_at,
            completed
          )
        `
        )
        .eq("user_id", userId)
        .limit(1);
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

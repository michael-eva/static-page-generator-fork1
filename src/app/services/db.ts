import { supabase } from "@/lib/supabase/server/supsbase";

export default async function DeleteSite(params: { siteId: string }) {
  const { siteId } = params;
  const { data, error } = await supabase
    .from("websites")
    .delete()
    .eq("site_id", siteId);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

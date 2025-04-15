import { supabase } from "@/lib/supabase/server/supsbase";

export async function DeleteSite(params: { siteId: string }) {
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

export async function AddCloudfrontDomain(params: {
  domain: string;
  siteId: string;
}) {
  const { domain, siteId } = params;
  const { data, error } = await supabase
    .from("websites")
    .update({ cloudfront_domain: domain })
    .eq("site_id", siteId);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

"use server";
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

export async function GetSite(params: { projectId: string }) {
  const { projectId } = params;
  const { data, error } = await supabase
    .from("websites")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function InsertDomainSetup(params: {
  domainName: string;
  certificateArn: string;
  distributionDomain: string;
  dnsSetupOption: string;
  nameservers: string[];
  validationRecords: any[];
  siteId: string;
}) {
  const {
    domainName,
    certificateArn,
    distributionDomain,
    dnsSetupOption,
    nameservers,
    validationRecords,
    siteId,
  } = params;

  const { error } = await supabase.from("domain_setups").insert({
    domain_name: domainName,
    certificate_arn: certificateArn,
    distribution_domain: distributionDomain,
    dns_setup_option: dnsSetupOption,
    nameservers: nameservers,
    validation_records: validationRecords,
    site_id: siteId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

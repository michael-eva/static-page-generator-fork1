import { supabase } from "@/lib/supabase/client/supabase";

export async function checkUserProjectLimit(userId: string): Promise<boolean> {
  console.log('Helper: Starting project limit check for user', { userId });
  console.log('Helper: Supabase config', {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'present' : 'missing',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'missing'
  });
  try {
    console.log('Helper: Attempting to query Supabase');
    const { data: projectCount, error } = await supabase
    .from("websites")
    .select("id", { count: "exact" })
    .eq("user_id", userId);
    
    if (error) {
      console.error('Helper: Supabase query error:', error);
      throw error;
    }
    
    console.log('Helper: Supabase query successful', { projectCount: projectCount?.length || 0 });

    // You can store this in an env variable or user's subscription plan
    const PROJECT_LIMIT = Number(process.env.NEXT_PUBLIC_PROJECT_LIMIT);
    console.log('Helper: Project limit from env', { PROJECT_LIMIT });

    const result = (projectCount?.length || 0) < PROJECT_LIMIT;
    console.log('Helper: Project limit check result', { result });
    return result;
  } catch (error) {
    console.error('Helper: Error in checkUserProjectLimit:', error);
    console.error('Helper: Error details:', JSON.stringify(error, null, 2));
    // Default to allowing project creation if we can't check the limit
    // You might want to change this behavior based on your requirements
    return true;
  }
}

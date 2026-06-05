import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://mzxheibhjtjueevyvasl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_wkuqjIdmz6zsCDYfDlIqHg_9aeUsAy2";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
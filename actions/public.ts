"use server";

import { getSupabaseAdminClient } from "@/lib/supabase";
import type { Raffle } from "@/types";

export async function getActiveRaffles(): Promise<Raffle[]> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("raffles")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data || []) as Raffle[];
}

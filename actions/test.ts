"use server";

import { getSupabaseAdminClient, getSupabaseClient } from "@/lib/supabase";

export async function testConnection(): Promise<{
  envVars: { url: string; anonKey: string; serviceKey: string };
  anonClient: { ok: boolean; error?: string; data?: unknown };
  adminClient: { ok: boolean; error?: string; data?: unknown };
  storageBucket: { ok: boolean; error?: string };
  tableRaffles: { ok: boolean; error?: string; count?: number };
  tableTickets: { ok: boolean; error?: string; count?: number };
  tableCreationCodes: { ok: boolean; error?: string; count?: number };
}> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  const result = {
    envVars: {
      url: url ? `${url.substring(0, 30)}...` : "VACÍA",
      anonKey: anonKey ? `${anonKey.substring(0, 20)}...` : "VACÍA",
      serviceKey: serviceKey ? `${serviceKey.substring(0, 20)}...` : "VACÍA",
    },
    anonClient: { ok: false, error: "", data: null } as {
      ok: boolean;
      error?: string;
      data?: unknown;
    },
    adminClient: { ok: false, error: "", data: null } as {
      ok: boolean;
      error?: string;
      data?: unknown;
    },
    storageBucket: { ok: false, error: "" } as { ok: boolean; error?: string },
    tableRaffles: { ok: false, error: "" } as {
      ok: boolean;
      error?: string;
      count?: number;
    },
    tableTickets: { ok: false, error: "" } as {
      ok: boolean;
      error?: string;
      count?: number;
    },
    tableCreationCodes: { ok: false, error: "" } as {
      ok: boolean;
      error?: string;
      count?: number;
    },
  };

  // Test 1: Env vars
  if (!url || !anonKey || !serviceKey) {
    result.anonClient.error = "Variables de entorno vacías";
    result.adminClient.error = "Variables de entorno vacías";
    return result;
  }

  // Test 2: Anon client
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("raffles")
      .select("id", { count: "exact", head: true });
    if (error) {
      result.anonClient.error = `${error.code}: ${error.message}`;
    } else {
      result.anonClient.ok = true;
      result.anonClient.data = data;
    }
  } catch (e) {
    result.anonClient.error =
      e instanceof Error ? e.message : "Error desconocido";
  }

  // Test 3: Admin client
  try {
    const client = getSupabaseAdminClient();
    const { data, error } = await client
      .from("raffles")
      .select("id", { count: "exact", head: true });
    if (error) {
      result.adminClient.error = `${error.code}: ${error.message}`;
    } else {
      result.adminClient.ok = true;
      result.adminClient.data = data;
    }
  } catch (e) {
    result.adminClient.error =
      e instanceof Error ? e.message : "Error desconocido";
  }

  // Test 4: Storage bucket - try to access directly
  try {
    const client = getSupabaseAdminClient();
    // Try listing files in the bucket directly (more reliable than listBuckets)
    const { data, error } = await client.storage
      .from("raffle-images")
      .list("", { limit: 1 });

    if (error) {
      // If bucket doesn't exist, error code will indicate it
      result.storageBucket.error = `${error.message} (code: ${error.name || "unknown"})`;
    } else {
      result.storageBucket.ok = true;
      result.storageBucket.error = undefined;
    }
  } catch (e) {
    result.storageBucket.error =
      e instanceof Error ? e.message : "Error desconocido";
  }

  // Test 5: Tables
  try {
    const client = getSupabaseAdminClient();
    const { count, error } = await client
      .from("raffles")
      .select("*", { count: "exact", head: true });
    if (error) {
      result.tableRaffles.error = `${error.code}: ${error.message}`;
    } else {
      result.tableRaffles.ok = true;
      result.tableRaffles.count = count ?? 0;
    }
  } catch (e) {
    result.tableRaffles.error =
      e instanceof Error ? e.message : "Error desconocido";
  }

  try {
    const client = getSupabaseAdminClient();
    const { count, error } = await client
      .from("tickets")
      .select("*", { count: "exact", head: true });
    if (error) {
      result.tableTickets.error = `${error.code}: ${error.message}`;
    } else {
      result.tableTickets.ok = true;
      result.tableTickets.count = count ?? 0;
    }
  } catch (e) {
    result.tableTickets.error =
      e instanceof Error ? e.message : "Error desconocido";
  }

  try {
    const client = getSupabaseAdminClient();
    const { count, error } = await client
      .from("creation_codes")
      .select("*", { count: "exact", head: true });
    if (error) {
      result.tableCreationCodes.error = `${error.code}: ${error.message}`;
    } else {
      result.tableCreationCodes.ok = true;
      result.tableCreationCodes.count = count ?? 0;
    }
  } catch (e) {
    result.tableCreationCodes.error =
      e instanceof Error ? e.message : "Error desconocido";
  }

  return result;
}

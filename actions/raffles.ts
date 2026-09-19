"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase";
import {
  generateRaffleCode,
  generateSlug,
  hashAdminCode,
  compareAdminCode,
} from "@/lib/crypto";
import {
  createRaffleSchema,
  updateRaffleSchema,
  verifyRaffleCodeSchema,
  type CreateRaffleInput,
  type UpdateRaffleInput,
} from "@/schemas/raffle";
import type { Raffle, RaffleStats, Ticket } from "@/types";
import { isMasterAuthenticated } from "./auth";

const RAFFLE_PUBLIC_COLUMNS =
  "id, slug, title, description, prize_image_url, raffle_date, terms, number_from, number_to, ticket_price, whatsapp, winner_method, winner_number, winner_source, status, created_at, updated_at";

export async function createRaffle(
  input: CreateRaffleInput,
  imageFile?: File
): Promise<{
  success: boolean;
  raffle?: Raffle;
  adminCode?: string;
  error?: string;
  warning?: string;
}> {
  const auth = await isMasterAuthenticated();
  if (!auth) {
    return { success: false, error: "No autenticado" };
  }

  const parsed = createRaffleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;
  const slug = generateSlug(data.title);
  const adminCode = generateRaffleCode();
  const adminCodeHash = await hashAdminCode(adminCode);

  const supabase = getSupabaseAdminClient();

  const { data: raffle, error: insertError } = await supabase
    .from("raffles")
    .insert({
      slug,
      title: data.title,
      description: data.description || null,
      raffle_date: data.raffle_date,
      terms: data.terms || null,
      number_from: data.number_from,
      number_to: data.number_to,
      ticket_price: data.ticket_price,
      whatsapp: data.whatsapp,
      winner_method: data.winner_method,
      admin_code_hash: adminCodeHash,
      status: "active",
    })
    .select()
    .single();

  if (insertError) {
    return {
      success: false,
      error: `No fue posible crear la rifa: ${insertError.message}`,
    };
  }

  let warning: string | undefined;

  if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split(".").pop() || "jpg";
    const filePath = `${raffle.id}/prize.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("raffle-images")
      .upload(filePath, imageFile, {
        contentType: imageFile.type,
        upsert: true,
      });

    if (uploadError) {
      warning =
        "La rifa se creó correctamente, pero no se pudo subir la imagen. Puedes intentar subirla después desde el panel de administración.";
    } else {
      const { data: urlData } = supabase.storage
        .from("raffle-images")
        .getPublicUrl(filePath);

      await supabase
        .from("raffles")
        .update({ prize_image_url: urlData.publicUrl })
        .eq("id", raffle.id);

      raffle.prize_image_url = urlData.publicUrl;
    }
  }

  revalidatePath("/admin/rifas");

  return { success: true, raffle: raffle as Raffle, adminCode, warning };
}

export async function getRaffles(): Promise<Raffle[]> {
  const auth = await isMasterAuthenticated();
  if (!auth) return [];

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("raffles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data || []) as Raffle[];
}

export async function getRaffleBySlug(
  slug: string
): Promise<{ raffle: Raffle | null; tickets: { number: number; status: string }[] }> {
  const supabase = getSupabaseAdminClient();

  const { data: raffle, error } = await supabase
    .from("raffles")
    .select(RAFFLE_PUBLIC_COLUMNS)
    .eq("slug", slug)
    .single();

  if (error || !raffle) {
    return { raffle: null, tickets: [] };
  }

  const { data: tickets } = await supabase
    .from("tickets")
    .select("number, status")
    .eq("raffle_id", raffle.id);

  return {
    raffle: raffle as Raffle,
    tickets: tickets || [],
  };
}

export async function getRaffleById(
  id: string
): Promise<{ raffle: Raffle | null; tickets: { number: number; status: string }[] }> {
  const supabase = getSupabaseAdminClient();

  const { data: raffle, error } = await supabase
    .from("raffles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !raffle) {
    return { raffle: null, tickets: [] };
  }

  const { data: tickets } = await supabase
    .from("tickets")
    .select("number, status")
    .eq("raffle_id", raffle.id);

  return {
    raffle: raffle as Raffle,
    tickets: tickets || [],
  };
}

export async function getRaffleByIdForManage(
  id: string
): Promise<{ raffle: Raffle | null; tickets: Ticket[] }> {
  const supabase = getSupabaseAdminClient();

  const { data: raffle, error } = await supabase
    .from("raffles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !raffle) {
    return { raffle: null, tickets: [] };
  }

  const { data: tickets } = await supabase
    .from("tickets")
    .select("*")
    .eq("raffle_id", raffle.id);

  return {
    raffle: raffle as Raffle,
    tickets: (tickets || []) as Ticket[],
  };
}

export async function verifyRaffleCode(
  raffleId: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const parsed = verifyRaffleCodeSchema.safeParse({ code });
  if (!parsed.success) {
    return { success: false, error: "Código requerido" };
  }

  const supabase = getSupabaseAdminClient();
  const { data: raffle, error } = await supabase
    .from("raffles")
    .select("admin_code_hash")
    .eq("id", raffleId)
    .single();

  if (error || !raffle) {
    return { success: false, error: "Rifa no encontrada" };
  }

  const valid = await compareAdminCode(code, raffle.admin_code_hash);
  if (!valid) {
    return { success: false, error: "Código de administración inválido" };
  }

  return { success: true };
}

export async function updateRaffle(
  id: string,
  input: UpdateRaffleInput,
  imageFile?: File
): Promise<{ success: boolean; error?: string; warning?: string }> {
  const auth = await isMasterAuthenticated();
  if (!auth) {
    return { success: false, error: "No autenticado" };
  }

  const parsed = updateRaffleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = getSupabaseAdminClient();

  const updateData: Record<string, unknown> = { ...parsed.data };

  let warning: string | undefined;

  if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split(".").pop() || "jpg";
    const filePath = `${id}/prize.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("raffle-images")
      .upload(filePath, imageFile, {
        contentType: imageFile.type,
        upsert: true,
      });

    if (uploadError) {
      warning =
        "Los datos se guardaron, pero no se pudo subir la imagen. Puedes intentar subirla de nuevo.";
    } else {
      const { data: urlData } = supabase.storage
        .from("raffle-images")
        .getPublicUrl(filePath);
      updateData.prize_image_url = urlData.publicUrl;
    }
  }

  const { error } = await supabase
    .from("raffles")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return {
      success: false,
      error: `No fue posible guardar los cambios: ${error.message}`,
    };
  }

  revalidatePath("/admin/rifas");
  revalidatePath(`/admin/rifa/${id}`);
  revalidatePath(`/r/${updateData.slug || ""}`);

  return { success: true, warning };
}

export async function getRaffleStats(
  raffleId: string,
  numberFrom: number,
  numberTo: number,
  ticketPrice: number
): Promise<RaffleStats> {
  const supabase = getSupabaseAdminClient();

  const { data: tickets } = await supabase
    .from("tickets")
    .select("status")
    .eq("raffle_id", raffleId);

  const total = numberTo - numberFrom + 1;
  const sold = tickets?.filter((t) => t.status === "sold").length || 0;
  const reserved = tickets?.filter((t) => t.status === "reserved").length || 0;
  const available = total - sold - reserved;

  return {
    total,
    sold,
    reserved,
    available: Math.max(0, available),
    revenueSold: sold * ticketPrice,
    revenuePotential: total * ticketPrice,
  };
}

export async function finishRaffle(
  raffleId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await isMasterAuthenticated();
  if (!auth) {
    return { success: false, error: "No autenticado" };
  }

  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from("raffles")
    .update({ status: "finished" })
    .eq("id", raffleId);

  if (error) {
    return { success: false, error: "No fue posible finalizar la rifa" };
  }

  revalidatePath("/admin/rifas");
  revalidatePath(`/admin/rifa/${raffleId}`);

  return { success: true };
}

export async function regenerateAdminCode(
  raffleId: string
): Promise<{ success: boolean; code?: string; error?: string }> {
  const auth = await isMasterAuthenticated();
  if (!auth) {
    return { success: false, error: "No autenticado" };
  }

  const supabase = getSupabaseAdminClient();
  const newCode = generateRaffleCode();
  const newHash = await hashAdminCode(newCode);

  const { error } = await supabase
    .from("raffles")
    .update({ admin_code_hash: newHash })
    .eq("id", raffleId);

  if (error) {
    return { success: false, error: "No fue posible regenerar el codigo" };
  }

  revalidatePath("/admin/rifas");
  revalidatePath(`/admin/rifa/${raffleId}`);

  return { success: true, code: newCode };
}

export async function updateRaffleImage(
  raffleId: string,
  imageFile: File,
  adminCode: string
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  const auth = await verifyRaffleCode(raffleId, adminCode);
  if (!auth.success) {
    return { success: false, error: "No autorizado" };
  }

  const supabase = getSupabaseAdminClient();

  const { data: raffle } = await supabase
    .from("raffles")
    .select("prize_image_url")
    .eq("id", raffleId)
    .single();

  if (raffle?.prize_image_url) {
    const oldPath = raffle.prize_image_url.split("/object/public/raffle-images/")[1];
    if (oldPath) {
      await supabase.storage.from("raffle-images").remove([oldPath]);
    }
  }

  const ext = imageFile.name.split(".").pop() || "jpg";
  const filePath = `${raffleId}/prize.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("raffle-images")
    .upload(filePath, imageFile, {
      contentType: imageFile.type,
      upsert: true,
    });

  if (uploadError) {
    return { success: false, error: "No se pudo subir la imagen" };
  }

  const { data: urlData } = supabase.storage
    .from("raffle-images")
    .getPublicUrl(filePath);

  const { error: updateError } = await supabase
    .from("raffles")
    .update({ prize_image_url: urlData.publicUrl })
    .eq("id", raffleId);

  if (updateError) {
    return { success: false, error: "No se pudo actualizar la imagen" };
  }

  revalidatePath(`/manage/${raffleId}`);
  revalidatePath(`/r/${raffleId}`);

  return { success: true, imageUrl: urlData.publicUrl };
}

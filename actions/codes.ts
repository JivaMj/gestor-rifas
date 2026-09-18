"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { generateCreationCode, generateRaffleCode, generateSlug, hashAdminCode } from "@/lib/crypto";
import { createRaffleSchema, type CreateRaffleInput } from "@/schemas/raffle";
import type { CreationCode, Raffle } from "@/types";
import { isMasterAuthenticated } from "./auth";
import { validateImageFile } from "@/lib/validation";

export async function generateCode(): Promise<{
  success: boolean;
  code?: string;
  error?: string;
}> {
  const auth = await isMasterAuthenticated();
  if (!auth) {
    return { success: false, error: "No autenticado" };
  }

  const supabase = getSupabaseAdminClient();
  const code = generateCreationCode();

  const { error } = await supabase
    .from("creation_codes")
    .insert({ code });

  if (error) {
    return { success: false, error: "No fue posible generar el código" };
  }

  revalidatePath("/admin/rifas");
  return { success: true, code };
}

export async function getCreationCodes(): Promise<CreationCode[]> {
  const auth = await isMasterAuthenticated();
  if (!auth) return [];

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("creation_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data || []) as CreationCode[];
}

export async function validateCreationCode(
  code: string
): Promise<{ valid: boolean; error?: string }> {
  if (!code || !code.trim()) {
    return { valid: false, error: "Ingresa un código" };
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("creation_codes")
    .select("id, used_by_raffle_id")
    .eq("code", code.trim().toUpperCase())
    .single();

  if (error || !data) {
    return { valid: false, error: "Código no válido" };
  }

  if (data.used_by_raffle_id) {
    return { valid: false, error: "Este código ya fue utilizado" };
  }

  return { valid: true };
}

export async function createRaffleWithCode(
  code: string,
  input: CreateRaffleInput,
  imageFile?: File
): Promise<{
  success: boolean;
  raffle?: Raffle;
  adminCode?: string;
  error?: string;
  warning?: string;
}> {
  // Validate creation code
  const codeValidation = await validateCreationCode(code);
  if (!codeValidation.valid) {
    return { success: false, error: codeValidation.error };
  }

  // Validate input
  const parsed = createRaffleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // Validate image before doing anything
  if (imageFile) {
    const fileValidation = validateImageFile(imageFile);
    if (!fileValidation.valid) {
      return { success: false, error: fileValidation.error };
    }
  }

  const data = parsed.data;
  const supabase = getSupabaseAdminClient();

  // Get the creation code ID
  const { data: codeRow } = await supabase
    .from("creation_codes")
    .select("id")
    .eq("code", code.trim().toUpperCase())
    .single();

  if (!codeRow) {
    return { success: false, error: "Código no válido" };
  }

  const slug = generateSlug(data.title);
  const adminCode = generateRaffleCode();
  const adminCodeHash = hashAdminCode(adminCode);

  // Insert raffle
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

  // Mark creation code as used
  await supabase
    .from("creation_codes")
    .update({
      used_by_raffle_id: raffle.id,
      used_at: new Date().toISOString(),
    })
    .eq("id", codeRow.id);

  // Upload image if provided
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
        "La rifa se creó correctamente, pero no se pudo subir la imagen. Puedes subirla después desde la administración.";
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

  return {
    success: true,
    raffle: raffle as Raffle,
    adminCode,
    warning,
  };
}

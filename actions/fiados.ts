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
  createFiadoSchema,
  updateFiadoSchema,
  verifyFiadoCodeSchema,
  type CreateFiadoInput,
  type UpdateFiadoInput,
} from "@/schemas/raffle";
import type { Fiado } from "@/types";
import { isMasterAuthenticated } from "./auth";

const FIADO_PUBLIC_COLUMNS =
  "id, slug, title, description, image_url, price, payment_type, payment_date, whatsapp, discount_info, status, created_at, updated_at";

export async function createFiado(
  input: CreateFiadoInput,
  imageFile?: File
): Promise<{
  success: boolean;
  fiado?: Fiado;
  adminCode?: string;
  error?: string;
  warning?: string;
}> {
  const parsed = createFiadoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;
  const slug = generateSlug(data.title);
  const adminCode = generateRaffleCode();
  const adminCodeHash = await hashAdminCode(adminCode);

  const supabase = getSupabaseAdminClient();

  const { data: fiado, error: insertError } = await supabase
    .from("fiados")
    .insert({
      slug,
      title: data.title,
      description: data.description || null,
      price: data.price,
      payment_type: data.payment_type,
      payment_date: data.payment_date || null,
      whatsapp: data.whatsapp,
      discount_info: data.discount_info || null,
      admin_code_hash: adminCodeHash,
      status: "active",
    })
    .select()
    .single();

  if (insertError) {
    return {
      success: false,
      error: `No fue posible crear la publicacion: ${insertError.message}`,
    };
  }

  let warning: string | undefined;

  if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split(".").pop() || "jpg";
    const filePath = `${fiado.id}/image.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("raffle-images")
      .upload(filePath, imageFile, {
        contentType: imageFile.type,
        upsert: true,
      });

    if (uploadError) {
      warning =
        "La publicacion se creo correctamente, pero no se pudo subir la imagen. Puedes subirla despues desde administrar.";
    } else {
      const { data: urlData } = supabase.storage
        .from("raffle-images")
        .getPublicUrl(filePath);

      await supabase
        .from("fiados")
        .update({ image_url: urlData.publicUrl })
        .eq("id", fiado.id);

      fiado.image_url = urlData.publicUrl;
    }
  }

  revalidatePath("/");

  return { success: true, fiado: fiado as Fiado, adminCode, warning };
}

export async function getFiadoBySlug(
  slug: string
): Promise<Fiado | null> {
  const supabase = getSupabaseAdminClient();

  const { data: fiado, error } = await supabase
    .from("fiados")
    .select(FIADO_PUBLIC_COLUMNS)
    .eq("slug", slug)
    .single();

  if (error || !fiado) return null;
  return fiado as Fiado;
}

export async function getFiadoById(
  id: string
): Promise<Fiado | null> {
  const supabase = getSupabaseAdminClient();

  const { data: fiado, error } = await supabase
    .from("fiados")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !fiado) return null;
  return fiado as Fiado;
}

export async function verifyFiadoCode(
  fiadoId: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const parsed = verifyFiadoCodeSchema.safeParse({ code });
  if (!parsed.success) {
    return { success: false, error: "Codigo requerido" };
  }

  const supabase = getSupabaseAdminClient();
  const { data: fiado, error } = await supabase
    .from("fiados")
    .select("admin_code_hash")
    .eq("id", fiadoId)
    .single();

  if (error || !fiado) {
    return { success: false, error: "Publicacion no encontrada" };
  }

  const valid = await compareAdminCode(code, fiado.admin_code_hash);
  if (!valid) {
    return { success: false, error: "Codigo de administracion invalido" };
  }

  return { success: true };
}

export async function updateFiado(
  id: string,
  input: UpdateFiadoInput,
  imageFile?: File
): Promise<{ success: boolean; error?: string; warning?: string }> {
  const parsed = updateFiadoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = getSupabaseAdminClient();

  const updateData: Record<string, unknown> = { ...parsed.data };

  let warning: string | undefined;

  if (imageFile && imageFile.size > 0) {
    const { data: oldFiado } = await supabase
      .from("fiados")
      .select("image_url")
      .eq("id", id)
      .single();

    if (oldFiado?.image_url) {
      const oldPath = oldFiado.image_url.split("/object/public/raffle-images/")[1];
      if (oldPath) {
        await supabase.storage.from("raffle-images").remove([oldPath]);
      }
    }

    const ext = imageFile.name.split(".").pop() || "jpg";
    const filePath = `${id}/image.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("raffle-images")
      .upload(filePath, imageFile, {
        contentType: imageFile.type,
        upsert: true,
      });

    if (uploadError) {
      warning =
        "Los datos se guardaron, pero no se pudo subir la imagen.";
    } else {
      const { data: urlData } = supabase.storage
        .from("raffle-images")
        .getPublicUrl(filePath);
      updateData.image_url = urlData.publicUrl;
    }
  }

  const { error } = await supabase
    .from("fiados")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return {
      success: false,
      error: `No fue posible guardar los cambios: ${error.message}`,
    };
  }

  revalidatePath("/");
  if (updateData.slug) revalidatePath(`/f/${updateData.slug}`);

  return { success: true, warning };
}

export async function getActiveFiados(): Promise<Fiado[]> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("fiados")
    .select(FIADO_PUBLIC_COLUMNS)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data || []) as Fiado[];
}

export async function getAllFiados(): Promise<Fiado[]> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("fiados")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data || []) as Fiado[];
}

export async function regenerateFiadoAdminCode(
  fiadoId: string
): Promise<{ success: boolean; code?: string; error?: string }> {
  if (!(await isMasterAuthenticated())) {
    return { success: false, error: "No autorizado" };
  }

  const supabase = getSupabaseAdminClient();
  const newCode = generateRaffleCode();
  const hash = await hashAdminCode(newCode);

  const { error } = await supabase
    .from("fiados")
    .update({ admin_code_hash: hash })
    .eq("id", fiadoId);

  if (error) {
    return { success: false, error: "No fue posible regenerar el codigo" };
  }

  return { success: true, code: newCode };
}

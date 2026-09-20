"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { generateSlug } from "@/lib/crypto";
import {
  createPromotionSchema,
  updatePromotionSchema,
  type CreatePromotionInput,
  type UpdatePromotionInput,
} from "@/schemas/raffle";
import type { Promotion } from "@/types";
import { getCurrentUser } from "@/lib/auth";

export async function createPromotion(
  input: CreatePromotionInput,
  imageFile?: File
): Promise<{
  success: boolean;
  promotion?: Promotion;
  error?: string;
  warning?: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "No autorizado" };
  }

  const parsed = createPromotionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const data = parsed.data;
  const slug = generateSlug(data.title);

  const supabase = getSupabaseAdminClient();

  const { data: promo, error: insertError } = await supabase
    .from("promotions")
    .insert({
      slug,
      title: data.title,
      description: data.description || null,
      availability: data.availability || null,
      address: data.address || null,
      conditions: data.conditions || null,
      whatsapp: data.whatsapp || null,
      facebook: data.facebook || null,
      instagram: data.instagram || null,
      tiktok: data.tiktok || null,
      website: data.website || null,
      owner_id: user.sub,
      status: "active",
    })
    .select()
    .single();

  if (insertError) {
    return {
      success: false,
      error: `No fue posible crear la promocion: ${insertError.message}`,
    };
  }

  let warning: string | undefined;

  if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split(".").pop() || "jpg";
    const filePath = `${promo.id}/image.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("raffle-images")
      .upload(filePath, imageFile, {
        contentType: imageFile.type,
        upsert: true,
      });

    if (uploadError) {
      warning =
        "La promocion se creo correctamente, pero no se pudo subir la imagen. Puedes subirla despues desde administrar.";
    } else {
      const { data: urlData } = supabase.storage
        .from("raffle-images")
        .getPublicUrl(filePath);

      await supabase
        .from("promotions")
        .update({ image_url: urlData.publicUrl })
        .eq("id", promo.id);

      promo.image_url = urlData.publicUrl;
    }
  }

  revalidatePath("/");

  return { success: true, promotion: promo as Promotion, warning };
}

export async function getPromotionBySlug(
  slug: string
): Promise<Promotion | null> {
  const supabase = getSupabaseAdminClient();

  const { data: promo, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !promo) return null;
  return promo as Promotion;
}

export async function getPromotionById(
  id: string
): Promise<Promotion | null> {
  const supabase = getSupabaseAdminClient();

  const { data: promo, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !promo) return null;
  return promo as Promotion;
}

export async function updatePromotion(
  id: string,
  input: UpdatePromotionInput,
  imageFile?: File
): Promise<{ success: boolean; error?: string; warning?: string }> {
  const parsed = updatePromotionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = getSupabaseAdminClient();

  const updateData: Record<string, unknown> = { ...parsed.data };

  let warning: string | undefined;

  if (imageFile && imageFile.size > 0) {
    const { data: oldPromo } = await supabase
      .from("promotions")
      .select("image_url")
      .eq("id", id)
      .single();

    if (oldPromo?.image_url) {
      const oldPath = oldPromo.image_url.split("/object/public/raffle-images/")[1];
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
    .from("promotions")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return {
      success: false,
      error: `No fue posible guardar los cambios: ${error.message}`,
    };
  }

  revalidatePath("/");
  if (updateData.slug) revalidatePath(`/promo/${updateData.slug}`);

  return { success: true, warning };
}

export async function getAllPromotions(): Promise<Promotion[]> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data || []) as Promotion[];
}

export async function getActivePromotions(): Promise<Promotion[]> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data || []) as Promotion[];
}

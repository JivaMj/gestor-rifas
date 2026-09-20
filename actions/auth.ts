"use server";

import { getSupabaseAdminClient } from "@/lib/supabase";
import {
  signSession,
  setSessionCookie,
  clearSessionCookie,
  getCurrentUser,
} from "@/lib/auth";
import { hashAdminCode, compareAdminCode, safeCompare } from "@/lib/crypto";
import type { User } from "@/types";

// ---- Login ----
export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseAdminClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, name, business_type, location, is_admin, password_hash")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (error || !user) {
    return { success: false, error: "Correo o contrasena incorrectos" };
  }

  const valid = await compareAdminCode(password, user.password_hash);
  if (!valid) {
    return { success: false, error: "Correo o contrasena incorrectos" };
  }

  const token = await signSession({
    sub: user.id,
    email: user.email,
    name: user.name,
    is_admin: user.is_admin,
  });

  await setSessionCookie(token);

  return { success: true };
}

// ---- Signup (requires code) ----
export async function signupUser(
  email: string,
  password: string,
  name: string,
  businessType: string,
  location: string,
  signupCode: string
): Promise<{ success: boolean; error?: string }> {
  const masterCode = process.env.MASTER_ADMIN_CODE;
  if (!masterCode) {
    return { success: false, error: "Sistema de registro no configurado" };
  }

  if (!safeCompare(signupCode, masterCode)) {
    return { success: false, error: "Codigo de registro invalido" };
  }

  if (!email || !password || !name) {
    return { success: false, error: "Correo, contrasena y nombre son requeridos" };
  }

  if (password.length < 6) {
    return { success: false, error: "La contrasena debe tener al menos 6 caracteres" };
  }

  const supabase = getSupabaseAdminClient();
  const passwordHash = await hashAdminCode(password);

  const { error } = await supabase.from("users").insert({
    email: email.toLowerCase().trim(),
    password_hash: passwordHash,
    name: name.trim(),
    business_type: businessType.trim() || null,
    location: location.trim() || null,
    is_admin: false,
  });

  if (error) {
    if (error.message.includes("duplicate")) {
      return { success: false, error: "Este correo ya esta registrado" };
    }
    return { success: false, error: `Error al crear usuario: ${error.message}` };
  }

  return { success: true };
}

// ---- Logout ----
export async function logoutUser(): Promise<void> {
  await clearSessionCookie();
}

// ---- Get current user ----
export async function getAuthUser(): Promise<{
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
} | null> {
  const session = await getCurrentUser();
  if (!session) return null;
  return {
    id: session.sub,
    email: session.email,
    name: session.name,
    is_admin: session.is_admin,
  };
}

// ---- Change password ----
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getCurrentUser();
  if (!session) {
    return { success: false, error: "No autenticado" };
  }

  if (newPassword.length < 6) {
    return { success: false, error: "La nueva contrasena debe tener al menos 6 caracteres" };
  }

  const supabase = getSupabaseAdminClient();

  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("password_hash")
    .eq("id", session.sub)
    .single();

  if (fetchError || !user) {
    return { success: false, error: "Usuario no encontrado" };
  }

  const valid = await compareAdminCode(currentPassword, user.password_hash);
  if (!valid) {
    return { success: false, error: "La contrasena actual es incorrecta" };
  }

  const newHash = await hashAdminCode(newPassword);
  const { error } = await supabase
    .from("users")
    .update({ password_hash: newHash })
    .eq("id", session.sub);

  if (error) {
    return { success: false, error: "No fue posible cambiar la contrasena" };
  }

  return { success: true };
}

// ---- Admin: Create user ----
export async function adminCreateUser(
  email: string,
  password: string,
  name: string,
  businessType: string,
  location: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getCurrentUser();
  if (!session?.is_admin) {
    return { success: false, error: "No autorizado" };
  }

  if (!email || !password || !name) {
    return { success: false, error: "Correo, contrasena y nombre son requeridos" };
  }

  if (password.length < 6) {
    return { success: false, error: "La contrasena debe tener al menos 6 caracteres" };
  }

  const supabase = getSupabaseAdminClient();
  const passwordHash = await hashAdminCode(password);

  const { error } = await supabase.from("users").insert({
    email: email.toLowerCase().trim(),
    password_hash: passwordHash,
    name: name.trim(),
    business_type: businessType.trim() || null,
    location: location.trim() || null,
    is_admin: false,
  });

  if (error) {
    if (error.message.includes("duplicate")) {
      return { success: false, error: "Este correo ya esta registrado" };
    }
    return { success: false, error: `Error al crear usuario: ${error.message}` };
  }

  return { success: true };
}

// ---- Admin: Reset user password ----
export async function adminResetPassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getCurrentUser();
  if (!session?.is_admin) {
    return { success: false, error: "No autorizado" };
  }

  if (newPassword.length < 6) {
    return { success: false, error: "La contrasena debe tener al menos 6 caracteres" };
  }

  const supabase = getSupabaseAdminClient();
  const hash = await hashAdminCode(newPassword);

  const { error } = await supabase
    .from("users")
    .update({ password_hash: hash })
    .eq("id", userId);

  if (error) {
    return { success: false, error: "No fue posible restablecer la contrasena" };
  }

  return { success: true };
}

// ---- Admin: Delete user (cascades) ----
export async function adminDeleteUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getCurrentUser();
  if (!session?.is_admin) {
    return { success: false, error: "No autorizado" };
  }

  if (session.sub === userId) {
    return { success: false, error: "No puedes eliminar tu propia cuenta" };
  }

  const supabase = getSupabaseAdminClient();

  // Delete user's content images first
  const [raffles, fiados, promos] = await Promise.all([
    supabase.from("raffles").select("prize_image_url, id").eq("owner_id", userId),
    supabase.from("fiados").select("image_url, id").eq("owner_id", userId),
    supabase.from("promotions").select("image_url, id").eq("owner_id", userId),
  ]);

  // Delete images from storage
  const imagePaths: string[] = [];
  for (const r of raffles.data || []) {
    if (r.prize_image_url) {
      const path = r.prize_image_url.split("/object/public/raffle-images/")[1];
      if (path) imagePaths.push(path);
    }
  }
  for (const f of fiados.data || []) {
    if (f.image_url) {
      const path = f.image_url.split("/object/public/raffle-images/")[1];
      if (path) imagePaths.push(path);
    }
  }
  for (const p of promos.data || []) {
    if (p.image_url) {
      const path = p.image_url.split("/object/public/raffle-images/")[1];
      if (path) imagePaths.push(path);
    }
  }

  if (imagePaths.length > 0) {
    await supabase.storage.from("raffle-images").remove(imagePaths);
  }

  // Delete user (CASCADE handles the rest)
  const { error } = await supabase.from("users").delete().eq("id", userId);
  if (error) {
    return { success: false, error: `No fue posible eliminar el usuario: ${error.message}` };
  }

  return { success: true };
}

// ---- Admin: Get all users ----
export async function getAllUsers(): Promise<User[]> {
  const session = await getCurrentUser();
  if (!session?.is_admin) return [];

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, business_type, location, is_admin, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data || []) as User[];
}

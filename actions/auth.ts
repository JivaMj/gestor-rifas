"use server";

import { cookies } from "next/headers";
import { hashAdminCode, compareAdminCode, safeCompare } from "@/lib/crypto";

const MASTER_CODE_COOKIE = "master_admin_session";

export async function verifyMasterCode(
  code: string
): Promise<{ success: boolean; error?: string }> {
  const masterCode = process.env.MASTER_ADMIN_CODE;
  if (!masterCode) {
    return { success: false, error: "Código maestro no configurado" };
  }

  if (!safeCompare(code, masterCode)) {
    return { success: false, error: "Código de administración inválido" };
  }

  const cookieStore = await cookies();
  const hash = await hashAdminCode(code);
  cookieStore.set(MASTER_CODE_COOKIE, hash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return { success: true };
}

export async function isMasterAuthenticated(): Promise<boolean> {
  const masterCode = process.env.MASTER_ADMIN_CODE;
  if (!masterCode) return false;

  const cookieStore = await cookies();
  const session = cookieStore.get(MASTER_CODE_COOKIE);
  if (!session) return false;

  return compareAdminCode(masterCode, session.value);
}

export async function logoutMaster(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(MASTER_CODE_COOKIE);
}

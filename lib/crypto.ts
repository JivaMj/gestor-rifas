import { createHash, randomBytes } from "crypto";

export function hashAdminCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function generateRaffleCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "RIFA-";
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

export function generateCreationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "CREAR-";
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const suffix = randomBytes(3).toString("hex");
  return `${base}-${suffix}`;
}

export function compareAdminCode(
  plainCode: string,
  hash: string
): Promise<boolean> {
  return new Promise((resolve) => {
    const computed = hashAdminCode(plainCode);
    resolve(computed === hash);
  });
}

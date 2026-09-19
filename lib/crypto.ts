import { randomBytes, timingSafeEqual } from "crypto";
import { hash, compare } from "bcryptjs";

const BCRYPT_ROUNDS = 12;

export async function hashAdminCode(code: string): Promise<string> {
  return hash(code, BCRYPT_ROUNDS);
}

export async function compareAdminCode(
  plainCode: string,
  hashedCode: string
): Promise<boolean> {
  return compare(plainCode, hashedCode);
}

export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function secureRandomInt(max: number): number {
  const bytes = randomBytes(4);
  const raw = bytes.readUInt32BE(0);
  return raw % max;
}

export function generateRaffleCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "RIFA-";
  for (let i = 0; i < 6; i++) {
    code += chars[secureRandomInt(chars.length)];
  }
  return code;
}

export function generateCreationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "CREAR-";
  for (let i = 0; i < 6; i++) {
    code += chars[secureRandomInt(chars.length)];
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

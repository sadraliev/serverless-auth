import { randomBytes, scrypt, randomUUID } from "node:crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

/**
 * Hash password using scrypt and return in the format: salt:hash
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Compare plain password with stored hash
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [salt, key] = storedHash.split(":");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return key === derivedKey.toString("hex");
}

export function generateUniqueId(): string {
  return randomUUID();
}

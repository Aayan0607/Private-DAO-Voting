import type { Identity } from "@semaphore-protocol/identity";
import { importIdentity } from "./identity";

const iterations = 310_000;
const context = new TextEncoder().encode(
  "private-dao-voting:identity-backup:v1",
);
function encode(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}
function decode(value: unknown, size: number) {
  if (
    typeof value !== "string" ||
    value.length > 256 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(value)
  )
    throw new Error("Invalid backup.");
  const bytes = Uint8Array.from(atob(value), (character) =>
    character.charCodeAt(0),
  );
  if (bytes.length !== size) throw new Error("Invalid backup.");
  return bytes;
}
async function derive(password: string, salt: Uint8Array<ArrayBuffer>) {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
export async function encryptBackup(
  identity: Identity,
  password: string,
): Promise<string> {
  if (password.length < 12 || password.length > 1024)
    throw new Error("Use a backup password between 12 and 1024 characters.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await derive(password, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: context },
    key,
    new TextEncoder().encode(identity.export()),
  );
  return JSON.stringify(
    {
      format: "private-dao-voting-identity",
      version: 1,
      kdf: "PBKDF2-SHA256",
      iterations,
      cipher: "AES-256-GCM",
      salt: encode(salt),
      iv: encode(iv),
      ciphertext: encode(new Uint8Array(ciphertext)),
    },
    null,
    2,
  );
}
export async function decryptBackup(
  text: string,
  password: string,
): Promise<Identity> {
  if (text.length > 4096 || password.length > 1024)
    throw new Error("Invalid backup.");
  try {
    const data = JSON.parse(text);
    if (
      data.format !== "private-dao-voting-identity" ||
      data.version !== 1 ||
      data.kdf !== "PBKDF2-SHA256" ||
      data.iterations !== iterations ||
      data.cipher !== "AES-256-GCM"
    ) {
      throw new Error("Invalid backup.");
    }
    const salt = decode(data.salt, 16);
    const iv = decode(data.iv, 12);
    const ciphertext = decode(data.ciphertext, 60);
    const key = await derive(password, salt);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv, additionalData: context },
      key,
      ciphertext,
    );
    return importIdentity(new TextDecoder().decode(plaintext));
  } catch {
    throw new Error(
      "Could not restore this backup. Check the file and password.",
    );
  }
}

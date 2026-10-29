import { Identity } from "@semaphore-protocol/identity";
/** Only call from browser code or isolated tests; never pass secrets to a server. */
export function createIdentity(): Identity {
  return new Identity(crypto.getRandomValues(new Uint8Array(32)));
}
export function importIdentity(secret: unknown): Identity {
  if (typeof secret !== "string" || !/^[A-Za-z0-9+/]{43}=$/.test(secret))
    throw new Error("Invalid identity data.");
  return Identity.import(secret);
}
export const IDENTITY_SESSION_KEY = "pdv.identity.v1";
export function loadIdentity(
  storage: Pick<Storage, "getItem">,
): Identity | null {
  const secret = storage.getItem(IDENTITY_SESSION_KEY);
  return secret === null ? null : importIdentity(secret);
}
export function saveIdentity(
  storage: Pick<Storage, "setItem">,
  identity: Identity,
) {
  storage.setItem(IDENTITY_SESSION_KEY, identity.export());
}

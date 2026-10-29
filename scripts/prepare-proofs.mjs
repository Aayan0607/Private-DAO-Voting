import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const directory = new URL(
  "../public/proofs/semaphore-4.13.0/",
  import.meta.url,
);
await mkdir(directory, { recursive: true });
const manifestPath = new URL("../docs/proof-artifacts.json", import.meta.url);
let manifest;
try {
  manifest = JSON.parse(await readFile(manifestPath, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  manifest = {
    source: "https://snark-artifacts.pse.dev/semaphore/4.13.0",
    depth: 6,
    files: {},
  };
}
for (const extension of ["wasm", "zkey"]) {
  const name = "semaphore-6." + extension;
  const path = new URL(name, directory);
  let bytes;
  try {
    bytes = await readFile(path);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (!bytes) {
    const response = await fetch(manifest.source + "/" + name);
    if (!response.ok)
      throw new Error("Artifact download failed: " + response.status);
    bytes = Buffer.from(await response.arrayBuffer());
  }
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (manifest.files[name] && manifest.files[name].sha256 !== sha256)
    throw new Error("Artifact checksum mismatch: " + name);
  manifest.files[name] = { sha256, bytes: bytes.length };
  await writeFile(path, bytes);
  console.log(name + " verified (" + bytes.length + " bytes)");
}
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

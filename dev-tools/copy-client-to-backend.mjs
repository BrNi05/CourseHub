import { rm, cp, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientDist = path.resolve(__dirname, "../apps/client/dist");
const backendPublic = path.resolve(__dirname, "../apps/backend/public/frontend");

await run().catch((err) => {
  console.error("Copy failed:", err);
  process.exit(1);
});

async function run() {
  console.log("Bundling client into backend...");

  // Clean target
  await rm(backendPublic, { recursive: true, force: true });
  await mkdir(backendPublic, { recursive: true });

  await cp(clientDist, backendPublic, { recursive: true });

  console.log("Client successfully copied into backend.");
}

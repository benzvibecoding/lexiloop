/** Sinh icon PWA từ SVG gốc: 192/512 + maskable 512 (padding 20%). Chạy: pnpm icons */
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "icons");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const src = readFileSync(join(outDir, "icon.svg"));

async function png(name, size, maskable = false) {
  let img = sharp(src).resize(size, size, { fit: "contain", background: "#F9562E" });
  if (maskable) {
    const pad = Math.round(size * 0.2);
    img = sharp({
      create: { width: size, height: size, channels: 4, background: "#F9562E" },
    }).composite([{ input: await sharp(src).resize(size - pad * 2, size - pad * 2).png().toBuffer(), left: pad, top: pad }]);
  }
  await img.png().toFile(join(outDir, name));
  console.log("wrote", name);
}

await png("icon-192.png", 192);
await png("icon-512.png", 512);
await png("maskable-512.png", 512, true);

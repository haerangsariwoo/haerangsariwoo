// Compile the existing mascot into iOS launch-screen assets. No AI redraw or remote image.
import { readFile, mkdir } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";
import sharp from "sharp";

const app = new URL("../", import.meta.url);
const exports = {};
vm.runInNewContext(
  ts.transpileModule(
    await readFile(new URL("src/lib/startup-images.ts", app), "utf8"),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    },
  ).outputText,
  { exports },
);
const mascot = await readFile(new URL("public/brand/dolphin-hello.webp", app));
await mkdir(new URL("public/startup/", app), { recursive: true });
let bytes = 0;
for (const {
  url,
  width,
  height,
  ratio,
  theme,
} of exports.APPLE_STARTUP_IMAGES) {
  const size = 144 * ratio;
  const image = await sharp(mascot).resize(size, size).png().toBuffer();
  // Same mascot position as the HTML signature, leaving room for its wordmark.
  const result = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: theme === "dark" ? "#102033" : "#f8fbff",
    },
  })
    .composite([
      {
        input: image,
        left: Math.round((width - size) / 2),
        top: Math.round(height / 2 - 111.5 * ratio),
      },
    ])
    .png({ compressionLevel: 9, palette: true, colours: 256 })
    .toFile(new URL(`public${url}`, app).pathname);
  bytes += result.size;
}
console.log(
  `${exports.APPLE_STARTUP_IMAGES.length} iOS startup images, ${(bytes / 1024 / 1024).toFixed(2)} MiB total`,
);

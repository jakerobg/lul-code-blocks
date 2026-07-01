// Generate looping GIF previews from the animated HTML graphics.
//
// Usage:
//   node gifgen.mjs            # render every graphic in CONFIG
//   node gifgen.mjs tables     # render just the one whose key matches
//
// Output GIFs land in ../../product_pages/graphics/gifs/
//
// Tweak per-graphic: durationMs (how long to record — set to one full
// animation loop for a seamless GIF), fps, and the output width.

import { chromium } from "playwright-core";
import gifenc from "gifenc";
const { GIFEncoder, quantize, applyPalette } = gifenc;
import { PNG } from "pngjs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve, join } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GRAPHICS = resolve(__dirname, "../../product_pages/graphics");
const OUT = join(GRAPHICS, "gifs");

// width is the GIF width in px; height is derived from the 4:3 card ratio.
const COMMON = { fps: 12, width: 600, ratio: 4 / 3 };

const CONFIG = [
  { key: "reports",   file: "reports_graphic.html",   out: "reports.gif",   durationMs: 8000 },
  { key: "districts", file: "districts_graphic.html", out: "districts.gif", durationMs: 8000 },
  { key: "slices",    file: "slices_graphic.html",    out: "slices.gif",    durationMs: 8000 },
  { key: "tables",    file: "tables_graphic.html",    out: "tables.gif",    durationMs: 18000 },
  { key: "rasters",   file: "rasters_graphic.html",   out: "rasters.gif",   durationMs: 8000 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function render(browser, cfg) {
  const width = cfg.width ?? COMMON.width;
  const height = Math.round(width / (cfg.ratio ?? COMMON.ratio));
  const fps = cfg.fps ?? COMMON.fps;
  const frameMs = Math.round(1000 / fps);
  const frames = Math.max(1, Math.round(cfg.durationMs / frameMs));

  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(join(GRAPHICS, cfg.file)).href, { waitUntil: "networkidle" });
  await sleep(400); // let fonts/first paint settle

  const gif = GIFEncoder();
  process.stdout.write(`  ${cfg.key}: ${frames} frames @ ${fps}fps `);
  for (let i = 0; i < frames; i++) {
    const buf = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width, height } });
    const { data } = PNG.sync.read(buf); // RGBA
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);
    gif.writeFrame(index, width, height, { palette, delay: frameMs });
    if (i % 10 === 0) process.stdout.write(".");
    await sleep(frameMs);
  }
  gif.finish();
  writeFileSync(join(OUT, cfg.out), Buffer.from(gif.bytes()));
  await page.close();
  console.log(` ✓ ${cfg.out}`);
}

(async () => {
  mkdirSync(OUT, { recursive: true });
  const only = process.argv[2];
  const jobs = only ? CONFIG.filter((c) => c.key === only) : CONFIG;
  if (!jobs.length) {
    console.error(`No graphic matches "${only}". Keys: ${CONFIG.map((c) => c.key).join(", ")}`);
    process.exit(1);
  }
  const browser = await chromium.launch({ channel: "chrome" });
  console.log(`Rendering ${jobs.length} GIF(s) -> ${OUT}`);
  for (const cfg of jobs) await render(browser, cfg);
  await browser.close();
  console.log("Done.");
})();

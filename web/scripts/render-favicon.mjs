// Rasterize favicon.svg to the PNG sizes browsers want, using the system Chrome.
import puppeteer from "puppeteer-core";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const dir = dirname(fileURLToPath(import.meta.url));
const svg = readFileSync(join(dir, "../public/favicon.svg"), "utf8");
const outDir = join(dir, "../public");

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  userDataDir: `/tmp/aitiome-fav-${process.pid}`,
  args: ["--no-sandbox", "--no-first-run", "--force-color-profile=srgb"],
});
const page = await browser.newPage();

async function render(size, path, bg) {
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  const html = `<!doctype html><html><head><style>
    html,body{margin:0;padding:0;background:${bg || "transparent"}}
    svg{display:block;width:${size}px;height:${size}px}
  </style></head><body>${svg}</body></html>`;
  await page.setContent(html, { waitUntil: "load" });
  const el = await page.$("svg");
  const buf = await el.screenshot({ omitBackground: !bg });
  writeFileSync(path, buf);
  console.log("wrote", path, size + "px");
}

await render(32, join(outDir, "favicon-32.png"));
await render(180, join(outDir, "apple-touch-icon.png"));
await render(256, "/tmp/favicon-preview.png", "#eef1f5");
await browser.close();

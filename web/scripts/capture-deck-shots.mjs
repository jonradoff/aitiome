// Capture real app-panel screenshots for the presentation product-tour slides.
// Strategy: scroll each section heading near the top of a 1440x980 window and
// screenshot the full viewport (robust; no fragile per-element clipping).
import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const url = process.argv[2] || "http://localhost:5273";
const PROBE = process.argv.includes("--probe");

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true, userDataDir: `/tmp/aitiome-shots-${process.pid}`,
  args: ["--no-sandbox", "--no-first-run", "--use-gl=angle", "--use-angle=swiftshader"],
  defaultViewport: { width: 1440, height: 980, deviceScaleFactor: 2 },
});
const page = await browser.newPage();
await page.goto(url, { waitUntil: "load", timeout: 60000 });
await new Promise((r) => setTimeout(r, 4000));

if (PROBE) {
  const map = await page.evaluate(() =>
    [...document.querySelectorAll("h2, h3, .panel > span:first-child, .section-head")]
      .map((e) => e.textContent.trim().slice(0, 70)).filter(Boolean));
  console.log(JSON.stringify(map, null, 2));
  await browser.close();
  process.exit(0);
}

async function shot(text, file, headroom = 70) {
  const ok = await page.evaluate((t, hr) => {
    const els = [...document.querySelectorAll("h1,h2,h3,span,div")];
    const el = els.find((e) => e.textContent && e.textContent.trim().startsWith(t) &&
      e.querySelectorAll("*").length < 6); // prefer a leaf-ish heading node
    if (!el) return false;
    el.scrollIntoView({ block: "start" });
    window.scrollBy(0, -hr);
    return true;
  }, text, headroom);
  if (!ok) { console.log("NOT FOUND:", text); return; }
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: file });
  console.log("wrote", file);
}

await shot("It reconstructs the endorsed", "/tmp/deck-app-hero.png", 0);
await shot("Reasoning trace", "/tmp/deck-app-readout.png");
await shot("It is not fooled", "/tmp/deck-app-specificity.png");
await shot("Why not just use bioactivity", "/tmp/deck-app-falsification.png");
await shot("Where AI-driven discovery", "/tmp/deck-app-discovery.png");
await shot("The candidate queue", "/tmp/deck-app-candidates.png");
await shot("Anticipated critiques", "/tmp/deck-app-critiques.png");
await shot("Sources and references", "/tmp/deck-app-sources.png");
await shot("An external agent", "/tmp/deck-app-mcp.png");
await browser.close();

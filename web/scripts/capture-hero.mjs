// Capture the hero canvas (recovered rotenone) for the presentation deck.
import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const url = process.argv[2] || "http://localhost:5273";

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true, userDataDir: `/tmp/aitiome-herocap-${process.pid}`,
  args: ["--no-sandbox", "--no-first-run", "--use-gl=angle", "--use-angle=swiftshader"],
  defaultViewport: { width: 1600, height: 1000, deviceScaleFactor: 2 },
});
const page = await browser.newPage();
await page.goto(url, { waitUntil: "load", timeout: 60000 });

async function shot(label, file) {
  await page.evaluate((t) => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim().toLowerCase() === t.toLowerCase());
    if (b) b.click();
  }, label);
  await new Promise((r) => setTimeout(r, 3400)); // let the cascade play
  const el = await page.$(".hero-canvas");
  await el.screenshot({ path: file });
  console.log("wrote", file);
}
await shot("rotenone", "/tmp/deck-hero-rotenone.png");
await shot("warfarin", "/tmp/deck-hero-warfarin.png");
await browser.close();

// Headless screenshot of the running app for visual QA. Uses the system Chrome.
import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const url = process.argv[2] || "http://localhost:5273";
const out = process.argv[3] || "/tmp/aitiome-hero.png";
const clickText = process.argv[4]; // optional: click a selector-by-text button first

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  userDataDir: `/tmp/aitiome-shot-${process.pid}`,
  args: [
    "--no-sandbox",
    "--no-first-run",
    "--remote-debugging-port=0",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
  ],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
});
const page = await browser.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });

if (clickText) {
  await page.evaluate((t) => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim().toLowerCase() === t.toLowerCase());
    if (b) b.click();
  }, clickText);
}
// let the cascade animation play
await new Promise((r) => setTimeout(r, 3200));

await page.screenshot({ path: out, fullPage: process.env.FULL === "1" });
console.log("shot:", out);
console.log("console errors:", errors.length ? JSON.stringify(errors.slice(0, 10), null, 2) : "none");
await browser.close();

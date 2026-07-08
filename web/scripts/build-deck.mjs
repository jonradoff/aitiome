// Builds the Aitiome presentation as a 16:9 PDF, on-brand (embedded fonts + hero
// screenshot). Renders via the system Chrome. Output: docs/aitiome-presentation.pdf
import puppeteer from "puppeteer-core";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const dir = dirname(fileURLToPath(import.meta.url));
const root = join(dir, "../..");
const b64 = (p) => readFileSync(p).toString("base64");

const grotesk = b64(join(dir, "../node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2"));
const mono = b64(join(dir, "../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2"));
const hero = b64("/tmp/deck-hero-rotenone.png");
const heroReject = b64("/tmp/deck-hero-warfarin.png");

const FAVICON = readFileSync(join(dir, "../public/favicon.svg"), "utf8");

// --- slide helpers ---
const slides = [];
const slide = (cls, inner) => slides.push(`<section class="slide ${cls || ""}">${inner}</section>`);
const eyebrow = (t) => `<div class="eyebrow">${t}</div>`;
const h = (t) => `<h1>${t}</h1>`;
const foot = (n) => `<div class="foot"><span>Aitiome</span><span class="mono">aitiome.fly.dev</span><span>${n}</span></div>`;

let n = 0;
const N = () => String(++n).padStart(2, "0");

// 1 - title
slide("title", `
  <div class="mark">${FAVICON}</div>
  <h1 class="big">Aitiome</h1>
  <p class="lede">An honest mechanistic-reasoning engine for the environmental exposome of neurodegeneration.</p>
  <p class="tag mono">It recovers the real ones, resolves to the real neurons, and isn't fooled by the imposters.</p>
  <div class="urls mono"><span>aitiome.fly.dev</span><span class="dot">/</span><span>Built with Claude: Life Sciences</span></div>
  ${foot(N())}`);

// 2 - problem
slide("", `${eyebrow("The open question")}${h("Non-genetic drivers of sporadic neurodegeneration")}
  <div class="cols">
    <p>Most Parkinson's and Alzheimer's is <b>sporadic</b>, not inherited. The environmental
    exposome - pesticides, metals, industrial chemicals - is a leading suspect, and the field
    (Miller, Barouki, Samieri; <i>Nature Neuroscience</i> 2024) has called for AI that connects
    chemicals to mechanism.</p>
    <p class="dim">The hard part isn't listing bioactive chemicals. It's telling a real
    neurotoxicant apart from a compound that is merely bioactive - the exact failure mode of
    activity-based screening.</p>
  </div>${foot(N())}`);

// 3 - pivot
slide("", `${eyebrow("The honest pivot")}${h("We set out to discover. The evidence redirected us.")}
  <div class="two">
    <div class="card"><div class="k mono">Finding 1</div><p>No shippable unsupervised-discovery
    signal exists for this chemical class on public data. Seven axes tested; all coverage-killed
    or confounder-killed.</p></div>
    <div class="card"><div class="k mono">Finding 2</div><p>The discriminating signal is
    <b>curated mechanism</b>, not assay activity. Bioactivity scores worse than chance against the
    decoys.</p></div>
  </div>
  <p class="pull">So we built the thing the data supports - and made the honesty the contribution.</p>
  ${foot(N())}`);

// 4 - win conditions
slide("", `${eyebrow("What it does")}${h("Three co-equal goals")}
  <div class="three">
    <div class="card"><div class="num c">01</div><b>Validation that works</b><p class="dim">Recover the known neurotoxicants on the endorsed pathway; reject the adversarial decoys.</p></div>
    <div class="card"><div class="num g">02</div><b>A signature visualization</b><p class="dim">The recovery-and-specificity reveal resolving into the vulnerable dopaminergic neurons.</p></div>
    <div class="card"><div class="num c">03</div><b>Honest, calibrated framing</b><p class="dim">Confidence tiers on every result; the discovery limits shown, not hidden.</p></div>
  </div>${foot(N())}`);

// 5 - scoreboard
slide("dark", `${eyebrow("The result, on the reconnaissance ground truth")}${h("Zero errors")}
  <div class="score">
    <div><div class="n c">12/12</div><div class="l">known neurotoxicants recovered</div></div>
    <div><div class="n">15/15</div><div class="l">negatives correctly rejected</div></div>
    <div><div class="n r">6/6</div><div class="l">bioactive decoys not fooled</div></div>
    <div><div class="n c">0</div><div class="l">false positives + false negatives</div></div>
  </div>
  <p class="dim center">12 positives (6 assay-recovered + 6 curated-anchored) - 15 negatives, including 6 mitochondria-active adversarial decoys.</p>
  ${foot(N())}`);

// 6 - recovery rule
slide("", `${eyebrow("The core discipline")}${h("The recovery rule")}
  <div class="rule mono">positive &nbsp;&#8660;&nbsp; ( CTD curated Parkinson's DirectEvidence ) &nbsp;OR&nbsp; ( registered neuro-AOP stressor )</div>
  <div class="two">
    <div><b class="c">Curated signals are diagnostic.</b><p class="dim">Two independent curation efforts. Fixed logical rule, no fitted parameters.</p></div>
    <div><b class="r">Assay activity is corroboration only.</b><p class="dim">Anti-diagnostic here - the engine <b>never</b> gates a positive call on bioactivity.</p></div>
  </div>${foot(N())}`);

// 7 - mechanism / hero
slide("bleed", `
  <img class="heroimg" src="data:image/png;base64,${hero}"/>
  <div class="overlay">
    ${eyebrow("The signature visual")}
    <h1>The endorsed AOP-3 cascade, grounded, resolving into the vulnerable neurons</h1>
    <p class="mono small">MIE complex-I inhibition &#8594; mitochondrial dysfunction &#8594; nigrostriatal dopaminergic degeneration &#8594; parkinsonian deficits. MIE grounded in MitoCarta Complex-I subunits; the terminal frame is the Kamath SOX6/AGTR1 vulnerable dopaminergic neurons.</p>
  </div>${foot(N())}`);

// 8 - specificity
slide("", `${eyebrow("The specificity centerpiece")}${h("It is not fooled by the imposters")}
  <div class="two">
    <div class="card uncertain"><div class="k mono">What fools an activity model</div><p>The decoys are genuinely bioactive, often mitochondria-active. On multi-assay fingerprint similarity they collapse into the positives (0.53).</p></div>
    <div class="card recovered"><div class="k mono">Why Aitiome does not</div><p>No curated diagnostic signal. Independently, warfarin and fenofibrate also fail brain-exposure and show zero FAERS parkinsonism signal - rejected on three independent lines at once.</p></div>
  </div>${foot(N())}`);

// 9 - falsification
slide("dark", `${eyebrow("The falsification - computed live from our own data")}${h("Why not just use bioactivity?")}
  <p class="dim">If activity could do the job, some signal would separate the 12 positives from the 6 decoys. None does - every one is at or below chance (0.5).</p>
  <div class="bars">
    ${bar("Mitochondrial assays", 0.16)}
    ${bar("Membrane potential (MMP)", 0.12)}
    ${bar("Oxidative stress", 0.20)}
    ${bar("Mechanistic assays (total)", 0.39)}
    ${bar("ToxCast active (all)", 0.15)}
  </div>
  <p class="dim">Curated rule on the same set: <b class="c">perfect (0 errors)</b>. The decoys are, if anything, more bioactive than the real neurotoxicants.</p>
  ${foot(N())}`);

// 10 - circularity
slide("", `${eyebrow("Answering the sharpest critique, empirically")}${h("Is it circular? Two independent curations converge")}
  <div class="score3">
    <div><div class="n">8/12</div><div class="l">CTD DirectEvidence alone</div></div>
    <div class="op">+</div>
    <div><div class="n">8/12</div><div class="l">AOP-Wiki stressor alone</div></div>
    <div class="op">&#8594;</div>
    <div><div class="n c">12/12</div><div class="l">the rule (CTD or AOP)</div></div>
  </div>
  <p class="dim center">CTD (toxicogenomics literature) and AOP-Wiki (OECD regulatory) are independent efforts; neither alone suffices, so this is not one source read twice. Both are <b>0/15</b> false-positives. And the decoys were selected for bioactivity, not curation status - so rejecting them is not baked in.</p>
  ${foot(N())}`);

// 11 - discovery map
slide("", `${eyebrow("The honest part")}${h("Where AI-driven discovery works, and where it does not")}
  <div class="grid7">
    ${axis("LINCS L1000", "coverage-killed")}
    ${axis("EPA HTTr", "coverage-killed")}
    ${axis("EPA HTPP", "coverage-killed")}
    ${axis("Structure / QSAR", "confounder-killed")}
    ${axis("ToxCast fingerprint", "confounder-killed")}
    ${axis("ComptoxAI / AlzKB", "coverage-killed")}
    ${axis("Neural-specific subset", "qualified lead", true)}
    ${axis("Boltz-2 Q-site", "conditional lead", true)}
  </div>
  <p class="dim">Seven axes coverage- or confounder-killed. Two honest, unproven leads remain (reported with explicit N). Discovery is a map, never a predictor.</p>
  ${foot(N())}`);

// 12 - built on claude
slide("dark", `${eyebrow("Built on Claude")}${h("Claude explains. It never decides.")}
  <div class="three">
    <div class="card"><b class="c">Evidence-reasoner (Opus 4.8)</b><p class="dim">Writes the calibrated, [E#]-cited synthesis. Hard-bounded: the call and tier are fixed inputs it may not change; it cites real strands, invents nothing, never claims causation.</p></div>
    <div class="card"><b class="c">Claude Science</b><p class="dim">The human-in-the-loop substrate for evidence curation (e.g. epidemiology extraction), snapshotted into the engine.</p></div>
    <div class="card"><b class="c">Dual interface</b><p class="dim">One engine over HTTP and MCP - a scientist and an external agent query the same tools.</p></div>
  </div>${foot(N())}`);

// 13 - architecture
slide("", `${eyebrow("How it's built")}${h("Deterministic core, auditable end to end")}
  <div class="two">
    <ul class="list">
      <li>One Go binary embeds the curated data; the recovery decision is <b>deterministic</b> - no LLM in the decision path.</li>
      <li>Transport-agnostic service, thin HTTP + MCP adapters (the dual interface).</li>
      <li>DTXSID-first, salt-form-correct identity (the paraquat-dichloride trap, tested).</li>
    </ul>
    <ul class="list">
      <li>Every claim links to the original source (CTD, AOP-Wiki, MitoCarta, Kamath, ToxCast/ICE, FAERS, B3DB).</li>
      <li><span class="mono">make validate</span> prints the falsification report; fp=fn=0 is enforced in tests.</li>
      <li>~13 MB container, live on fly.io. Reproducible: same input, same output.</li>
    </ul>
  </div>${foot(N())}`);

// 14 - limitations
slide("", `${eyebrow("Said before you ask")}${h("Limitations and next steps")}
  <div class="two">
    <ul class="list">
      <li>A curated benchmark with an adversarial control (27), not a population generalization study.</li>
      <li>Recovery shares curated provenance with the labels - defended by the independent-source ablation and the orthogonal negatives; it is a sanity check, not the headline.</li>
      <li>Anchored on the Parkinson's / mitochondrial route; Alzheimer's is a scaffold extension.</li>
    </ul>
    <ul class="list">
      <li><b>Next:</b> a larger, blinded neural-specific reference set to power the one qualified lead (AUROC 0.72, currently perm-p 0.155).</li>
      <li><b>Next:</b> run the bounded Boltz-2 Q-site benchmark - physics, not annotation or activity.</li>
      <li><b>Next:</b> extend the endorsed scaffold to an AD hallmark.</li>
    </ul>
  </div>${foot(N())}`);

// 15 - close
slide("title", `
  <div class="mark">${FAVICON}</div>
  <h1 class="big2">Less flashy than the original pitch.<br/>Far more trustworthy.</h1>
  <p class="lede">Validated recovery, adversarial specificity proven by falsification, and an honest map of the limits - for a mechanism-first audience, that is the point.</p>
  <div class="urls mono"><span>aitiome.fly.dev</span><span class="dot">/</span><span>github.com/jonradoff/aitiome</span></div>
  ${foot(N())}`);

function bar(name, v) {
  const pct = Math.round(v * 100);
  const chance = 50;
  return `<div class="barrow">
    <div class="bn">${name}</div>
    <div class="bt"><div class="bfill" style="width:${pct}%"></div><div class="bchance" style="left:${chance}%"></div></div>
    <div class="bv mono">${v.toFixed(2)}</div>
  </div>`;
}
function axis(name, verdict, lead) {
  const tone = lead ? "lead" : verdict.includes("confounder") ? "conf" : "cov";
  return `<div class="axis ${tone}"><div class="an">${name}</div><div class="av mono">${verdict}${lead ? " &#9679;" : ""}</div></div>`;
}

const css = `
  @font-face{font-family:'Grotesk';src:url(data:font/woff2;base64,${grotesk}) format('woff2');font-weight:300 700;}
  @font-face{font-family:'PlexMono';src:url(data:font/woff2;base64,${mono}) format('woff2');font-weight:400;}
  *{box-sizing:border-box;margin:0;padding:0}
  :root{--bg:#0a0c10;--bg2:#12161d;--bg3:#171c25;--line:rgba(255,255,255,.09);--ink:#e9edf3;--dim:#9fabbb;--faint:#616d7e;--c:#55d6c6;--g:#e7b168;--r:#e07a8f;--u:#d6a444}
  html,body{background:#000}
  body{font-family:'Grotesk',system-ui,sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased}
  .mono{font-family:'PlexMono',monospace}
  .slide{width:1280px;height:720px;background:var(--bg);position:relative;padding:70px 84px;overflow:hidden;page-break-after:always;display:flex;flex-direction:column}
  .slide.dark{background:radial-gradient(120% 90% at 15% 0%,#0f151d,#080a0e 75%)}
  .eyebrow{font-family:'PlexMono';font-size:14px;letter-spacing:.22em;text-transform:uppercase;color:var(--c);margin-bottom:26px}
  h1{font-size:44px;font-weight:600;letter-spacing:-.02em;line-height:1.08;max-width:22ch}
  .big{font-size:120px;letter-spacing:-.03em;margin:6px 0 22px}
  .big2{font-size:52px;max-width:20ch;margin-bottom:22px}
  p{font-size:20px;line-height:1.5;color:var(--ink)}
  .dim{color:var(--dim)}.faint{color:var(--faint)}.center{text-align:center}
  b.c,.c{color:var(--c)}b.r,.r{color:var(--r)}b.g,.g{color:var(--g)}
  .foot{position:absolute;left:84px;right:84px;bottom:34px;display:flex;justify-content:space-between;font-size:13px;color:var(--faint);font-family:'PlexMono'}
  /* title */
  .slide.title{justify-content:center}
  .mark{width:64px;height:64px;margin-bottom:26px}.mark svg{width:64px;height:64px;border-radius:16px}
  .lede{font-size:24px;max-width:40ch;color:var(--dim);margin-bottom:18px}
  .tag{font-size:16px;color:var(--c);margin-bottom:40px}
  .urls{display:flex;gap:16px;font-size:15px;color:var(--faint)}.urls .dot{color:var(--line)}
  /* layouts */
  .cols{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:34px}
  .two{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:34px}
  .three{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:34px}
  .card{background:linear-gradient(180deg,var(--bg2),var(--bg));border:1px solid var(--line);border-radius:14px;padding:26px}
  .card .k{font-size:12px;letter-spacing:.05em;text-transform:uppercase;color:var(--faint);margin-bottom:12px}
  .card .num{font-family:'PlexMono';font-size:30px;margin-bottom:10px}
  .card b{font-size:20px;display:block;margin-bottom:8px}
  .card.recovered{border-color:color-mix(in srgb,var(--c) 40%,transparent)}
  .card.uncertain{border-color:color-mix(in srgb,var(--u) 40%,transparent)}
  .pull{margin-top:34px;font-size:24px;color:var(--c)}
  .rule{margin:38px 0 10px;font-size:22px;background:var(--bg2);border:1px solid var(--line);border-radius:12px;padding:26px 24px;color:var(--ink);text-align:center}
  .list{list-style:none;display:flex;flex-direction:column;gap:16px}
  .list li{font-size:18px;line-height:1.45;color:var(--dim);padding-left:20px;position:relative}
  .list li::before{content:"";position:absolute;left:0;top:9px;width:7px;height:7px;border-radius:99px;background:var(--c)}
  .list li b{color:var(--ink)}
  /* scoreboard */
  .score{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid var(--line);border-radius:14px;overflow:hidden;margin:38px 0 26px}
  .score>div{padding:38px 26px;border-left:1px solid var(--line)}.score>div:first-child{border-left:none}
  .score .n{font-family:'PlexMono';font-size:50px;font-weight:500;line-height:1}
  .score .l{font-size:14px;color:var(--faint);margin-top:10px}
  .score3{display:flex;align-items:center;gap:28px;justify-content:center;margin:46px 0 30px}
  .score3 .n{font-family:'PlexMono';font-size:52px}.score3 .l{font-size:14px;color:var(--faint);margin-top:8px;text-align:center}
  .score3 .op{font-size:34px;color:var(--faint)}
  /* bars */
  .bars{display:flex;flex-direction:column;gap:16px;margin:30px 0}
  .barrow{display:grid;grid-template-columns:280px 1fr 60px;align-items:center;gap:18px}
  .bn{font-size:17px}.bv{font-size:17px;color:var(--u);text-align:right}
  .bt{position:relative;height:12px;background:var(--bg3);border-radius:8px;overflow:visible}
  .bfill{height:100%;background:var(--u);border-radius:8px;opacity:.85}
  .bchance{position:absolute;top:-5px;bottom:-5px;width:2px;background:var(--faint)}
  /* discovery */
  .grid7{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:30px 0}
  .axis{border:1px solid var(--line);border-radius:12px;padding:18px}
  .axis .an{font-size:16px;font-weight:500;margin-bottom:8px}
  .axis .av{font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:var(--faint)}
  .axis.conf .av{color:var(--u)}.axis.lead{border-color:color-mix(in srgb,var(--c) 40%,transparent)}.axis.lead .av{color:var(--c)}
  /* bleed hero */
  .slide.bleed{padding:0}
  .heroimg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 30%}
  .slide.bleed .overlay{position:absolute;left:0;right:0;bottom:0;padding:60px 84px 84px;background:linear-gradient(180deg,transparent,rgba(8,10,14,.4) 30%,rgba(8,10,14,.96))}
  .slide.bleed h1{max-width:26ch}
  .small{font-size:15px;color:var(--dim);margin-top:14px;max-width:80ch}
`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${slides.join("")}</body></html>`;

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true, userDataDir: `/tmp/aitiome-deck-${process.pid}`,
  args: ["--no-sandbox", "--no-first-run", "--force-color-profile=srgb"],
});
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(async () => { await document.fonts.ready; });
const out = join(root, "docs/aitiome-presentation.pdf");
await page.pdf({ path: out, width: "1280px", height: "720px", printBackground: true, pageRanges: "1-15" });
console.log("wrote", out);
// QA: export a few slide images
if (process.env.QA) {
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  const els = await page.$$(".slide");
  for (const i of [0, 4, 6, 8, 9]) {
    await els[i].screenshot({ path: `/tmp/deck-slide-${i + 1}.png` });
    console.log("qa slide", i + 1);
  }
}
await browser.close();

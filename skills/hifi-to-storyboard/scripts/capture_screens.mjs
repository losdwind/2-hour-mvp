// 配置驱动的交互稿逐页截图。用法: node capture_screens.mjs capture-config.json
// config 字段:
//   html            交互稿绝对路径
//   outputDir       截图输出目录
//   screens         页面 id 数组
//   navExpression   跳转 JS 模板，{screen} 会被替换，如 "go('{screen}')"
//   targetSelector  截图元素选择器模板，如 "#s-{screen}"；留空则截全页
//   viewport        { width, height, deviceScaleFactor }，默认 900x900 @2x
//   settleMs        每页跳转后的等待毫秒，默认 300
//   chromePath      可选，不用 puppeteer 时的 Chrome 可执行文件路径
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

// 模块解析顺序: 脚本目录 → 当前工作目录（支持在装了 puppeteer/playwright 的项目目录里运行）
const req = createRequire(resolve(process.cwd(), "package.json"));
const loadPkg = async (name) => {
  try { return await import(name); }
  catch { return import(req.resolve(name)); }
};

const cfg = JSON.parse(readFileSync(process.argv[2], "utf8"));
const vp = cfg.viewport ?? { width: 900, height: 900, deviceScaleFactor: 2 };
const settle = cfg.settleMs ?? 300;
mkdirSync(cfg.outputDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fill = (tpl, screen) => tpl.replaceAll("{screen}", screen);

async function withPuppeteer() {
  const { default: puppeteer } = await loadPkg("puppeteer");
  const browser = await puppeteer.launch({ headless: "new", args: ["--allow-file-access-from-files", "--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport(vp);
  await page.goto(`file://${resolve(cfg.html)}`, { waitUntil: "networkidle0" });
  for (const screen of cfg.screens) {
    if (cfg.navExpression) await page.evaluate(fill(cfg.navExpression, screen));
    await sleep(settle);
    const out = resolve(cfg.outputDir, `${screen}.png`);
    if (cfg.targetSelector) {
      const el = await page.$(fill(cfg.targetSelector, screen));
      if (!el) throw new Error(`selector not found for ${screen}`);
      await el.screenshot({ path: out });
    } else {
      await page.screenshot({ path: out });
    }
    console.log(`${screen}.png`);
  }
  await browser.close();
}

async function withRawCdp() {
  const port = 9333;
  const chrome = spawn(cfg.chromePath, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars",
    "--allow-file-access-from-files", `--remote-debugging-port=${port}`,
    `--user-data-dir=${resolve(cfg.outputDir, ".chrome-profile")}`, "about:blank",
  ], { stdio: ["ignore", "ignore", "ignore"] });
  process.on("exit", () => chrome.kill("SIGTERM"));
  let version;
  for (let i = 0; i < 60; i++) {
    try { version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); break; }
    catch { await sleep(200); }
  }
  if (!version) throw new Error("Chrome CDP 未启动");
  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener("open", r, { once: true }); ws.addEventListener("error", j, { once: true }); });
  const pending = new Map(); let nextId = 1;
  ws.addEventListener("message", (ev) => {
    const d = JSON.parse(ev.data);
    if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.j(new Error(d.error.message)) : p.r(d.result); }
  });
  const send = (method, params = {}, sessionId) => {
    const id = nextId++;
    ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
    return new Promise((r, j) => pending.set(id, { r, j }));
  };
  const { targetId } = await send("Target.createTarget", { url: `file://${resolve(cfg.html)}` });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  const s = (m, p = {}) => send(m, p, sessionId);
  await s("Page.enable"); await s("Runtime.enable");
  await s("Emulation.setDeviceMetricsOverride", { ...vp, mobile: false });
  await sleep(800);
  for (const screen of cfg.screens) {
    if (cfg.navExpression) await s("Runtime.evaluate", { expression: fill(cfg.navExpression, screen) });
    await sleep(settle);
    let clip;
    if (cfg.targetSelector) {
      const rect = (await s("Runtime.evaluate", {
        expression: `(()=>{const r=document.querySelector(${JSON.stringify(fill(cfg.targetSelector, screen))}).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}})()`,
        returnByValue: true,
      })).result.value;
      clip = { x: Math.max(0, rect.x), y: Math.max(0, rect.y), width: rect.width, height: rect.height, scale: 1 };
    }
    const image = await s("Page.captureScreenshot", { format: "png", fromSurface: true, ...(clip ? { clip } : {}) });
    writeFileSync(resolve(cfg.outputDir, `${screen}.png`), Buffer.from(image.data, "base64"));
    console.log(`${screen}.png`);
  }
  chrome.kill("SIGTERM");
}

async function withPlaywright() {
  const pw = await loadPkg("playwright");
  const browser = await pw.chromium.launch({ args: ["--allow-file-access-from-files", "--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.deviceScaleFactor ?? 2 });
  await page.goto(`file://${resolve(cfg.html)}`, { waitUntil: "networkidle" });
  for (const screen of cfg.screens) {
    if (cfg.navExpression) await page.evaluate(fill(cfg.navExpression, screen));
    await sleep(settle);
    const out = resolve(cfg.outputDir, `${screen}.png`);
    if (cfg.targetSelector) await page.locator(fill(cfg.targetSelector, screen)).screenshot({ path: out });
    else await page.screenshot({ path: out });
    console.log(`${screen}.png`);
  }
  await browser.close();
}

// 依次尝试 puppeteer → playwright → 裸 CDP(chromePath)
try { await withPuppeteer(); }
catch (e1) {
  try { console.error(`puppeteer 不可用(${e1.message.slice(0, 80)})，尝试 playwright`); await withPlaywright(); }
  catch (e2) {
    if (cfg.chromePath) { console.error(`playwright 不可用(${e2.message.slice(0, 80)})，改用 chromePath`); await withRawCdp(); }
    else throw new Error(`puppeteer/playwright 均不可用且未配置 chromePath: ${e2.message}`);
  }
}

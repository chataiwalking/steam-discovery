import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const out = path.join(root, "artifacts");
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
page.setDefaultTimeout(60_000);
page.setDefaultNavigationTimeout(90_000);
const report = {
  recordedAt: new Date().toISOString(),
  environment: {
    browser: await browser.version(),
    platform: process.platform,
    headless: true,
    audioMocked: false,
    baseURL: "http://127.0.0.1:5173",
  },
  interpretation:
    "Local desktop Chrome only. 390px is a narrow desktop viewport, not a real phone or iPad. FPS is requestAnimationFrame scheduling over 100 intervals with a visible live WebGL canvas, not a guaranteed GPU-rendering or device-performance benchmark.",
  consoleErrors: [],
  pageErrors: [],
  failedRequests: [],
  captures: [],
};
page.on("console", (message) => {
  if (message.type() === "error")
    report.consoleErrors.push({ url: page.url(), message: message.text() });
});
page.on("pageerror", (error) =>
  report.pageErrors.push({ url: page.url(), message: error.message }),
);
page.on("requestfailed", (request) =>
  report.failedRequests.push({
    url: request.url(),
    error: request.failure()?.errorText,
  }),
);

async function sceneReady(selector) {
  await page.locator(selector).waitFor({ state: "visible" });
  await page.waitForLoadState("networkidle");
  if(selector.includes("island"))await page.getByRole("button",{name:"探索昼夜的秘密",exact:true}).waitFor({state:"visible",timeout:90000});
  if (selector.includes("experiment")) {
    const id = new URL(page.url()).hash.match(/lesson\/([\w-]+)/)?.[1];
    const text = id === "day-night" ? "地球自转 · 找找小屋的白天" : "红 + 绿 + 蓝 = 白光";
    await page.locator(".experiment-canvas").getByText(text, { exact: true }).waitFor({ state: "visible", timeout: 90_000 });
  }
  await page.waitForFunction((selector) => {
    const canvas = document.querySelector(selector);
    return (
      canvas instanceof HTMLCanvasElement &&
      canvas.width > 100 &&
      canvas.height > 100
    );
  }, selector);
  // Allow the lazy scene to mount and the browser to finish its first paints.
  await page.evaluate(async () => {
    for (let frame = 0; frame < 12; frame++)
      await new Promise(requestAnimationFrame);
  });
}

async function measure() {
  return page.evaluate(async () => {
    const ticks = [];
    for (let index = 0; index <= 100; index++)
      ticks.push(
        await new Promise((resolve) => requestAnimationFrame(resolve)),
      );
    const intervals = ticks.slice(1).map((time, index) => time - ticks[index]);
    const sorted = [...intervals].sort((a, b) => a - b);
    const mean =
      intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const canvas = document.querySelector("canvas");
    return {
      url: location.href,
      viewport: { width: innerWidth, height: innerHeight },
      layout: {
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: innerWidth,
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      },
      canvas: canvas
        ? {
            width: canvas.width,
            height: canvas.height,
            cssWidth: canvas.getBoundingClientRect().width,
            cssHeight: canvas.getBoundingClientRect().height,
          }
        : null,
      frameScheduling: {
        intervals: intervals.length,
        averageFps: Number((1000 / mean).toFixed(1)),
        medianFrameMs: Number(sorted[50].toFixed(2)),
        p95FrameMs: Number(sorted[95].toFixed(2)),
        durationMs: Number((ticks[100] - ticks[0]).toFixed(2)),
      },
    };
  });
}

async function capture(name, selector) {
  await sceneReady(selector);
  const measurement = await measure();
  const destination = path.join(out, name);
  await page.screenshot({ path: destination, fullPage: true });
  report.captures.push({ name, path: destination, ...measurement });
  console.log(
    `${name}: ${measurement.viewport.width}px, overflow=${measurement.layout.horizontalOverflow}, rAF=${measurement.frameScheduling.averageFps}fps`,
  );
}

try {
  await page.goto("http://127.0.0.1:5173/#/");
  await capture("home-desktop.png", ".island-wrap canvas");
  await page.setViewportSize({ width: 1920, height: 1080 });
  await sceneReady(".island-wrap canvas");
  report.captures.push({
    name: "home-desktop-1920-layout-only",
    ...(await measure()),
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await capture("home-mobile.png", ".island-wrap canvas");

  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("http://127.0.0.1:5173/#/lesson/day-night?age=4-5");
  await capture("lesson-day-night.png", ".experiment-canvas canvas");

  await page.goto("http://127.0.0.1:5173/#/lesson/light?age=6-8");
  await page.getByRole("button", { name: "我来试试看", exact: true }).click();
  for (const color of ["红灯", "绿灯", "蓝灯"])
    await page.getByRole("button", { name: color, exact: true }).click();
  await capture("lesson-light.png", ".experiment-canvas canvas");
  report.summary = {
    noHorizontalOverflow: report.captures.every(
      (capture) => !capture.layout.horizontalOverflow,
    ),
    consoleErrorCount: report.consoleErrors.length,
    pageErrorCount: report.pageErrors.length,
    failedRequestCount: report.failedRequests.length,
    screenshotCount: report.captures.filter((capture) => capture.path).length,
  };
} catch (error) {
  report.failure = error.message;
  process.exitCode = 1;
} finally {
  await writeFile(
    path.join(out, "ui-report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  await browser.close();
}
console.log(JSON.stringify(report.summary || { failure: report.failure }));

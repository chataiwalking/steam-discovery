import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import type { LessonDefinition } from "../src/types";

const lessonData = JSON.parse(
  readFileSync(new URL("../src/content/lessons.json", import.meta.url), "utf8"),
) as LessonDefinition[];

type LessonId =
  | "day-night"
  | "water-cycle"
  | "gears"
  | "bridge"
  | "light"
  | "shapes";
type Age = "2-3" | "4-5" | "6-8";
type AudioRecord = { src: string; paused: boolean; attempts: number };
type AudioHarness = {
  records: AudioRecord[];
  failNext: number;
  delay: number;
  events: string[];
};
declare global {
  interface Window {
    __audioHarness: AudioHarness;
  }
}

const manifest = Object.fromEntries(
  lessonData.flatMap((lesson) =>
    Object.values(lesson.tracks).flatMap((track) =>
      track.steps.map(({ clip }) => [
        clip.id,
        {
          file: `audio/${clip.id}.mp3`,
          duration: 12,
          text: clip.spokenText,
          textHash: "e2e-fixture",
        },
      ]),
    ),
  ),
);

// Keep the real narration hook, requests, controls and route lifecycle. Only the
// browser audio device is deterministic, so media duration/autoplay cannot hold
// up the learning paths and race conditions can be reproduced explicitly.
async function mockAudio(
  page: Page,
  options: { failNext?: number; delay?: number } = {},
) {
  await page.route("**/audio/manifest.json", (route) =>
    route.fulfill({ json: manifest }),
  );
  await page.addInitScript(
    ({ failNext, delay }) => {
      window.__audioHarness = { records: [], failNext, delay, events: [] };
      class ControlledAudio {
        currentTime = 0;
        duration = 12;
        onended: (() => void) | null = null;
        onerror: (() => void) | null = null;
        record: AudioRecord;
        constructor(src = "") {
          this.record = { src, paused: true, attempts: 0 };
          window.__audioHarness.records.push(this.record);
        }
        async play() {
          const harness = window.__audioHarness;
          this.record.attempts += 1;
          harness.events.push(`play:${this.record.src}`);
          if (harness.failNext > 0) {
            harness.failNext -= 1;
            throw new DOMException(
              "Simulated autoplay denial",
              "NotAllowedError",
            );
          }
          await new Promise((resolve) => setTimeout(resolve, harness.delay));
          this.record.paused = false;
        }
        pause() {
          this.record.paused = true;
          window.__audioHarness.events.push(`pause:${this.record.src}`);
        }
        removeAttribute(name: string) {
          if (name === "src") this.record.src = "";
        }
        load() {
          this.record.paused = true;
        }
      }
      window.Audio = ControlledAudio as unknown as typeof Audio;
    },
    { failNext: options.failNext ?? 0, delay: options.delay ?? 0 },
  );
}

const button = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });

const sceneLabels: Record<LessonId, string> = {
  "day-night": "地球自转 · 找找小屋的白天",
  "water-cycle": "小水滴在这里",
  gears: "相邻齿轮 · 总是反着转",
  bridge: "三角形斜撑 · 连接更稳定",
  light: "让彩色的光，在这里相遇",
  shapes: "选形状 · 动手数一数",
};

async function expectSceneReady(page: Page, id: LessonId) {
  // A Canvas can exist while the lazy R3F scene is still empty. These labels
  // mount inside the actual scene, so a blank canvas cannot pass this check.
  await expect(
    page.locator(".experiment-canvas").getByText(sceneLabels[id], { exact: true }),
  ).toBeVisible({ timeout: 60_000 });
}

async function trialAction(page: Page, id: LessonId) {
  const action: Record<LessonId, string> = {
    "day-night": "转动地球",
    "water-cycle": "↑ 蒸发",
    gears: "启动齿轮",
    bridge: "桥面",
    light: "红灯",
    shapes: "添加小球",
  };
  // The arrow in the water button is decorative text in the accessible name.
  if (id === "water-cycle")
    await page.getByRole("button", { name: /蒸发/ }).click();
  else await button(page, action[id]).click();
}

async function enterChallenge(page: Page, id: LessonId, age: Age) {
  await page.goto(`/#/lesson/${id}?age=${age}`);
  await expect(page.locator("main.lesson-page")).toHaveAttribute(
    "data-age",
    age,
  );
  await expectSceneReady(page, id);
  await button(page, "听讲解").click();
  await expect(button(page, "暂停讲解")).toBeVisible();
  await button(page, "我来试试看").click();
  await expect(button(page, "去发现小规律")).toBeDisabled();
  await trialAction(page, id);
  await button(page, "去发现小规律").click();
  await expect(button(page, "收下这颗发现星")).toBeDisabled();
}

async function solve(page: Page, id: LessonId, age: Age) {
  switch (id) {
    case "day-night":
      if (age === "6-8") {
        await button(page, "转半圈后是白天").click();
        await expect(button(page, "收下这颗发现星")).toBeDisabled();
        await button(page, "转半圈后是黑夜").click();
      } else {
        // Four quarter turns guarantee an observation of both hemispheres,
        // without depending on floating-point behavior exactly at sunset.
        for (let n = 0; n < 4; n++) await button(page, "转动地球").click();
      }
      break;
    case "water-cycle":
      if (age === "6-8") {
        await page.getByRole("button", { name: /凝结/ }).click();
        await expect(button(page, "收下这颗发现星")).toBeDisabled();
        await button(page, "重新试试").click();
      }
      for (const name of ["蒸发", "凝结", "降雨"])
        await page.getByRole("button", { name: new RegExp(name) }).click();
      break;
    case "gears":
      await button(page, "启动齿轮").click();
      await expect(button(page, "收下这颗发现星")).toBeDisabled();
      if (age === "2-3") await button(page, "停止齿轮").click();
      else if (age === "4-5") await button(page, "换个转动方向").click();
      else {
        await button(page, "右边 24 齿").click();
        await expect(button(page, "收下这颗发现星")).toBeEnabled();
        await button(page, "右边 12 齿").click();
        await expect(button(page, "收下这颗发现星")).toBeDisabled();
        await button(page, "右边 24 齿").click();
      }
      break;
    case "bridge":
      await button(page, "让小车过桥").click();
      await expect(page.getByRole("status")).toContainText("先给小桥放上桥面");
      await expect(button(page, "收下这颗发现星")).toBeDisabled();
      await button(page, "桥面").click();
      await button(page, "让小车过桥").click();
      await expect(button(page, "桥面")).toBeDisabled();
      if (age === "2-3") {
        await button(page, "暂停动画").click();
        // Deliberately wait longer than the five-second crossing: elapsed
        // wall time must not award a star while the actual animation is paused.
        await page.waitForTimeout(5_300);
        await expect(button(page, "收下这颗发现星")).toBeDisabled();
        await button(page, "继续动画").click();
      }
      if (age === "4-5") {
        await button(page, "桥墩").click();
        await expect(button(page, "收下这颗发现星")).toBeDisabled();
        await button(page, "让小车过桥").click();
      } else if (age === "6-8") {
        await expect(button(page, "收下这颗发现星")).toBeDisabled();
        await button(page, "斜撑").click();
        await expect(button(page, "收下这颗发现星")).toBeDisabled();
        await button(page, "让小车过桥").click();
      }
      break;
    case "light":
      await button(page, "红灯").click();
      await expect(button(page, "收下这颗发现星")).toBeDisabled();
      await button(page, "绿灯").click();
      if (age !== "4-5") await button(page, "蓝灯").click();
      break;
    case "shapes":
      if (age === "2-3") {
        for (let n = 0; n < 3; n++) await button(page, "添加小球").click();
      } else if (age === "4-5") {
        await page
          .locator(".shape-options")
          .getByRole("button", { name: /方块/ })
          .click();
        for (let n = 0; n < 5; n++) await button(page, "添加方块").click();
        await expect(button(page, "收下这颗发现星")).toBeDisabled();
        await button(page, "把方块放入分类托盘").click();
      } else {
        for (let n = 0; n < 3; n++) await button(page, "添加小球").click();
        await page
          .locator(".shape-options")
          .getByRole("button", { name: /方块/ })
          .click();
        for (let n = 0; n < 5; n++) await button(page, "添加方块").click();
      }
      break;
  }
}

test("all six scenes mount their actual 3D scene labels", async ({ page }) => {
  for (const lesson of lessonData) {
    await page.goto(`/#/lesson/${lesson.id}?age=4-5`);
    await expectSceneReady(page, lesson.id);
  }
});

for (const lesson of lessonData) {
  for (const age of ["2-3", "4-5", "6-8"] as const) {
    test(`${lesson.title} / ${age} completes through real controls and persists its star`, async ({
      page,
    }) => {
      await mockAudio(page);
      const id = lesson.id as LessonId;
      await enterChallenge(page, id, age);
      await solve(page, id, age);
      await button(page, "收下这颗发现星").click();
      await expect(
        page.getByRole("dialog", { name: "探索完成" }),
      ).toBeVisible();
      await expect
        .poll(() =>
          page.evaluate(
            (key) =>
              JSON.parse(localStorage.getItem("discovery-progress") || "{}")[
                key
              ],
            `${id}:${age}`,
          ),
        )
        .toBe(true);
      await button(page, "再自由玩一会儿").click();
      await expect(page.getByText("已经发现，欢迎再玩")).toBeVisible();
      await button(page, "重新试试").click();
      await expect(button(page, "再收下一颗好奇心")).toBeDisabled();
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              window.__audioHarness.records.filter((record) => !record.paused)
                .length,
          ),
        )
        .toBe(0);
    });
  }
}

test("playback rejection displays a retry and the same narration can recover", async ({
  page,
}) => {
  await mockAudio(page, { failNext: 1 });
  await page.goto("/#/lesson/day-night?age=4-5");
  await button(page, "听讲解").click();
  await expect(page.getByRole("alert")).toContainText("声音暂时没能播放");
  await button(page, "重试播放").click();
  await expect(button(page, "暂停讲解")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await button(page, "暂停讲解").click();
  await expect(button(page, "继续讲解")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__audioHarness.records.filter((record) => !record.paused)
            .length,
      ),
    )
    .toBe(0);
  await button(page, "继续讲解").click();
  await expect(button(page, "暂停讲解")).toBeVisible();
});

test("a failed manifest request retries through the real loading path", async ({
  page,
}) => {
  await mockAudio(page);
  await page.unroute("**/audio/manifest.json");
  let attempts = 0;
  await page.route("**/audio/manifest.json", (route) => {
    attempts++;
    return attempts === 1
      ? route.fulfill({ status: 503, body: "not ready" })
      : route.fulfill({ json: manifest });
  });
  await page.goto("/#/lesson/water-cycle?age=2-3");
  await button(page, "听讲解").click();
  await expect(button(page, "重试播放")).toBeVisible();
  await button(page, "重试播放").click();
  await expect(button(page, "暂停讲解")).toBeVisible();
  expect(attempts).toBe(2);
});

test("rapid navigation and replay leave only the current clip playing", async ({
  page,
}) => {
  await mockAudio(page, { delay: 250 });
  await page.goto("/#/lesson/day-night?age=4-5");
  await button(page, "听讲解").click();
  await expect
    .poll(() => page.evaluate(() => window.__audioHarness.records.length))
    .toBe(1);
  await page.getByRole("link", { name: "回到小岛", exact: true }).click();
  await page
    .locator(".lesson-grid")
    .getByRole("button", { name: /小水滴旅行/ })
    .click();
  await button(page, "听讲解").click();
  await button(page, "重听这一段").click();
  await expect(button(page, "暂停讲解")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__audioHarness.records
          .filter((record) => !record.paused)
          .map((record) => record.src),
      ),
    )
    .toEqual(["/audio/water-cycle-4-5-0.mp3"]);
  await button(page, "我来试试看").click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__audioHarness.records.filter((record) => !record.paused)
            .length,
      ),
    )
    .toBe(0);
  await button(page, "听讲解").click();
  await expect(button(page, "暂停讲解")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__audioHarness.records
          .filter((record) => !record.paused)
          .map((record) => record.src),
      ),
    )
    .toEqual(["/audio/water-cycle-4-5-1.mp3"]);
});

test("small viewport keeps navigation and experiment controls on screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockAudio(page);
  await page.goto("/#/lesson/light?age=6-8");
  await expect(button(page, "我来试试看")).toBeVisible();
  await button(page, "我来试试看").click();
  await button(page, "红灯").click();
  await button(page, "去发现小规律").click();
  await solve(page, "light", "6-8");
  await button(page, "收下这颗发现星").click();
  await expect(page.getByRole("dialog", { name: "探索完成" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const readJson = (file) =>
  JSON.parse(readFileSync(path.join(root, file), "utf8"));
const ages = ["2-3", "4-5", "6-8"];
const coreSubjects = { "day-night": "S", "water-cycle": "S", gears: "T", bridge: "E", light: "A", shapes: "M" };
const experiments = readJson("src/content/experiments.json");
const ids = [...Object.keys(coreSubjects), ...experiments.map(experiment => experiment.id)];
const expectedSubjects = { ...coreSubjects, ...Object.fromEntries(experiments.map(experiment => [experiment.id, experiment.subject])) };
const subjectCounts = { S: 0, T: 0, E: 0, A: 0, M: 0 };
const titles = ["看一看", "动手试", "发现规律"];
const clips = new Map();
const lessons = readJson("src/content/lessons.json");
const hasText = (value, label) => {
  assert.equal(typeof value, "string", `${label} must be text`);
  assert.ok(value.trim().length > 0, `${label} must not be empty`);
  assert.ok(
    !/TODO|TBD|待补充|占位文本/i.test(value),
    `${label} contains placeholder content`,
  );
};

assert.ok(Array.isArray(lessons), "Lessons must be an array");
assert.equal(experiments.length, 44, "Exactly 44 additional experiment configurations are required");
assert.equal(new Set(ids).size, 50, "Experiment configurations and core lessons must have 50 unique IDs");
assert.deepEqual(
  lessons.map(({ id }) => id).sort(),
  [...ids].sort(),
  "Exactly 50 unique topics matching the fixed experiment configurations are required",
);
let trackCount = 0;
for (const lesson of lessons) {
  assert.equal(lesson.subject, expectedSubjects[lesson.id], `${lesson.id} has the wrong STEAM subject`);
  subjectCounts[lesson.subject] += 1;
  for (const field of [
    "title",
    "subtitle",
    "category",
    "color",
    "icon",
    "description",
    "fact",
  ]) {
    hasText(lesson[field], `${lesson.id}.${field}`);
  }
  assert.match(
    lesson.color,
    /^#[\da-f]{6}$/i,
    `${lesson.id} color must be hexadecimal`,
  );
  hasText(lesson.source?.title, `${lesson.id}.source.title`);
  if (lesson.source.url) {
    assert.equal(
      new URL(lesson.source.url).protocol,
      "https:",
      `${lesson.id} source must use HTTPS`,
    );
  } else {
    assert.ok(["T", "A", "M"].includes(lesson.subject), `${lesson.id} science and engineering knowledge require a primary source`);
    assert.match(lesson.source.title, /原创/, `${lesson.id} without an external source must identify the original activity`);
  }
  assert.deepEqual(
    Object.keys(lesson.tracks).sort(),
    [...ages].sort(),
    `${lesson.id} needs all age bands`,
  );
  for (const age of ages) {
    const track = lesson.tracks[age];
    trackCount += 1;
    hasText(track.goal, `${lesson.id}/${age}.goal`);
    hasText(track.success, `${lesson.id}/${age}.success`);
    assert.equal(
      track.steps.length,
      3,
      `${lesson.id}/${age} must contain three steps`,
    );
    for (const [index, step] of track.steps.entries()) {
      assert.equal(
        step.title,
        titles[index],
        `${lesson.id}/${age} step order is incorrect`,
      );
      hasText(step.instruction, `${lesson.id}/${age}/${index}.instruction`);
      const clip = step.clip;
      assert.equal(
        clip.id,
        `${lesson.id}-${age}-${index}`,
        "Clip IDs must be stable and predictable",
      );
      assert.ok(!clips.has(clip.id), `Duplicate clip: ${clip.id}`);
      hasText(clip.text, `${clip.id}.text`);
      hasText(clip.spokenText, `${clip.id}.spokenText`);
      assert.equal(
        clip.text,
        clip.spokenText,
        `${clip.id} subtitle and narration must match`,
      );
      assert.ok(
        clip.text.length >= 20 && clip.text.length <= 60,
        `${clip.id} should be one short narration segment`,
      );
      clips.set(clip.id, clip);
    }
  }
  const experiment = experiments.find(item => item.id === lesson.id);
  if (experiment) {
    assert.equal(lesson.title, experiment.title, `${lesson.id} title differs from the experiment`);
    assert.equal(lesson.fact, experiment.fact, `${lesson.id} science boundary differs from the experiment`);
    assert.notEqual(experiment.initial, experiment.targetValue, `${lesson.id} comparison requires distinct parameter values`);
    assert.ok(lesson.tracks["4-5"].goal.includes(String(experiment.initial)) && lesson.tracks["4-5"].goal.includes(String(experiment.targetValue)), `${lesson.id} comparison goal must name both parameter values`);
    assert.ok(lesson.tracks["6-8"].goal.includes(String(experiment.targetValue)), `${lesson.id} advanced goal must name the target value`);
    assert.ok(lesson.tracks["6-8"].goal.includes(experiment.options[experiment.targetOption]), `${lesson.id} advanced goal must name the target option`);
  }
}
assert.deepEqual(subjectCounts, { S: 10, T: 10, E: 10, A: 10, M: 10 }, "Each STEAM subject must contain ten lessons");
assert.equal(
  trackCount,
  150,
  "Exactly 150 age-specific learning tracks are required",
);
assert.equal(clips.size, 450, "Exactly 450 narration clips are required");

// Inspect MPEG Layer III frames instead of trusting a filename or metadata alone.
// Kokoro output is converted to MPEG-1/2/2.5 MP3 by ffmpeg; no native tools are
// needed in the browser build or GitHub Actions validation job.
function mp3Duration(buffer, label) {
  let offset = 0;
  if (buffer.subarray(0, 3).toString("ascii") === "ID3") {
    assert.ok(buffer.length >= 10, `${label} has a truncated ID3 header`);
    const bytes = [...buffer.subarray(6, 10)];
    assert.ok(
      bytes.every((value) => value < 128),
      `${label} has an invalid ID3 size`,
    );
    offset = 10 + bytes.reduce((size, value) => (size << 7) + value, 0);
    if (buffer[5] & 0x10) offset += 10;
  }
  let seconds = 0;
  let frames = 0;
  let skipped = 0;
  while (offset + 4 <= buffer.length) {
    const h = buffer.readUInt32BE(offset);
    const version = (h >>> 19) & 3;
    const layer = (h >>> 17) & 3;
    const bitrateIndex = (h >>> 12) & 15;
    const rateIndex = (h >>> 10) & 3;
    if (
      h >>> 21 !== 0x7ff ||
      version === 1 ||
      layer !== 1 ||
      bitrateIndex === 0 ||
      bitrateIndex === 15 ||
      rateIndex === 3
    ) {
      offset += 1;
      skipped += 1;
      continue;
    }
    const bitrates =
      version === 3
        ? [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
        : [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
    const sampleRate =
      [44100, 48000, 32000][rateIndex] /
      (version === 3 ? 1 : version === 2 ? 2 : 4);
    const length =
      Math.floor(
        ((version === 3 ? 144 : 72) * bitrates[bitrateIndex] * 1000) /
          sampleRate,
      ) +
      ((h >>> 9) & 1);
    assert.ok(
      offset + length <= buffer.length,
      `${label} has a truncated MP3 frame`,
    );
    seconds += (version === 3 ? 1152 : 576) / sampleRate;
    frames += 1;
    offset += length;
  }
  assert.ok(
    frames > 5 && seconds > 0.2,
    `${label} contains no usable MP3 audio`,
  );
  assert.ok(skipped < 1024, `${label} has unexpected non-audio bytes`);
  return seconds;
}

if (!process.argv.includes("--content-only")) {
  const manifest = readJson("public/audio/manifest.json");
  assert.deepEqual(
    Object.keys(manifest).sort(),
    [...clips.keys()].sort(),
    "Manifest must match the 450 course clips exactly",
  );
  for (const [id, clip] of clips) {
    const entry = manifest[id];
    assert.equal(
      entry.file,
      `audio/${id}.mp3`,
      `${id} has an unexpected audio path`,
    );
    assert.equal(entry.text, clip.spokenText, `${id} manifest text is stale`);
    const hash = createHash("sha256")
      .update(clip.spokenText, "utf8")
      .digest("hex");
    assert.equal(
      entry.textHash,
      hash,
      `${id} text hash is stale; regenerate its audio`,
    );
    assert.ok(
      Number.isFinite(entry.duration) &&
        entry.duration > 0.2 &&
        entry.duration < 120,
      `${id} has an invalid duration`,
    );
    const audio = readFileSync(path.join(root, "public", entry.file));
    assert.ok(audio.length > 1000, `${id} audio is empty or too short`);
    const audioHash = createHash("sha256").update(audio).digest("hex");
    assert.equal(entry.audioHash, audioHash, `${id} audio file digest does not match the manifest`);
    const measured = mp3Duration(audio, id);
    assert.ok(
      Math.abs(measured - entry.duration) < 0.2 + entry.duration * 0.02,
      `${id} duration differs from the actual MP3: ${measured.toFixed(3)} versus ${entry.duration}`,
    );
  }
  console.log(
    "Content verified: 50 topics (10 per STEAM subject), 150 learning tracks, 450 matching MP3 files, text and audio hashes, and measured durations.",
  );
} else {
  console.log(
    "Content verified: 50 topics (10 per STEAM subject), 150 learning tracks, 450 complete narration clips. Audio verification skipped explicitly.",
  );
}

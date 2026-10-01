#!/usr/bin/env python3
"""Generate offline Mandarin narration with the explicitly selected Chinese Kokoro model.

Run with Python 3.12 after installing scripts/tts-requirements.txt. FFmpeg and
FFprobe must be on PATH. Model files stay in the ignored .venv-tts directory.

  .venv-tts/bin/python scripts/synthesize_narration.py --samples
  .venv-tts/bin/python scripts/synthesize_narration.py
  python3 scripts/synthesize_narration.py --verify

The sample pass is a technical gate, not a substitute for a person listening.
All yielded model chunks are concatenated; no sentence is silently discarded.
The default style raises pitch and resonances by 3.5 semitones, then restores
the original speaking tempo. It is a synthetic childlike effect, not a verified
child speaker, and does not use voice cloning or a paid service.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
MODEL = "hexgrad/Kokoro-82M-v1.1-zh"
MODEL_SHA256 = "b1d8410fa44dfb5c15471fd6c4225ea6b4e9ac7fa03c98e8bea47a9928476e2b"
VOICE = "zf_001"
SPEED = 0.9
RATE = 24000
# A synthetic childlike style, not a claim that the source speaker is a child.
# Resampling raises both pitch and resonances; independent time stretching then
# restores the original speaking pace instead of making the narration faster.
VOICE_STYLE = "playful-childlike"
PITCH_SEMITONES = 3.5
SHIFTED_RATE = round(RATE * 2 ** (PITCH_SEMITONES / 12))
PITCH_RATIO = SHIFTED_RATE / RATE
VOICE_FILTER = (
    f"asetrate={SHIFTED_RATE},aresample={RATE},atempo={1 / PITCH_RATIO:.9f},"
    "highpass=f=75,equalizer=f=5800:t=q:w=0.8:g=-1.5,"
    "loudnorm=I=-18:TP=-2:LRA=7"
)
SAMPLES = [
    "你好，小小发现家。点一点，我们一起看太阳。",
    "一、二、三。三个圆圆的球，滚进小篮子。",
    "白天亮亮的，夜晚暗暗的。小屋转到哪里了？",
    "红光和绿光照在一起，变成了黄色的光。",
    "地球不停地自转，朝向太阳的一面是白天。",
    "液态的水变成看不见的水蒸气，这叫蒸发。",
    "水蒸气遇冷凝结成小水滴，许多小水滴聚成云。",
    "两个咬合的齿轮，转动方向总是相反。",
    "大齿轮转一圈，小齿轮会转得更快。",
    "桥墩缩短了桥面的跨度。加上斜撑，结构更稳定。",
    "再听一遍，再转动地球，预测小屋何时进入白天。",
    "五加五等于十。球、立方体和圆柱，形状各不相同。",
]


def write_json(path: Path, value: object) -> None:
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")
    temporary.replace(path)


def narration_clips(value: object):
    if isinstance(value, dict):
        if all(key in value for key in ("id", "text", "spokenText")):
            yield {"id": value["id"], "text": value["spokenText"]}
        else:
            for child in value.values():
                yield from narration_clips(child)
    elif isinstance(value, list):
        for child in value:
            yield from narration_clips(child)


def text_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def probe(path: Path) -> dict:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries",
         "format=duration:stream=codec_name,sample_rate,channels", "-of", "json", str(path)],
        check=True, capture_output=True, text=True,
    )
    data = json.loads(result.stdout)
    duration = float(data["format"]["duration"])
    stream = data["streams"][0]
    if not (0.5 < duration < 90):
        raise ValueError(f"Unexpected duration for {path.name}: {duration}")
    if stream["codec_name"] != "mp3" or stream["sample_rate"] != str(RATE) or stream["channels"] != 1:
        raise ValueError(f"Unexpected audio format for {path.name}: {stream}")
    return {"duration": round(duration, 4), **stream}


def verify(clips: list[dict], output: Path, manifest: dict) -> dict:
    records = []
    for clip in clips:
        entry = manifest.get(clip["id"])
        if not entry or entry["textHash"] != text_hash(clip["text"]) or entry["text"] != clip["text"]:
            raise ValueError(f"Missing or outdated clip: {clip['id']}")
        info = probe(output / f"{clip['id']}.mp3")
        if abs(info["duration"] - entry["duration"]) > 0.05:
            raise ValueError(f"Duration mismatch: {clip['id']}")
        # Decode every MP3. FFmpeg's mean_volume detects an accidentally silent file.
        decoded = subprocess.run(
            ["ffmpeg", "-v", "info", "-i", str(output / f"{clip['id']}.mp3"),
             "-af", "volumedetect", "-f", "null", "-"],
            check=True, capture_output=True, text=True,
        )
        volume_match = re.search(r"mean_volume: (-?[\d.]+) dB", decoded.stderr)
        if not volume_match or float(volume_match[1]) < -45:
            raise ValueError(f"Silent or unexpectedly quiet clip: {clip['id']}")
        peak_match = re.search(r"max_volume: (-?[\d.]+) dB", decoded.stderr)
        if not peak_match or float(peak_match[1]) >= -0.1:
            raise ValueError(f"Clipping or unexpected peak level: {clip['id']}")
        records.append({"id": clip["id"], **info, "meanVolumeDb": float(volume_match[1]),
                        "maxVolumeDb": float(peak_match[1])})
    report = {
        "count": len(records),
        "totalDuration": round(sum(record["duration"] for record in records), 2),
        "technicalChecks": "All files decoded; MP3, mono 24 kHz, matching text hashes and measured durations; non-silent audio with peak headroom.",
        "listeningStatus": "Human review is required for pronunciation, completeness and child suitability; technical checks alone do not verify those qualities.",
        "clips": records,
    }
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--samples", action="store_true", help="Produce the twelve review samples first")
    parser.add_argument("--verify", action="store_true", help="Check existing files without loading a model")
    parser.add_argument("--force", action="store_true", help="Regenerate even unchanged text")
    parser.add_argument("--only", help="Only generate the comma-separated clip IDs")
    parser.add_argument("--model-dir", type=Path, help="Optional predownloaded model directory containing config.json, kokoro-v1_1-zh.pth and zf_001.pt")
    args = parser.parse_args()
    cached_model_dir = ROOT / ".venv-tts/cache/kokoro-model"
    if args.model_dir is None and all((cached_model_dir / name).exists() for name in ("config.json", "kokoro-v1_1-zh.pth", "zf_001.pt")):
        args.model_dir = cached_model_dir
    for executable in ("ffmpeg", "ffprobe"):
        if not shutil.which(executable):
            raise SystemExit(f"Install {executable} before running this script")

    if args.samples:
        clips = [{"id": f"sample-{i:02}", "text": text} for i, text in enumerate(SAMPLES, start=1)]
        output = ROOT / "artifacts/audio-samples"
    else:
        source = ROOT / "src/content/lessons.json"
        clips = list(narration_clips(json.loads(source.read_text())))
        output = ROOT / "public/audio"
    if not clips or len({clip["id"] for clip in clips}) != len(clips):
        raise SystemExit("The content has no clips or contains duplicate clip IDs")
    for clip in clips:
        if not re.fullmatch(r"[a-z0-9-]+", clip["id"]) or not clip["text"].strip():
            raise SystemExit(f"Invalid clip: {clip!r}")
    if args.only:
        wanted = set(args.only.split(","))
        clips = [clip for clip in clips if clip["id"] in wanted]
        if {clip["id"] for clip in clips} != wanted:
            raise SystemExit("--only references an unknown clip ID")
    output.mkdir(parents=True, exist_ok=True)
    manifest_path = output / "manifest.json"
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    generation_path = output / "generation.json"
    settings = {"model": MODEL, "modelSha256": MODEL_SHA256, "voice": VOICE, "speed": SPEED, "device": "cpu", "sampleRate": RATE,
                "encoding": "MP3 mono 96 kbps", "kokoro": "0.9.4", "misaki": "0.9.4", "scriptVersion": 2,
                "voiceStyle": {"name": VOICE_STYLE, "sourceSpeakerAge": "not verified; childlike DSP style only",
                               "pitchSemitones": PITCH_SEMITONES, "pitchRatio": PITCH_RATIO,
                               "formants": "shifted with pitch by resampling", "tempoCompensation": 1 / PITCH_RATIO,
                               "filter": VOICE_FILTER}}
    previous_settings = json.loads(generation_path.read_text()) if generation_path.exists() else None
    if args.verify and previous_settings != settings:
        raise SystemExit("Synthesis settings do not match this voice style; generate the updated audio before verifying.")

    if not args.verify:
        pending = [clip for clip in clips if args.force or previous_settings != settings
                   or manifest.get(clip["id"], {}).get("textHash") != text_hash(clip["text"])
                   or not (output / f"{clip['id']}.mp3").exists()]
        if pending:
            cache = ROOT / ".venv-tts/cache"
            os.environ.setdefault("HF_HOME", str(cache / "huggingface"))
            os.environ.setdefault("TORCH_HOME", str(cache / "torch"))
            os.environ.setdefault("XDG_CACHE_HOME", str(cache))
            os.environ.setdefault("HF_HUB_DISABLE_XET", "1")
            os.environ.setdefault("HF_HUB_DOWNLOAD_TIMEOUT", "60")
            import numpy as np
            import soundfile as sf
            import torch
            from kokoro import KModel, KPipeline
            from huggingface_hub import hf_hub_download

            torch.set_num_threads(min(4, os.cpu_count() or 1))
            print("Loading the pinned Chinese model (first run downloads weights)...", flush=True)
            model_file = str(args.model_dir / KModel.MODEL_NAMES[MODEL]) if args.model_dir else hf_hub_download(repo_id=MODEL, filename=KModel.MODEL_NAMES[MODEL])
            with open(model_file, "rb") as handle:
                actual_sha256 = hashlib.file_digest(handle, "sha256").hexdigest()
            if actual_sha256 != MODEL_SHA256:
                raise ValueError("The model checksum does not match the official model card")
            config = str(args.model_dir / "config.json") if args.model_dir else None
            model = KModel(repo_id=MODEL, model=model_file, config=config).to("cpu").eval()
            pipeline = KPipeline(lang_code="z", repo_id=MODEL, model=model)
            voice_file = str(args.model_dir / f"{VOICE}.pt") if args.model_dir else VOICE
            for index, clip in enumerate(pending, start=1):
                print(f"[{index}/{len(pending)}] {clip['id']}: {clip['text']}", flush=True)
                chunks = []
                for result in pipeline(clip["text"], voice=voice_file, speed=SPEED):
                    chunk = result.audio.detach().cpu().numpy()
                    if chunk.size:
                        if chunks:
                            chunks.append(np.zeros(round(RATE * 0.12), dtype=np.float32))
                        chunks.append(chunk)
                if not chunks:
                    raise ValueError(f"Model returned no audio for {clip['id']}")
                # A short release tail prevents the MP3 stream ending immediately at a final phoneme.
                chunks.append(np.zeros(round(RATE * 0.25), dtype=np.float32))
                waveform = np.concatenate(chunks)
                if not np.isfinite(waveform).all() or np.max(np.abs(waveform)) < 0.001:
                    raise ValueError(f"Invalid or silent waveform for {clip['id']}")
                with tempfile.TemporaryDirectory(prefix="steam-narration-") as directory:
                    wav = Path(directory) / "narration.wav"
                    sf.write(wav, waveform, RATE, subtype="PCM_16")
                    target = output / f"{clip['id']}.mp3"
                    subprocess.run(
                        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav),
                         "-af", VOICE_FILTER, "-ar", str(RATE), "-ac", "1",
                         "-codec:a", "libmp3lame", "-b:a", "96k", str(target)], check=True,
                    )
                info = probe(target)
                manifest[clip["id"]] = {"file": f"audio/{clip['id']}.mp3", "duration": info["duration"],
                                        "textHash": text_hash(clip["text"]), "text": clip["text"],
                                        "audioHash": hashlib.sha256((output / f"{clip['id']}.mp3").read_bytes()).hexdigest()}
                write_json(manifest_path, manifest)
                print(f"  {info['duration']:.2f}s", flush=True)
            if not args.only or previous_settings == settings:
                write_json(generation_path, settings)
        else:
            print("All narration text and synthesis settings are unchanged; skipped generation.")
    report = verify(clips, output, manifest)
    report_path = ROOT / ("artifacts/audio-samples-verification.json" if args.samples else "artifacts/audio-verification.json")
    report_path.parent.mkdir(parents=True, exist_ok=True)
    write_json(report_path, report)
    print(json.dumps({key: value for key, value in report.items() if key != "clips"}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

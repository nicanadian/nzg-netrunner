#!/usr/bin/env python3
"""Build/verify browser card images from the checked-in NSG originals.

Dependency: Pillow==13.0.0 with WebP support (libwebp 1.6.0 used for this build).
  python3 -m venv /tmp/netrunner-card-assets-venv
  /tmp/netrunner-card-assets-venv/bin/pip install Pillow==13.0.0
  /tmp/netrunner-card-assets-venv/bin/python scripts/build-card-display.py
  /tmp/netrunner-card-assets-venv/bin/python scripts/build-card-display.py --check

The 16-bit RGBA PNG masters remain untouched. Pillow decodes them to 8-bit
RGBA for WebP delivery. WebP is lossless relative to those decoded pixels;
the 300px variant is a single Lanczos reduction. No sharpening or upscaling.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import struct

from PIL import Image, __version__ as pillow_version, features


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/cards-hires"
OUTPUT = ROOT / "assets/cards-display"
MANIFEST = OUTPUT / "manifest.json"
WIDTHS = (300, 600)
ENCODER = {"lossless": True, "quality": 75, "method": 6, "exact": True}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def describe(path, width, height):
    return {
        "path": path.relative_to(ROOT).as_posix(),
        "width": width,
        "height": height,
        "bytes": path.stat().st_size,
        "sha256": digest(path),
    }


def load_master(path):
    with Image.open(path) as image:
        if image.size != (600, 839):
            raise ValueError(f"Unexpected master dimensions: {path}: {image.size}")
        return image.convert("RGBA")


def delivery_pixels(master, width):
    if width > master.width:
        raise ValueError("Upscaling is prohibited")
    if width == master.width:
        return master
    return master.resize(
        (width, round(master.height * width / master.width)),
        Image.Resampling.LANCZOS,
    )


def build_one(path):
    master = load_master(path)
    variants = []
    for width in WIDTHS:
        pixels = delivery_pixels(master, width)
        target = OUTPUT / f"{path.stem}-{width}.webp"
        pixels.save(target, "WEBP", **ENCODER)
        variants.append(describe(target, *pixels.size))
    header = path.read_bytes()[:29]
    _, _, depth, color, _, _, _ = struct.unpack(">IIBBBBB", header[16:29])
    return {
        "code": path.stem,
        "input": {
            **describe(path, *master.size),
            "format": "PNG",
            "bitDepth": depth,
            "pngColorType": color,
        },
        "variants": variants,
    }


def verify(manifest):
    expected = {str(n) for n in range(30001, 30078)}
    if {entry["code"] for entry in manifest["cards"]} != expected:
        raise ValueError("Manifest must cover all 77 System Gateway cards")
    output_bytes = 0
    for entry in manifest["cards"]:
        source = ROOT / entry["input"]["path"]
        if digest(source) != entry["input"]["sha256"]:
            raise ValueError(f"Master hash mismatch: {source}")
        master = load_master(source)
        if {v["width"] for v in entry["variants"]} != set(WIDTHS):
            raise ValueError(f"Incomplete sizes: {entry['code']}")
        for variant in entry["variants"]:
            path = ROOT / variant["path"]
            if digest(path) != variant["sha256"] or path.stat().st_size != variant["bytes"]:
                raise ValueError(f"Delivery file hash/size mismatch: {path}")
            expected_pixels = delivery_pixels(master, variant["width"])
            with Image.open(path) as image:
                image.load()
                actual = image.convert("RGBA")
                if image.format != "WEBP" or actual.size != expected_pixels.size:
                    raise ValueError(f"Incorrect format/dimensions: {path}")
                if actual.tobytes() != expected_pixels.tobytes():
                    raise ValueError(f"Lossless RGBA verification failed: {path}")
            output_bytes += variant["bytes"]
    print(f"Verified 77 masters and 154 lossless delivery images ({output_bytes:,} bytes).")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Verify existing files without rebuilding")
    args = parser.parse_args()
    if not features.check("webp"):
        raise RuntimeError("Pillow needs WebP support")
    if args.check:
        verify(json.loads(MANIFEST.read_text()))
        return
    paths = [SOURCE / f"{n}.png" for n in range(30001, 30078)]
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=4) as pool:
        cards = list(pool.map(build_one, paths))
    manifest = {
        "schemaVersion": 1,
        "set": "System Gateway",
        "sourceManifest": "assets/card-sources.json",
        "sourcePrinting": "Checked-in 2023 Null Signal Games PNG card faces",
        "generator": "scripts/build-card-display.py",
        "pillowVersion": pillow_version,
        "webpVersion": features.version("webp"),
        "encoding": {
            "format": "WebP",
            "mode": "8-bit RGBA",
            **ENCODER,
            "qualityMeaning": "Compression effort only in lossless mode; decoded RGBA pixels are exact",
            "sourceConversion": "Pillow 16-bit PNG decode to 8-bit RGBA; alpha retained",
            "resize": "300px: single Lanczos downsample to 300x420; 600px: no resize",
            "upscaling": False,
            "sharpening": False,
        },
        "cards": cards,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    verify(manifest)


if __name__ == "__main__":
    main()

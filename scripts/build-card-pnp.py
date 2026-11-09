#!/usr/bin/env python3
"""Extract native-resolution System Gateway faces from NSG's official PnP.

Dependencies: Pillow==13.0.0 (WebP + LittleCMS), pypdf==6.21.4.
  /tmp/netrunner-card-assets-venv/bin/pip install Pillow==13.0.0 pypdf==6.21.4
  /tmp/netrunner-card-assets-venv/bin/python scripts/build-card-pnp.py --download
  /tmp/netrunner-card-assets-venv/bin/python scripts/build-card-pnp.py --check

This pinned PDF has 300ppi raster sheets, not vector card text. We crop the
original JPEG pixels inside the trim lines: 743x1029. No resize, upscale,
sharpening, or invented corner masks. ICC conversion preserves print colors.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
from io import BytesIO
import json
from pathlib import Path
import urllib.request

from PIL import Image, ImageChops, ImageCms, ImageStat, __version__ as pillow_version, features
from pypdf import PdfReader, __version__ as pypdf_version


ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "tmp/pdfs/system-gateway-remastered-a4-1x.pdf"
SOURCE_URL = "https://access.nullsignal.games/Gateway/English/English/SystemGatewayEnglish-A4%20Printable%20Sheets%201x.pdf"
SOURCE_HASH = "10ef89cb8caec211d1d487f43d9270f1b224fcb2d526c4d33a97db71f94ebcc4"
OUTPUT = ROOT / "assets/cards-display"
MANIFEST = OUTPUT / "pnp-manifest.json"
ENCODER = {"lossless": True, "quality": 75, "method": 6, "exact": True}
SIZE = (743, 1029)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def fingerprint(image):
    # Ignore exterior printing differences while retaining both art and rules.
    return image.convert("RGB").resize((60, 84)).crop((2, 5, 58, 70))


def extract_cards():
    if sha(PDF) != SOURCE_HASH:
        raise ValueError("PDF checksum changed: review its layout before extraction")
    reader = PdfReader(PDF)
    if len(reader.pages) != 12:
        raise ValueError("Unexpected PDF page count")
    metadata = json.loads((ROOT / "assets/card-data.json").read_text())
    references = {}
    for number in range(30001, 30078):
        code = str(number)
        with Image.open(ROOT / f"assets/cards-hires/{code}.png") as image:
            references[code] = fingerprint(image)
    result = []
    for page_number in range(2, 11):
        page = reader.pages[page_number - 1]
        objects = list(page["/Resources"]["/XObject"].values())
        if len(objects) != 1:
            raise ValueError("Expected one native raster sheet per page")
        image_object = objects[0].get_object()
        if (image_object["/Width"], image_object["/Height"]) != (2386, 3246):
            raise ValueError("Unexpected native sheet dimensions")
        profile = image_object["/ColorSpace"].get_object()[1].get_object().get_data()
        with Image.open(BytesIO(image_object.get_data())) as jpeg:
            if jpeg.mode != "CMYK":
                raise ValueError("Expected pinned PDF CMYK image")
            # PDF's CMYK samples and Pillow's Adobe JPEG convention are inverse.
            cmyk = ImageChops.invert(jpeg)
            rgb = ImageCms.profileToProfile(
                cmyk,
                ImageCms.ImageCmsProfile(BytesIO(profile)),
                ImageCms.createProfile("sRGB"),
                outputMode="RGB",
            )
        mask_object = image_object["/SMask"].get_object()
        mask = Image.frombytes("L", rgb.size, mask_object.get_data())
        for slot in range(9):
            number = 30001 + (page_number - 2) * 9 + slot
            if number > 30077:
                break
            code = str(number)
            row, column = divmod(slot, 3)
            left, top = (77, 821, 1565)[column], (78, 1109, 2140)[row]
            box = (left, top, left + SIZE[0], top + SIZE[1])
            # These crops are inside the printed faces, not the cut marks.
            crop_alpha = mask.crop(box)
            translucent = crop_alpha.point(lambda value: 255 - value).getbbox()
            if translucent not in (None, (0, SIZE[1] - 1, SIZE[0], SIZE[1])) or crop_alpha.getextrema()[0] < 200:
                raise ValueError(f"Unexpected opacity/trim line in crop {code}")
            card = rgb.crop(box).convert("RGBA")
            card.putalpha(crop_alpha)
            sample = fingerprint(card)
            matches = sorted(
                (sum(ImageStat.Stat(ImageChops.difference(sample, ref)).rms), ref_code)
                for ref_code, ref in references.items()
            )
            if matches[0][1] != code or matches[1][0] < matches[0][0] * 1.5:
                raise ValueError(f"Ambiguous card identity at page {page_number}, slot {slot + 1}")
            result.append((card, {
                "code": code,
                "title": metadata[code]["title"],
                "artist": metadata[code].get("artist", metadata[code].get("illustrator")),
                "pdfPage": page_number,
                "gridRow": row + 1,
                "gridColumn": column + 1,
                "pdfImageObject": objects[0].idnum,
                "nativeCrop": list(box),
                "reference": f"assets/cards-hires/{code}.png",
                "referenceSha256": sha(ROOT / f"assets/cards-hires/{code}.png"),
                "identityCheck": "Nearest existing card-image fingerprint, independently verified printed title/contact sheet",
            }))
    return result


def save_card(item):
    image, record = item
    path = OUTPUT / f"{record['code']}-743.webp"
    image.save(path, "WEBP", **ENCODER)
    return {**record, "path": path.relative_to(ROOT).as_posix(),
            "width": image.width, "height": image.height,
            "bytes": path.stat().st_size, "sha256": sha(path)}


def verify(cards, manifest):
    entries = {e["code"]: e for e in manifest["cards"]}
    if set(entries) != {str(n) for n in range(30001, 30078)}:
        raise ValueError("Must contain exactly 77 unique cards")
    for pixels, source in cards:
        entry = entries[source["code"]]
        for key in ("title", "pdfPage", "gridRow", "gridColumn", "nativeCrop", "referenceSha256"):
            if source[key] != entry[key]:
                raise ValueError(f"Provenance mismatch: {source['code']} {key}")
        path = ROOT / entry["path"]
        if sha(path) != entry["sha256"] or path.stat().st_size != entry["bytes"]:
            raise ValueError(f"Output checksum mismatch: {path}")
        with Image.open(path) as image:
            image.load()
            if image.format != "WEBP" or image.size != SIZE or image.convert("RGBA").tobytes() != pixels.tobytes():
                raise ValueError(f"Native-pixel verification failed: {path}")
    print(f"Verified 77 mapped native {SIZE[0]}x{SIZE[1]} crops; "
          f"{sum(e['bytes'] for e in entries.values()):,} lossless WebP bytes.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--download", action="store_true", help="Download the pinned official source if absent")
    parser.add_argument("--check", action="store_true", help="Verify without changing outputs")
    args = parser.parse_args()
    if args.download and not PDF.exists():
        PDF.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(SOURCE_URL, PDF)
    if not PDF.exists():
        raise FileNotFoundError("Run with --download to fetch the pinned official PDF")
    cards = extract_cards()
    if args.check:
        verify(cards, json.loads(MANIFEST.read_text()))
        return
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=4) as pool:
        entries = list(pool.map(save_card, cards))
    manifest = {
        "schemaVersion": 1,
        "set": "System Gateway - Remastered Edition (2023)",
        "source": {"url": SOURCE_URL, "productPage": "https://nullsignal.games/products/system-gateway/",
                   "sha256": SOURCE_HASH, "bytes": PDF.stat().st_size, "pages": 12,
                   "nativeSheetPixels": [2386, 3246], "nativePpi": 300,
                   "description": "Raster CMYK JPEG card sheets with embedded ICC profile and opacity mask; not vector artwork"},
        "generator": "scripts/build-card-pnp.py",
        "dependencies": {"Pillow": pillow_version, "pypdf": pypdf_version, "libwebp": features.version("webp")},
        "conversion": {"input": "Native CMYK JPEG pixels", "output": "sRGB 8-bit RGBA lossless WebP",
                       "color": "Invert Adobe JPEG sample convention, then embedded PDF ICC to sRGB via LittleCMS",
                       "crop": "Interior of print trim grid; square printed corners retained",
                       "alpha": "Source PDF opacity preserved; third-row cards retain one antialiased bottom edge row, all other crop pixels fully opaque",
                       "resize": False, "upscale": False, "sharpen": False, **ENCODER},
        "identityVerification": "All 77 printed names reviewed on contact sheets; sequential page mapping also checked against existing 600px card art fingerprints",
        "rights": "Card designs, artwork, and printed artist credits remain with their respective rights holders; official public PnP source is recorded, not a new blanket license.",
        "cards": entries,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    verify(cards, manifest)


if __name__ == "__main__":
    main()

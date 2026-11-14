#!/usr/bin/env python3
"""Extract native Elevation faces from the official PnP and build lossless WebP.

Requires Pillow and pypdf. --download fetches the pinned source if absent;
--check verifies every delivered pixel against that source without rebuilding.
No sharpening, upscaling, or generated artwork.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
import hashlib
import json
from pathlib import Path
import urllib.request
from PIL import Image, ImageChops, ImageCms, ImageStat
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / 'tmp/pdfs/elevation-1x-a4.pdf'
URL = 'https://access.nullsignal.games/Sets/PnPs/Elevation/English/Elevation-1x-A4-print-and-play_ENG.pdf'
SOURCE_HASH = 'a8ea674ccd4edc091fa403d8a452f57a722d11e264dfe28af11cd05d13f1adb9'
MANIFEST = ROOT / 'assets/elevation-sources.json'
EXPECTED = {str(i) for i in range(35001, 35083)} | {'35023-0', '35057-0'}
WIDTHS = (300, 600, 743)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def extract(reader, page, name):
    obj = reader.pages[page - 1]['/Resources']['/XObject'][name].get_object()
    with Image.open(BytesIO(obj.get_data())) as source:
        if source.size != (746, 1033):
            raise ValueError(f'Unexpected native dimensions: page {page}, {name}')
        profile = ImageCms.ImageCmsProfile(BytesIO(obj['/ColorSpace'][1].get_object().get_data()))
        # PDF CMYK samples use the inverse of Pillow's Adobe JPEG convention.
        pixels = ImageChops.invert(source) if source.mode == 'CMYK' else source
        return ImageCms.profileToProfile(pixels, profile, ImageCms.createProfile('sRGB'), outputMode='RGB')


def resized(image, width):
    if width > image.width:
        raise ValueError('Upscaling prohibited')
    return image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)


def describe(path, pixels):
    return {'path': str(path.relative_to(ROOT)), 'width': pixels.width, 'height': pixels.height, 'sha256': sha(path)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--download', action='store_true')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    if args.download and not PDF.exists():
        PDF.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(URL, PDF)
    if sha(PDF) != SOURCE_HASH:
        raise ValueError('Source PDF changed; inspect the layout before rebuilding')
    reader = PdfReader(PDF)
    if len(reader.pages) != 15:
        raise ValueError('Unexpected page count')
    if args.check:
        entries = json.loads(MANIFEST.read_text())['images']
        if len(entries) != 84 or {e['code'] for e in entries} != EXPECTED:
            raise ValueError('Must cover all 84 unique faces')
        if {(e['pdfPage'], e['pdfImageObject']) for e in entries} != {(pn + 1, name) for pn in [3, 4, *range(7, 15)] for name in reader.pages[pn]['/Resources']['/XObject']}:
            raise ValueError('PDF image mapping is incomplete or duplicated')
        for entry in entries:
            original = extract(reader, entry['pdfPage'], entry['pdfImageObject'])
            for record, expected in [(entry['master'], original), *[(v, resized(original, int(v['path'].rsplit('-', 1)[1].split('.')[0]))) for v in entry['variants']]]:
                path = ROOT / record['path']
                with Image.open(path) as image:
                    if sha(path) != record['sha256'] or image.size != expected.size or image.convert('RGB').tobytes() != expected.tobytes():
                        raise ValueError(f'Pixel/checksum mismatch: {path}')
            if {v['width'] for v in entry['variants']} != set(WIDTHS):
                raise ValueError('Incomplete display sizes')
        print('Verified all 84 native masters and 252 lossless display files against the pinned PDF.')
        return
    # Validate all mappings before changing any assets. Existing 300px versions
    # provide independent identity references, including the two reverse faces.
    references = {}
    for code in EXPECTED:
        with Image.open(ROOT / f'assets/cards-display/{code}-300.webp') as image:
            references[code] = image.convert('RGB').resize((60, 84))
    metadata = json.loads((ROOT / 'assets/card-data.json').read_text())
    cards = []
    for pn in [3, 4, *range(7, 15)]:
        for name in reader.pages[pn]['/Resources']['/XObject']:
            image = extract(reader, pn + 1, name)
            sample = image.resize((60, 84))
            matches = sorted((sum(ImageStat.Stat(ImageChops.difference(sample, reference)).rms), code) for code, reference in references.items())
            if matches[1][0] < matches[0][0] * 1.5:
                raise ValueError(f'Ambiguous face on page {pn + 1}, {name}')
            cards.append((image, {'code': matches[0][1], 'pdfPage': pn + 1, 'pdfImageObject': name, 'identityCheck': 'Nearest independent card-face fingerprint with >=1.5 separation', 'matchSeparation': matches[1][0] / matches[0][0]}))
    if len(cards) != 84 or {record['code'] for _, record in cards} != EXPECTED:
        raise ValueError('Missing or duplicate card mappings; no assets changed')

    def save(item):
        image, entry = item
        code = entry['code']
        entry['title'] = metadata[code.split('-')[0]]['title'] + (' (reverse face)' if '-' in code else '')
        master = ROOT / f'assets/cards-hires/{code}.png'
        image.save(master)
        entry['master'] = describe(master, image)
        entry['variants'] = []
        for width in WIDTHS:
            pixels = resized(image, width)
            target = ROOT / f'assets/cards-display/{code}-{width}.webp'
            pixels.save(target, 'WEBP', lossless=True, method=6)
            entry['variants'].append(describe(target, pixels))
        return entry

    with ThreadPoolExecutor(max_workers=4) as pool:
        entries = list(pool.map(save, cards))
    MANIFEST.write_text(json.dumps({'set': 'Elevation', 'scope': 'All 82 front faces and both flipping-identity back faces', 'source': URL, 'sourceSha256': SOURCE_HASH, 'colorConversion': 'Embedded ICC profile to sRGB; inverse PDF CMYK samples', 'images': sorted(entries, key=lambda e:e['code'])}, indent=2) + '\n')
    print('Built 84 native 746x1033 masters and 252 true-size display files.')


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Extract native Vantage Point PDF faces; build or verify lossless display art.

Requires Pillow 12.2.0 and pypdf. Independent NRDB thumbnails identify faces;
they are never upscaled. No sharpening or generated artwork.
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
PDF = ROOT / 'tmp/pdfs/vantage-point-x1.pdf'
URL = 'https://access.nullsignal.games/Sets/PnPs/Vantage%20Point/English/Vantage-Point-English-A4-PNP-x1.pdf'
SOURCE_HASH = '09a28b6b6989f00c3399c4b674d346c584105e2e75fdcd5a6b7de372801098cb'
MANIFEST = ROOT / 'assets/vantage-sources.json'
EXPECTED = {str(i) for i in range(36001, 36067)} | {'36036-0', '36036-1', '36036-2'}
WIDTHS = (300, 600, 743)

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def extract(reader, page, name):
    obj = reader.pages[page-1]['/Resources']['/XObject'][name].get_object()
    if obj['/Width'] < max(WIDTHS) or obj['/BitsPerComponent'] != 8:
        raise ValueError(f'Unexpected native dimensions/precision: {page} {name}')
    icc = obj['/ColorSpace'][1].get_object()
    profile = ImageCms.ImageCmsProfile(BytesIO(icc.get_data()))
    raw = False
    try:
        image = Image.open(BytesIO(obj.get_data()))
    except Exception:
        raw = True
        image = Image.frombytes({1:'L', 3:'RGB', 4:'CMYK'}[icc['/N']], (obj['/Width'], obj['/Height']), obj.get_data())
    if image.mode == 'CMYK' and not raw:
        image = ImageChops.invert(image)
    return ImageCms.profileToProfile(image, profile, ImageCms.createProfile('sRGB'), outputMode='RGB')

def resized(image, width):
    if width > image.width:
        raise ValueError('Upscaling prohibited')
    return image.resize((width, round(image.height*width/image.width)), Image.Resampling.LANCZOS)

def describe(path, pixels):
    return {'path':str(path.relative_to(ROOT)), 'width':pixels.width, 'height':pixels.height, 'sha256':sha(path)}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--download', action='store_true')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    if args.download and not PDF.exists():
        PDF.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(URL, PDF)
    if sha(PDF) != SOURCE_HASH:
        raise ValueError('Source PDF changed; inspect it before rebuilding')
    reader = PdfReader(PDF)
    if len(reader.pages) != 10:
        raise ValueError('Unexpected PDF layout')
    if args.check:
        entries = json.loads(MANIFEST.read_text())['images']
        if len(entries) != 69 or {e['code'] for e in entries} != EXPECTED:
            raise ValueError('Missing/duplicated native faces')
        for entry in entries:
            source = extract(reader, entry['pdfPage'], entry['pdfImageObject'])
            for record, pixels in [(entry['master'],source), *[(v,resized(source,v['width'])) for v in entry['variants']]]:
                path = ROOT / record['path']
                with Image.open(path) as actual:
                    if sha(path) != record['sha256'] or actual.convert('RGB').tobytes() != pixels.tobytes():
                        raise ValueError(f'Pixel or checksum mismatch: {path}')
            if {v['width'] for v in entry['variants']} != set(WIDTHS):
                raise ValueError('Missing display size')
        print('Verified 69 native masters and 207 true-size display files against the pinned PDF.')
        return
    refs = {code:Image.open(ROOT / f'tmp/vantage-assets/references/{code}.jpg').convert('RGB').resize((60,84)) for code in EXPECTED}
    metadata = {c['code']:c for c in json.loads((ROOT / 'docs/research/vantage-point/cards.json').read_text())}
    faces = []
    # Page 2 contains rules and cropped identity previews. Full faces start on 3.
    for page in range(3,11):
        for name in reader.pages[page-1]['/Resources']['/XObject']:
            image = extract(reader, page, name)
            sample = image.resize((60,84))
            matches = sorted((sum(ImageStat.Stat(ImageChops.difference(sample,ref)).rms),code) for code,ref in refs.items())
            separation = matches[1][0]/max(matches[0][0],.001)
            if separation < 1.5:
                raise ValueError(f'Ambiguous card mapping: {page} {name} {matches[:2]}')
            faces.append((image,{'code':matches[0][1],'pdfPage':page,'pdfImageObject':name,'identityCheck':'Independent thumbnail fingerprint; at least 1.5 separation','matchSeparation':separation}))
    if len(faces) != 69 or {entry['code'] for _,entry in faces} != EXPECTED:
        raise ValueError('Missing/duplicate mapping; no assets changed')
    for folder in ['cards-hires','cards-display']:
        (ROOT / 'assets' / folder).mkdir(parents=True,exist_ok=True)
    def save(item):
        image,entry = item
        code = entry['code']
        entry['title'] = metadata[code.split('-')[0]]['title'] + (' (alternate face)' if '-' in code else '')
        master = ROOT / f'assets/cards-hires/{code}.png'
        image.save(master)
        entry['master'] = describe(master,image)
        entry['variants'] = []
        for width in WIDTHS:
            pixels = resized(image,width)
            target = ROOT / f'assets/cards-display/{code}-{width}.webp'
            pixels.save(target,'WEBP',lossless=True,method=6)
            entry['variants'].append(describe(target,pixels))
        return entry
    with ThreadPoolExecutor(max_workers=4) as pool:
        entries = list(pool.map(save,faces))
    MANIFEST.write_text(json.dumps({'set':'Vantage Point','scope':'All 66 card fronts and three alternate Méliès U faces','source':URL,'sourceSha256':SOURCE_HASH,'colorConversion':'Embedded ICC profile to sRGB; raw samples or inverted Adobe JPEG CMYK','images':sorted(entries,key=lambda e:e['code'])},indent=2)+'\n')
    print('Built 69 native masters and 207 lossless display files, without upscaling.')

if __name__ == '__main__':
    main()

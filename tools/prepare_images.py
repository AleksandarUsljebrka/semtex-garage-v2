"""
Builds every image the site uses from the source material in ../SemtexGarage.
Nothing in the source folder is changed.

    python tools/prepare_images.py

Output goes to assets/img/ as WebP (and JPG for the hero fallback).
"""
from pathlib import Path
import shutil

from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT.parent / "SemtexGarage" / "semtex-garage"
OLD_SITE = ROOT.parent / "SemtexGarage" / "site" / "assets" / "img"
OUT = ROOT / "assets" / "img"


def load(rel):
    im = Image.open(SRC / rel)
    im = ImageOps.exif_transpose(im)
    return im.convert("RGB")


def crop_square(im, fy=0.5, fx=0.5):
    """Square crop; fx/fy = where the subject sits (0..1)."""
    w, h = im.size
    s = min(w, h)
    left = int(min(max(w * fx - s / 2, 0), w - s))
    top = int(min(max(h * fy - s / 2, 0), h - s))
    return im.crop((left, top, left + s, top + s))


def crop_ratio(im, ratio, fy=0.5, fx=0.5):
    """Crop to width/height = ratio around the focus point."""
    w, h = im.size
    if w / h > ratio:
        nw, nh = int(h * ratio), h
    else:
        nw, nh = w, int(w / ratio)
    left = int(min(max(w * fx - nw / 2, 0), w - nw))
    top = int(min(max(h * fy - nh / 2, 0), h - nh))
    return im.crop((left, top, left + nw, top + nh))


def save(im, rel, width, q=80):
    path = OUT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(path, "WEBP", quality=q, method=6)
    print(f"{rel:42s} {im.width}x{im.height}  {path.stat().st_size // 1024} KB")


# ---- pre / posle: square pairs, both sides cropped identically --------------
# (Audi A6 pair dropped: "pre" and "posle" are two different cars.)
PAIRS = [
    # slug, pre, posle, focus-y
    ("opel", "pre-posle/04-opel-insignia-pre.jpg", "pre-posle/04-opel-insignia-posle.jpg", 0.5),
    ("megane", "pre-posle/10-renault-megane-pre.jpg", "pre-posle/10-renault-megane-posle.jpg", 0.5),
    ("tiguan", "pre-posle/11-vw-tiguan-pre.jpg", "pre-posle/11-vw-tiguan-posle.jpg", 0.5),
    ("mercedes", "pre-posle/14-mercedes-e-pre.jpg", "pre-posle/14-mercedes-e-posle.jpg", 0.5),
    ("bmw3gt", "pre-posle/12-bmw-3gt-pre.jpg", "pre-posle/12-bmw-3gt-posle.jpg", 0.5),
    ("touran", "pre-posle/09-vw-touran-pre.jpg", "pre-posle/09-vw-touran-posle.jpg", 0.5),
    ("alfa", "pre-posle/13-alfa-mito-pre.jpg", "pre-posle/13-alfa-mito-posle.jpg", 0.5),
    ("ix20", "pre-posle/05-hyundai-ix20-pre.jpg", "pre-posle/05-hyundai-ix20-posle.jpg", 0.5),
    ("bmw", "pre-posle/01-bmw-e60-srebrni-pre.jpg", "pre-posle/01-bmw-e60-srebrni-posle.jpg", 0.42),
    ("smart", "pre-posle/08-smart-pre.jpg", "pre-posle/08-smart-posle.jpg", 0.5),
]
for slug, pre, posle, fy in PAIRS:
    for side, rel in (("pre", pre), ("posle", posle)):
        im = crop_square(load(rel), fy=fy)
        save(im, f"radovi/{slug}-{side}.webp", 1400)
        save(im, f"radovi/{slug}-{side}-sm.webp", 760)

# ---- usluge: one picture per service, 4:5 -----------------------------------
SERVICES = [
    ("polimerizacija", "pre-posle/06-audi-a6-posle.jpg", 0.5, 0.5),
    # cracked lens close-up (VW Tiguan, Nov 2026); the Porsche photo hid its headlights
    ("staklo", "instagram/13-vw-tiguan-pukao-far.jpg", 0.5, 0.5),
    ("vlaga", "pre-posle/05-hyundai-ix20-pre.jpg", 0.5, 0.5),
    ("reparacija", "proces/rav4-rasklopljen-far.jpg", 0.5, 0.5),
    ("projektori", "instagram/10-mercedes-sl-r232.webp", 0.5, 0.42),
    ("led", "proces/iveco-bi-led-projektor.jpg", 0.48, 0.5),
    ("elektronika", "instagram/06-toyota-chr-video-cover.jpg", 0.42, 0.5),
    ("drl", "instagram/11-bmw-e46.webp", 0.5, 0.5),
]
for slug, rel, fy, fx in SERVICES:
    im = load(rel)
    im = im.crop(fy) if isinstance(fy, tuple) else crop_ratio(im, 4 / 5, fy=fy, fx=fx)
    save(im, f"usluge/{slug}.webp", 720)

# ---- noć: night shots, kept in their own proportions -------------------------
NIGHT = [
    ("e46-angel-eyes", "instagram/11-bmw-e46.webp", None),
    ("audi-matrix", "google-maps/recenzija-dejan-audi-a6.jpg", (3 / 4, 0.55)),
    ("e60-angel-eyes", "pre-posle/02-bmw-e60-crni-posle.jpg", (3 / 4, 0.38)),
    ("seat-leon", "google-maps/recenzija-ivke.jpg", (3 / 4, 0.62)),
    ("mercedes-sl", "instagram/10-mercedes-sl-r232.webp", None),
    ("porsche-cayman", "instagram/12-porsche-cayman.jpg", None),
]
for slug, rel, crop in NIGHT:
    im = load(rel)
    if crop:
        im = crop_ratio(im, crop[0], fy=crop[1])
    save(im, f"noc/{slug}.webp", 1200)

# ---- proces + majstor --------------------------------------------------------
save(crop_ratio(load("proces/rav4-rasklopljen-far.jpg"), 4 / 5), "proces/rasklopljen.webp", 1000)
save(crop_ratio(load("proces/iveco-bi-led-projektor.jpg"), 4 / 5, fy=0.48), "proces/projektor.webp", 1000)
save(crop_ratio(load("google-maps/profil-radionica-bmw-x1.jpg"), 4 / 5, fy=0.55), "proces/radionica.webp", 1000)
save(crop_ratio(load("pre-posle/04-opel-insignia-posle.jpg"), 4 / 5), "proces/gotovo.webp", 1000)
save(crop_ratio(load("google-maps/profil-majstor-na-poslu.jpg"), 4 / 5, fx=0.45), "majstor.webp", 1100)

# ---- hero: the lit-up layers from the old site, untouched --------------------
hero_out = OUT / "hero"
hero_out.mkdir(parents=True, exist_ok=True)
for f in (OLD_SITE / "hero").iterdir():
    shutil.copy2(f, hero_out / f.name)
    print(f"hero/{f.name}")

# ---- logo: 150 px original -> 4x with edge-preserving sharpening -------------
# A 150 px JPG cannot become a true vector logo. This gives the cleanest
# raster possible until the owner sends the original file.
logo = load("instagram/00-logo-profilna.jpg")
big = logo.resize((600, 600), Image.LANCZOS)
big = big.filter(ImageFilter.MedianFilter(3))  # removes JPG block noise
big = big.filter(ImageFilter.UnsharpMask(radius=2.2, percent=140, threshold=2))
(OUT / "brand").mkdir(parents=True, exist_ok=True)
big.save(OUT / "brand" / "logo-600.png", optimize=True)
big.resize((180, 180), Image.LANCZOS).save(OUT / "brand" / "apple-touch-icon.png", optimize=True)
big.resize((64, 64), Image.LANCZOS).save(OUT / "brand" / "favicon-64.png", optimize=True)
print("brand/logo-600.png, apple-touch-icon.png, favicon-64.png")

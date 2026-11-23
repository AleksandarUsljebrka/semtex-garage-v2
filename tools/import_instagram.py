"""
New before/after pairs from @semtex_garage (posts from Sep-Nov 2026).

    python -I tools/import_instagram.py <folder with the downloaded jpgs>

1. Copies the untouched downloads to
   SemtexGarage/semtex-garage/originali-sa-tablicama/instagram-2026-11/ (they show plates).
2. Writes square crops without plates to SemtexGarage/semtex-garage/pre-posle/
   (and night shots / a close-up to instagram/), named like the existing files.
   Each box keeps the headlight in the middle at about the same size on both
   sides of a pair, so the slider lines them up.
"""
from pathlib import Path
import shutil
import sys

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT.parent / "SemtexGarage" / "semtex-garage"
RAW = DATA / "originali-sa-tablicama" / "instagram-2026-11"

# name in download folder -> (target file, crop box (left, top, right, bottom) or None)
JOBS = {
    "touran-2":   ("pre-posle/09-vw-touran-pre.jpg", None),
    "touran-4":   ("pre-posle/09-vw-touran-posle.jpg", None),
    "megane-2":   ("pre-posle/10-renault-megane-pre.jpg", None),
    "megane-3":   ("pre-posle/10-renault-megane-posle.jpg", None),
    "tiguan-2":   ("pre-posle/11-vw-tiguan-pre.jpg", None),
    "tiguan-7":   ("pre-posle/11-vw-tiguan-posle.jpg", (274, 344, 1194, 1264)),
    "bmwgt-2":    ("pre-posle/12-bmw-3gt-pre.jpg", None),
    "bmwgt-4":    ("pre-posle/12-bmw-3gt-posle.jpg", (497, 209, 1327, 1039)),
    "alfa-2":     ("pre-posle/13-alfa-mito-pre.jpg", (250, 150, 1350, 1250)),
    "alfa-5":     ("pre-posle/13-alfa-mito-posle.jpg", (486, 476, 1194, 1184)),
    "mercedes-3": ("pre-posle/14-mercedes-e-pre.jpg", (0, 368, 1440, 1808)),
    "mercedes-8": ("pre-posle/14-mercedes-e-posle.jpg", (305, 529, 1295, 1519)),
    # extras
    "tiguan-3":    ("instagram/13-vw-tiguan-pukao-far.jpg", None),
    "tiguan-10":   ("instagram/14-vw-tiguan-noc.jpg", None),
    "mercedes-10": ("instagram/15-mercedes-e-noc.jpg", None),
    "cupra-2":     ("instagram/16-cupra-formentor-noc.jpg", None),
}

src = Path(sys.argv[1])
RAW.mkdir(parents=True, exist_ok=True)
for f in sorted(src.glob("*.jpg")):
    shutil.copy2(f, RAW / f.name)

for name, (target, box) in JOBS.items():
    im = Image.open(src / f"{name}.jpg").convert("RGB")
    if box:
        im = im.crop(box)
    out = DATA / target
    out.parent.mkdir(parents=True, exist_ok=True)
    im.save(out, "JPEG", quality=92)
    print(f"{target:45s} {im.width}x{im.height}")

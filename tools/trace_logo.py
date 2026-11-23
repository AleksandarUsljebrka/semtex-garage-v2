"""
Traces the red and white parts of the 150 px Instagram logo into a vector SVG
(ring, SEMTEX lettering, GARAGE, chevron). The car in the middle is a dark
gradient and cannot be traced cleanly, so the vector mark leaves it out.

    python tools/trace_logo.py
"""
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT.parent / "SemtexGarage" / "semtex-garage" / "instagram" / "00-logo-profilna.jpg"
OUT = ROOT / "assets" / "img" / "brand"
SCALE = 8  # 150 -> 1200 working size

img = cv2.imread(str(SRC))
big = cv2.resize(img, None, fx=SCALE, fy=SCALE, interpolation=cv2.INTER_CUBIC)
big = cv2.bilateralFilter(big, 9, 40, 9)
big = cv2.GaussianBlur(big, (0, 0), 3.2)
b, g, r = [c.astype(np.int16) for c in cv2.split(big)]

red = ((r > 120) & (r - g > 70) & (r - b > 60)).astype(np.uint8) * 255
white = ((r > 165) & (g > 165) & (b > 165)).astype(np.uint8) * 255

# keep white only in the GARAGE band, the car body has white highlights too
h = white.shape[0]
band = np.zeros_like(white)
band[int(h * 0.66):int(h * 0.76), :] = 255
white = cv2.bitwise_and(white, band)

# the car's red tail-light glow sits inside the ring; drop it from the red layer
glow = np.zeros_like(red)
cv2.rectangle(glow, (int(h * 0.17), int(h * 0.34)), (int(h * 0.83), int(h * 0.47)), 255, -1)
red = cv2.bitwise_and(red, cv2.bitwise_not(glow))


def paths(mask, min_area):
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, k)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k)
    contours, _ = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    d = []
    for c in contours:
        if abs(cv2.contourArea(c)) < min_area:
            continue
        c = cv2.approxPolyDP(c, 1.6, True)
        pts = c.reshape(-1, 2) / SCALE
        d.append("M" + " L".join(f"{x:.2f} {y:.2f}" for x, y in pts) + "Z")
    return " ".join(d)


# Only the SEMTEX brush lettering traces cleanly (the ring fades into the dark
# and GARAGE is too thin at 150 px), so the vector file is the SEMTEX word.
# GARAGE is set as real text next to it on the site.
word = np.zeros_like(red)
word[int(h * 0.47):int(h * 0.68), :] = 255
word = cv2.bitwise_and(red, word)
ys, xs = np.nonzero(word)
pad = 6
x0, y0 = (xs.min() - pad) / SCALE, (ys.min() - pad) / SCALE
x1, y1 = (xs.max() + pad) / SCALE, (ys.max() + pad) / SCALE

word_d = paths(word, 260)
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.2f} {y0:.2f} {x1 - x0:.2f} {y1 - y0:.2f}" role="img" aria-label="Semtex">
  <path fill="#e3261b" fill-rule="evenodd" d="{word_d}"/>
</svg>
'''
OUT.mkdir(parents=True, exist_ok=True)
(OUT / "semtex-word.svg").write_text(svg, encoding="utf-8")
print("semtex-word.svg", len(svg) // 1024, "KB", f"viewBox {x1 - x0:.1f} x {y1 - y0:.1f}")

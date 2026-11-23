# Semtex Garage v2

Statičan sajt (HTML, CSS, JS). Ne treba build.

## Pokretanje

```
python -m http.server 5180
```

Zatim otvori http://localhost:5180

## Pre objavljivanja: podaci koji fale

| Šta | Gde | Trenutno |
|---|---|---|
| Broj telefona | `index.html`, pretraži `381640000000` i `+381 64 000 0000` | izmišljen placeholder |
| Adresa | `index.html`, sekcija Kontakt | samo „Novi Sad" |
| Radno vreme | `index.html`, sekcija Kontakt | „Po dogovoru" |
| Slika majstora | `assets/img/majstor.webp` | 
| Logo | `assets/img/brand/` | tražiti original (SVG ili PDF) od vlasnika |
| Dozvola za slike | sve fotke | slike su sa Instagrama i iz Google recenzija |

## Struktura

- `index.html`: cela stranica
- `assets/css/main.css`: dizajn (boje i fontovi su na vrhu, u `:root`)
- `assets/js/hero-lights.js`: farovi se pale u hero sekciji
- `assets/js/main.js`: klizač pre/posle, slika koja prati miš kod usluga, horizontalni proces, recenzije, glatko skrolovanje
- `tools/prepare_images.py`: pravi sve slike iz `../SemtexGarage/semtex-garage` (izvor se ne menja)
- `tools/trace_logo.py`: pretvara SEMTEX natpis iz logoa u SVG

## Fontovi

Archivo, Geist i Geist Mono su u `assets/fonts/` (licenca SIL OFL, `OFL-*.txt`), pa sajt
ne šalje nikakve zahteve Google-u. Ponovno skidanje: `python tools/fetch_fonts.py`.

## Biblioteke

GSAP 3.12.5 + ScrollTrigger i Lenis 1.1.13 su u `assets/vendor/` (licence u
`assets/vendor/LICENSES.md`). Sajt ne učitava ništa sa spoljnih servera.
Ako se skripte ne učitaju, sajt i dalje radi i sav sadržaj je vidljiv, samo bez animacija na skrolu.

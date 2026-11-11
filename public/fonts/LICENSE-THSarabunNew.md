# TH Sarabun New — Font License & Source

- **Font:** TH Sarabun New (Regular, Bold) — webfont versions
- **Copyright:** © 2010-2011 Software Industry Promotion Agency (Public Organization) — **SIPA**, Thailand. Created by Suppakit CHALERMLARP (embedded in the font's name table, verified at import).
- **Distribution:** SIPA national font project — free to use and redistribute (พร้อมใช้งาน/แจกจ่ายได้ฟรีตามนโยบายฟอนต์ไทยมาตรฐานของ SIPA).
- **Source of files:** npm package [`font-th-sarabun-new@1.0.0`](https://www.npmjs.com/package/font-th-sarabun-new) (via jsDelivr), which repackages the webfonts from [Phonbopit/sarabun-webfont](https://github.com/Phonbopit/sarabun-webfont) (archived).
- **Processing:** TTF → WOFF2 conversion only (fontTools); no glyphs added, removed, or modified. Verified Thai glyph coverage (ก, ่, ั, ำ, อ, ํ) before inclusion.
- **Usage in this project:** served from `/fonts/`, declared via `@font-face` in `app/globals.css` so printed/exported PDF pages embed TH Sarabun New deterministically on every machine.

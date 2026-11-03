# Manqoos Mawlid – proofreading notes

Source: manzilmedia.net PDF (14 pages). Text re-typed from the page images (the PDF's own text layer is corrupted).
Silent typographic fixes only: hamza (اَلْقَى→أَلْقَى, اَنْ→أَنْ), run-together words (قَدَدَّخَلُوا→قَدْ دَخَلُوا, قَدسَّقَطَ→قَدْ سَقَطَ,
قَدَدَّنَا→قَدْ دَنَا), إِذًا→إِذَا, ى→ا in فَنَجَى→فَنَجَا, نَسْئَلُكَ→نَسْأَلُكَ, الدَّنَسِى→الدَّنَسِ, اِلاَّ→إِلَّا, "رَبِيعُ"→"رَبِيعِ".

## Please have a scholar confirm (left as printed or best reading)
1. Part 6, table row 2 (left): «قَدْ دَرَّتِ الْعِيرُ بِالسُّحْبِ» – printed as «قَدَدَّرَتِ الْعَيِرُ…»; wording unclear.
2. Part 5, table row 2: «مَنِصَّةِ حُسْنِهِ» – dictionary form is مِنَصَّة.
3. Part 9, table row 9: «ذَنْبُنَا مَاحِي لَيَمْنَعُنَا» – meaning/wording unclear.
4. Part 4: «وَأَشْرَقَتِ الْبَيْتُ» (feminine verb, masculine noun) – likely البُيُوتُ or أَشْرَقَ.
5. Part 8: «وَإِشْرَاقُ الْكَوْنِ» – after «وَقْتُ» expect genitive «وَإِشْرَاقِ».
6. Part 3: «فَفُتِحَ أَبْوَابُ» – expect «فُتِحَتْ أَبْوَابُ» (or «فَفُتِحَتْ»).
7. Part 7 table: «مُحَمَّدًا سَمَّوْا» – confirm سَمَّوْا vs سَمُّوا.
8. Part 6: the printed "year" for the fire of Persia («بِأَلْفَيْ عَامٍ») is the source's own wording – not altered.

## Pending
- Translations in all supported languages are machine-drafted and require review by qualified translators; the existing English draft was retained.
- Ashrakal Baith's full Arabic lyrics were supplied by the user. Confirm the wording and machine-drafted translations with a qualified reviewer.
- Other mawlids (Barzanji, Diba'i, Simtud Durar, …) need verified Arabic sources; add a JSON source file beside the existing Mawlid sources and an entry in MAWLIDS in scripts/build_mawlid.py.

## Translations
- Translations are machine-drafted, not yet reviewed by a scholar/native translator. Arabic is the source text; English uses the existing draft.
- Arabic source parts and all language translations for Manqoos Mawlid and Ashrakal Baith are stored together in `manqoos.json` and `ashrakal_baith.json`. Translation arrays follow the same order as their Arabic `parts`; verse parts keep one line per verse.
- Add a language by adding its array to the `translations` object in the relevant JSON source, then run `python scripts/build_mawlid.py`.
- The narrations (e.g. "I was a light before God...") are reproduced as in the source edition; their authenticity grading has not been checked.

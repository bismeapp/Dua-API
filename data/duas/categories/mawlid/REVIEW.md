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
- Translations (all languages except ar) are empty strings; the app should fall back to Arabic-only display or be filled later.
- Other mawlids (Barzanji, Diba'i, Simtud Durar, …) need verified Arabic sources; add a module beside manqoos.py and an entry in MAWLIDS in scripts/build_mawlid.py.

## Translations
- Machine-drafted, not yet reviewed by a scholar/native translator. Done: en. Pending: ta, ml, ur, fr, tr, id, bn, ms (ar = source text).
- Add a language by creating `translations/manqoos_<lang>.py` with `T = [...]` (18 strings, same order as manqoos.py; verse parts keep one line per verse), then reset the shared JSON files to the pre-Mawlid commit and run `python scripts/build_mawlid.py`.
- The narrations (e.g. "I was a light before God...") are reproduced as in the source edition; their authenticity grading has not been checked.

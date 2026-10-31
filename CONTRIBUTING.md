# Contributing to Islamic Duas Collection

Thank you for your interest in contributing to this project! We welcome contributions from the community to make this collection more comprehensive and accurate.

## 📋 How to Contribute

### 1. Adding New Duas

To add a new dua to the collection:

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/Rizna001/islamic-duas-collection.git
   cd islamic-duas-collection
   ```

3. **Find the appropriate category** in `src/data/expanded-duas.json`

4. **Add your dua** following this structure:
   ```json
   {
     "id": "category-prefix-number",
     "title": {
       "en": "English Title",
       "ar": "العنوان بالعربية",
       "ur": "اردو عنوان",
       "hi": "हिंदी शीर्षक",
       "bn": "বাংলা শিরোনাম",
       "ta": "தமிழ் தலைப்பு",
       "ml": "മലയാളം തലക്കെട്ട്",
       "tr": "Türkçe Başlık",
       "id": "Judul Bahasa Indonesia",
       "fr": "Titre en Français"
     },
     "arabic": "النص العربي الكامل",
     "translation": {
       "en": "Full English translation",
       "ar": "الترجمة العربية",
       "ur": "اردو ترجمہ",
       "hi": "हिंदी अनुवाद",
       "bn": "বাংলা অনুবাদ",
       "ta": "தமிழ் மொழிபெயர்ப்பு",
       "ml": "മലയാളം വിവർത്തനം",
       "tr": "Türkçe çeviri",
       "id": "Terjemahan Bahasa Indonesia",
       "fr": "Traduction française"
     },
     "reference": "Source reference (e.g., Bukhari 7/150, Quran 2:201)",
     "times": 1
   }
   ```

5. **Ensure accuracy**:
   - Verify the Arabic text is correct
   - Provide accurate translations in all languages
   - Include proper reference (hadith collection and number, or Quran verse)
   - Specify recommended recitation count

6. **Test locally**:
   ```bash
   npm install
   npm run dev
   ```

7. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Add dua for [situation] from [source]"
   ```

8. **Push and create a Pull Request**:
   ```bash
   git push origin main
   ```
   Then open a PR on GitHub with a clear description.

### 2. Adding a New Category

To add a new category:

1. Add the category to `src/data/expanded-duas.json`:
   ```json
   {
     "id": "new-category",
     "icon": "📿",
     "color": "purple",
     "gradient": "from-purple-400 to-pink-500",
     "bg": "bg-purple-50",
     "border": "border-purple-200",
     "text": "text-purple-700",
     "name": {
       "en": "Category Name",
       "ar": "اسم الفئة",
       ...
     },
     "duas": [...]
   }
   ```

2. Update the README.md categories section

3. Follow the same PR process as above

### 3. Adding a New Language

To add support for a new language:

1. **Update the languages array** in both JSON files:
   ```json
   { "code": "xx", "name": "Language Name", "flag": "🏳️" }
   ```

2. **Add translations** for all duas in the new language

3. **Update components**:
   - `src/App.tsx` - Add language to type definition
   - `src/components/Header.tsx` - Add UI strings
   - `src/components/SearchBar.tsx` - Add placeholder
   - `src/components/DuaDetail.tsx` - Add labels
   - `src/components/CategoryCard.tsx` - Add count labels

4. **Test thoroughly** to ensure all text is translated

### 4. Bug Fixes and Improvements

For bug fixes or UI improvements:

1. Check existing issues or create a new one
2. Fork and clone the repository
3. Make your changes
4. Test thoroughly
5. Submit a PR with clear description

## 📝 Guidelines

### Quality Standards

- **Authenticity**: All duas must be from authentic sources (Quran, Sahih hadith collections)
- **Accuracy**: Arabic text must be verified and correct
- **References**: Include specific references (book, chapter, hadith number)
- **Translations**: Provide accurate translations in all supported languages
- **Formatting**: Follow the existing JSON structure exactly

### Code Style

- Use TypeScript for type safety
- Follow existing code patterns
- Keep components small and focused
- Add comments for complex logic
- Use meaningful variable names

### Commit Messages

Use clear, descriptive commit messages:
- `Add dua for [situation] from [source]`
- `Fix translation error in [category]`
- `Add [language] translations for [category]`
- `Improve UI for [component]`

## 🔍 Review Process

1. **Automated checks**: CI will run tests and linting
2. **Manual review**: Maintainers will review for:
   - Authenticity of content
   - Accuracy of translations
   - Code quality
   - Proper formatting
3. **Feedback**: You may receive feedback for improvements
4. **Merge**: Once approved, your PR will be merged

## 🙏 Recognition

Contributors will be acknowledged in:
- README.md contributors section
- Release notes
- Project documentation

## ❓ Questions?

- Open an issue for questions
- Check existing documentation
- Review closed PRs for examples

## 📚 Resources

- [Sahih al-Bukhari](https://sunnah.com/bukhari)
- [Sahih Muslim](https://sunnah.com/muslim)
- [Quran.com](https://quran.com)
- [Dorar.net](https://dorar.net) (Arabic hadith verification)

---

**جزاكم الله خيرا** - May Allah reward you with good

Thank you for helping make this resource better for the Muslim community!

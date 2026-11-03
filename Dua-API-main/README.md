# 🤲 Comprehensive Islamic Duas Collection

A complete collection of authentic Islamic supplications (Duas) from the Quran and Sunnah, organized by situation and available in 10 languages.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Languages](https://img.shields.io/badge/languages-10-orange)
![Duas](https://img.shields.io/badge/duas-200+-purple)

## 🌟 Features

- **200+ Authentic Duas** from Quran and Sahih Hadith collections
- **36 Categories** covering every life situation
- **10 Languages** including Arabic, English, Urdu, Hindi, Bengali, Tamil, Malayalam, Turkish, Indonesian, and French
- **Clean category-first UI** for easy navigation
- **Search functionality** to find specific duas
- **Responsive design** works on all devices
- **GitHub API** ready for integration
- **Offline capable** - all data included

## 📚 Categories

### Daily Worship (8)
- 🌅 Morning & Evening Adhkar
- 💧 Wudu & Adhan
- 🕌 Mosque (Entering/Leaving)
- 🤲 Prayer Duas (after Salah and specific prayer times)
- 🌙 Friday (Jumu'ah)
- 🌟 Laylatul Qadr (Night of Power)
- 🌙 Fasting & Ramadan
- 🤲 General Good

### Daily Life (7)
- 🍽️ Before & After Eating
- 🏠 Home (Entering/Leaving)
- 🚿 Bathroom
- 👔 Clothes & Appearance
- 🏪 Market & Business
- 💰 Debt & Poverty
- 😤 Anger & Calm

### Sleep & Dreams (2)
- 🌙 Sleep & Waking Up
- 😰 Nightmare & Bad Dreams

### Travel (1)
- ✈️ Travel

### Hajj & Umrah (1)
- 🕋 Hajj & Umrah (Talbiyah, Ka'bah, Safa/Marwah, Arafat)

### Salawat & Dhikr (3)
- 💚 Salawat upon the Prophet (Ibrahimiyyah, Nariyyah, Tunjina, Simple)
- ✨ Asma ul Husna (99 Names of Allah)
- 📖 Asma ul Anbiya (25 Prophets)

### Death & Hereafter (2)
- 🕊️ Death & Funeral (Dying, Inna lillahi, Condolence, Janazah, Grave)
- 🌌 Hereafter

### Life Events (1)
- 👨‍👩‍👧‍👦 Family & Children

### Health & Hardship (3)
- 🏥 Sickness & Healing
- 😢 Hardship & Distress
- 🤔 Istikhara (Seeking Guidance)

### Protection (3)
- 🛡️ Protection from Evil
- 👁️ Protection from Evil Eye
- 🤲 Forgiveness & Repentance

### Knowledge & Character (2)
- 📚 Knowledge & Study
- 🌟 Good Character

### Community (1)
- 🌍 For the Ummah

### Weather (1)
- 🌧️ Rain & Weather

## 🌍 Supported Languages

| Language | Code | Flag |
|----------|------|------|
| English | en | 🇬🇧 |
| Tamil | ta | 🇮🇳 |
| Malayalam | ml | 🇮🇳 |
| Arabic | ar | 🇸🇦 |
| Urdu | ur | 🇵🇰 |
| French | fr | 🇫🇷 |
| Turkish | tr | 🇹🇷 |
| Indonesian | id | 🇮🇩 |
| Bengali | bn | 🇧🇩 |
| Malay | ms | 🇲🇾 |

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/Rizna001/islamic-duas-collection.git

# Navigate to project directory
cd islamic-duas-collection

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Flutter app

The Flutter app lives in `flutter_app/` and bundles its JSON dataset under
`flutter_app/assets/json/`.

```bash
cd flutter_app
flutter pub get
flutter run
```

The app opens with a home screen, then lets you browse text-only category cards,
dua lists, and individual dua details. Category names are centered without
icons or illustrations.

After updating the canonical `data/` or `metadata/` JSON files, regenerate the
Flutter bundle from the repository root with `python scripts/build_flutter_assets.py`.

### Using the API

The complete duas data is available as a JSON API:

```javascript
// Fetch all duas
fetch('/api/v1/duas.json')
  .then(response => response.json())
  .then(data => console.log(data));

// API Structure
{
  "categories": [
    {
      "id": "morning-evening",
      "name": { "en": "Morning & Evening", "ar": "الصباح والمساء", ... },
      "icon": "🌅",
      "color": "amber",
      "duas": [
        {
          "id": "me-1",
          "title": { "en": "Morning Remembrance", ... },
          "arabic": "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ...",
          "translation": { "en": "We have reached the morning...", ... },
          "reference": "Muslim 4/2088",
          "times": 1
        }
      ]
    }
  ],
  "languages": [
    { "code": "en", "name": "English", "flag": "🇬🇧" },
    ...
  ]
}
```

## 📖 Data Structure

Each dua follows this structure:

```typescript
interface Dua {
  id: string;                    // Unique identifier
  title: Record<string, string>; // Title in all languages
  arabic: string;                // Arabic text
  translation: Record<string, string>; // Translation in all languages
  reference: string;             // Source reference (e.g., "Bukhari 7/150")
  times: number;                 // Recommended recitation count
}
```

## 🛠️ Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **JSON** - Data storage

## 📱 Usage Examples

### React Component

```tsx
import { useState, useEffect } from 'react';

function DuasApp() {
  const [duas, setDuas] = useState([]);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    fetch('/api/v1/duas.json')
      .then(res => res.json())
      .then(data => setDuas(data.categories));
  }, []);

  return (
    <div>
      {duas.map(category => (
        <div key={category.id}>
          <h2>{category.name[language]}</h2>
          {category.duas.map(dua => (
            <div key={dua.id}>
              <h3>{dua.title[language]}</h3>
              <p dir="rtl">{dua.arabic}</p>
              <p>{dua.translation[language]}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

### Vanilla JavaScript

```javascript
fetch('/api/v1/duas.json')
  .then(response => response.json())
  .then(data => {
    const morningDuas = data.categories.find(c => c.id === 'morning-evening');
    console.log(morningDuas.duas);
  });
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Adding a New Dua

1. Find the appropriate category in `src/data/expanded-duas.json`
2. Add your dua following the existing structure
3. Ensure all translations are accurate
4. Include proper reference (hadith number or Quran verse)
5. Submit a pull request

### Adding a New Language

1. Update the `languages` array in the JSON files
2. Add translations for all duas in the new language
3. Update the language selector component
4. Test thoroughly before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- All duas are sourced from authentic Islamic references:
  - Sahih al-Bukhari
  - Sahih Muslim
  - Sunan Abu Dawud
  - Jami' at-Tirmidhi
  - Sunan an-Nasa'i
  - Sunan Ibn Majah
  - The Noble Quran

## 📞 Contact

For questions, suggestions, or issues:
- Open an issue on GitHub
- Email: your-email@example.com

## 🌟 Star History

If you find this project useful, please consider giving it a star ⭐

---

**Note:** This is a community project. Always verify religious content with qualified scholars. The translations are provided for convenience and may not capture all nuances of the original Arabic text.

**بارك الله فيكم** - May Allah bless you

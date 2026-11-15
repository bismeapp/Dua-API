# API Documentation

## Overview

The Islamic Duas Collection provides a comprehensive JSON API for accessing authentic Islamic supplications. The API is static and can be hosted on GitHub Pages, any static file server, or used directly from the repository.

## Base URL

```
https://rizna001.github.io/islamic-duas-collection/api/v1/
```

Or for local development:
```
http://localhost:5173/api/v1/
```

## Endpoints

### 1. Get All Duas

**Endpoint:** `/duas.json`

**Description:** Returns the complete collection of all duas, including the 40-entry Rabbana category.

**Response:**
```json
{
  "categories": [
    {
      "id": "morning-evening",
      "icon": "🌅",
      "color": "amber",
      "gradient": "from-amber-400 to-orange-500",
      "bg": "bg-amber-50",
      "border": "border-amber-200",
      "text": "text-amber-700",
      "name": {
        "en": "Morning & Evening",
        "ar": "الصباح والمساء",
        "ur": "صبح و شام",
        "fr": "Matin et Soir",
        "tr": "Sabah ve Akşam",
        "id": "Pagi dan Sore",
        "bn": "সকাল ও সন্ধ্যা",
        "ms": "Pagi dan Petang",
        "ta": "காலை மற்றும் மாலை",
        "ml": "രാവിലെയും വൈകുന്നേരവും"
      },
      "duas": [
        {
          "id": "me-1",
          "title": {
            "en": "Morning Remembrance",
            "ar": "ذكر الصباح",
            ...
          },
          "arabic": "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ...",
          "translation": {
            "en": "We have reached the morning...",
            "ar": "أصبحنا وأصبح الملك لله...",
            ...
          },
          "reference": "Muslim 4/2088",
          "times": 1
        }
      ]
    }
  ],
  "languages": [
    { "code": "en", "name": "English", "flag": "🇬🇧" },
    { "code": "ar", "name": "العربية", "flag": "🇸🇦" },
    ...
  ]
}
```

### 2. Get API Index

**Endpoint:** `/index.json`

**Description:** Returns API metadata and category overview.

**Response:**
```json
{
  "api_version": "1.0.0",
  "description": "Comprehensive Islamic Duas API",
  "total_categories": 38,
  "total_duas": 511,
  "supported_languages": ["en", "ta", "ml", "ar", "ur", "fr", "tr", "id", "bn", "ms"],
  "categories": [
    {
      "id": "morning-evening",
      "name": { "en": "Morning & Evening", ... },
      "icon": "🌅",
      "duas_count": 5
    }
  ]
}
```

### 3. Get the Rabbana Duas

**Endpoint:** `/rabbana-duas.json`

**Description:** Returns the existing 40 Quranic Rabbana duas. This legacy endpoint is retained for compatibility; the same records are also available in the `rabbana-duas` category from `/duas.json`.


## Data Structure

### Category Object

```typescript
interface Category {
  id: string;                    // Unique identifier (e.g., "morning-evening")
  icon: string;                  // Emoji icon
  color: string;                 // Tailwind color name
  gradient: string;              // Tailwind gradient classes
  bg: string;                    // Background color class
  border: string;                // Border color class
  text: string;                  // Text color class
  name: Record<string, string>;  // Category name in all languages
  duas: Dua[];                   // Array of duas in this category
}
```

### Dua Object

```typescript
interface Dua {
  id: string;                    // Unique identifier (e.g., "me-1")
  title: Record<string, string>; // Title in all languages
  arabic: string;                // Full Arabic text
  translation: Record<string, string>; // Translation in all languages
  reference: string;             // Source reference (e.g., "Bukhari 7/150")
  times: number;                 // Recommended recitation count
}
```

### Language Object

```typescript
interface Language {
  code: string;  // ISO language code (e.g., "en", "ar")
  name: string;  // Language name in native script
  flag: string;  // Country flag emoji
}
```

## Usage Examples

### JavaScript (Fetch API)

```javascript
// Get all duas
fetch('https://rizna001.github.io/islamic-duas-collection/api/v1/duas.json')
  .then(response => response.json())
  .then(data => {
    console.log('Total categories:', data.categories.length);
    console.log('Total duas:', data.categories.reduce((sum, cat) => sum + cat.duas.length, 0));
  });

// Get specific category
fetch('https://rizna001.github.io/islamic-duas-collection/api/v1/duas.json')
  .then(response => response.json())
  .then(data => {
    const morningEvening = data.categories.find(cat => cat.id === 'morning-evening');
    console.log('Morning duas:', morningEvening.duas);
  });

// Get dua in specific language
fetch('https://rizna001.github.io/islamic-duas-collection/api/v1/duas.json')
  .then(response => response.json())
  .then(data => {
    const dua = data.categories[0].duas[0];
    const arabicText = dua.arabic;
    const englishTranslation = dua.translation.en;
    const urduTranslation = dua.translation.ur;
  });
```

### React

```tsx
import { useState, useEffect } from 'react';

function DuasApp() {
  const [duas, setDuas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/duas.json')
      .then(res => res.json())
      .then(data => {
        setDuas(data.categories);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {duas.map(category => (
        <div key={category.id}>
          <h2>{category.name.en}</h2>
          {category.duas.map(dua => (
            <div key={dua.id}>
              <h3>{dua.title.en}</h3>
              <p dir="rtl">{dua.arabic}</p>
              <p>{dua.translation.en}</p>
              <small>{dua.reference}</small>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

### Python

```python
import requests
import json

# Get all duas
response = requests.get('https://rizna001.github.io/islamic-duas-collection/api/v1/duas.json')
data = response.json()

# Print all categories
for category in data['categories']:
    print(f"{category['icon']} {category['name']['en']}: {len(category['duas'])} duas")

# Get specific dua
morning_duas = next(cat for cat in data['categories'] if cat['id'] == 'morning-evening')
for dua in morning_duas['duas']:
    print(f"Title: {dua['title']['en']}")
    print(f"Arabic: {dua['arabic']}")
    print(f"Translation: {dua['translation']['en']}")
    print(f"Reference: {dua['reference']}")
    print("---")
```

### cURL

```bash
# Get all duas
curl https://rizna001.github.io/islamic-duas-collection/api/v1/duas.json

# Get API index
curl https://rizna001.github.io/islamic-duas-collection/api/v1/index.json

# Save to file
curl -o duas.json https://rizna001.github.io/islamic-duas-collection/api/v1/duas.json
```

## Rate Limiting

This is a static API with no rate limiting. However, please be respectful:
- Cache responses when possible
- Don't make excessive requests
- Consider hosting your own copy for high-traffic applications

## CORS

The API supports CORS and can be accessed from any domain.

## Caching

For best performance:
- Cache responses for 24 hours
- Use ETags for conditional requests
- Implement offline fallback

## Error Handling

The API returns standard HTTP status codes:
- `200 OK` - Success
- `404 Not Found` - Endpoint doesn't exist
- `500 Internal Server Error` - Server error (rare for static API)

## Versioning

The API follows semantic versioning:
- Current version: `1.0.0`
- Breaking changes will increment major version
- New features will increment minor version
- Bug fixes will increment patch version

## Support

For API questions or issues:
- Open an issue on GitHub
- Check the documentation
- Review example code in README.md

---

**Note:** This API is provided as-is for educational and religious purposes. Always verify religious content with qualified scholars.

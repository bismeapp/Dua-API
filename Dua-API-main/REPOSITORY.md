# 📦 Repository Structure

```
islamic-duas-collection/
│
├── 📄 README.md                    # Main documentation
├── 📄 LICENSE                      # MIT License
├── 📄 CONTRIBUTING.md              # Contribution guidelines
├── 📄 CHANGELOG.md                 # Version history
├── 📄 API.md                       # API documentation
├── 📄 CODE_OF_CONDUCT.md           # Community guidelines
├── 📄 .gitignore                   # Git ignore rules
│
├── 📁 .github/
│   ├── 📁 ISSUE_TEMPLATE/
│   │   ├── 📄 bug_report.md       # Bug report template
│   │   └── 📄 dua_request.md      # New dua request template
│   └── 📄 PULL_REQUEST_TEMPLATE.md # PR template
│
├── 📁 public/
│   └── 📁 api/
│       └── 📁 v1/
│           ├── 📄 index.json       # API metadata
│           └── 📄 duas.json        # Complete duas data
│
├── 📁 src/
│   ├── 📄 App.tsx                  # Main application component
│   ├── 📄 main.tsx                 # Application entry point
│   ├── 📄 index.css                # Global styles
│   │
│   ├── 📁 components/
│   │   ├── 📄 Header.tsx           # Header with language selector
│   │   ├── 📄 SearchBar.tsx        # Search functionality
│   │   ├── 📄 CategoryCard.tsx     # Category display card
│   │   ├── 📄 DuaDetail.tsx        # Individual dua view
│   │   └── 📄 LanguageSelector.tsx # Language selection
│   │
│   └── 📁 data/
│       ├── 📄 duas.json            # Original duas data
│       └── 📄 expanded-duas.json   # Expanded duas collection
│
├── 📄 index.html                   # HTML entry point
├── 📄 package.json                 # Dependencies
├── 📄 tsconfig.json                # TypeScript config
└── 📄 vite.config.js               # Vite configuration
```

## 📊 File Statistics

- **Total Categories:** 36
- **Total Duas:** 200+
- **Languages Supported:** 10
- **Components:** 5
- **Data Files:** 2 JSON files

## 🚀 Quick Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📝 Key Files

### Data Files
- `src/data/duas.json` - Original collection
- `src/data/expanded-duas.json` - Complete collection with all categories
- `public/api/v1/duas.json` - API-ready JSON

### Component Files
- `src/App.tsx` - Main app with routing and state management
- `src/components/Header.tsx` - Header with language selector
- `src/components/DuaDetail.tsx` - Dua display with counter

### Documentation
- `README.md` - Project overview and usage
- `API.md` - Complete API documentation
- `CONTRIBUTING.md` - How to contribute

## 🌐 Deployment

### GitHub Pages
1. Push to `main` branch
2. Go to Settings → Pages
3. Select `main` branch and `/root`
4. Site will be available at `https://rizna001.github.io/islamic-duas-collection`

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

## 📦 Package Information

- **Name:** islamic-duas-collection
- **Version:** 1.0.0
- **License:** MIT
- **Repository:** https://github.com/Rizna001/islamic-duas-collection

## 🔗 Important Links

- **Documentation:** [README.md](README.md)
- **API Docs:** [API.md](API.md)
- **Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md)
- **Changelog:** [CHANGELOG.md](CHANGELOG.md)
- **Code of Conduct:** [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

---

**بارك الله فيكم** - May Allah bless you

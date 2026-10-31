import { ChevronDown, Home, Languages } from 'lucide-react';

export default function Header({
  language,
  languages,
  showLanguageMenu,
  setShowLanguageMenu,
  setLanguage,
  currentLanguage,
  onHomeClick,
  viewMode,
  setViewMode,
  bookmarksCount,
}: {
  language: string;
  languages: { code: string; name: string }[];
  showLanguageMenu: boolean;
  setShowLanguageMenu: (v: boolean) => void;
  setLanguage: (code: any) => void;
  currentLanguage: { code: string; name: string };
  onHomeClick: () => void;
  viewMode: 'categories' | 'bookmarks';
  setViewMode: (mode: 'categories' | 'bookmarks') => void;
  bookmarksCount: number;
}) {
  const title = language === 'en' ? 'Duas Collection' :
    language === 'ar' ? 'مجموعة الأدعية' :
    language === 'ur' ? 'مجموعہ دعائیں' :
    language === 'fr' ? 'Collection de Duas' :
    language === 'tr' ? 'Dua Koleksiyonu' :
    language === 'id' ? 'Koleksi Doa' :
    language === 'bn' ? 'দোয়া সংকলন' :
    language === 'ms' ? 'Koleksi Doa' :
    language === 'ta' ? 'துஆ தொகுப்பு' :
    'ദുആ ശേഖരം';

  const subtitle = language === 'en' ? 'Authentic supplications for every occasion' :
    language === 'ar' ? 'أدعية صحيحة لكل مناسبة' :
    language === 'ur' ? 'ہر موقع کے لیے مستند دعائیں' :
    language === 'fr' ? 'Invocations authentiques pour chaque occasion' :
    language === 'tr' ? 'Her durum için sahih dualar' :
    language === 'id' ? 'Doa-doa shahih untuk setiap keadaan' :
    language === 'bn' ? 'প্রতিটি উপলক্ষ্যের জন্য সহীহ দোয়া' :
    language === 'ms' ? 'Doa-doa sahih untuk setiap keadaan' :
    language === 'ta' ? 'ஒவ்வொரு சந்தர்ப்பத்திற்கும் நம்பகமான பிரார்த்தனைகள்' :
    'ഓരോ സന്ദർഭത്തിനുമുള്ള ആധികാരികമായ പ്രാർത്ഥനകൾ';

  const categoriesLabel = language === 'en' ? 'Categories' : language === 'ar' ? 'الفئات' : language === 'ur' ? 'زمرہ جات' : language === 'fr' ? 'Catégories' : language === 'tr' ? 'Kategoriler' : language === 'id' ? 'Kategori' : language === 'bn' ? 'বিভাগ' : language === 'ms' ? 'Kategori' : language === 'ta' ? 'வகைகள்' : 'വിഭാഗങ്ങൾ';
  const savedLabel = language === 'en' ? 'Saved' : language === 'ar' ? 'المحفوظة' : language === 'ur' ? 'محفوظ' : language === 'fr' ? 'Enregistrés' : language === 'tr' ? 'Kaydedilen' : language === 'id' ? 'Tersimpan' : language === 'bn' ? 'সংরক্ষিত' : language === 'ms' ? 'Disimpan' : language === 'ta' ? 'சேமிக்கப்பட்டவை' : 'സേവ് ചെയ്തവ';

  return (
    <header className="app-header sticky top-0 z-50 border-b">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-[60px] items-center justify-between gap-3 sm:h-16">
          {/* Logo & Title */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
              <h1 className="truncate font-sans text-[15px] font-semibold text-white">{title}</h1>
              <p className="hidden text-xs text-white/55 sm:block">{subtitle}</p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="hidden items-center rounded-lg bg-white/5 p-1 sm:flex">
              <button
                onClick={() => setViewMode('categories')}
                aria-pressed={viewMode === 'categories'}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === 'categories' ? 'gold-gradient-surface text-[var(--bisme-on-gold)]' : 'text-white/75 hover:text-white'
                }`}
              >
                {categoriesLabel}
              </button>
              <button
                onClick={() => setViewMode('bookmarks')}
                aria-pressed={viewMode === 'bookmarks'}
                className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === 'bookmarks' ? 'gold-gradient-surface text-[var(--bisme-on-gold)]' : 'text-white/75 hover:text-white'
                }`}
              >
                {savedLabel}
                {bookmarksCount > 0 && (
                  <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-xs text-white">
                    {bookmarksCount}
                  </span>
                )}
              </button>
            </div>

            {/* Home Button */}
            <button
              onClick={onHomeClick}
              aria-label="Home"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--bisme-gold-border)] bg-[#063b2b] text-[var(--bisme-gold)] transition-colors hover:bg-[#084633] hover:text-white"
              title="Home"
            >
              <Home className="w-5 h-5" aria-hidden="true" />
              <svg className="hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                aria-haspopup="menu"
                aria-expanded={showLanguageMenu}
                className="flex items-center gap-2 rounded-lg border border-[var(--bisme-gold-border)] bg-[#063b2b] px-3 py-2 transition-colors hover:bg-[#084633]"
              >
                <Languages className="h-4 w-4 text-[var(--bisme-gold)]" aria-hidden="true" />
                <span className="text-xs font-medium text-white sm:text-sm">{currentLanguage.name}</span>
                <ChevronDown className={`h-4 w-4 text-white/60 transition-transform ${showLanguageMenu ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>

              {showLanguageMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowLanguageMenu(false)} />
                  <div className="dropdown-panel absolute right-0 z-50 mt-2 max-h-80 w-48 overflow-y-auto rounded-xl border border-[var(--bisme-gold-border)] bg-[#063b2b] py-2 shadow-xl">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setShowLanguageMenu(false);
                        }}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          language === lang.code
                            ? 'bg-[rgba(230,198,107,0.2)] text-white'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="text-sm font-medium">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <nav className="flex gap-2 pb-2 sm:hidden" aria-label="Main navigation">
          <button
            onClick={() => setViewMode('categories')}
            aria-pressed={viewMode === 'categories'}
            className={`flex min-h-9 min-w-0 flex-1 items-center justify-center rounded-md px-2 py-1.5 text-center text-xs font-medium transition-colors ${
              viewMode === 'categories' ? 'gold-gradient-surface text-[var(--bisme-on-gold)]' : 'bg-white/5 text-white/75'
            }`}
          >
            {categoriesLabel}
          </button>
          <button
            onClick={() => setViewMode('bookmarks')}
            aria-pressed={viewMode === 'bookmarks'}
            className={`flex min-h-9 min-w-0 flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-center text-xs font-medium transition-colors ${
              viewMode === 'bookmarks' ? 'gold-gradient-surface text-[var(--bisme-on-gold)]' : 'bg-white/5 text-white/75'
            }`}
          >
            <span>{savedLabel}</span>
            {bookmarksCount > 0 && <span className="text-[10px]">({bookmarksCount})</span>}
          </button>
        </nav>
      </div>
    </header>
  );
}

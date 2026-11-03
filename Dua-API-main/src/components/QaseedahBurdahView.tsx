import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { stripReferenceMarkers } from '../utils/text';

interface BurdahEntry {
  id: string;
  section_id: string;
  section_number: number;
  verse_number: number;
  arabic: string;
  translation: Record<string, string>;
}

interface BurdahSection {
  id: string;
  section_number: number;
  title: string;
  title_localized: Record<string, string>;
  verse_ids: string[];
}

interface QaseedahBurdahViewProps {
  entries: BurdahEntry[];
  sections: BurdahSection[];
  language: string;
  displayTitle: Record<string, string>;
  focusVerseId?: string;
  onBack: () => void;
}

const labels: Record<string, Record<string, string>> = {
  en: { search: 'Search sections or verses...', back: 'Back to Categories', englishTranslation: 'Show English translation' },
  ta: { search: 'பகுதிகள் அல்லது பாடல்களைத் தேடுங்கள்...', back: 'வகைகளுக்குத் திரும்பு', englishTranslation: 'ஆங்கில மொழிபெயர்ப்பைக் காண்பி' },
  ml: { search: 'ഭാഗങ്ങളോ വരികളോ തിരയുക...', back: 'വിഭാഗങ്ങളിലേക്ക് മടങ്ങുക', englishTranslation: 'ഇംഗ്ലീഷ് പരിഭാഷ കാണിക്കുക' },
  ar: { search: 'ابحث في الأقسام أو الأبيات...', back: 'العودة إلى الفئات', englishTranslation: 'عرض الترجمة الإنجليزية' },
  ur: { search: 'حصوں یا اشعار میں تلاش کریں...', back: 'اقسام پر واپس جائیں', englishTranslation: 'انگریزی ترجمہ دکھائیں' },
  fr: { search: 'Rechercher des sections ou des vers...', back: 'Retour aux catégories', englishTranslation: 'Afficher la traduction anglaise' },
  tr: { search: 'Bölüm veya beyit ara...', back: 'Kategorilere dön', englishTranslation: 'İngilizce çeviriyi göster' },
  id: { search: 'Cari bagian atau bait...', back: 'Kembali ke kategori', englishTranslation: 'Tampilkan terjemahan bahasa Inggris' },
  bn: { search: 'অংশ বা পঙ্‌ক্তি খুঁজুন...', back: 'বিভাগে ফিরে যান', englishTranslation: 'ইংরেজি অনুবাদ দেখান' },
  ms: { search: 'Cari bahagian atau rangkap...', back: 'Kembali ke kategori', englishTranslation: 'Tunjukkan terjemahan bahasa Inggeris' },
};

const normalize = (value: string) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
  .replace(/['’‘ʿʻ`]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

export default function QaseedahBurdahView({
  entries,
  sections,
  language,
  displayTitle,
  focusVerseId,
  onBack,
}: QaseedahBurdahViewProps) {
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');
  const label = labels[language] || labels.en;
  const entriesById = useMemo(() => new Map(entries.map(entry => [entry.id, entry])), [entries]);
  const filteredSections = useMemo(() => {
    const normalizedQuery = normalize(query);
    return sections.map(section => {
      const sectionText = normalize([
        section.title,
        ...Object.values(section.title_localized),
      ].filter(Boolean).join(' '));
      const sectionMatches = normalizedQuery.length > 0 && sectionText.includes(normalizedQuery);
      const verses = section.verse_ids
        .map(id => entriesById.get(id))
        .filter((entry): entry is BurdahEntry => Boolean(entry))
        .filter(entry => !normalizedQuery || sectionMatches || normalize([
          entry.arabic,
          entry.translation.en,
          entry.translation[language],
        ].filter(Boolean).join(' ')).includes(normalizedQuery));
      return { section, verses, sectionMatches };
    }).filter(({ verses }) => verses.length > 0);
  }, [entriesById, language, query, sections]);

  useEffect(() => {
    if (!focusVerseId) return;
    requestAnimationFrame(() => {
      document.getElementById(focusVerseId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [focusVerseId]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="mx-auto max-w-5xl">
      <button
        onClick={onBack}
        className="category-back-button mb-5 inline-flex min-h-10 items-center gap-2 rounded-[13px] border border-[var(--bisme-gold)] px-3 py-2"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {label.back}
      </button>

      <header className="category-detail-header mb-6 rounded-2xl p-4 sm:p-6">
        <h2 className="text-xl font-bold sm:text-2xl">{displayTitle[language] || displayTitle.en}</h2>
        <p dir="rtl" className="mt-1 text-xl font-arabic" lang="ar">قصيدة البردة</p>
      </header>

      <nav
        aria-label="Qaseedah sections"
        tabIndex={0}
        className="mb-5 flex flex-nowrap gap-2 overflow-x-auto overscroll-x-contain pb-2"
      >
        {sections.map(section => (
          <button
            key={section.id}
            type="button"
            onClick={() => scrollTo(section.id)}
            className="shrink-0 whitespace-nowrap rounded-full border border-[var(--bisme-gold-border)] bg-[#00251B] px-3 py-2 text-sm text-[var(--bisme-gold)] transition-colors hover:bg-[#003B2B]"
          >
            {section.title_localized[language] || section.title_localized.en}
          </button>
        ))}
      </nav>

      <div className="glass-search mb-6 flex min-h-[50px] items-center gap-3 rounded-full px-4">
        <Search className="glass-search-icon h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder={label.search}
          className="glass-search-input box-border min-h-[48px] min-w-0 flex-1 font-sans text-sm"
          aria-label={label.search}
        />
      </div>

      <div className="space-y-8">
        {filteredSections.map(({ section, verses }) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <header className="category-detail-header mb-4 rounded-2xl p-4 sm:p-5">
              <h3 className="text-lg font-bold text-[var(--bisme-gold)] sm:text-xl">
                {section.title_localized[language] || section.title_localized.en}
              </h3>
            </header>

            <div className="space-y-3">
              {verses.map(verse => (
                <article
                  key={verse.id}
                  id={verse.id}
                  className={`themed-card scroll-mt-24 rounded-xl border p-4 sm:p-5 ${
                    isDark ? 'bg-[#063b2b] border-[var(--bisme-gold-border)]' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bisme-jade)] text-sm font-bold text-[var(--bisme-on-gold)]">
                      {verse.verse_number}
                    </span>
                  </div>
                  <p
                    dir="rtl"
                    lang="ar"
                    className="whitespace-pre-line break-words text-right text-2xl leading-[2.2] font-arabic sm:text-3xl"
                    style={{ fontFamily: "'Arabic Punctuation', 'KFGQPC Uthmanic Script HAFS', 'Amiri Quran', 'Amiri', serif" }}
                  >
                    {verse.arabic}
                  </p>
                  <p
                    dir={verse.translation[language] && (language === 'ar' || language === 'ur') ? 'rtl' : 'auto'}
                    className={`mt-4 whitespace-pre-line break-words text-sm leading-7 sm:text-base ${
                      isDark ? 'text-gray-200' : 'text-gray-700'
                    }`}
                  >
                    {stripReferenceMarkers(verse.translation[language] || verse.translation.en)}
                  </p>
                  {language !== 'en' && verse.translation[language] && (
                    <details className="mt-3 text-xs">
                      <summary className="cursor-pointer text-[var(--bisme-gold)]">{label.englishTranslation}</summary>
                      <p dir="ltr" className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--bisme-text-secondary)]">
                        {stripReferenceMarkers(verse.translation.en)}
                      </p>
                    </details>
                  )}
                </article>
              ))}
            </div>
          </section>
        ))}
        {!filteredSections.length && (
          <p className="py-12 text-center text-[var(--bisme-text-secondary)]">
            {language === 'ar' ? 'لم يتم العثور على نتائج' : language === 'ur' ? 'کوئی نتیجہ نہیں ملا' : language === 'ta' ? 'முடிவுகள் எதுவும் இல்லை' : language === 'ml' ? 'ഫലങ്ങളൊന്നും കണ്ടെത്തിയില്ല' : 'No matching sections or verses found.'}
          </p>
        )}
      </div>
    </div>
  );
}

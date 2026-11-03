import { useMemo, useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { stripReferenceMarkers } from '../utils/text';

interface MawlidEntry {
  id: string;
  section_id: string;
  verse_number: number;
  title: Record<string, string>;
  arabic: string;
  translation: Record<string, string>;
}

interface MawlidSection {
  id: string;
  title: string;
  title_localized: Record<string, string>;
  verse_ids: string[];
  display_groups?: MawlidDisplayGroup[];
}

interface MawlidDisplayGroup {
  id: string;
  title: string;
  verse_ids: string[];
}

interface MawlidViewProps {
  entries: MawlidEntry[];
  sections: MawlidSection[];
  language: string;
  displayTitle: Record<string, string>;
  onBack: () => void;
}

const labels: Record<string, Record<string, string>> = {
  en: { backCategories: 'Back to Categories', backMawlid: 'Back to Mawlid', part: 'Part', parts: 'parts', englishTranslation: 'Show English translation', showTranslations: 'Show translations', hideTranslations: 'Hide translations' },
  ta: { backCategories: 'வகைகளுக்குத் திரும்பு', backMawlid: 'மௌலிதுக்குத் திரும்பு', part: 'பகுதி', parts: 'பகுதிகள்', englishTranslation: 'ஆங்கில மொழிபெயர்ப்பைக் காண்பி', showTranslations: 'மொழிபெயர்ப்புகளைக் காட்டு', hideTranslations: 'மொழிபெயர்ப்புகளை மறை' },
  ml: { backCategories: 'വിഭാഗങ്ങളിലേക്ക് മടങ്ങുക', backMawlid: 'മൗലിദിലേക്ക് മടങ്ങുക', part: 'ഭാഗം', parts: 'ഭാഗങ്ങൾ', englishTranslation: 'ഇംഗ്ലീഷ് പരിഭാഷ കാണിക്കുക', showTranslations: 'പരിഭാഷകൾ കാണിക്കുക', hideTranslations: 'പരിഭാഷകൾ മറയ്ക്കുക' },
  ar: { backCategories: 'العودة إلى الفئات', backMawlid: 'العودة إلى المولد', part: 'الجزء', parts: 'الأجزاء', englishTranslation: 'عرض الترجمة الإنجليزية', showTranslations: 'عرض الترجمات', hideTranslations: 'إخفاء الترجمات' },
  ur: { backCategories: 'زمرہ جات پر واپس', backMawlid: 'مولد پر واپس', part: 'حصہ', parts: 'حصے', englishTranslation: 'انگریزی ترجمہ دکھائیں', showTranslations: 'ترجمے دکھائیں', hideTranslations: 'ترجمے چھپائیں' },
  fr: { backCategories: 'Retour aux catégories', backMawlid: 'Retour au Mawlid', part: 'Partie', parts: 'parties', englishTranslation: 'Afficher la traduction anglaise', showTranslations: 'Afficher les traductions', hideTranslations: 'Masquer les traductions' },
  tr: { backCategories: 'Kategorilere dön', backMawlid: 'Mevlide dön', part: 'Bölüm', parts: 'bölüm', englishTranslation: 'İngilizce çeviriyi göster', showTranslations: 'Çevirileri göster', hideTranslations: 'Çevirileri gizle' },
  id: { backCategories: 'Kembali ke kategori', backMawlid: 'Kembali ke Maulid', part: 'Bagian', parts: 'bagian', englishTranslation: 'Tampilkan terjemahan bahasa Inggris', showTranslations: 'Tampilkan terjemahan', hideTranslations: 'Sembunyikan terjemahan' },
  bn: { backCategories: 'বিভাগে ফিরে যান', backMawlid: 'মাওলিদে ফিরে যান', part: 'অংশ', parts: 'অংশ', englishTranslation: 'ইংরেজি অনুবাদ দেখান', showTranslations: 'অনুবাদ দেখান', hideTranslations: 'অনুবাদ লুকান' },
  ms: { backCategories: 'Kembali ke kategori', backMawlid: 'Kembali ke Maulid', part: 'Bahagian', parts: 'bahagian', englishTranslation: 'Tunjukkan terjemahan bahasa Inggeris', showTranslations: 'Tunjukkan terjemahan', hideTranslations: 'Sembunyikan terjemahan' },
};

function MawlidEntryText({
  entry,
  language,
  isDark,
  showTranslations,
  englishTranslationLabel,
}: {
  entry: MawlidEntry;
  language: string;
  isDark: boolean;
  showTranslations: boolean;
  englishTranslationLabel: string;
}) {
  return (
    <div>
      <p
        dir="rtl"
        lang="ar"
        className="whitespace-pre-line break-words text-right text-2xl leading-[2.2] font-arabic sm:text-3xl"
        style={{ fontFamily: "'Arabic Punctuation', 'KFGQPC Uthmanic Script HAFS', 'Amiri Quran', 'Amiri', serif" }}
      >
        {entry.arabic}
      </p>
      {showTranslations && entry.translation[language] && (
        <p
          dir={language === 'ar' || language === 'ur' ? 'rtl' : 'auto'}
          className={`mt-4 whitespace-pre-line break-words text-sm leading-7 sm:text-base ${
            isDark ? 'text-gray-200' : 'text-gray-700'
          }`}
        >
          {stripReferenceMarkers(entry.translation[language])}
        </p>
      )}
      {showTranslations && language !== 'en' && entry.translation.en && (
        <details className="mt-3 text-xs">
          <summary className="cursor-pointer text-[var(--bisme-gold)]">{englishTranslationLabel}</summary>
          <p dir="ltr" className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--bisme-text-secondary)]">
            {stripReferenceMarkers(entry.translation.en)}
          </p>
        </details>
      )}
    </div>
  );
}

export default function MawlidView({
  entries,
  sections,
  language,
  displayTitle,
  onBack,
}: MawlidViewProps) {
  const { isDark } = useTheme();
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [showTranslations, setShowTranslations] = useState(true);
  const label = labels[language] || labels.en;
  const entriesById = useMemo(() => new Map(entries.map(entry => [entry.id, entry])), [entries]);
  const selectedSection = sections.find(section => section.id === selectedSectionId);
  const sectionEntries = selectedSection?.verse_ids
    .map(id => entriesById.get(id))
    .filter((entry): entry is MawlidEntry => Boolean(entry)) || [];

  return (
    <div className="mx-auto max-w-5xl">
      <button
        type="button"
        onClick={() => selectedSection ? setSelectedSectionId(null) : onBack()}
        className="category-back-button mb-5 inline-flex min-h-10 items-center gap-2 rounded-[13px] border border-[var(--bisme-gold)] px-3 py-2"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {selectedSection ? label.backMawlid : label.backCategories}
      </button>

      <header className="category-detail-header mb-6 rounded-2xl p-4 sm:p-6">
        <h2 className="text-xl font-bold sm:text-2xl">
          {selectedSection
            ? selectedSection.title_localized[language] || selectedSection.title_localized.en
            : displayTitle[language] || displayTitle.en}
        </h2>
      </header>

      {!selectedSection ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {sections.map(section => (
            <button
              key={section.id}
              type="button"
              onClick={() => setSelectedSectionId(section.id)}
              className={`mawlid-section-card themed-card rounded-xl border p-5 text-left transition-colors ${
                isDark ? 'bg-[#063b2b] border-[var(--bisme-gold-border)]' : 'bg-white border-gray-200'
              }`}
            >
              <span className="block text-lg font-semibold text-[var(--bisme-gold)]">
                {section.title_localized[language] || section.title_localized.en}
              </span>
              <span className="mt-1 block text-sm text-[var(--bisme-text-secondary)]">
                {section.verse_ids.length} {section.verse_ids.length === 1 ? label.part.toLowerCase() : label.parts}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => setShowTranslations(visible => !visible)}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--bisme-gold-border)] px-3 py-2 text-sm text-[var(--bisme-gold)]"
              aria-pressed={showTranslations}
            >
              {showTranslations
                ? <EyeOff className="h-4 w-4" aria-hidden="true" />
                : <Eye className="h-4 w-4" aria-hidden="true" />}
              {showTranslations ? label.hideTranslations : label.showTranslations}
            </button>
          </div>
          {selectedSection.display_groups?.length ? (
            <>
              <nav
                aria-label="Subuhana Mawlid sections"
                tabIndex={0}
                className="mb-6 flex flex-nowrap gap-2 overflow-x-auto overscroll-x-contain pb-2"
              >
                {selectedSection.display_groups.map(group => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => {
                      const target = document.getElementById(group.id);
                      if (!target) return;
                      const headerHeight = document.querySelector('.app-header')?.getBoundingClientRect().height || 0;
                      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
                      window.scrollTo({ top, behavior: 'smooth' });
                    }}
                    className="shrink-0 whitespace-nowrap rounded-full border border-[var(--bisme-gold-border)] bg-[#00251B] px-3 py-2 text-sm text-[var(--bisme-gold)] transition-colors hover:bg-[#003B2B]"
                  >
                    {group.title}
                  </button>
                ))}
              </nav>
              <div className="space-y-8">
                {selectedSection.display_groups.map(group => (
                  <section key={group.id} id={group.id} className="scroll-mt-28">
                  <header className="category-detail-header mb-4 rounded-2xl p-4 sm:p-5">
                    <h3 className="text-lg font-bold text-[var(--bisme-gold)] sm:text-xl">{group.title}</h3>
                  </header>
                  <div className="space-y-3">
                    {group.verse_ids
                      .map(id => entriesById.get(id))
                      .filter((entry): entry is MawlidEntry => Boolean(entry))
                      .map(entry => (
                        <article
                          key={entry.id}
                          id={entry.id}
                          className={`themed-card scroll-mt-24 rounded-xl border p-4 sm:p-5 ${
                            isDark ? 'bg-[#063b2b] border-[var(--bisme-gold-border)]' : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="mb-3 flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bisme-jade)] text-sm font-bold text-[var(--bisme-on-gold)]">
                              {entry.verse_number}
                            </span>
                          </div>
                          <MawlidEntryText
                            entry={entry}
                            language={language}
                            isDark={isDark}
                            showTranslations={showTranslations}
                            englishTranslationLabel={label.englishTranslation}
                          />
                        </article>
                      ))}
                  </div>
                  </section>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {sectionEntries.map(entry => (
                <article
                  key={entry.id}
                  className={`themed-card rounded-xl border p-4 sm:p-5 ${
                    isDark ? 'bg-[#063b2b] border-[var(--bisme-gold-border)]' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bisme-jade)] text-sm font-bold text-[var(--bisme-on-gold)]">
                      {entry.verse_number}
                    </span>
                    <h3 className="font-semibold text-[var(--bisme-gold)]">
                      {entry.title[language] || entry.title.en || `${label.part} ${entry.verse_number}`}
                    </h3>
                  </div>
                  <MawlidEntryText
                    entry={entry}
                    language={language}
                    isDark={isDark}
                    showTranslations={showTranslations}
                    englishTranslationLabel={label.englishTranslation}
                  />
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

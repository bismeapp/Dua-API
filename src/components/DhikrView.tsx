import { ArrowLeft } from 'lucide-react';
import AudioPlayer from './AudioPlayer';

export interface DhikrRecord {
  id: string;
  title: Record<string, string>;
  category_ids: string[];
  arabic: string;
  transliteration: string;
  translation: Record<string, string>;
  references: { source: string; reference: string; type: string }[];
  repetition: { count: number | null; basis: string };
  deeper_meaning?: Record<string, string>;
}

const translationLabels: Record<string, string> = {
  ar: 'الترجمة',
  en: 'Translation',
  ta: 'மொழிபெயர்ப்பு',
  ml: 'വിവർത്തനം',
  ur: 'ترجمہ',
  fr: 'Traduction',
  tr: 'Çeviri',
  id: 'Terjemahan',
  bn: 'অনুবাদ',
  ms: 'Terjemahan',
};

export default function DhikrView({
  categoryTitle,
  records,
  language,
  onBack,
}: {
  categoryTitle: string;
  records: DhikrRecord[];
  language: string;
  onBack: () => void;
}) {
  return (
    <section aria-label={categoryTitle}>
      <button
        type="button"
        onClick={onBack}
        className="category-back-button mb-5 inline-flex min-h-10 items-center gap-2 rounded-[13px] border border-[var(--bisme-gold)] px-3 py-2"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {language === 'ta' ? 'பிரிவுகளுக்குத் திரும்பு' : language === 'ml' ? 'വിഭാഗങ്ങളിലേക്ക് മടങ്ങുക' : 'Back to Dhikr'}
      </button>
      {records.length === 0 ? (
        <p className="text-center text-sm text-[var(--bisme-text-secondary)]">
          {language === 'ta' ? 'இந்த திக்ர் கிடைக்கவில்லை.'
            : language === 'ml' ? 'ഈ ദിക്റ് ലഭ്യമല്ല.'
              : language === 'ar' ? 'هذا الذكر غير متاح.'
                : language === 'ur' ? 'یہ ذکر دستیاب نہیں ہے۔'
                  : language === 'fr' ? 'Ce dhikr est indisponible.'
                    : language === 'tr' ? 'Bu zikir mevcut değil.'
                      : language === 'id' ? 'Zikir ini tidak tersedia.'
                        : language === 'bn' ? 'এই যিকিরটি উপলভ্য নয়।'
                          : language === 'ms' ? 'Zikir ini tidak tersedia.'
                            : 'This dhikr is unavailable.'}
        </p>
      ) : (
        <div className="mx-auto max-w-3xl">
          {records.map(record => {
            const translation = record.translation[language] || record.translation.en;
            const deeperMeaning = language === 'en' ? record.deeper_meaning?.en : undefined;
            const references = record.references.map(reference =>
              `${reference.source} ${reference.reference}`
            ).join('; ');
            return (
              <article key={record.id} className="dua-detail-shell overflow-hidden rounded-2xl border text-center shadow-xl">
                <header className="dua-detail-header border-b p-4 text-center text-white sm:p-6">
                  <p className="text-sm text-white/80">{categoryTitle}</p>
                  <h3 className="mt-1 text-xl font-bold">{record.title[language] || record.title.en}</h3>
                </header>
                <div className="border-b border-[rgba(185,154,69,0.32)] p-4 sm:p-6">
                  <p
                    lang="ar"
                    dir="rtl"
                    className="max-w-full break-words whitespace-pre-line py-4 text-center text-3xl leading-loose text-white"
                    style={{ fontFamily: "'Arabic Punctuation', 'KFGQPC Uthmanic Script HAFS', 'Amiri Quran', 'Amiri', serif" }}
                  >
                    {record.arabic}
                  </p>
                  <p dir="ltr" className="whitespace-pre-line break-words text-center text-sm italic leading-relaxed text-[var(--bisme-text-secondary)]">
                    {record.transliteration}
                  </p>
                </div>
                <div className="border-b border-[rgba(185,154,69,0.32)] p-4">
                  <AudioPlayer arabicText={record.arabic} language={language} />
                </div>
                <div className="space-y-4 border-b border-[rgba(185,154,69,0.32)] bg-[#00251b] p-4 sm:p-6">
                  <section>
                    <h4 className="mb-2 text-center text-xs font-medium uppercase tracking-wider text-gray-400">
                      {translationLabels[language] || translationLabels.en}
                    </h4>
                    <p lang={language} dir={language === 'ar' || language === 'ur' ? 'rtl' : 'auto'} className="text-center text-lg leading-relaxed text-[var(--bisme-text-secondary)]">
                      {translation}
                    </p>
                  </section>
                  {references && (
                    <p className="text-center text-sm text-[var(--bisme-text-secondary)]">
                      <strong className="text-[var(--bisme-gold)]">Reference:</strong> {references}
                    </p>
                  )}
                  {deeperMeaning && (
                    <section>
                      <h4 className="mb-2 text-center text-xs font-medium uppercase tracking-wider text-gray-400">Deeper Meaning</h4>
                      <p className="text-center text-sm leading-relaxed text-[var(--bisme-text-secondary)]">{deeperMeaning}</p>
                    </section>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

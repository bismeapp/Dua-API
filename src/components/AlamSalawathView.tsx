import { ArrowLeft } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const closingDuaMarker = '\n\nالدعاء\n\n';

export default function AlamSalawathView({
  arabic,
  title,
  translation,
  translationStatus,
  language,
  onBack,
}: {
  arabic: string;
  title: Record<string, string>;
  translation: Record<string, string>;
  translationStatus?: string;
  language: string;
  onBack: () => void;
}) {
  const { isDark } = useTheme();
  const closingDuaIndex = arabic.indexOf(closingDuaMarker);
  const salawathText = closingDuaIndex < 0 ? arabic : arabic.slice(0, closingDuaIndex);
  const closingDua = closingDuaIndex < 0
    ? null
    : arabic.slice(closingDuaIndex + closingDuaMarker.length);
  const translationReviewLabel: Record<string, string> = {
    en: 'Machine-generated translation; human review required.',
    ar: 'ترجمة مولدة آليًا وتتطلب مراجعة بشرية.',
    ta: 'இயந்திரத்தால் உருவாக்கப்பட்ட மொழிபெயர்ப்பு; மனித மதிப்பாய்வு தேவை.',
    ml: 'യന്ത്രം സൃഷ്ടിച്ച വിവർത്തനം; മനുഷ്യപരിശോധന ആവശ്യമാണ്.',
    ur: 'مشینی ترجمہ؛ انسانی نظرثانی ضروری ہے۔',
    fr: 'Traduction générée par machine ; révision humaine requise.',
    tr: 'Makine tarafından oluşturulan çeviri; insan incelemesi gereklidir.',
    id: 'Terjemahan yang dihasilkan mesin; perlu ditinjau manusia.',
    bn: 'যন্ত্রে তৈরি অনুবাদ; মানুষের পর্যালোচনা প্রয়োজন।',
    ms: 'Terjemahan jana mesin; semakan manusia diperlukan.',
  };
  const selectedTranslation = language === 'ar' ? '' : translation[language] || translation.en || '';

  return (
    <section aria-label={title.en || 'A\'lam Salawath'} className="mx-auto max-w-4xl">
      <button
        type="button"
        onClick={onBack}
        className="category-back-button mb-5 inline-flex min-h-10 items-center gap-2 rounded-[13px] border border-[var(--bisme-gold)] px-3 py-2"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Salawath
      </button>

      <article className={`dua-detail-shell overflow-hidden rounded-2xl border shadow-xl ${
        isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-100 bg-white'
      }`}>
        <header className="dua-detail-header border-b p-4 text-white sm:p-6">
          <h2 className="text-xl font-bold sm:text-2xl">{title[language] || title.en || 'A\'lam Salawath'}</h2>
          <p
            dir="rtl"
            lang="ar"
            className="mt-2 text-xl font-arabic text-white/90 sm:text-2xl"
            style={{ fontFamily: "'Arabic Punctuation', 'KFGQPC Uthmanic Script HAFS', 'Amiri Quran', 'Amiri', serif" }}
          >
            {title.ar || 'أَعْظَمُ الصَّلَاةِ'}
          </p>
        </header>

        <div className="space-y-6 p-4 sm:p-6">
          <p
            dir="rtl"
            lang="ar"
            className={`whitespace-pre-line break-words text-right text-2xl leading-[2.3] font-arabic sm:text-3xl ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
            style={{ fontFamily: "'Arabic Punctuation', 'KFGQPC Uthmanic Script HAFS', 'Amiri Quran', 'Amiri', serif" }}
          >
            {salawathText}
          </p>

          {selectedTranslation && (
            <section
              aria-label={`${language.toUpperCase()} translation`}
              className={`border-t border-[rgba(185,154,69,0.32)] pt-5 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              {translationStatus && (
                <p className="mb-3 text-xs text-[var(--bisme-text-muted)]">
                  {translationReviewLabel[language] || translationReviewLabel.en}
                </p>
              )}
              <p
                dir={language === 'ur' ? 'rtl' : 'ltr'}
                lang={language}
                className={`whitespace-pre-line break-words text-base leading-8 sm:text-lg ${
                  language === 'ur' ? 'text-right' : 'text-left'
                }`}
              >
                {selectedTranslation}
              </p>
            </section>
          )}

          {closingDua !== null && (
            <section
              aria-labelledby="alam-salawath-closing-dua"
              className={`border-t border-[rgba(185,154,69,0.32)] pt-5 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              <h3
                id="alam-salawath-closing-dua"
                dir="rtl"
                lang="ar"
                className="mb-3 text-right text-2xl font-bold font-arabic sm:text-3xl"
                style={{ fontFamily: "'Arabic Punctuation', 'KFGQPC Uthmanic Script HAFS', 'Amiri Quran', 'Amiri', serif" }}
              >
                الدعاء
              </h3>
              <p
                dir="rtl"
                lang="ar"
                className="whitespace-pre-line break-words text-right text-2xl leading-[2.3] font-arabic sm:text-3xl"
                style={{ fontFamily: "'Arabic Punctuation', 'KFGQPC Uthmanic Script HAFS', 'Amiri Quran', 'Amiri', serif" }}
              >
                {closingDua}
              </p>
            </section>
          )}
        </div>
      </article>
    </section>
  );
}

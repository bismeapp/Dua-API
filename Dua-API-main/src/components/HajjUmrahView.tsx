import { ArrowLeft } from 'lucide-react';
import { stripReferenceMarkers } from '../utils/text';

type HajjDua = {
  id: string;
  title: Record<string, string>;
  arabic: string;
  translation: Record<string, string>;
  transliteration?: string;
  reference: string | { source?: string; reference_text?: string };
  times: number;
  item_number?: number;
  section_letter?: string;
  section_title?: Record<string, string>;
  classification?: Record<string, string>;
};

type HajjSection = {
  id: string;
  section_number: number;
  letter: string;
  title_localized: Record<string, string>;
  introduction?: Record<string, string>;
  item_numbers: number[];
  dua_ids: string[];
};

const existingLabels: Record<string, string> = {
  en: 'Existing Hajj & Umrah duas',
  ta: 'ஏற்கனவே உள்ள ஹஜ் மற்றும் உம்ரா துஆக்கள்',
  ml: 'നിലവിലുള്ള ഹജ്ജ്, ഉംറ ദുആകൾ',
  ar: 'أدعية الحج والعمرة الحالية',
  ur: 'موجودہ حج اور عمرہ کی دعائیں',
  fr: 'Invocations existantes du Hajj et de la Omra',
  tr: 'Mevcut Hac ve Umre duaları',
  id: 'Doa Haji dan Umrah yang sudah ada',
  bn: 'বিদ্যমান হজ ও উমরাহর দোয়া',
  ms: 'Doa Haji dan Umrah sedia ada',
};

const backLabels: Record<string, string> = {
  en: 'Back to Categories',
  ta: 'வகைகளுக்குத் திரும்பு',
  ml: 'വിഭാഗങ്ങളിലേക്ക് മടങ്ങുക',
  ar: 'العودة للفئات',
  ur: 'زمرہ جات پر واپس',
  fr: 'Retour aux catégories',
  tr: 'Kategorilere dön',
  id: 'Kembali ke kategori',
  bn: 'বিভাগে ফিরে যান',
  ms: 'Kembali ke kategori',
};

const translationReviewLabels: Record<string, string> = {
  en: 'Translations are machine-generated and require human review.',
  ta: 'மொழிபெயர்ப்புகள் இயந்திரத்தால் உருவாக்கப்பட்டவை; மனிதர் மதிப்பாய்வு செய்ய வேண்டும்.',
  ml: 'വിവർത്തനങ്ങൾ യന്ത്രം സൃഷ്ടിച്ചതാണ്; മനുഷ്യപരിശോധന ആവശ്യമാണ്.',
  ar: 'الترجمات مولدة آليًا وتتطلب مراجعة بشرية.',
  ur: 'ترجمے مشینی طور پر تیار کیے گئے ہیں اور انسانی نظرثانی درکار ہے۔',
  fr: 'Les traductions sont générées automatiquement et nécessitent une révision humaine.',
  tr: 'Çeviriler makine tarafından oluşturulmuştur ve insan incelemesi gerektirir.',
  id: 'Terjemahan dibuat oleh mesin dan memerlukan peninjauan manusia.',
  bn: 'অনুবাদগুলো যন্ত্রের মাধ্যমে তৈরি এবং মানুষের পর্যালোচনা প্রয়োজন।',
  ms: 'Terjemahan dijana mesin dan memerlukan semakan manusia.',
};

export default function HajjUmrahView({
  entries,
  sections,
  language,
  categoryName,
  onBack,
  onDuaClick,
}: {
  entries: HajjDua[];
  sections: HajjSection[];
  language: string;
  categoryName: string;
  onBack: () => void;
  onDuaClick: (dua: HajjDua) => void;
}) {
  const legacyEntries = entries.filter(dua => typeof dua.item_number !== 'number');

  const renderDua = (dua: HajjDua, fallbackNumber: number) => (
    <button
      type="button"
      key={dua.id}
      onClick={() => onDuaClick(dua)}
      className="dua-card w-full cursor-pointer rounded-xl border p-4 text-left transition-all duration-200 sm:p-5"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[var(--bisme-gold-border)] bg-[#00251b] text-sm font-bold text-white">
          {dua.item_number ?? fallbackNumber}
        </span>
        <span className="min-w-0 flex-1">
          <span className="mb-1 block break-words text-base font-semibold text-white sm:text-lg">
            {stripReferenceMarkers(dua.title[language] || dua.title.en)}
          </span>
          <span className="block whitespace-pre-line break-words text-sm text-[var(--bisme-text-secondary)]">
            {stripReferenceMarkers(dua.translation[language] || dua.translation.en)}
          </span>
          {dua.classification?.[language] && (
            <span className="mt-2 inline-flex max-w-full break-words rounded-full border border-[var(--bisme-gold-border)] px-2 py-1 text-xs text-[var(--bisme-text-muted)]">
              {stripReferenceMarkers(dua.classification[language])}
            </span>
          )}
        </span>
      </div>
    </button>
  );

  return (
    <div>
      <button
        onClick={onBack}
        className="category-back-button mb-5 inline-flex items-center gap-2 rounded-[13px] border border-[var(--bisme-gold)] px-3 py-2 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>{backLabels[language] || backLabels.en}</span>
      </button>

      <div className="category-detail-header mb-6 rounded-2xl p-4 sm:p-6">
        <h2 className="break-words text-xl font-bold sm:text-2xl">{categoryName}</h2>
        <p className="text-sm">{entries.length} {language === 'ta' ? 'துஆக்கள்' : language === 'ml' ? 'ദുആകൾ' : language === 'ar' ? 'دعاء' : language === 'ur' ? 'دعائیں' : language === 'bn' ? 'দোয়া' : 'duas'}</p>
      </div>
      <p className="mb-5 rounded-xl border border-[var(--bisme-gold-border)] bg-[#063b2b] p-3 text-sm text-[var(--bisme-text-secondary)]">
        {translationReviewLabels[language] || translationReviewLabels.en}
      </p>

      {sections.length > 0 && (
        <nav aria-label="Hajj and Umrah sections" className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {sections.map(section => (
            <button
              type="button"
              key={section.id}
              onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="min-h-10 flex-shrink-0 rounded-full border border-[var(--bisme-gold-border)] bg-[#00251b] px-3 py-2 text-sm text-white transition-colors hover:bg-[#063b2b]"
            >
              {section.letter}. {section.title_localized[language] || section.title_localized.en}
            </button>
          ))}
        </nav>
      )}

      <div className="space-y-7">
        {legacyEntries.length > 0 && (
          <section aria-labelledby="hajj-existing-heading" className="space-y-3">
            <h3 id="hajj-existing-heading" className="break-words text-lg font-bold text-[var(--bisme-gold)]">
              {existingLabels[language] || existingLabels.en}
            </h3>
            {legacyEntries.map((dua, index) => renderDua(dua, index + 1))}
          </section>
        )}

        {sections.map(section => {
          const sectionEntries = entries
            .filter(dua => dua.section_letter === section.letter)
            .sort((left, right) => (left.item_number || 0) - (right.item_number || 0));
          if (!sectionEntries.length) return null;
          return (
            <section id={section.id} key={section.id} aria-labelledby={`${section.id}-heading`} className="scroll-mt-24 space-y-3">
              <div>
                <h3 id={`${section.id}-heading`} className="break-words text-lg font-bold text-[var(--bisme-gold)]">
                  {section.letter}. {section.title_localized[language] || section.title_localized.en}
                </h3>
                {section.introduction?.[language] && (
                  <p dir={language === 'ar' || language === 'ur' ? 'rtl' : 'auto'} className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed text-[var(--bisme-text-secondary)]">
                    {stripReferenceMarkers(section.introduction[language])}
                  </p>
                )}
              </div>
              {sectionEntries.map(dua => renderDua(dua, dua.item_number || 0))}
            </section>
          );
        })}
      </div>
    </div>
  );
}

import { useState } from 'react';
import completeListsData from '../data/allData.json';
const { asmaUlAnbiya } = completeListsData;
const { prophetsWithDuas } = completeListsData;
import { useTheme } from '../contexts/ThemeContext';
import AudioPlayer from './AudioPlayer';
import { stripReferenceMarkers } from '../utils/text';

interface AsmaUlAnbiyaViewProps {
  language: string;
  onBack: () => void;
}

export default function AsmaUlAnbiyaView({ language, onBack }: AsmaUlAnbiyaViewProps) {
  const { isDark } = useTheme();
  const [selectedProphet, setSelectedProphet] = useState<number | null>(null);
  const [showDuas, setShowDuas] = useState<number | null>(null);

  const labels: Record<string, Record<string, string>> = {
    en: { title: "Names of the Prophets (Asma ul Anbiya)", subtitle: "25 Prophets", back: "Back to Categories", showDuas: "Show Duas", hideDuas: "Hide Duas", noDuas: "No specific duas recorded" },
    ar: { title: "أسماء الأنبياء (Asma ul Anbiya)", subtitle: "25 نبيًا", back: "العودة للفئات", showDuas: "عرض الأدعية", hideDuas: "إخفاء الأدعية", noDuas: "لا توجد أدعية محددة مسجلة" },
    ur: { title: "انبیاء کے نام (Asma ul Anbiya)", subtitle: "25 انبیاء", back: "زمرہ جات پر واپس", showDuas: "دعائیں دکھائیں", hideDuas: "دعائیں چھپائیں", noDuas: "کوئی مخصوص دعائیں درج نہیں" },
    fr: { title: "Noms des prophètes (Asma ul Anbiya)", subtitle: "25 prophètes", back: "Retour", showDuas: "Afficher les Duas", hideDuas: "Masquer les Duas", noDuas: "Aucun dua spécifique enregistré" },
    tr: { title: "Peygamberlerin İsimleri (Asma ul Anbiya)", subtitle: "25 peygamber", back: "Geri", showDuas: "Duaları Göster", hideDuas: "Duaları Gizle", noDuas: "Belirli dua kaydedilmedi" },
    id: { title: "Nama Para Nabi (Asma ul Anbiya)", subtitle: "25 nabi", back: "Kembali", showDuas: "Tampilkan Doa", hideDuas: "Sembunyikan Doa", noDuas: "Tidak ada doa spesifik yang tercatat" },
    bn: { title: "নবীদের নাম (Asma ul Anbiya)", subtitle: "২৫ জন নবী", back: "পিছনে", showDuas: "দোয়া দেখান", hideDuas: "দোয়া লুকান", noDuas: "কোনো নির্দিষ্ট দোয়া রেকর্ড নেই" },
    ms: { title: "Nama-nama Nabi (Asma ul Anbiya)", subtitle: "25 nabi", back: "Kembali", showDuas: "Tunjukkan Doa", hideDuas: "Sembunyikan Doa", noDuas: "Tiada doa khusus direkodkan" },
    ta: { title: "நபிமார்களின் பெயர்கள் (Asma ul Anbiya)", subtitle: "25 நபிமார்கள்", back: "பின்", showDuas: "துஆக்களை காட்டு", hideDuas: "துஆக்களை மறை", noDuas: "குறிப்பிட்ட துஆக்கள் பதிவு செய்யப்படவில்லை" },
    ml: { title: "പ്രവാചകന്മാരുടെ പേരുകൾ (Asma ul Anbiya)", subtitle: "25 നബിമാർ", back: "തിരികെ", showDuas: "ദുആകൾ കാണിക്കുക", hideDuas: "ദുആകൾ മറയ്ക്കുക", noDuas: "നിർദ്ദിഷ്ട ദുആകൾ രേഖപ്പെടുത്തിയിട്ടില്ല" }
  };

  const label = labels[language] || labels.en;

  const getProphetDuas = (prophetNumber: number) => {
    return prophetsWithDuas.find(p => p.prophetNumber === prophetNumber);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <button
        onClick={onBack}
        className="category-back-button mb-5 inline-flex items-center gap-2 rounded-[13px] border border-[var(--bisme-gold)] px-3 py-2"
      >
        <span>{label.back}</span>
      </button>

      <div className="category-detail-header mb-6 rounded-2xl p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-2">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">{label.title}</h2>
            <p className="text-sm">{label.subtitle}</p>
          </div>
        </div>
      </div>

      {/* List of Prophets */}
      <div className="space-y-4">
        {asmaUlAnbiya.map((prophet) => (
          <div
            key={prophet.n}
            onClick={() => setSelectedProphet(selectedProphet === prophet.n ? null : prophet.n)}
            className={`themed-card cursor-pointer rounded-xl border p-4 transition-all sm:p-5 ${
              isDark 
                ? 'bg-[#063b2b] border-[var(--bisme-gold-border)] hover:border-[var(--bisme-jade)]' 
                : 'bg-white border-gray-200 hover:border-indigo-400 hover:shadow-md'
            } ${selectedProphet === prophet.n ? (isDark ? 'border-[var(--bisme-gold)]' : 'border-indigo-500 shadow-lg') : ''}`}
          >
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                isDark ? 'bg-[var(--bisme-jade)] text-[var(--bisme-on-gold)]' : 'bg-indigo-100 text-indigo-700'
              }`}>
                {prophet.n}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p dir="rtl" className="text-2xl font-arabic mb-1" style={{ fontFamily: "'Arabic Punctuation', 'KFGQPC Uthmanic Script HAFS', 'Amiri Quran', 'Amiri', serif" }}>
                      {prophet.ar}
                    </p>
                    <p className={`text-base font-semibold ${isDark ? 'text-[var(--bisme-gold)]' : 'text-indigo-700'}`}>
                      {language === 'ta' ? prophet.ta : language === 'ml' ? prophet.ml : prophet.en}
                    </p>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {prophet.title}
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {prophet.years}
                    </p>
                  </div>
                </div>

                {/* Expanded view with audio and duas */}
                {selectedProphet === prophet.n && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
                    <AudioPlayer arabicText={prophet.ar} language={language} />
                    
                    {/* Duas Section */}
                    {(() => {
                      const prophetData = getProphetDuas(prophet.n);
                      if (!prophetData || !prophetData.duas || prophetData.duas.length === 0) {
                        return (
                          <div className="mt-4 p-3 rounded-lg bg-gray-100 dark:bg-slate-700">
                            <p className={`text-sm italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {label.noDuas}
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="mt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDuas(showDuas === prophet.n ? null : prophet.n);
                            }}
                            className={`mb-3 min-h-10 w-full rounded-lg px-4 py-2 font-medium transition-colors ${
                              isDark
                                ? 'bg-[var(--bisme-jade)] hover:bg-[var(--bisme-emerald)] text-[var(--bisme-on-gold)]'
                                : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                            }`}
                          >
                            {showDuas === prophet.n ? label.hideDuas : label.showDuas} ({prophetData.duas.length})
                          </button>

                          {showDuas === prophet.n && (
                            <div className="space-y-3">
                              {prophetData.duas.map((dua, idx) => (
                                <div
                                  key={dua.id}
                                  className={`p-4 rounded-lg border ${
                                    isDark
                                      ? 'bg-slate-900 border-slate-600'
                                      : 'bg-white border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-start gap-3 mb-2">
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                                      isDark ? 'bg-[var(--bisme-jade)] text-[var(--bisme-on-gold)]' : 'bg-indigo-100 text-indigo-700'
                                    }`}>
                                      {idx + 1}
                                    </span>
                                    <h4 className={`font-semibold flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                      {stripReferenceMarkers(dua.title[language as keyof typeof dua.title] || dua.title.en)}
                                    </h4>
                                  </div>
                                  
                                  <p
                                    dir="rtl"
                                    className={`text-xl mb-2 leading-relaxed ${isDark ? 'text-gray-100' : 'text-gray-800'}`}
                                    style={{ fontFamily: "'Arabic Punctuation', 'KFGQPC Uthmanic Script HAFS', 'Amiri Quran', 'Amiri', serif" }}
                                  >
                                    {stripReferenceMarkers(dua.arabic)}
                                  </p>

                                  {dua.transliteration && (
                                    <p className={`text-sm italic mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {stripReferenceMarkers(dua.transliteration)}
                                    </p>
                                  )}

                                  <p className={`text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {stripReferenceMarkers(dua.translation[language as keyof typeof dua.translation] || dua.translation.en)}
                                  </p>

                                  {dua.context && (
                                    <p className={`text-xs mt-2 italic ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                      {stripReferenceMarkers(dua.context)}
                                    </p>
                                  )}

                                  <div className="mt-3">
                                    <AudioPlayer arabicText={dua.arabic} language={language} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

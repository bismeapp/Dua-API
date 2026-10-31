import { useState } from 'react';
import { Search } from 'lucide-react';
import completeListsData from '../data/allData.json';
const { asmaUlHusna } = completeListsData;
import { useTheme } from '../contexts/ThemeContext';
import AudioPlayer from './AudioPlayer';

interface AsmaUlHusnaViewProps {
  language: string;
  onBack: () => void;
}

export default function AsmaUlHusnaView({ language, onBack }: AsmaUlHusnaViewProps) {
  const { isDark } = useTheme();
  const [selectedName, setSelectedName] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNames = asmaUlHusna.filter(name => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      name.tr.toLowerCase().includes(query) ||
      name.en.toLowerCase().includes(query) ||
      name.ar.includes(searchQuery) ||
      name.ta.includes(searchQuery) ||
      name.ml.includes(searchQuery)
    );
  });

  const labels: Record<string, Record<string, string>> = {
    en: { title: "99 Names of Allah", subtitle: "Asma ul Husna - The Most Beautiful Names", search: "Search names...", back: "Back to Categories" },
    ar: { title: "أسماء الله الحسنى", subtitle: "99 اسماً - الأسماء الحسنى", search: "ابحث عن الأسماء...", back: "العودة للفئات" },
    ur: { title: "اسماء اللہ الحسنی", subtitle: "99 نام - خوبصورت نام", search: "نام تلاش کریں...", back: "زمرہ جات پر واپس" },
    fr: { title: "99 Noms d'Allah", subtitle: "Asma ul Husna - Les Plus Beaux Noms", search: "Rechercher...", back: "Retour" },
    tr: { title: "99 İsim", subtitle: "Esmaü'l-Hüsna - En Güzel İsimler", search: "İsim ara...", back: "Geri" },
    id: { title: "99 Nama Allah", subtitle: "Asmaul Husna - Nama-Nama Terbaik", search: "Cari nama...", back: "Kembali" },
    bn: { title: "আল্লাহর ৯৯টি নাম", subtitle: "আসমাউল হুসনা - সর্বোত্তম নাম", search: "নাম খুঁজুন...", back: "পিছনে" },
    ms: { title: "99 Nama Allah", subtitle: "Asmaul Husna - Nama-Nama Terbaik", search: "Cari nama...", back: "Kembali" },
    ta: { title: "அல்லாஹ்வின் 99 பெயர்கள்", subtitle: "அஸ்மாவுல் ஹுஸ்னா - மிக அழகான பெயர்கள்", search: "பெயர் தேடு...", back: "பின்" },
    ml: { title: "അല്ലാഹുവിന്റെ 99 നാമങ്ങൾ", subtitle: "അൽ-അസ്മാഉൽ ഹുസ്നാ - ഏറ്റവും മനോഹരമായ നാമങ്ങൾ", search: "നാമം തിരയുക...", back: "തിരികെ" }
  };

  const label = labels[language] || labels.en;

  return (
    <div className="max-w-6xl mx-auto">
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

      {/* Search */}
      <div className="mb-6">
        <div className="glass-search flex min-h-[50px] items-center gap-3 rounded-full px-4">
          <Search className="glass-search-icon h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={label.search}
            className="glass-search-input box-border min-h-[48px] min-w-0 flex-1 font-sans text-sm"
          />
        </div>
      </div>

      {/* Grid of Names */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {filteredNames.map((name) => (
          <div
            key={name.n}
            onClick={() => setSelectedName(selectedName === name.n ? null : name.n)}
            className={`themed-card cursor-pointer rounded-xl border p-4 transition-all ${
              isDark 
                ? 'bg-[#063b2b] border-[var(--bisme-gold-border)] hover:border-[var(--bisme-jade)]' 
                : 'bg-white border-gray-200 hover:border-yellow-400 hover:shadow-md'
            } ${selectedName === name.n ? (isDark ? 'border-[var(--bisme-gold)]' : 'border-yellow-500 shadow-lg') : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                isDark ? 'bg-[var(--bisme-jade)] text-[var(--bisme-on-gold)]' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {name.n}
              </div>
              <div className="min-w-0 flex-1">
                <p dir="rtl" className="mb-1 max-w-full break-words text-2xl font-arabic" style={{ fontFamily: "'Arabic Punctuation', 'KFGQPC Uthmanic Script HAFS', 'Amiri Quran', 'Amiri', serif" }}>
                  {name.ar}
                </p>
                <p className={`text-sm font-semibold ${isDark ? 'text-[var(--bisme-gold)]' : 'text-yellow-700'}`}>
                  {name.tr}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'ta' ? name.ta : language === 'ml' ? name.ml : name.en}
                </p>
              </div>
            </div>

            {/* Expanded view with audio */}
            {selectedName === name.n && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
                <AudioPlayer arabicText={name.ar} language={language} />
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredNames.length === 0 && (
        <div className="text-center py-12">
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {language === 'en' ? 'No names found' : 'لا توجد أسماء'}
          </p>
        </div>
      )}
    </div>
  );
}

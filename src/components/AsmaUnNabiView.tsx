import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { stripReferenceMarkers } from '../utils/text';

interface AsmaEntry {
  id: string;
  order?: number;
  arabic: string;
  transliteration?: string;
  translation: Record<string, string>;
}

interface AsmaUnNabiViewProps {
  entries: AsmaEntry[];
  language: string;
  onBack: () => void;
}

const labels: Record<string, { title: string; subtitle: string; sourceNote: string; search: string; back: string; empty: string }> = {
  en: { title: 'Asma un Nabi', subtitle: 'Names and descriptions in the supplied compilation', sourceNote: 'User-provided compilation; translations are machine-generated and require review. Sources have not been independently verified.', search: 'Search names or meanings...', back: 'Back to Categories', empty: 'No names found' },
  ta: { title: 'நபி முஹம்மது (ஸல்) அவர்களின் பெயர்கள்', subtitle: 'வழங்கப்பட்ட தொகுப்பிலுள்ள பெயர்கள் மற்றும் விளக்கங்கள்', sourceNote: 'பயனர் வழங்கிய தொகுப்பு; மொழிபெயர்ப்புகள் இயந்திரத்தால் உருவாக்கப்பட்டவை, சரிபார்க்கப்பட வேண்டும். ஆதாரங்கள் தனியாக உறுதிப்படுத்தப்படவில்லை.', search: 'பெயர்கள் அல்லது பொருள்களைத் தேடுங்கள்...', back: 'வகைகளுக்குத் திரும்பு', empty: 'பெயர்கள் எதுவும் கிடைக்கவில்லை' },
  ml: { title: 'പ്രവാചകൻ മുഹമ്മദ് നബി ﷺയുടെ പേരുകൾ', subtitle: 'നൽകിയ സമാഹാരത്തിലെ പേരുകളും വിവരണങ്ങളും', sourceNote: 'ഉപയോക്താവ് നൽകിയ സമാഹാരം; യന്ത്രവിവർത്തനങ്ങൾ പരിശോധിക്കണം. ഉറവിടങ്ങൾ സ്വതന്ത്രമായി സ്ഥിരീകരിച്ചിട്ടില്ല.', search: 'പേരുകളോ അർത്ഥങ്ങളോ തിരയുക...', back: 'വിഭാഗങ്ങളിലേക്ക് മടങ്ങുക', empty: 'പേരുകളൊന്നും കണ്ടെത്തിയില്ല' },
  ar: { title: 'أسماء النبي محمد ﷺ', subtitle: 'الأسماء والأوصاف الواردة في المجموعة المقدمة', sourceNote: 'مجموعة قدمها المستخدم؛ الترجمات آلية وتحتاج إلى مراجعة. لم يتم التحقق من المصادر بصورة مستقلة.', search: 'ابحث عن الأسماء أو المعاني...', back: 'العودة إلى الفئات', empty: 'لم يتم العثور على أسماء' },
  ur: { title: 'نبی محمد ﷺ کے نام', subtitle: 'فراہم کردہ مجموعے میں شامل نام اور اوصاف', sourceNote: 'صارف کی فراہم کردہ فہرست؛ مشینی تراجم کا جائزہ ضروری ہے۔ ماخذ کی آزادانہ تصدیق نہیں کی گئی۔', search: 'نام یا معانی تلاش کریں...', back: 'اقسام پر واپس جائیں', empty: 'کوئی نام نہیں ملا' },
  fr: { title: 'Asma un Nabi', subtitle: 'Noms et descriptions de la compilation fournie', sourceNote: 'Compilation fournie par l’utilisateur ; les traductions automatiques doivent être révisées. Les sources n’ont pas été vérifiées indépendamment.', search: 'Rechercher des noms ou des sens...', back: 'Retour aux catégories', empty: 'Aucun nom trouvé' },
  tr: { title: 'Asma un Nabi', subtitle: 'Sağlanan derlemedeki isimler ve açıklamalar', sourceNote: 'Kullanıcı tarafından sağlanan derleme; makine çevirileri gözden geçirilmelidir. Kaynaklar bağımsız olarak doğrulanmamıştır.', search: 'İsim veya anlam ara...', back: 'Kategorilere dön', empty: 'İsim bulunamadı' },
  id: { title: 'Asma un Nabi', subtitle: 'Nama dan keterangan dalam kompilasi yang diberikan', sourceNote: 'Kompilasi dari pengguna; terjemahan mesin perlu ditinjau. Sumber belum diverifikasi secara independen.', search: 'Cari nama atau makna...', back: 'Kembali ke kategori', empty: 'Nama tidak ditemukan' },
  bn: { title: 'আসমা উন নবী', subtitle: 'প্রদত্ত সংকলনের নাম ও বিবরণ', sourceNote: 'ব্যবহারকারীর দেওয়া সংকলন; যন্ত্র-অনূদিত অর্থ পর্যালোচনা করা প্রয়োজন। সূত্র স্বাধীনভাবে যাচাই করা হয়নি।', search: 'নাম বা অর্থ খুঁজুন...', back: 'বিভাগে ফিরে যান', empty: 'কোনো নাম পাওয়া যায়নি' },
  ms: { title: 'Asma un Nabi', subtitle: 'Nama dan keterangan dalam himpunan yang diberikan', sourceNote: 'Himpunan yang diberikan pengguna; terjemahan mesin perlu disemak. Sumber belum disahkan secara bebas.', search: 'Cari nama atau makna...', back: 'Kembali ke kategori', empty: 'Tiada nama ditemukan' },
};

const normalize = (value: string) =>
  value.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
    .replace(/['’‘ʿʻ`]/g, '')
    .trim();

export default function AsmaUnNabiView({ entries, language, onBack }: AsmaUnNabiViewProps) {
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');
  const label = labels[language] || labels.en;
  const filteredEntries = useMemo(() => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return entries;
    return entries.filter(entry => normalize([
      entry.translation[language],
      entry.arabic,
      entry.transliteration,
    ].join(' ')).includes(normalizedQuery));
  }, [entries, language, query]);

  return (
    <div className="mx-auto max-w-6xl">
      <button
        onClick={onBack}
        className="category-back-button mb-5 inline-flex min-h-10 items-center gap-2 rounded-[13px] border border-[var(--bisme-gold)] px-3 py-2"
      >
        {label.back}
      </button>

      <div className="category-detail-header mb-6 rounded-2xl p-4 sm:p-6">
        <h2 className="text-xl font-bold sm:text-2xl">{label.title}</h2>
        <p className="mt-1 text-sm">{label.subtitle}</p>
        <p className="mt-2 text-xs opacity-80">{entries.length}</p>
      </div>

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

      {filteredEntries.length ? (
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEntries.map((entry, index) => (
            <article
              key={entry.id}
              className={`themed-card min-w-0 rounded-xl border p-4 ${
                isDark ? 'bg-[#063b2b] border-[var(--bisme-gold-border)]' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  isDark ? 'bg-[var(--bisme-jade)] text-[var(--bisme-on-gold)]' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {entry.order ?? index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    dir="rtl"
                    className="mb-2 break-words text-2xl font-arabic leading-relaxed"
                    style={{ fontFamily: "'Arabic Punctuation', 'KFGQPC Uthmanic Script HAFS', 'Amiri Quran', 'Amiri', serif" }}
                  >
                    {entry.arabic}
                  </p>
                  <p dir="ltr" className={`break-words text-sm font-semibold ${isDark ? 'text-[var(--bisme-gold)]' : 'text-yellow-700'}`}>
                    <bdi dir="ltr">{entry.transliteration}</bdi>
                  </p>
                  <p
                    dir={language === 'ar' || language === 'ur' ? 'rtl' : 'auto'}
                    className={`mt-2 break-words text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    {stripReferenceMarkers(entry.translation[language])}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className={`py-12 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label.empty}</p>
      )}
    </div>
  );
}
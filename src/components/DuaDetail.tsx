import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useBookmarks } from '../contexts/BookmarksContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { ArrowLeft } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import { getDuaHeading, stripReferenceMarkers } from '../utils/text';

export default function DuaDetail({
  dua,
  category,
  language,
  onBack,
}: {
  dua: any;
  category: any;
  language: string;
  onBack: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('lg');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderTimes, setReminderTimes] = useState(['08:00']);
  const [reminderFrequency, setReminderFrequency] = useState<'daily' | 'custom'>('daily');
  const [reminderDays, setReminderDays] = useState<string[]>([]);
  const [reminderSound, setReminderSound] = useState('adhan');
  const { isDark } = useTheme();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { addReminder, sounds } = useNotifications();

  const arabicFontSize = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
  };

  const handleCopy = () => {
    const text = `${stripReferenceMarkers(dua.arabic)}\n\n${stripReferenceMarkers(dua.translation[language] || dua.translation.en)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBookmark = () => {
    toggleBookmark({
      id: dua.id,
      categoryId: category.id,
      title: dua.title,
      heading: dua.heading,
      arabic: dua.arabic,
      translation: dua.translation,
      reference: dua.reference,
      times: dua.times,
      bookmarkedAt: Date.now(),
    });
  };

  const handleSetReminder = () => {
    setShowReminderModal(true);
  };

  const saveReminder = () => {
    const times = [...new Set(reminderTimes.filter(Boolean))];
    if (times.length === 0 || (reminderFrequency === 'custom' && reminderDays.length === 0)) return;

    addReminder({
      duaId: dua.id,
      duaTitle: getDuaHeading(dua, language),
      duaArabic: dua.arabic,
      times,
      frequency: reminderFrequency,
      days: reminderDays,
      sound: reminderSound,
      enabled: true,
    });
    setShowReminderModal(false);
    setReminderTimes(['08:00']);
    setReminderFrequency('daily');
    setReminderDays([]);
  };

  const toggleReminderDay = (day: string) => {
    setReminderDays(current => current.includes(day)
      ? current.filter(value => value !== day)
      : [...current, day]
    );
  };

  const isCurrentlyBookmarked = isBookmarked(dua.id);

  const reciteLabel = language === 'en' ? 'Recite' :
    language === 'ar' ? 'اقرأ' :
    language === 'ur' ? 'پڑھیں' :
    language === 'fr' ? 'Réciter' :
    language === 'tr' ? 'Oku' :
    language === 'id' ? 'Baca' :
    language === 'bn' ? 'পড়ুন' :
    language === 'ms' ? 'Baca' :
    language === 'ta' ? 'படிக்கவும்' :
    'വായിക്കുക';

  const timesLabel = language === 'en' ? 'times' :
    language === 'ar' ? 'مرات' :
    language === 'ur' ? 'بار' :
    language === 'fr' ? 'fois' :
    language === 'tr' ? 'kez' :
    language === 'id' ? 'kali' :
    language === 'bn' ? 'বার' :
    language === 'ms' ? 'kali' :
    language === 'ta' ? 'முறை' :
    'തവണ';

  const translationReviewLabel = language === 'ta'
    ? 'மொழிபெயர்ப்புகள் இயந்திரத்தால் உருவாக்கப்பட்டவை; மனிதர் மதிப்பாய்வு செய்ய வேண்டும்.'
    : language === 'ml'
      ? 'വിവർത്തനങ്ങൾ യന്ത്രം സൃഷ്ടിച്ചതാണ്; മനുഷ്യപരിശോധന ആവശ്യമാണ്.'
      : language === 'ar'
        ? 'الترجمات مولدة آليًا وتتطلب مراجعة بشرية.'
        : language === 'ur'
          ? 'ترجمے مشینی طور پر تیار کیے گئے ہیں اور انسانی نظرثانی درکار ہے۔'
          : language === 'fr'
            ? 'Les traductions sont générées automatiquement et nécessitent une révision humaine.'
            : language === 'tr'
              ? 'Çeviriler makine tarafından oluşturulmuştur ve insan incelemesi gerektirir.'
              : language === 'id'
                ? 'Terjemahan dibuat oleh mesin dan memerlukan peninjauan manusia.'
                : language === 'bn'
                  ? 'অনুবাদগুলো যন্ত্রের মাধ্যমে তৈরি এবং মানুষের পর্যালোচনা প্রয়োজন।'
                  : language === 'ms'
                    ? 'Terjemahan dijana mesin dan memerlukan semakan manusia.'
                    : 'Translations are machine-generated and require human review.';

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="category-back-button mb-5 inline-flex items-center gap-2 rounded-[13px] border border-[var(--bisme-gold)] px-3 py-2 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>{language === 'en' ? 'Back' : language === 'ar' ? 'رجوع' : language === 'ur' ? 'واپس' : language === 'fr' ? 'Retour' : language === 'tr' ? 'Geri' : language === 'id' ? 'Kembali' : language === 'bn' ? 'পিছনে' : language === 'ms' ? 'Kembali' : language === 'ta' ? 'பின்' : 'തിരികെ'}</span>
      </button>

      {/* Dua Card */}
      <div className={`dua-detail-shell rounded-2xl shadow-xl border overflow-hidden ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
      }`}>
        {/* Header */}
        <div className="dua-detail-header border-b p-4 text-white sm:p-6">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <span className="break-words text-sm text-white/80">{category.name[language] || category.name.en}</span>
            </div>
            {/* Bookmark Button */}
            <button
              onClick={handleBookmark}
              className={`rounded-lg border border-[var(--bisme-gold-border)] px-3 py-1 text-sm font-medium transition-all ${
                isCurrentlyBookmarked 
                  ? 'gold-gradient-surface text-[var(--bisme-on-gold)] hover:brightness-105' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title={isCurrentlyBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              {isCurrentlyBookmarked ? 'Saved' : 'Save'}
            </button>
          </div>
          <h2 className="break-words text-xl font-bold text-white">{stripReferenceMarkers(getDuaHeading(dua, language))}</h2>
          {typeof dua.item_number === 'number' && (
            <p className="mt-1 break-words text-sm text-white/80">
              {dua.section_letter}. {stripReferenceMarkers(dua.section_title?.[language] || dua.section_title?.en || '')} · {language === 'en' ? 'Item' : language === 'ta' ? 'உருப்படி' : language === 'ml' ? 'ഇനം' : language === 'ar' ? 'العنصر' : language === 'ur' ? 'آئٹم' : language === 'fr' ? 'Élément' : language === 'tr' ? 'Öğe' : language === 'id' ? 'Item' : language === 'bn' ? 'আইটেম' : 'Item'} {dua.item_number}
            </p>
          )}
          {dua.translation_status && (
            <p className="mt-1 break-words text-xs text-white/75">{translationReviewLabel}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{reciteLabel}: {dua.times} {timesLabel}</span>
            {dua.classification?.[language] && (
              <span className="max-w-full break-words text-xs bg-white/20 px-2 py-1 rounded-full">
                {stripReferenceMarkers(dua.classification[language])}
              </span>
            )}
          </div>
        </div>

        {/* Arabic Text */}
        {(dua.arabic || dua.transliteration) && <div className="border-b border-[rgba(185,154,69,0.32)] p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
              {language === 'en' ? 'Arabic Text' : language === 'ar' ? 'النص العربي' : language === 'ur' ? 'عربی متن' : language === 'fr' ? 'Texte Arabe' : language === 'tr' ? 'Arapça Metin' : language === 'id' ? 'Teks Arab' : language === 'bn' ? 'আরবি টেক্সট' : language === 'ms' ? 'Teks Arab' : language === 'ta' ? 'அரபி உரை' : 'അറബിക് പാഠം'}
            </span>
            {/* Font Size Controls */}
            <div className="flex items-center gap-1">
              {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`w-7 h-7 rounded-md text-xs font-bold transition-colors ${
                    fontSize === size
                      ? isDark ? 'bg-emerald-900 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                      : isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-slate-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  A
                </button>
              ))}
            </div>
          </div>
          <p
            dir="rtl"
            className={`${arabicFontSize[fontSize]} max-w-full break-words whitespace-pre-line py-4 text-center leading-loose font-arabic text-white`}
            style={{ fontFamily: "'Arabic Punctuation', 'KFGQPC Uthmanic Script HAFS', 'Amiri Quran', 'Amiri', serif" }}
          >
            {stripReferenceMarkers(dua.arabic)}
          </p>
          {dua.transliteration && (
            <p dir="ltr" className="whitespace-pre-line break-words text-center text-sm italic leading-relaxed text-[var(--bisme-text-secondary)]">
              {stripReferenceMarkers(dua.transliteration)}
            </p>
          )}
        </div>}

        {/* Audio Player */}
        {dua.arabic && <div className="border-b border-[rgba(185,154,69,0.32)] p-4">
          <AudioPlayer arabicText={dua.arabic} language={language} />
        </div>}

        {/* Translation */}
        <div className="border-b border-[rgba(185,154,69,0.32)] bg-[#00251b] p-4 sm:p-6">
          <span className={`text-xs font-medium uppercase tracking-wider mb-3 block ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
            {language === 'en' ? 'Translation' : language === 'ar' ? 'الترجمة' : language === 'ur' ? 'ترجمہ' : language === 'fr' ? 'Traduction' : language === 'tr' ? 'Çeviri' : language === 'id' ? 'Terjemahan' : language === 'bn' ? 'অনুবাদ' : language === 'ms' ? 'Terjemahan' : language === 'ta' ? 'மொழிபெயர்ப்பு' : 'വിവർത്തനം'}
          </span>
          <p dir={language === 'ar' || language === 'ur' ? 'rtl' : 'auto'} className={`text-lg leading-relaxed text-[var(--bisme-text-secondary)] ${language === 'ar' ? 'font-arabic' : ''}`}>
            {stripReferenceMarkers(dua.translation[language] || dua.translation.en)}
          </p>
        </div>

        {dua.notes?.[language] && (
          <div className="border-b border-[rgba(185,154,69,0.32)] bg-[#063b2b] p-4 sm:p-6">
            <span className="mb-3 block text-xs font-medium uppercase tracking-wider text-gray-300">
              {language === 'ta' ? 'குறிப்பு' : language === 'ml' ? 'കുറിപ്പ്' : language === 'ar' ? 'ملاحظة' : language === 'ur' ? 'نوٹ' : language === 'fr' ? 'Note' : language === 'tr' ? 'Not' : language === 'id' ? 'Catatan' : language === 'bn' ? 'নোট' : language === 'ms' ? 'Nota' : 'Note'}
            </span>
            <p dir={language === 'ar' || language === 'ur' ? 'rtl' : 'auto'} className={`whitespace-pre-line break-words text-sm leading-relaxed text-[var(--bisme-text-secondary)] ${language === 'ar' ? 'font-arabic' : ''}`}>
              {stripReferenceMarkers(dua.notes[language])}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#063b2b] p-4">
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            <button
              onClick={handleSetReminder}
              className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--bisme-gold-border)] bg-[var(--bisme-jade)] px-3 py-2 text-center text-sm font-medium text-[#173b2b] transition-colors hover:brightness-110"
            >
              {language === 'en' ? 'Set Reminder' : language === 'ar' ? 'تعيين تذكير' : language === 'ur' ? 'یاد دہانی سیٹ کریں' : language === 'fr' ? 'Définir un Rappel' : language === 'tr' ? 'Hatırlatıcı Ayarla' : language === 'id' ? 'Atur Pengingat' : language === 'bn' ? 'রিমাইন্ডার সেট করুন' : language === 'ms' ? 'Tetapkan Peringatan' : language === 'ta' ? 'நினைவூட்டல் அமை' : 'ഒരു ഓർമ്മപ്പെടുത്തൽ സജ്ജമാക്കുക'}
            </button>
            <button
              onClick={handleCopy}
              className={`flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                copied
                  ? isDark ? 'bg-emerald-900 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                  : isDark ? 'bg-slate-700 text-gray-200 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {copied
                ? (language === 'en' ? 'Copied!' : language === 'ar' ? 'تم النسخ!' : language === 'ur' ? 'کاپی ہو گیا!' : language === 'fr' ? 'Copié!' : language === 'tr' ? 'Kopyalandı!' : language === 'id' ? 'Disalin!' : language === 'bn' ? 'কপি হয়েছে!' : language === 'ms' ? 'Disalin!' : language === 'ta' ? 'நகலெடுக்கப்பட்டது!' : 'പകർത്തി!')
                : (language === 'en' ? 'Copy' : language === 'ar' ? 'نسخ' : language === 'ur' ? 'کاپی' : language === 'fr' ? 'Copier' : language === 'tr' ? 'Kopyala' : language === 'id' ? 'Salin' : language === 'bn' ? 'কপি' : language === 'ms' ? 'Salin' : language === 'ta' ? 'நகலெடு' : 'പകർത്തുക')}
            </button>
          </div>
        </div>
      </div>

      {/* Counter */}
      <DuaCounter language={language} targetTimes={dua.times} />

      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#001c14]/80 p-4 backdrop-blur-sm" onClick={() => setShowReminderModal(false)}>
          <div 
            className="modal-panel w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-[rgba(185,154,69,0.35)] p-6">
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {language === 'en' ? 'Set Reminder' : language === 'ar' ? 'تعيين تذكير' : language === 'ur' ? 'یاد دہانی سیٹ کریں' : 'Set Reminder'}
              </h3>
              <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {getDuaHeading(dua, language)}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {language === 'en' ? 'Reminder times' : 'Reminder times'}
                </label>
                <div className="space-y-2">
                  {reminderTimes.map((time, index) => (
                    <div className="flex items-center gap-2" key={index}>
                      <input
                        type="time"
                        value={time}
                        onChange={(event) => setReminderTimes(current => current.map((value, timeIndex) =>
                          timeIndex === index ? event.target.value : value
                        ))}
                        className={`themed-input flex-1 rounded-lg border px-3 py-2 ${
                          isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      {reminderTimes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setReminderTimes(current => current.filter((_, timeIndex) => timeIndex !== index))}
                          aria-label="Remove time"
                          className={`rounded-lg px-3 py-2 ${isDark ? 'bg-slate-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setReminderTimes(current => [...current, '09:00'])}
                  className={`mt-2 text-sm font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}
                >
                  + Add another time
                </button>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Repeat</label>
                <select
                  value={reminderFrequency}
                  onChange={(event) => setReminderFrequency(event.target.value as 'daily' | 'custom')}
                  className={`themed-input w-full rounded-lg border px-3 py-2 ${
                    isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="daily">Every day</option>
                  <option value="custom">Selected days</option>
                </select>
              </div>

              {reminderFrequency === 'custom' && (
                <div className="flex flex-wrap gap-2">
                  {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleReminderDay(day)}
                      aria-pressed={reminderDays.includes(day)}
                      className={`rounded-lg px-3 py-1.5 text-sm capitalize ${
                        reminderDays.includes(day)
                          ? 'bg-emerald-600 text-white'
                          : isDark ? 'bg-slate-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {language === 'en' ? 'Sound' : 'Sound'}
                </label>
                <select
                  value={reminderSound}
                  onChange={(event) => setReminderSound(event.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  {sounds.map(sound => <option key={sound.id} value={sound.id}>{sound.name}</option>)}
                </select>
              </div>
            </div>

            <div className={`p-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'} flex gap-2`}>
              <button
                onClick={() => setShowReminderModal(false)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                }`}
              >
                {language === 'en' ? 'Cancel' : 'Cancel'}
              </button>
              <button
                onClick={saveReminder}
                disabled={reminderTimes.every(time => !time) || (reminderFrequency === 'custom' && reminderDays.length === 0)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  isDark ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                {language === 'en' ? 'Set Reminder' : 'Set'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DuaCounter({ language, targetTimes }: { language: string; targetTimes: number }) {
  const [count, setCount] = useState(0);
  const { isDark } = useTheme();

  const label = language === 'en' ? 'Dua Counter' :
    language === 'ar' ? 'عداد الذكر' :
    language === 'ur' ? 'ذکر کاؤنٹر' :
    language === 'fr' ? 'Compteur de Dua' :
    language === 'tr' ? 'Dua Sayacı' :
    language === 'id' ? 'Penghitung Doa' :
    language === 'bn' ? 'দোয়া কাউন্টার' :
    language === 'ms' ? 'Penghitung Doa' :
    language === 'ta' ? 'துஆ எண்ணிக்கை' :
    'ദുആ എണ്ണി';

  return (
    <div className={`mt-6 rounded-2xl shadow-lg border p-6 text-center ${
      isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
    }`}>
      <h3 className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</h3>
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => setCount(Math.max(0, count - 1))}
          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
            isDark ? 'bg-slate-700 hover:bg-slate-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
        >
          Decrease
        </button>
        
        <div className="text-center">
          <div className={`text-4xl font-bold ${count >= targetTimes ? 'text-emerald-500' : isDark ? 'text-white' : 'text-gray-800'}`}>
            {count}
          </div>
          <div className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>/ {targetTimes}</div>
        </div>

        <button
          onClick={() => setCount(count + 1)}
          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
            isDark ? 'bg-emerald-900 hover:bg-emerald-800 text-emerald-300' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-600'
          }`}
        >
          Increase
        </button>
      </div>

      <button
        onClick={() => setCount(0)}
        className={`mt-4 text-xs transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
      >
        {language === 'en' ? 'Reset' : language === 'ar' ? 'إعادة' : language === 'ur' ? 'ری سیٹ' : language === 'fr' ? 'Réinitialiser' : language === 'tr' ? 'Sıfırla' : language === 'id' ? 'Reset' : language === 'bn' ? 'রিসেট' : language === 'ms' ? 'Reset' : language === 'ta' ? 'மீட்டமை' : 'പുനഃക്രമീകരിക്കുക'}
      </button>

      {count >= targetTimes && (
        <div className="mt-3 text-emerald-500 text-sm font-medium animate-pulse">
          {language === 'en' ? 'Completed!' : language === 'ar' ? 'تم!' : language === 'ur' ? 'مکمل!' : language === 'fr' ? 'Terminé!' : language === 'tr' ? 'Tamamlandı!' : language === 'id' ? 'Selesai!' : language === 'bn' ? 'সম্পন্ন!' : language === 'ms' ? 'Selesai!' : language === 'ta' ? 'முடிந்தது!' : 'പൂർത്തിയായി!'}
        </div>
      )}
    </div>
  );
}

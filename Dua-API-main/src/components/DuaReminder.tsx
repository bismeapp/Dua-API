import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationsContext';

interface DuaReminderProps {
  language: string;
  duas: { id: string; title: Record<string, string>; arabic: string }[];
}

export default function DuaReminder({ language, duas }: DuaReminderProps) {
  const { isDark } = useTheme();
  const { customReminders, addReminder, removeReminder, toggleReminder, sounds, playSound } = useNotifications();
  const [showForm, setShowForm] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close the popover when clicking outside it or pressing Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);
  const [newReminder, setNewReminder] = useState({
    duaId: '',
    times: ['08:00'],
    frequency: 'daily' as 'daily' | 'custom',
    days: [] as string[],
    sound: 'adhan',
    enabled: true,
  });

  const dayOptions = [
    { value: 'mon', label: { en: 'Mon', ar: 'اثنين', ur: 'پیر', fr: 'Lun', tr: 'Pzt', id: 'Sen', bn: 'সোম', ms: 'Isn', ta: 'திங்', ml: 'തിങ്ക' } },
    { value: 'tue', label: { en: 'Tue', ar: 'ثلاثاء', ur: 'منگل', fr: 'Mar', tr: 'Sal', id: 'Sel', bn: 'মঙ্গল', ms: 'Sel', ta: 'செவ்', ml: 'ചൊവ്വ' } },
    { value: 'wed', label: { en: 'Wed', ar: 'أربعاء', ur: 'بدھ', fr: 'Mer', tr: 'Çar', id: 'Rab', bn: 'বুধ', ms: 'Rab', ta: 'புத', ml: 'ബുധ' } },
    { value: 'thu', label: { en: 'Thu', ar: 'خميس', ur: 'جمعرات', fr: 'Jeu', tr: 'Per', id: 'Kam', bn: 'বৃহ', ms: 'Kha', ta: 'வியா', ml: 'വ്യാഴ' } },
    { value: 'fri', label: { en: 'Fri', ar: 'جمعة', ur: 'جمعہ', fr: 'Ven', tr: 'Cum', id: 'Jum', bn: 'শুক্র', ms: 'Jum', ta: 'வெள்', ml: 'വെള്ള' } },
    { value: 'sat', label: { en: 'Sat', ar: 'سبت', ur: 'ہفتہ', fr: 'Sam', tr: 'Cmt', id: 'Sab', bn: 'শনি', ms: 'Sab', ta: 'சனி', ml: 'ശനി' } },
    { value: 'sun', label: { en: 'Sun', ar: 'أحد', ur: 'اتوار', fr: 'Dim', tr: 'Paz', id: 'Min', bn: 'রবি', ms: 'Ahd', ta: 'ஞாயி', ml: 'ഞായ' } },
  ];

  const labels = {
    en: { title: 'Custom Reminders', add: 'Add Reminder', noReminders: 'No reminders yet', delete: 'Delete', test: 'Test Sound', title2: 'Title', arabic: 'Arabic Text', time: 'Time', frequency: 'Frequency', daily: 'Daily', weekly: 'Weekly', custom: 'Custom Days', days: 'Select Days', sound: 'Notification Sound', save: 'Save', cancel: 'Cancel' },
    ar: { title: 'تذكيرات مخصصة', add: 'إضافة تذكير', noReminders: 'لا توجد تذكيرات بعد', delete: 'حذف', test: 'اختبار الصوت', title2: 'العنوان', arabic: 'النص العربي', time: 'الوقت', frequency: 'التكرار', daily: 'يومي', weekly: 'أسبوعي', custom: 'أيام مخصصة', days: 'اختر الأيام', sound: 'صوت الإشعار', save: 'حفظ', cancel: 'إلغاء' },
    ur: { title: 'اپنی یاد دہانیاں', add: 'یاد دہانی شامل کریں', noReminders: 'ابھی تک کوئی یاد دہانی نہیں', delete: 'حذف کریں', test: 'آواز آزمائیں', title2: 'عنوان', arabic: 'عربی متن', time: 'وقت', frequency: 'تکرار', daily: 'روزانہ', weekly: 'ہفتہ وار', custom: 'مخصوص دن', days: 'دن منتخب کریں', sound: 'اطلاع کی آواز', save: 'محفوظ کریں', cancel: 'منسوخ کریں' },
    fr: { title: 'Rappels Personnalisés', add: 'Ajouter un Rappel', noReminders: 'Aucun rappel pour le moment', delete: 'Supprimer', test: 'Tester le Son', title2: 'Titre', arabic: 'Texte Arabe', time: 'Heure', frequency: 'Fréquence', daily: 'Quotidien', weekly: 'Hebdomadaire', custom: 'Jours Personnalisés', days: 'Sélectionner les Jours', sound: 'Son de Notification', save: 'Enregistrer', cancel: 'Annuler' },
    tr: { title: 'Özel Hatırlatıcılar', add: 'Hatırlatıcı Ekle', noReminders: 'Henüz hatırlatıcı yok', delete: 'Sil', test: 'Sesi Test Et', title2: 'Başlık', arabic: 'Arapça Metin', time: 'Zaman', frequency: 'Sıklık', daily: 'Günlük', weekly: 'Haftalık', custom: 'Özel Günler', days: 'Günleri Seçin', sound: 'Bildirim Sesi', save: 'Kaydet', cancel: 'İptal' },
    id: { title: 'Pengingat Kustom', add: 'Tambah Pengingat', noReminders: 'Belum ada pengingat', delete: 'Hapus', test: 'Uji Suara', title2: 'Judul', arabic: 'Teks Arab', time: 'Waktu', frequency: 'Frekuensi', daily: 'Harian', weekly: 'Mingguan', custom: 'Hari Kustom', days: 'Pilih Hari', sound: 'Suara Notifikasi', save: 'Simpan', cancel: 'Batal' },
    bn: { title: 'কাস্টম রিমাইন্ডার', add: 'রিমাইন্ডার যোগ করুন', noReminders: 'কোনো রিমাইন্ডার নেই', delete: 'মুছুন', test: 'শব্দ পরীক্ষা', title2: 'শিরোনাম', arabic: 'আরবি টেক্সট', time: 'সময়', frequency: 'ফ্রিকোয়েন্সি', daily: 'দৈনিক', weekly: 'সাপ্তাহিক', custom: 'কাস্টম দিন', days: 'দিন নির্বাচন করুন', sound: 'বিজ্ঞপ্তি শব্দ', save: 'সংরক্ষণ', cancel: 'বাতিল' },
    ms: { title: 'Peringatan Tersuai', add: 'Tambah Peringatan', noReminders: 'Tiada peringatan lagi', delete: 'Padam', test: 'Uji Bunyi', title2: 'Tajuk', arabic: 'Teks Arab', time: 'Masa', frequency: 'Kekerapan', daily: 'Harian', weekly: 'Mingguan', custom: 'Hari Tersuai', days: 'Pilih Hari', sound: 'Bunyi Pemberitahuan', save: 'Simpan', cancel: 'Batal' },
    ta: { title: 'தனிப்பயன் நினைவூட்டல்கள்', add: 'நினைவூட்டலைச் சேர்', noReminders: 'நினைவூட்டல்கள் இல்லை', delete: 'நீக்கு', test: 'ஒலி சோதனை', title2: 'தலைப்பு', arabic: 'அரபி உரை', time: 'நேரம்', frequency: 'அலைவரிசை', daily: 'தினசரி', weekly: 'வாராந்திர', custom: 'தனிப்பயன் நாட்கள்', days: 'நாட்களைத் தேர்ந்தெடு', sound: 'அறிவிப்பு ஒலி', save: 'சேமி', cancel: 'ரத்து' },
    ml: { title: 'ഇഷ്ടാനുസൃത ഓർമ്മപ്പെടുത്തലുകൾ', add: 'ഓർമ്മപ്പെടുത്തൽ ചേർക്കുക', noReminders: 'ഓർമ്മപ്പെടുത്തലുകൾ ഇല്ല', delete: 'ഇല്ലാതാക്കുക', test: 'ശബ്ദം പരീക്ഷിക്കുക', title2: 'തലക്കെട്ട്', arabic: 'അറബിക് പാഠം', time: 'സമയം', frequency: 'ആവൃത്തി', daily: 'ദൈനംദിനം', weekly: 'വാർഷികം', custom: 'ഇഷ്ട ദിവസങ്ങൾ', days: 'ദിവസങ്ങൾ തിരഞ്ഞെടുക്കുക', sound: 'അറിയിപ്പ് ശബ്ദം', save: 'സംരക്ഷിക്കുക', cancel: 'റദ്ദാക്കുക' },
  };

  const label = labels[language as keyof typeof labels] || labels.en;

  const handleSubmit = () => {
    const dua = duas.find(item => item.id === newReminder.duaId);
    const times = [...new Set(newReminder.times.filter(Boolean))];
    if (!dua || times.length === 0 || (newReminder.frequency === 'custom' && newReminder.days.length === 0)) return;
    addReminder({
      ...newReminder,
      times,
      duaTitle: dua.title[language] || dua.title.en,
      duaArabic: dua.arabic,
    });
    setNewReminder({
      duaId: '',
      times: ['08:00'],
      frequency: 'daily',
      days: [],
      sound: 'adhan',
      enabled: true,
    });
    setShowForm(false);
  };

  const toggleDay = (day: string) => {
    setNewReminder(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const canSave = Boolean(
    newReminder.duaId &&
    newReminder.times.some(Boolean) &&
    (newReminder.frequency === 'daily' || newReminder.days.length > 0)
  );

  return (
    <div ref={containerRef} className="relative md:w-72 lg:w-80 shrink-0">
      {/* Compact bar: same height as the search box */}
      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        aria-expanded={open}
        className={`w-full h-[54px] px-4 rounded-xl border shadow-sm flex items-center justify-between gap-3 text-left transition-colors ${
          isDark
            ? 'bg-slate-800 border-slate-700 hover:border-slate-600 text-gray-200'
            : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
        }`}
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="truncate font-medium text-sm">{label.title}</span>
          {customReminders.length > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-emerald-900/60 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
              {customReminders.length}
            </span>
          )}
        </span>
        <svg className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
      <div className={`absolute z-40 left-0 right-0 md:left-auto md:right-0 md:w-[min(92vw,26rem)] top-full mt-2 max-h-[70vh] overflow-y-auto rounded-2xl p-4 border shadow-xl ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {label.title}
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            isDark
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
          }`}
        >
          {showForm ? label.cancel : label.add}
        </button>
      </div>

      {/* Add Reminder Form */}
      {showForm && (
        <div className={`mb-6 p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {label.title2}
              </label>
              <select
                value={newReminder.duaId}
                onChange={(e) => setNewReminder({ ...newReminder, duaId: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">{language === 'en' ? 'Choose a dua' : 'Choose a dua'}</option>
                {duas.map(dua => (
                  <option key={dua.id} value={dua.id}>{dua.title[language] || dua.title.en}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {label.time}
                </label>
                <button
                  type="button"
                  onClick={() => setNewReminder(current => ({ ...current, times: [...current.times, '09:00'] }))}
                  className={`text-xs font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}
                >
                  + {language === 'en' ? 'Add time' : 'Add time'}
                </button>
              </div>
              <div className="space-y-2">
                {newReminder.times.map((time, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setNewReminder(current => ({
                        ...current,
                        times: current.times.map((value, timeIndex) => timeIndex === index ? e.target.value : value),
                      }))}
                      className={`flex-1 px-3 py-2 rounded-lg border ${
                        isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    {newReminder.times.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setNewReminder(current => ({
                          ...current,
                          times: current.times.filter((_, timeIndex) => timeIndex !== index),
                        }))}
                        aria-label={language === 'en' ? 'Remove time' : 'Remove time'}
                        className={`rounded-lg px-3 py-2 text-sm ${isDark ? 'bg-slate-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {label.frequency}
              </label>
              <select
                value={newReminder.frequency}
                onChange={(e) => setNewReminder({ ...newReminder, frequency: e.target.value as 'daily' | 'custom' })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-slate-800 border-slate-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="daily">{label.daily}</option>
                <option value="custom">{label.custom}</option>
              </select>
            </div>

            {newReminder.frequency === 'custom' && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {label.days}
                </label>
                <div className="flex flex-wrap gap-2">
                  {dayOptions.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      aria-pressed={newReminder.days.includes(day.value)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        newReminder.days.includes(day.value)
                          ? isDark
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-500 text-white'
                          : isDark
                          ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {day.label[language as keyof typeof day.label] || day.label.en}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {label.sound}
              </label>
              <div className="flex flex-wrap gap-2">
                {sounds.map((sound) => (
                  <button
                    key={sound.id}
                    onClick={() => setNewReminder({ ...newReminder, sound: sound.id })}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      newReminder.sound === sound.id
                        ? isDark
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-500 text-white'
                        : isDark
                        ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {sound.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!canSave}
              className={`w-full py-2 rounded-lg font-medium transition-colors ${
                !canSave
                  ? isDark
                    ? 'bg-slate-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isDark
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              {label.save}
            </button>
          </div>
        </div>
      )}

      {/* Reminders List */}
      {customReminders.length === 0 ? (
        <p className={`text-center py-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {label.noReminders}
        </p>
      ) : (
        <div className="space-y-3">
          {customReminders.map((reminder) => (
            <div
              key={reminder.id}
              className={`p-4 rounded-xl border transition-all ${
                reminder.enabled
                  ? isDark
                    ? 'bg-slate-900 border-slate-700'
                    : 'bg-gray-50 border-gray-200'
                  : isDark
                  ? 'bg-slate-900/50 border-slate-800 opacity-50'
                  : 'bg-gray-50/50 border-gray-100 opacity-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {reminder.duaTitle}
                    </h4>
                  </div>
                  <p dir="rtl" className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontFamily: "'Arabic Punctuation', 'KFGQPC Uthmanic Script HAFS', 'Amiri Quran', 'Amiri', serif" }}>
                    {reminder.duaArabic.substring(0, 60)}...
                  </p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                      {label.time}: {reminder.times.join(', ')}
                    </span>
                    <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                      {reminder.frequency === 'daily' ? label.daily : `${label.custom}: ${reminder.days.join(', ')}`}
                    </span>
                    <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>
                      {sounds.find(s => s.id === reminder.sound)?.name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => playSound(reminder.sound)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      isDark
                        ? 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                    title={label.test}
                  >
                    {label.test}
                  </button>
                  <button
                    onClick={() => toggleReminder(reminder.id)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      reminder.enabled
                        ? isDark
                          ? 'bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900'
                          : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                        : isDark
                        ? 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                        : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                    }`}
                  >
                    {reminder.enabled ? 'Enabled' : 'Paused'}
                  </button>
                  <button
                    onClick={() => removeReminder(reminder.id)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      isDark
                        ? 'bg-red-900/50 text-red-400 hover:bg-red-900'
                        : 'bg-red-100 text-red-600 hover:bg-red-200'
                    }`}
                    title={label.delete}
                  >
                    {label.delete}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
      )}
    </div>
  );
}

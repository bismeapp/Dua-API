import { useState } from 'react';
import { useTheme, MIN_FONT_SCALE, MAX_FONT_SCALE, DEFAULT_FONT_SCALE } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationsContext';

interface SettingsProps {
  language: string;
}

export default function Settings({ language }: SettingsProps) {
  const { isDark, fontScale, setFontScale } = useTheme();
  const { 
    notificationsEnabled, 
    toggleNotifications, 
    notificationTime, 
    setNotificationTime,
    notificationSound,
    setNotificationSound,
    sounds,
    playSound
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);

  const labels = {
    en: { title: 'Settings', notifications: 'Notifications', enableNotifications: 'Enable Notifications', notificationTime: 'Notification Time', sound: 'Notification Sound', testSound: 'Test Sound', close: 'Close' },
    ar: { title: 'الإعدادات', notifications: 'الإشعارات', enableNotifications: 'تفعيل الإشعارات', notificationTime: 'وقت الإشعار', sound: 'صوت الإشعار', testSound: 'اختبار الصوت', close: 'إغلاق' },
    ur: { title: 'ترتیبات', notifications: 'اطلاعات', enableNotifications: 'اطلاعات فعال کریں', notificationTime: 'اطلاع کا وقت', sound: 'اطلاع کی آواز', testSound: 'آواز آزمائیں', close: 'بند کریں' },
    fr: { title: 'Paramètres', notifications: 'Notifications', enableNotifications: 'Activer les Notifications', notificationTime: 'Heure de Notification', sound: 'Son de Notification', testSound: 'Tester le Son', close: 'Fermer' },
    tr: { title: 'Ayarlar', notifications: 'Bildirimler', enableNotifications: 'Bildirimleri Etkinleştir', notificationTime: 'Bildirim Zamanı', sound: 'Bildirim Sesi', testSound: 'Sesi Test Et', close: 'Kapat' },
    id: { title: 'Pengaturan', notifications: 'Notifikasi', enableNotifications: 'Aktifkan Notifikasi', notificationTime: 'Waktu Notifikasi', sound: 'Suara Notifikasi', testSound: 'Uji Suara', close: 'Tutup' },
    bn: { title: 'সেটিংস', notifications: 'বিজ্ঞপ্তি', enableNotifications: 'বিজ্ঞপ্তি সক্রিয় করুন', notificationTime: 'বিজ্ঞপ্তির সময়', sound: 'বিজ্ঞপ্তি শব্দ', testSound: 'শব্দ পরীক্ষা', close: 'বন্ধ' },
    ms: { title: 'Tetapan', notifications: 'Pemberitahuan', enableNotifications: 'Aktifkan Pemberitahuan', notificationTime: 'Masa Pemberitahuan', sound: 'Bunyi Pemberitahuan', testSound: 'Uji Bunyi', close: 'Tutup' },
    ta: { title: 'அமைப்புகள்', notifications: 'அறிவிப்புகள்', enableNotifications: 'அறிவிப்புகளை இயக்கு', notificationTime: 'அறிவிப்பு நேரம்', sound: 'அறிவிப்பு ஒலி', testSound: 'ஒலி சோதனை', close: 'மூடு' },
    ml: { title: 'ക്രമീകരണങ്ങൾ', notifications: 'അറിയിപ്പുകൾ', enableNotifications: 'അറിയിപ്പുകൾ പ്രവർത്തനക്ഷമമാക്കുക', notificationTime: 'അറിയിപ്പ് സമയം', sound: 'അറിയിപ്പ് ശബ്ദം', testSound: 'ശബ്ദം പരീക്ഷിക്കുക', close: 'അടയ്ക്കുക' },
  };

  const label = labels[language as keyof typeof labels] || labels.en;

  const extraLabels = {
    en: { fontSize: 'Font Size', reset: 'Reset to default' },
    ar: { fontSize: 'حجم الخط', reset: 'إعادة الضبط' },
    ur: { fontSize: 'فونٹ سائز', reset: 'ڈیفالٹ پر واپس' },
    fr: { fontSize: 'Taille de police', reset: 'Réinitialiser' },
    tr: { fontSize: 'Yazı Boyutu', reset: 'Varsayılana dön' },
    id: { fontSize: 'Ukuran Font', reset: 'Atur ulang' },
    bn: { fontSize: 'ফন্টের আকার', reset: 'ডিফল্টে ফিরুন' },
    ms: { fontSize: 'Saiz Fon', reset: 'Set semula' },
    ta: { fontSize: 'எழுத்துரு அளவு', reset: 'இயல்புநிலைக்கு மீட்டமை' },
    ml: { fontSize: 'ഫോണ്ട് വലുപ്പം', reset: 'ഡിഫോൾട്ടിലേക്ക് മടങ്ങുക' },
  };
  const extra = extraLabels[language as keyof typeof extraLabels] || extraLabels.en;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label={label.title}
        className="fixed bottom-4 right-4 z-40 h-12 w-12 rounded-full border border-[var(--bisme-gold)] bg-[var(--bisme-jade)] text-white shadow-lg transition-colors hover:bg-[var(--bisme-emerald)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--bisme-gold)] sm:bottom-6 sm:right-6 sm:h-14 sm:w-14"
      >
        <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#001c14]/80 p-4 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div
            className="modal-panel max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`border-b p-4 sm:p-6 ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  ⚙️ {label.title}
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className={`px-2 py-1 rounded-lg text-xs whitespace-nowrap transition-colors ${
                    isDark ? 'hover:bg-slate-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  {label.close}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6 p-4 sm:p-6">
              {/* Font size */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {extra.fontSize}
                  </h3>
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{fontScale}%</span>
                </div>
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setFontScale(fontScale - 5)}
                      disabled={fontScale <= MIN_FONT_SCALE}
                      aria-label="Decrease font size"
                      className={`w-9 h-9 rounded-lg text-sm font-bold disabled:opacity-40 ${isDark ? 'bg-slate-700 text-gray-200' : 'bg-gray-200 text-gray-700'}`}
                    >
                      A−
                    </button>
                    <input
                      type="range"
                      min={MIN_FONT_SCALE}
                      max={MAX_FONT_SCALE}
                      step={5}
                      value={fontScale}
                      onChange={(e) => setFontScale(Number(e.target.value))}
                      aria-label={extra.fontSize}
                      className="flex-1 accent-emerald-600"
                    />
                    <button
                      onClick={() => setFontScale(fontScale + 5)}
                      disabled={fontScale >= MAX_FONT_SCALE}
                      aria-label="Increase font size"
                      className={`w-9 h-9 rounded-lg text-base font-bold disabled:opacity-40 ${isDark ? 'bg-slate-700 text-gray-200' : 'bg-gray-200 text-gray-700'}`}
                    >
                      A+
                    </button>
                  </div>
                  <button
                    onClick={() => setFontScale(DEFAULT_FONT_SCALE)}
                    className={`mt-3 text-xs font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}
                  >
                    {extra.reset}
                  </button>
                </div>
              </div>

              {/* Notifications */}
              <div>
                <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {label.notifications}
                </h3>
                <div className={`p-4 rounded-xl border space-y-4 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                  {/* Enable Notifications */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {label.enableNotifications}
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {language === 'en' ? 'Receive daily duas at scheduled time' :
                         language === 'ar' ? 'تلقي الأدعية اليومية في الوقت المحدد' :
                         language === 'ur' ? 'مقررہ وقت پر روزانہ دعائیں وصول کریں' :
                         language === 'fr' ? 'Recevez des duas quotidiennes à l\'heure prévue' :
                         language === 'tr' ? 'Belirlenen zamanda günlük dualar alın' :
                         language === 'id' ? 'Terima doa harian pada waktu yang dijadwalkan' :
                         language === 'bn' ? 'নির্ধারিত সময়ে দৈনিক দোয়া পান' :
                         language === 'ms' ? 'Terima doa harian pada masa yang dijadualkan' :
                         language === 'ta' ? 'திட்டமிடப்பட்ட நேரத்தில் தினசரி துஆக்களைப் பெறுங்கள்' :
                         'നിശ്ചിത സമയത്ത് ദൈനംദിന ദുആകൾ സ്വീകരിക്കുക'}
                      </p>
                    </div>
                    <button
                      onClick={toggleNotifications}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        notificationsEnabled ? 'bg-emerald-600' : isDark ? 'bg-slate-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                          notificationsEnabled ? 'translate-x-7' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {notificationsEnabled && (
                    <>
                      {/* Notification Time */}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {label.notificationTime}
                        </label>
                        <input
                          type="time"
                          value={notificationTime}
                          onChange={(e) => setNotificationTime(e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            isDark
                              ? 'bg-slate-800 border-slate-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>

                      {/* Sound Selection */}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {label.sound}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {sounds.map((sound) => (
                            <button
                              key={sound.id}
                              onClick={() => setNotificationSound(sound.id)}
                              className={`p-3 rounded-lg text-sm font-medium transition-all ${
                                notificationSound === sound.id
                                  ? isDark
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-emerald-500 text-white'
                                  : isDark
                                  ? 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                              }`}
                            >
                              {sound.name}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => playSound()}
                          className={`mt-2 w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                            isDark
                              ? 'bg-slate-800 hover:bg-slate-700 text-gray-300'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          {label.testSound}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`p-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setIsOpen(false)}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  isDark
                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                }`}
              >
                {label.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

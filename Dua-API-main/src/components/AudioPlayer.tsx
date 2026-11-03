import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface AudioPlayerProps {
  arabicText: string;
  language: string;
}

export default function AudioPlayer({ arabicText, language }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [speed, setSpeed] = useState(0.7);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState<number>(-1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { isDark } = useTheme();

  // Load voices
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Find best Arabic voice
      const arabicVoiceIndex = availableVoices.findIndex(v => 
        v.lang === 'ar-SA' || v.lang === 'ar' || v.lang.startsWith('ar-')
      );
      
      if (arabicVoiceIndex !== -1) {
        setSelectedVoiceIndex(arabicVoiceIndex);
      }
    };

    loadVoices();
    
    // Voices may load asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const playAudio = useCallback(() => {
    if (!isSupported) return;

    // Cancel any ongoing speech first
    window.speechSynthesis.cancel();

    // Small delay to ensure cancellation is complete (fixes iOS bug)
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(arabicText);
      utterance.lang = 'ar-SA';
      utterance.rate = speed;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      if (selectedVoiceIndex >= 0 && voices[selectedVoiceIndex]) {
        utterance.voice = voices[selectedVoiceIndex];
      }

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = (e) => {
        /* unsupported or blocked: ignore */
        setIsPlaying(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }, 100);
  }, [arabicText, speed, selectedVoiceIndex, voices, isSupported]);

  const pauseAudio = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  const increaseSpeed = () => {
    const newSpeed = Math.min(speed + 0.1, 1.5);
    setSpeed(newSpeed);
    if (isPlaying) {
      pauseAudio();
      setTimeout(() => playAudio(), 150);
    }
  };

  const decreaseSpeed = () => {
    const newSpeed = Math.max(speed - 0.1, 0.3);
    setSpeed(newSpeed);
    if (isPlaying) {
      pauseAudio();
      setTimeout(() => playAudio(), 150);
    }
  };

  if (!isSupported) {
    return (
      <div className={`mt-4 p-3 rounded-xl text-center text-sm ${isDark ? 'bg-slate-800 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
        {language === 'en' ? 'Audio not supported on this device' :
         language === 'ar' ? 'الصوت غير مدعوم على هذا الجهاز' :
         language === 'ta' ? 'இந்த சாதனத்தில் ஆடியோ ஆதரிக்கப்படவில்லை' :
         language === 'ml' ? 'ഈ ഉപകരണത്തിൽ ഓഡിയോ പിന്തുണയ്ക്കുന്നില്ല' :
         'Audio not supported'}
      </div>
    );
  }

  const labels: Record<string, Record<string, string>> = {
    en: { listen: 'Listen', play: 'Play', pause: 'Pause', speed: 'Speed', note: 'Uses browser speech synthesis', voice: 'Voice' },
    ar: { listen: 'استمع', play: 'تشغيل', pause: 'إيقاف', speed: 'السرعة', note: 'يستخدم تخليق كلام المتصفح', voice: 'الصوت' },
    ur: { listen: 'سنیں', play: 'چلائیں', pause: 'روکیں', speed: 'رفتار', note: 'براؤزر اسپیچ سنتھیسس استعمال کرتا ہے', voice: 'آواز' },
    fr: { listen: 'Écouter', play: 'Lecture', pause: 'Pause', speed: 'Vitesse', note: 'Utilise la synthèse vocale du navigateur', voice: 'Voix' },
    tr: { listen: 'Dinle', play: 'Oynat', pause: 'Duraklat', speed: 'Hız', note: 'Tarayıcı konuşma sentezini kullanır', voice: 'Ses' },
    id: { listen: 'Dengarkan', play: 'Putar', pause: 'Jeda', speed: 'Kecepatan', note: 'Menggunakan sintesis ucapan browser', voice: 'Suara' },
    bn: { listen: 'শুনুন', play: 'চালান', pause: 'বিরতি', speed: 'গতি', note: 'ব্রাউজার স্পিচ সিন্থেসিস ব্যবহার করে', voice: 'কণ্ঠ' },
    ms: { listen: 'Dengar', play: 'Main', pause: 'Jeda', speed: 'Kelajuan', note: 'Menggunakan sintesis ucapan pelayar', voice: 'Suara' },
    ta: { listen: 'கேளுங்கள்', play: 'இயக்கு', pause: 'இடைநிறுத்து', speed: 'வேகம்', note: 'உலாவி பேச்சு தொகுப்பைப் பயன்படுத்துகிறது', voice: 'குரல்' },
    ml: { listen: 'കേൾക്കുക', play: 'പ്ലേ', pause: 'നിർത്തുക', speed: 'വേഗത', note: 'ബ്രൗസർ സ്പീച്ച് സിന്തസിസ് ഉപയോഗിക്കുന്നു', voice: 'ശബ്ദം' },
  };

  const label = labels[language] || labels.en;

  // Filter Arabic voices for the dropdown
  const arabicVoices = voices.filter(v => v.lang.startsWith('ar'));

  return (
    <div className={`mt-4 p-4 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {label.listen}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={decreaseSpeed}
            disabled={speed <= 0.3}
            className={`w-7 h-7 rounded-md text-xs font-bold transition-colors ${
              isDark 
                ? 'bg-slate-700 text-gray-300 hover:bg-slate-600 disabled:opacity-50' 
                : 'bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50'
            }`}
          >
            -
          </button>
          <span className={`text-xs font-medium min-w-[3rem] text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {speed.toFixed(1)}x
          </span>
          <button
            onClick={increaseSpeed}
            disabled={speed >= 1.5}
            className={`w-7 h-7 rounded-md text-xs font-bold transition-colors ${
              isDark 
                ? 'bg-slate-700 text-gray-300 hover:bg-slate-600 disabled:opacity-50' 
                : 'bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50'
            }`}
          >
            +
          </button>
        </div>
      </div>

      {/* Voice Selection */}
      {arabicVoices.length > 1 && (
        <div className="mb-3">
          <label className={`block text-xs sm:inline-block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label.voice}:</label>
          <select
            value={selectedVoiceIndex}
            onChange={(e) => setSelectedVoiceIndex(Number(e.target.value))}
            className={`mt-1 block w-full max-w-full rounded border px-2 py-1 text-xs sm:ml-2 sm:inline-block sm:w-auto ${
              isDark 
                ? 'bg-slate-700 border-slate-600 text-gray-300' 
                : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            {arabicVoices.map((voice, idx) => {
              const originalIndex = voices.indexOf(voice);
              return (
                <option key={idx} value={originalIndex}>
                  {voice.name} ({voice.lang})
                </option>
              );
            })}
          </select>
        </div>
      )}

      <button
        onClick={togglePlay}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-all text-center ${
          isDark
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
            : 'bg-emerald-500 hover:bg-emerald-600 text-white'
        }`}
      >
        {isPlaying ? label.pause : label.play}
      </button>

      <p className={`text-xs mt-2 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        {label.note}
      </p>
    </div>
  );
}

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';

const NOTIFICATION_SOUNDS = [
  { id: 'adhan', name: 'Adhan' },
  { id: 'bell', name: 'Bell' },
  { id: 'chime', name: 'Chime' },
  { id: 'gentle', name: 'Gentle' },
  { id: 'none', name: 'No Sound' },
];

interface CustomReminder {
  id: string;
  duaId: string;
  duaTitle: string;
  duaArabic: string;
  times: string[];
  frequency: 'daily' | 'custom';
  days: string[];
  sound: string;
  enabled: boolean;
  lastTriggered: Record<string, string>;
}

interface NotificationsContextType {
  notificationsEnabled: boolean;
  toggleNotifications: () => void;
  notificationTime: string;
  setNotificationTime: (time: string) => void;
  notificationSound: string;
  setNotificationSound: (sound: string) => void;
  lastNotification: string | null;
  requestPermission: () => Promise<boolean>;
  playSound: (soundId?: string) => void;
  customReminders: CustomReminder[];
  addReminder: (reminder: Omit<CustomReminder, 'id' | 'lastTriggered'>) => void;
  removeReminder: (id: string) => void;
  toggleReminder: (id: string) => void;
  updateReminder: (id: string, updates: Partial<CustomReminder>) => void;
  sounds: typeof NOTIFICATION_SOUNDS;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

type StoredReminder = Omit<CustomReminder, 'times' | 'lastTriggered' | 'frequency'> & {
  times?: unknown;
  time?: unknown;
  frequency: string;
  lastTriggered?: unknown;
};

function readCustomReminders(): CustomReminder[] {
  const saved = localStorage.getItem('customReminders');
  if (!saved) return [];

  const stored = JSON.parse(saved) as StoredReminder[];
  return stored.map(reminder => {
    const time = typeof reminder.time === 'string' ? reminder.time : undefined;
    const times = Array.isArray(reminder.times)
      ? reminder.times.filter((value): value is string => typeof value === 'string')
      : time ? [time] : [];
    const lastTriggered = typeof reminder.lastTriggered === 'string'
      ? time ? { [time]: reminder.lastTriggered } : {}
      : reminder.lastTriggered && typeof reminder.lastTriggered === 'object'
        ? reminder.lastTriggered as Record<string, string>
        : {};

    return {
      ...reminder,
      times,
      frequency: reminder.frequency === 'daily' ? 'daily' : 'custom',
      days: Array.isArray(reminder.days) ? reminder.days : [],
      lastTriggered,
    };
  });
}

// Generate sound using Web Audio API
function generateTone(type: string, duration: number = 1) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    
    if (type === 'adhan') {
      // Adhan-like melody
      const notes = [440, 494, 523, 587, 523, 494, 440];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.3 + 0.28);
        osc.start(ctx.currentTime + i * 0.3);
        osc.stop(ctx.currentTime + i * 0.3 + 0.3);
      });
    } else if (type === 'bell') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } else if (type === 'chime') {
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.2 + 0.4);
        osc.start(ctx.currentTime + i * 0.2);
        osc.stop(ctx.currentTime + i * 0.2 + 0.5);
      });
    } else if (type === 'gentle') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 350;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration * 1.5);
      osc.start();
      osc.stop(ctx.currentTime + duration * 1.5);
    }
  } catch (e) {
    /* unsupported or blocked: ignore */
  }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('notificationsEnabled') === 'true';
    }
    return false;
  });

  const [notificationTime, setNotificationTimeState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('notificationTime') || '08:00';
    }
    return '08:00';
  });

  const [notificationSound, setNotificationSoundState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('notificationSound') || 'adhan';
    }
    return 'adhan';
  });

  const [lastNotification, setLastNotification] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastNotification');
    }
    return null;
  });

  const [customReminders, setCustomReminders] = useState<CustomReminder[]>(() => {
    if (typeof window !== 'undefined') {
      return readCustomReminders();
    }
    return [];
  });
  const firedReminderKeys = useRef(new Set<string>());
  const firedReminderDate = useRef<string | null>(null);

  useEffect(() => { localStorage.setItem('notificationsEnabled', String(notificationsEnabled)); }, [notificationsEnabled]);
  useEffect(() => { localStorage.setItem('notificationTime', notificationTime); }, [notificationTime]);
  useEffect(() => { localStorage.setItem('notificationSound', notificationSound); }, [notificationSound]);
  useEffect(() => { if (lastNotification) localStorage.setItem('lastNotification', lastNotification); }, [lastNotification]);
  useEffect(() => { localStorage.setItem('customReminders', JSON.stringify(customReminders)); }, [customReminders]);

  // Check for daily notification
  useEffect(() => {
    if (!notificationsEnabled) return;
    const checkNotification = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const today = now.toDateString();
      if (currentTime === notificationTime && lastNotification !== today) {
        sendDailyNotification();
        setLastNotification(today);
      }
      checkCustomReminders(currentTime, today);
    };
    checkNotification();
    const interval = setInterval(checkNotification, 30000);
    return () => clearInterval(interval);
  }, [notificationsEnabled, notificationTime, lastNotification, customReminders]);

  const checkCustomReminders = (currentTime: string, today: string) => {
    if (firedReminderDate.current !== today) {
      firedReminderKeys.current.clear();
      firedReminderDate.current = today;
    }
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDay = dayNames[new Date().getDay()];

    customReminders.forEach(reminder => {
      if (!reminder.enabled) return;
      if (reminder.frequency !== 'daily' && !reminder.days.includes(currentDay)) return;

      reminder.times.forEach(time => {
        const key = `${today}|${reminder.id}|${time}`;
        if (time !== currentTime || reminder.lastTriggered[time] === today || firedReminderKeys.current.has(key)) return;

        firedReminderKeys.current.add(key);
        showNotification(
          reminder.duaTitle,
          reminder.duaArabic.length > 100 ? `${reminder.duaArabic.substring(0, 100)}...` : reminder.duaArabic,
          key
        );
        if (reminder.sound !== 'none') playSound(reminder.sound);
        setCustomReminders(prev => prev.map(current => current.id === reminder.id
          ? { ...current, lastTriggered: { ...current.lastTriggered, [time]: today } }
          : current
        ));
      });
    });
  };

  const playSound = (soundId?: string) => {
    const sound = soundId || notificationSound;
    if (sound !== 'none') {
      generateTone(sound);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      const granted = await requestPermission();
      if (granted) {
        setNotificationsEnabled(true);
        showNotification('Notifications Enabled', 'You will receive daily duas at your scheduled time.');
        playSound();
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  const setNotificationTime = (time: string) => {
    setNotificationTimeState(time);
    if (notificationsEnabled) {
      showNotification('Time Updated', `Daily duas will be sent at ${time}`);
    }
  };

  const setNotificationSound = (sound: string) => {
    setNotificationSoundState(sound);
    if (sound !== 'none') {
      generateTone(sound);
    }
  };

  const addReminder = (reminder: Omit<CustomReminder, 'id' | 'lastTriggered'>) => {
    const newReminder: CustomReminder = {
      ...reminder,
      id: `reminder-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      lastTriggered: {},
    };
    setCustomReminders(prev => [...prev, newReminder]);
  };

  const removeReminder = (id: string) => {
    setCustomReminders(prev => prev.filter(r => r.id !== id));
  };

  const toggleReminder = (id: string) => {
    setCustomReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const updateReminder = (id: string, updates: Partial<CustomReminder>) => {
    setCustomReminders(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const sendDailyNotification = () => {
    const duas = [
      { title: 'Morning Remembrance', text: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ' },
      { title: 'Seeking Forgiveness', text: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ كَرِيمٌ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي' },
      { title: 'Protection', text: 'أَعُوذُ بِكَلِمَاتِ اللهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ' },
      { title: 'Guidance', text: 'رَبِّ زِدْنِي عِلْمًا' },
      { title: 'Gratitude', text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ' },
    ];
    const randomDua = duas[Math.floor(Math.random() * duas.length)];
    showNotification(`Daily Dua: ${randomDua.title}`, randomDua.text);
    if (notificationSound !== 'none') playSound();
  };

  const showNotification = (title: string, body: string, tag = 'daily-dua') => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, tag, requireInteraction: false });
    }
  };

  return (
    <NotificationsContext.Provider value={{
      notificationsEnabled, toggleNotifications, notificationTime, setNotificationTime,
      notificationSound, setNotificationSound, lastNotification, requestPermission,
      playSound, customReminders, addReminder, removeReminder, toggleReminder, updateReminder,
      sounds: NOTIFICATION_SOUNDS,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error('useNotifications must be used within NotificationsProvider');
  return context;
}

export { NOTIFICATION_SOUNDS };

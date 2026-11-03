import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface DailyProgressProps {
  language: string;
}

interface DailyTask {
  id: string;
  name: Record<string, string>;
  target: number;
  completed: number;
}

export default function DailyProgress({ language }: DailyProgressProps) {
  const { isDark } = useTheme();
  const [tasks, setTasks] = useState<DailyTask[]>(() => {
    const saved = localStorage.getItem('dailyProgress');
    const today = new Date().toDateString();
    
    if (saved) {
      const data = JSON.parse(saved);
      if (data.date === today) {
        return data.tasks;
      }
    }
    
    // Default daily tasks
    return [
      { id: 'morning-adhkar', name: { en: 'Morning Adhkar', ar: 'أذكار الصباح', ur: 'صبح کے اذکار', fr: 'Adhkar du Matin', tr: 'Sabah Ezkarı', id: 'Dzikir Pagi', bn: 'সকালের আযকার', ms: 'Zikir Pagi', ta: 'காலை அத்கார்', ml: 'രാവിലെ അദ്കാർ' }, target: 1, completed: 0 },
      { id: 'evening-adhkar', name: { en: 'Evening Adhkar', ar: 'أذكار المساء', ur: 'شام کے اذکار', fr: 'Adhkar du Soir', tr: 'Akşam Ezkarı', id: 'Dzikir Petang', bn: 'সন্ধ্যার আযকার', ms: 'Zikir Petang', ta: 'மாலை அத்கார்', ml: 'വൈകുന്നേര അദ്കാർ' }, target: 1, completed: 0 },
      { id: 'salawat', name: { en: 'Salawat (10x)', ar: 'الصلاة على النبي', ur: 'درود شریف', fr: 'Salawat (10x)', tr: 'Salavat (10x)', id: 'Shalawat (10x)', bn: 'সালাওয়াত (১০ বার)', ms: 'Selawat (10x)', ta: 'ஸலவாத் (10 முறை)', ml: 'സ്വലാത്ത് (10 തവണ)' }, target: 10, completed: 0 },
      { id: 'istighfar', name: { en: 'Istighfar (100x)', ar: 'الاستغفار', ur: 'استغفار', fr: 'Istighfar (100x)', tr: 'İstiğfar (100x)', id: 'Istighfar (100x)', bn: 'ইস্তিগফার (১০০ বার)', ms: 'Istighfar (100x)', ta: 'இஸ்திஃபார் (100 முறை)', ml: 'ഇസ്തിഗ്ഫാർ (100 തവണ)' }, target: 100, completed: 0 },
      { id: 'quran', name: { en: 'Quran Reading', ar: 'قراءة القرآن', ur: 'قرآن پڑھنا', fr: 'Lecture du Coran', tr: 'Kur\'an Okuma', id: 'Membaca Al-Quran', bn: 'কুরআন পাঠ', ms: 'Membaca Al-Quran', ta: 'குர்ஆன் படிப்பு', ml: 'ഖുർആൻ വായന' }, target: 1, completed: 0 },
    ];
  });

  useEffect(() => {
    const today = new Date().toDateString();
    localStorage.setItem('dailyProgress', JSON.stringify({ date: today, tasks }));
  }, [tasks]);

  const incrementTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, completed: Math.min(task.completed + 1, task.target) }
        : task
    ));
  };

  const decrementTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, completed: Math.max(task.completed - 1, 0) }
        : task
    ));
  };

  const resetTasks = () => {
    setTasks(prev => prev.map(task => ({ ...task, completed: 0 })));
  };

  const totalCompleted = tasks.reduce((sum, task) => sum + (task.completed >= task.target ? 1 : 0), 0);
  const totalTasks = tasks.length;
  const progressPercentage = (totalCompleted / totalTasks) * 100;

  const labels: Record<string, Record<string, string>> = {
    en: { title: 'Daily Progress', completed: 'Completed', reset: 'Reset', progress: 'Progress' },
    ar: { title: 'التقدم اليومي', completed: 'مكتمل', reset: 'إعادة تعيين', progress: 'التقدم' },
    ur: { title: 'روزانہ پیشرفت', completed: 'مکمل', reset: 'ری سیٹ', progress: 'پیشرفت' },
    fr: { title: 'Progrès Quotidien', completed: 'Terminé', reset: 'Réinitialiser', progress: 'Progrès' },
    tr: { title: 'Günlük İlerleme', completed: 'Tamamlandı', reset: 'Sıfırla', progress: 'İlerleme' },
    id: { title: 'Kemajuan Harian', completed: 'Selesai', reset: 'Reset', progress: 'Kemajuan' },
    bn: { title: 'দৈনিক অগ্রগতি', completed: 'সম্পন্ন', reset: 'রিসেট', progress: 'অগ্রগতি' },
    ms: { title: 'Kemajuan Harian', completed: 'Selesai', reset: 'Reset', progress: 'Kemajuan' },
    ta: { title: 'தினசரி முன்னேற்றம்', completed: 'முடிந்தது', reset: 'மீட்டமை', progress: 'முன்னேற்றம்' },
    ml: { title: 'ദൈനംദിന പുരോഗതി', completed: 'പൂർത്തിയായി', reset: 'പുനഃക്രമീകരിക്കുക', progress: 'പുരോഗതി' },
  };

  const label = labels[language] || labels.en;

  return (
    <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-lg`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {label.title}
        </h3>
        <button
          onClick={resetTasks}
          className={`text-xs px-3 py-1 rounded-lg transition-colors ${
            isDark 
              ? 'bg-slate-700 hover:bg-slate-600 text-gray-300' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
        >
          {label.reset}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {label.progress}
          </span>
          <span className={`text-sm font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            {totalCompleted}/{totalTasks}
          </span>
        </div>
        <div className={`w-full h-3 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
          <div
            className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-3">
        {tasks.map((task) => {
          const isCompleted = task.completed >= task.target;
          return (
            <div
              key={task.id}
              className={`p-3 rounded-xl border transition-all ${
                isCompleted
                  ? isDark
                    ? 'bg-emerald-900/20 border-emerald-700'
                    : 'bg-emerald-50 border-emerald-200'
                  : isDark
                  ? 'bg-slate-900 border-slate-700'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    isCompleted
                      ? isDark ? 'text-emerald-300' : 'text-emerald-700'
                      : isDark ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {task.name[language] || task.name.en}
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {task.completed} / {task.target}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => decrementTask(task.id)}
                    disabled={task.completed === 0}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isDark
                        ? 'bg-slate-700 hover:bg-slate-600 text-gray-300 disabled:opacity-50'
                        : 'bg-white hover:bg-gray-100 text-gray-600 disabled:opacity-50'
                    }`}
                  >
                    -
                  </button>
                  <button
                    onClick={() => incrementTask(task.id)}
                    disabled={isCompleted}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isCompleted
                        ? isDark
                          ? 'bg-emerald-700 text-emerald-300'
                          : 'bg-emerald-500 text-white'
                        : isDark
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    } disabled:opacity-50`}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

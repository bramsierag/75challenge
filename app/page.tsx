"use client";

import { useEffect, useState } from "react";
import { getStartDate, setStartDate } from "@/lib/schedule";
import DatePicker from "@/components/DatePicker";
import { useTaskSync } from "@/hooks/useTaskSync";

interface DaySchedule {
  day: number;
  date: string;
  muscleGroups: string[];
}

const TASK_NAMES = [
  '2× 45 minuten training',
  'Dieet volgen',
  '3.8 liter water',
  '10 paginas lezen',
  'Voortgangsfoto'
];

function getMuscleIcon(muscleName: string): string {
  const icons: { [key: string]: string } = {
    'Chest': '💪',
    'Triceps': '💪',
    'Shoulders': '🏋️',
    'Biceps': '💪',
    'Back': '🏋️',
    'Legs': '🦵'
  };
  return icons[muscleName] || '🏋️';
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [schedule, setSchedule] = useState<DaySchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDateState] = useState<string>("");
  const [tasks, setTasks] = useState<{ [key: string]: boolean }>({});
  
  const { isOnline, saveTask, loadTasks, getPendingTasks } = useTaskSync();

  useEffect(() => {
    setMounted(true);
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    const start = getStartDate();
    setStartDateState(start.toISOString().split('T')[0]);
  }, []);

  const loadSchedule = (date: Date) => {
    setLoading(true);
    const dateString = date.toISOString().split('T')[0];
    const startDateString = startDate || new Date().toISOString().split('T')[0];
    
    Promise.all([
      fetch(`/api/schedule?date=${dateString}&startDate=${startDateString}`).then(res => res.json()),
      loadTasks(dateString)
    ]).then(([scheduleData, tasksData]) => {
      setSchedule(scheduleData);
      setTasks(tasksData);
      setLoading(false);
    }).catch(error => {
      console.error('Error loading data:', error);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (startDate) {
      loadSchedule(currentDate);
    }
  }, [currentDate, startDate]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleTaskToggle = async (taskName: string) => {
    const dateString = currentDate.toISOString().split('T')[0];
    const newCompleted = !tasks[taskName];
    
    // Update UI meteen
    setTasks(prev => ({ ...prev, [taskName]: newCompleted }));
    
    // Sla op (lokaal of server)
    await saveTask({
      date: dateString,
      taskName,
      completed: newCompleted,
    });
  };

  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleSaveStartDate = () => {
    const newStartDate = new Date(startDate);
    setStartDate(newStartDate);
    setShowSettings(false);
    setShowDatePicker(false);
    // Herlaad schedule met nieuwe startdatum
    loadSchedule(currentDate);
  };

  const handleDatePickerChange = (date: string) => {
    setStartDateState(date);
    const newStartDate = new Date(date);
    setStartDate(newStartDate);
    setShowDatePicker(false);
    setShowSettings(false);
    // Herlaad schedule met nieuwe startdatum
    loadSchedule(currentDate);
  };

  const isToday = currentDate.toDateString() === new Date().toDateString();

  if (!mounted || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-stone-900">
        <div className="text-stone-600 dark:text-stone-400">Laden...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 dark:bg-stone-900 py-8 px-4 transition-colors">
      {showSettings ? (
        /* Settings Page */
        <div className="max-w-md mx-auto space-y-6">
          {/* Settings Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowSettings(false)}
              className="p-2 rounded hover:bg-white dark:hover:bg-stone-800 transition-colors"
              aria-label="Terug"
            >
              <svg className="w-6 h-6 text-stone-600 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-light text-stone-800 dark:text-stone-100">
              Instellingen
            </h1>
            <div className="w-10"></div>
          </div>

          {/* Settings Content */}
          <div className="bg-white dark:bg-stone-800 rounded-lg p-6 shadow-sm space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-stone-700 dark:text-stone-300">
                  Dark Mode
                </label>
                <button
                  onClick={toggleDarkMode}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2 dark:focus:ring-offset-stone-800"
                  style={{ backgroundColor: darkMode ? '#57534e' : '#d6d3d1' }}
                >
                  <span
                    className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    style={{ transform: darkMode ? 'translateX(1.5rem)' : 'translateX(0.25rem)' }}
                  />
                </button>
              </div>
              <div className="space-y-2">
                <label className="block text-sm text-stone-700 dark:text-stone-300">
                  Startdatum Challenge
                </label>
                <button
                  onClick={() => setShowDatePicker(true)}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded text-left hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors text-stone-800 dark:text-stone-200"
                  suppressHydrationWarning
                >
                  {startDate ? new Date(startDate).toLocaleDateString('nl-NL', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }) : 'Selecteer datum'}
                </button>
              </div>
            </div>
          </div>

          {/* Date Picker */}
          {showDatePicker && (
            <DatePicker
              value={startDate}
              onChange={handleDatePickerChange}
              onClose={() => setShowDatePicker(false)}
            />
          )}
        </div>
      ) : (
        /* Main Content */
        <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex-1"></div>
          <div className="text-center flex-1">
            <h1 className="text-3xl font-light text-stone-800 dark:text-stone-100">
              75 Challenge
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Dag {schedule?.day || 1}
            </p>
          </div>
          <div className="flex-1 flex justify-end">
            <button
              onClick={() => setShowSidebar(true)}
              className="p-2 rounded hover:bg-white dark:hover:bg-stone-800 transition-colors"
              aria-label="Menu"
            >
              <svg className="w-6 h-6 text-stone-600 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Sidebar Overlay */}
        {showSidebar && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 transition-opacity"
            onClick={() => setShowSidebar(false)}
          >
            {/* Sidebar */}
            <div
              className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-stone-800 shadow-2xl transform transition-transform duration-300 ease-in-out"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-6 border-b border-stone-200 dark:border-stone-700">
                <h2 className="text-xl font-medium text-stone-800 dark:text-stone-200">Menu</h2>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-2 rounded hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                  aria-label="Sluit menu"
                >
                  <svg className="w-6 h-6 text-stone-600 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="p-4 space-y-2">
                <button
                  onClick={() => {
                    setShowSidebar(false);
                    setShowSettings(true);
                  }}
                  className="w-full text-left px-4 py-3 rounded hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-stone-700 dark:text-stone-300 flex items-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Instellingen
                </button>
                <button
                  onClick={() => {
                    setShowSidebar(false);
                    // Voeg hier actie toe
                  }}
                  className="w-full text-left px-4 py-3 rounded hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-stone-700 dark:text-stone-300"
                >
                  Test
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Datum navigatie */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={goToPreviousDay}
            className="p-2 rounded hover:bg-white dark:hover:bg-stone-800 transition-colors"
            aria-label="Vorige dag"
          >
            <svg className="w-6 h-6 text-stone-600 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-center flex-1">
            <p className="text-stone-800 dark:text-stone-200 font-medium" suppressHydrationWarning>
              {new Date(schedule?.date || new Date()).toLocaleDateString('nl-NL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </p>
            {!isToday && (
              <button
                onClick={goToToday}
                className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 underline mt-1"
              >
                Ga naar vandaag
              </button>
            )}
          </div>

          <button
            onClick={goToNextDay}
            className="p-2 rounded hover:bg-white dark:hover:bg-stone-800 transition-colors"
            aria-label="Volgende dag"
          >
            <svg className="w-6 h-6 text-stone-600 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Muscle Groups */}
        <div className="bg-white dark:bg-stone-800 rounded-lg p-6 shadow-sm space-y-3">
          <h2 className="text-sm uppercase tracking-wider text-stone-500 dark:text-stone-400 font-medium">
            Training
          </h2>
          <div className="space-y-2">
            {schedule?.muscleGroups.map((group, index) => {
              const muscleIcon = getMuscleIcon(group);
              return (
                <div
                  key={index}
                  className="py-3 px-4 bg-stone-50 dark:bg-stone-700 rounded text-stone-700 dark:text-stone-300 flex items-center gap-3"
                >
                  <span className="text-stone-500 dark:text-stone-400">{muscleIcon}</span>
                  <span>{group}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dagelijkse Taken */}
        <div className="bg-white dark:bg-stone-800 rounded-lg p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-wider text-stone-500 dark:text-stone-400 font-medium">
              Taken
            </h2>
            {!isOnline && (
              <span className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                </svg>
                Offline
              </span>
            )}
          </div>
          <div className="space-y-3">
            {TASK_NAMES.map((task, index) => (
              <label key={index} className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={tasks[task] || false}
                  onChange={() => handleTaskToggle(task)}
                  className="w-5 h-5 rounded border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 focus:ring-stone-400 dark:focus:ring-stone-500 focus:ring-offset-0 dark:bg-stone-700"
                />
                <span className="text-stone-700 dark:text-stone-300 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors">
                  {task}
                </span>
              </label>
            ))}
          </div>
        </div>
        </div>
      )}
    </main>
  );
}

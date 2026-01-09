"use client";

import { useEffect, useState } from "react";
import { getStartDate, setStartDate } from "@/lib/schedule";
import DatePicker from "@/components/DatePicker";
import ProgressPhoto from "@/components/ProgressPhoto";
import GalleryView from "@/components/GalleryView";
import { useTaskSync } from "@/hooks/useTaskSync";
import trainingCyclus from "./trainingcyclus.json";

interface DaySchedule {
  day: number;
  date: string;
  muscleGroups: string[];
  hasCardio?: boolean;
  cardioType?: 'bike' | 'run';
}

interface MuscleGroupData {
  musslegroup: string;
  icon: string;
  workout?: string[];
}

const TASK_NAMES = [
  '2× 45 minuten training',
  'Dieet volgen',
  '3.8 liter water',
  '10 paginas lezen'
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
  const [showGallery, setShowGallery] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDateState] = useState<string>("");
  const [tasks, setTasks] = useState<{ [key: string]: boolean }>({});
  const [expandedMuscleGroups, setExpandedMuscleGroups] = useState<{ [key: string]: boolean }>({});
  const [workoutTasks, setWorkoutTasks] = useState<{ [key: string]: boolean }>({});
  const [selectedWorkouts, setSelectedWorkouts] = useState<{ [key: string]: string[] }>({});
  const [cardioSchedule, setCardioSchedule] = useState<{ [key: string]: 'bike' | 'run' | 'none' }>({
    monday: 'none',
    tuesday: 'none',
    wednesday: 'none',
    thursday: 'none',
    friday: 'none',
    saturday: 'none',
    sunday: 'none'
  });
  const [showProgressPhoto, setShowProgressPhoto] = useState(false);
  const [progressPhotos, setProgressPhotos] = useState<{ [key: string]: string }>({});
  const [language, setLanguage] = useState<'nl' | 'en'>('nl');
  
  const { isOnline, saveTask, loadTasks, getPendingTasks } = useTaskSync();

  useEffect(() => {
    setMounted(true);
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
    
    // Laad cardio schema
    const savedCardio = localStorage.getItem('cardioSchedule');
    if (savedCardio) {
      setCardioSchedule(JSON.parse(savedCardio));
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
    const cardioScheduleString = encodeURIComponent(JSON.stringify(cardioSchedule));
    
    Promise.all([
      fetch(`/api/schedule?date=${dateString}&startDate=${startDateString}&cardioSchedule=${cardioScheduleString}`).then(res => res.json()),
      loadTasks(dateString)
    ]).then(([scheduleData, tasksData]) => {
      setSchedule(scheduleData);
      setTasks(tasksData);
      
      // Filter workout tasks from regular tasks
      const workoutTasksData: { [key: string]: boolean } = {};
      const regularTasksData: { [key: string]: boolean } = {};
      
      Object.keys(tasksData).forEach(key => {
        if (key.startsWith('workout:')) {
          workoutTasksData[key] = tasksData[key];
        } else {
          regularTasksData[key] = tasksData[key];
        }
      });
      
      setWorkoutTasks(workoutTasksData);
      setTasks(regularTasksData);
      
      // Selecteer willekeurige workouts voor elke musclegroup
      if (scheduleData?.muscleGroups) {
        const selected: { [key: string]: string[] } = {};
        scheduleData.muscleGroups.forEach((group: string) => {
          const workouts = getWorkoutsForMuscleGroup(group);
          if (workouts.length > 0) {
            // Shuffle en pak eerste 3
            const shuffled = [...workouts].sort(() => Math.random() - 0.5);
            selected[group] = shuffled.slice(0, 3);
          }
        });
        setSelectedWorkouts(selected);
      }
      
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

  const handleCardioToggle = (day: string) => {
    setCardioSchedule(prev => {
      const current = prev[day];
      const next: 'bike' | 'run' | 'none' = current === 'none' ? 'bike' : current === 'bike' ? 'run' : 'none';
      const updated = { ...prev, [day]: next };
      localStorage.setItem('cardioSchedule', JSON.stringify(updated));
      return updated;
    });
  };

  const handleProgressPhotoSave = async (photoPath: string) => {
    const dateString = currentDate.toISOString().split('T')[0];
    
    if (photoPath) {
      setProgressPhotos(prev => ({ ...prev, [dateString]: photoPath }));
      // Mark task as completed
      handleTaskToggle('Voortgangsfoto');
    } else {
      setProgressPhotos(prev => {
        const updated = { ...prev };
        delete updated[dateString];
        return updated;
      });
    }
  };

  const loadProgressPhoto = async (date: string) => {
    try {
      const response = await fetch(`/api/photos?date=${date}`);
      if (response.ok) {
        const photoData = await response.json();
        setProgressPhotos(prev => ({ ...prev, [date]: photoData.path }));
        return photoData.path;
      }
    } catch (error) {
      // Silently handle - no photo exists
    }
    return null;
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

  const handleWorkoutToggle = async (muscleGroup: string, workout: string) => {
    const dateString = currentDate.toISOString().split('T')[0];
    const taskKey = `workout:${muscleGroup}:${workout}`;
    const newCompleted = !workoutTasks[taskKey];
    
    // Update UI meteen
    setWorkoutTasks(prev => ({ ...prev, [taskKey]: newCompleted }));
    
    // Sla op (lokaal of server)
    await saveTask({
      date: dateString,
      taskName: taskKey,
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

  const toggleMuscleGroup = (groupName: string) => {
    setExpandedMuscleGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const getWorkoutsForMuscleGroup = (groupName: string): string[] => {
    const muscleGroup = (trainingCyclus as MuscleGroupData[]).find(
      mg => mg.musslegroup === groupName
    );
    return muscleGroup?.workout || [];
  };

  const isMuscleGroupComplete = (groupName: string): boolean => {
    const workouts = selectedWorkouts[groupName] || [];
    if (workouts.length === 0) return false;
    
    return workouts.every(workout => {
      const taskKey = `workout:${groupName}:${workout}`;
      return workoutTasks[taskKey] === true;
    });
  };

  if (!mounted || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-stone-900">
        <div className="text-stone-600 dark:text-stone-400">Laden...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 dark:bg-stone-900 py-8 px-4 transition-colors relative">
      {/* Background Image with Opacity */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-15 dark:opacity-5 pointer-events-none"
        style={{ backgroundImage: 'url(/background.png)' }}
      />
      
      {/* Content */}
      <div className="relative z-10">
      {showGallery ? (
        /* Gallery Page */
        <GalleryView onClose={() => setShowGallery(false)} />
      ) : showSettings ? (
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

          {/* Cardio Weekoverzicht */}
          <div className="bg-white dark:bg-stone-800 rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-sm uppercase tracking-wider text-stone-500 dark:text-stone-400 font-medium">
              Cardio Planning
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Stel in op welke dagen je cardio doet (geldt voor elke week)
            </p>
            <div className="space-y-2">
              {[
                { key: 'monday', label: 'Maandag' },
                { key: 'tuesday', label: 'Dinsdag' },
                { key: 'wednesday', label: 'Woensdag' },
                { key: 'thursday', label: 'Donderdag' },
                { key: 'friday', label: 'Vrijdag' },
                { key: 'saturday', label: 'Zaterdag' },
                { key: 'sunday', label: 'Zondag' }
              ].map(({ key, label }) => {
                const cardioType = cardioSchedule[key];
                return (
                  <button
                    key={key}
                    onClick={() => handleCardioToggle(key)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded bg-stone-50 dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors"
                  >
                    <span className="text-stone-700 dark:text-stone-300">{label}</span>
                    <div className="flex items-center gap-2">
                      {cardioType === 'bike' && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="7" cy="17" r="3" strokeWidth="2"/>
                            <circle cx="17" cy="17" r="3" strokeWidth="2"/>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 7l-3 10M8 7h8M8 7l3 10m3-10l-3 10"/>
                          </svg>
                          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Fietsen</span>
                        </div>
                      )}
                      {cardioType === 'run' && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 rounded">
                          <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                          </svg>
                          <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">Hardlopen</span>
                        </div>
                      )}
                      {cardioType === 'none' && (
                        <span className="text-sm text-stone-400 dark:text-stone-500">Geen</span>
                      )}
                    </div>
                  </button>
                );
              })}
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
          <div className="text-center flex-1 flex flex-col items-center gap-1">
            {/* Logo SVG */}
            <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" className="mb-1">
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor:'#3b82f6', stopOpacity:1}} />
                  <stop offset="50%" style={{stopColor:'#8b5cf6', stopOpacity:1}} />
                  <stop offset="100%" style={{stopColor:'#ec4899', stopOpacity:1}} />
                </linearGradient>
              </defs>
              <rect width="60" height="60" fill="#1a1a1a" rx="9" className="dark:fill-stone-700"/>
              <text x="30" y="40" fontFamily="Arial, sans-serif" fontSize="33" fontWeight="900" 
                    textAnchor="middle" fill="url(#logoGradient)">75</text>
              <rect x="12" y="44" width="36" height="1.5" fill="url(#logoGradient)" rx="0.75"/>
            </svg>
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
                    setShowGallery(true);
                  }}
                  className="w-full text-left px-4 py-3 rounded hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-stone-700 dark:text-stone-300 flex items-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Foto Galerij
                </button>
                
                {/* Taal Switcher */}
                <div className="pt-4 border-t border-stone-200 dark:border-stone-700">
                  <div className="px-4 py-2 text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400 font-medium">
                    Taal / Language
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setLanguage('nl')}
                      className={`flex-1 px-4 py-3 rounded flex items-center justify-center gap-2 transition-colors ${
                        language === 'nl'
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <span className="text-2xl">🇳🇱</span>
                      <span className="text-sm font-medium">NL</span>
                    </button>
                    <button
                      onClick={() => setLanguage('en')}
                      className={`flex-1 px-4 py-3 rounded flex items-center justify-center gap-2 transition-colors ${
                        language === 'en'
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <span className="text-2xl">🇬🇧</span>
                      <span className="text-sm font-medium">EN</span>
                    </button>
                  </div>
                </div>
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
              const isCardio = group.startsWith('Cardio:');
              const workouts = isCardio ? [] : (selectedWorkouts[group] || []);
              const isExpanded = expandedMuscleGroups[group];
              const hasWorkouts = workouts.length > 0;
              const cardioKey = `workout:cardio:${schedule.date}`;
              const isComplete = isCardio 
                ? (workoutTasks[cardioKey] || false)
                : isMuscleGroupComplete(group);
              
              return (
                <div key={index}>
                  <button
                    onClick={() => {
                      if (isCardio) {
                        handleWorkoutToggle('cardio', schedule.date || '');
                      } else if (hasWorkouts) {
                        toggleMuscleGroup(group);
                      }
                    }}
                    className={`w-full py-3 px-4 rounded flex items-center gap-3 transition-colors ${
                      isComplete 
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                        : 'bg-stone-50 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-600'
                    } ${(hasWorkouts || isCardio) ? 'cursor-pointer' : ''}`}
                    disabled={!hasWorkouts && !isCardio}
                  >
                    {isCardio ? (
                      schedule.cardioType === 'bike' ? (
                        <svg className={`w-5 h-5 ${isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-500 dark:text-stone-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="7" cy="17" r="3" strokeWidth="2"/>
                          <circle cx="17" cy="17" r="3" strokeWidth="2"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 7l-3 10M8 7h8M8 7l3 10m3-10l-3 10"/>
                        </svg>
                      ) : (
                        <svg className={`w-5 h-5 ${isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-500 dark:text-stone-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                      )
                    ) : (
                      <span className={isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-500 dark:text-stone-400'}>
                        {getMuscleIcon(group)}
                      </span>
                    )}
                    <span className="flex-1 text-left">{group}</span>
                    <div className="flex items-center gap-2">
                      {isComplete && (
                        <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {hasWorkouts && !isCardio && (
                        <svg
                          className={`w-5 h-5 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          } ${isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-500 dark:text-stone-400'}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                  </button>
                  
                  {/* Dropdown met workouts (3 willekeurige) */}
                  {isExpanded && hasWorkouts && (
                    <div className="mt-2 ml-4 space-y-2 border-l-2 border-stone-200 dark:border-stone-600 pl-4">
                      {workouts.map((workout, workoutIndex) => {
                        const taskKey = `workout:${group}:${workout}`;
                        const isCompleted = workoutTasks[taskKey] || false;
                        
                        return (
                          <label
                            key={workoutIndex}
                            className="flex items-center gap-3 py-2 px-3 text-sm bg-stone-50 dark:bg-stone-900/50 rounded hover:bg-stone-100 dark:hover:bg-stone-700/50 transition-colors cursor-pointer group"
                          >
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              onChange={() => handleWorkoutToggle(group, workout)}
                              className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 focus:ring-stone-400 dark:focus:ring-stone-500 focus:ring-offset-0 dark:bg-stone-700 cursor-pointer"
                            />
                            <span className="text-stone-600 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-200 transition-colors">
                              {workout}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
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
            {TASK_NAMES.map((task, index) => {
              return (
                <div key={index} className="flex items-center gap-3">
                  <label className="flex items-center gap-3 cursor-pointer group flex-1">
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
                </div>
              );
            })}
          </div>
        </div>

        {/* Voortgangsfoto */}
        <div className="bg-white dark:bg-stone-800 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-sm uppercase tracking-wider text-stone-500 dark:text-stone-400 font-medium">
            Voortgangsfoto
          </h2>
          <button
            onClick={() => setShowProgressPhoto(true)}
            className={`w-full py-3 px-4 rounded flex items-center gap-3 transition-colors ${
              (tasks['Voortgangsfoto'] || progressPhotos[currentDate.toISOString().split('T')[0]])
                ? 'bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                : 'bg-stone-50 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-600'
            }`}
          >
            <svg className={`w-5 h-5 ${
              (tasks['Voortgangsfoto'] || progressPhotos[currentDate.toISOString().split('T')[0]]) ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-500 dark:text-stone-400'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="flex-1 text-left">Voortgangsfoto</span>
            <div className="flex items-center gap-2">
              {(tasks['Voortgangsfoto'] || progressPhotos[currentDate.toISOString().split('T')[0]]) && (
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </button>
        </div>
        </div>
      )}
      </div>
      
      {/* Progress Photo Modal */}
      {showProgressPhoto && (
        <ProgressPhoto
          date={currentDate.toISOString().split('T')[0]}
          onClose={() => setShowProgressPhoto(false)}
          onSave={handleProgressPhotoSave}
          existingPhoto={progressPhotos[currentDate.toISOString().split('T')[0]]}
          loadPhoto={loadProgressPhoto}
        />
      )}
    </main>
  );
}

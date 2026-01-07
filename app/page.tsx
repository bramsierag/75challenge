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

export default function Home() {
  const [schedule, setSchedule] = useState<DaySchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDateState] = useState<string>("");
  const [tasks, setTasks] = useState<{ [key: string]: boolean }>({});
  
  const { isOnline, saveTask, loadTasks, getPendingTasks } = useTaskSync();

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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="text-stone-600">Laden...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 py-8 px-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-light text-stone-800">
              75 Challenge
            </h1>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 rounded hover:bg-white transition-colors"
              aria-label="Instellingen"
            >
              <svg className="w-5 h-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-stone-500">
            Dag {schedule?.day || 1}
          </p>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-sm uppercase tracking-wider text-stone-500 font-medium">
              Instellingen
            </h2>
            <div className="space-y-2">
              <label className="block text-sm text-stone-700">
                Startdatum Challenge
              </label>
              <button
                onClick={() => setShowDatePicker(true)}
                className="w-full px-3 py-2 border border-stone-300 rounded text-left hover:bg-stone-50 transition-colors"
              >
                {startDate ? new Date(startDate).toLocaleDateString('nl-NL', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                }) : 'Selecteer datum'}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 bg-stone-200 text-stone-800 py-2 px-4 rounded hover:bg-stone-300 transition-colors"
              >
                Sluiten
              </button>
            </div>
          </div>
        )}

        {/* Date Picker */}
        {showDatePicker && (
          <DatePicker
            value={startDate}
            onChange={handleDatePickerChange}
            onClose={() => setShowDatePicker(false)}
          />
        )}

        {/* Datum navigatie */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={goToPreviousDay}
            className="p-2 rounded hover:bg-white transition-colors"
            aria-label="Vorige dag"
          >
            <svg className="w-6 h-6 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-center flex-1">
            <p className="text-stone-800 font-medium">
              {new Date(schedule?.date || new Date()).toLocaleDateString('nl-NL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </p>
            {!isToday && (
              <button
                onClick={goToToday}
                className="text-xs text-stone-500 hover:text-stone-700 underline mt-1"
              >
                Ga naar vandaag
              </button>
            )}
          </div>

          <button
            onClick={goToNextDay}
            className="p-2 rounded hover:bg-white transition-colors"
            aria-label="Volgende dag"
          >
            <svg className="w-6 h-6 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Muscle Groups */}
        <div className="bg-white rounded-lg p-6 shadow-sm space-y-3">
          <h2 className="text-sm uppercase tracking-wider text-stone-500 font-medium">
            Training
          </h2>
          <div className="space-y-2">
            {schedule?.muscleGroups.map((group, index) => (
              <div
                key={index}
                className="py-3 px-4 bg-stone-50 rounded text-stone-700"
              >
                {group}
              </div>
            ))}
          </div>
        </div>

        {/* Dagelijkse Taken */}
        <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-wider text-stone-500 font-medium">
              Taken
            </h2>
            {!isOnline && (
              <span className="text-xs text-orange-600 flex items-center gap-1">
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
                  className="w-5 h-5 rounded border-stone-300 text-stone-600 focus:ring-stone-400 focus:ring-offset-0"
                />
                <span className="text-stone-700 group-hover:text-stone-900 transition-colors">
                  {task}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

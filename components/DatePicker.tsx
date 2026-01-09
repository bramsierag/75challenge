"use client";

import { useState } from "react";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  onClose: () => void;
}

export default function DatePicker({ value, onChange, onClose }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = value ? new Date(value) : new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  const monthNames = [
    "januari", "februari", "maart", "april", "mei", "juni",
    "juli", "augustus", "september", "oktober", "november", "december"
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Maandag = 0, Zondag = 6
    let startDay = firstDay.getDay() - 1;
    if (startDay === -1) startDay = 6;
    
    const days = [];
    
    // Vorige maand
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthDays - i)
      });
    }
    
    // Huidige maand
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i)
      });
    }
    
    // Volgende maand
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }
    
    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const selectedDate = value ? new Date(value) : null;

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const selectDate = (date: Date) => {
    // Zorg ervoor dat we de lokale datum zonder timezone issues krijgen
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    onChange(dateString);
    onClose();
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-stone-800 rounded-lg shadow-lg max-w-sm w-full p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded transition-colors"
          >
            <svg className="w-5 h-5 text-stone-600 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h3 className="text-lg font-medium text-stone-800 dark:text-stone-200">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded transition-colors"
          >
            <svg className="w-5 h-5 text-stone-600 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Weekdagen */}
        <div className="grid grid-cols-7 gap-1">
          {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-stone-500 dark:text-stone-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Dagen */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <button
              key={index}
              onClick={() => selectDate(day.date)}
              className={`
                aspect-square flex items-center justify-center rounded text-sm transition-colors
                ${!day.isCurrentMonth ? "text-stone-300 dark:text-stone-600" : "text-stone-700 dark:text-stone-300"}
                ${isSelected(day.date) ? "bg-stone-800 dark:bg-stone-600 text-white font-medium" : "hover:bg-stone-100 dark:hover:bg-stone-700"}
                ${isToday(day.date) && !isSelected(day.date) ? "border border-stone-400 dark:border-stone-500" : ""}
              `}
            >
              {day.day}
            </button>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 rounded hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
          >
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
}

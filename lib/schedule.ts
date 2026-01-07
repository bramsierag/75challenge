export interface MuscleGroup {
  musslegroup: string;
}

export interface DaySchedule {
  day: number;
  date: string;
  muscleGroups: string[];
}

export function getStartDate(): Date {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('challengeStartDate');
    if (stored) {
      return new Date(stored);
    }
    // Als er geen startdatum is, stel vandaag in als startdatum
    const today = new Date();
    localStorage.setItem('challengeStartDate', today.toISOString());
    return today;
  }
  // Server-side fallback
  return new Date();
}

export function setStartDate(date: Date): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('challengeStartDate', date.toISOString());
  }
}

export function getDaySchedule(date: Date = new Date()): DaySchedule {
  const muscleGroups: MuscleGroup[] = [
    { musslegroup: "Chest" },
    { musslegroup: "Triceps" },
    { musslegroup: "Shoulders" },
    { musslegroup: "Biceps" },
    { musslegroup: "Back" },
    { musslegroup: "Legs" }
  ];

  // Bereken dag nummer sinds start van de challenge
  const startDate = getStartDate();
  startDate.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const diff = targetDate.getTime() - startDate.getTime();
  let dayOfChallenge = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  
  // Zorg dat we altijd een positief dag nummer hebben
  if (dayOfChallenge < 1) {
    dayOfChallenge = 1;
  }

  // Elke dag krijgt 2 muscle groups (0+1, 2+3, 4+5, dan weer 0+1, etc.)
  const cycleDay = ((dayOfChallenge - 1) % 3 + 3) % 3; // 0, 1, of 2 (handle negative)
  const startIndex = cycleDay * 2;
  
  const todaysMuscleGroups = [
    muscleGroups[startIndex].musslegroup,
    muscleGroups[startIndex + 1].musslegroup
  ];

  return {
    day: dayOfChallenge,
    date: date.toISOString().split('T')[0],
    muscleGroups: todaysMuscleGroups
  };
}

export function getWeekSchedule(): DaySchedule[] {
  const schedule: DaySchedule[] = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    schedule.push(getDaySchedule(date));
  }
  
  return schedule;
}

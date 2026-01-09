export interface MuscleGroup {
  musslegroup: string;
  icon?: string;
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
      // Parse als lokale datum, niet als UTC
      const [year, month, day] = stored.split('T')[0].split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    // Als er geen startdatum is, stel vandaag in als startdatum
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    localStorage.setItem('challengeStartDate', `${year}-${month}-${day}`);
    return today;
  }
  // Server-side fallback
  return new Date();
}

export function setStartDate(date: Date): void {
  if (typeof window !== 'undefined') {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    localStorage.setItem('challengeStartDate', `${year}-${month}-${day}`);
  }
}

export function getDaySchedule(date: Date = new Date()): DaySchedule {
  const muscleGroups: MuscleGroup[] = [
    { musslegroup: "Chest", icon: "chest" },
    { musslegroup: "Triceps", icon: "triceps" },
    { musslegroup: "Shoulders", icon: "shoulders" },
    { musslegroup: "Biceps", icon: "biceps" },
    { musslegroup: "Back", icon: "back" },
    { musslegroup: "Legs", icon: "legs" }
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

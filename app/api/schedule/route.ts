import { NextResponse } from 'next/server';
import { getWeekSchedule } from '@/lib/schedule';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const dateParam = searchParams.get('date');
  const startDateParam = searchParams.get('startDate');
  const cardioScheduleParam = searchParams.get('cardioSchedule');
  
  if (type === 'week') {
    const schedule = getWeekSchedule();
    return NextResponse.json(schedule);
  }
  
  // Parse datums
  const date = dateParam ? new Date(dateParam) : new Date();
  const startDate = startDateParam ? new Date(startDateParam) : new Date();
  const cardioSchedule = cardioScheduleParam ? JSON.parse(cardioScheduleParam) : null;
  
  // Bereken schedule met de gegeven startdatum
  const schedule = getDayScheduleWithStart(date, startDate, cardioSchedule);
  return NextResponse.json(schedule);
}

function getDayScheduleWithStart(date: Date, startDate: Date, cardioSchedule: any) {
  const muscleGroups = [
    { musslegroup: "Chest" },
    { musslegroup: "Triceps" },
    { musslegroup: "Shoulders" },
    { musslegroup: "Biceps" },
    { musslegroup: "Back" },
    { musslegroup: "Legs" }
  ];

  startDate.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const diff = targetDate.getTime() - startDate.getTime();
  let dayOfChallenge = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  
  if (dayOfChallenge < 1) {
    dayOfChallenge = 1;
  }

  // Check if this day has cardio
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayOfWeek = dayNames[targetDate.getDay()];
  const cardioType = cardioSchedule?.[dayOfWeek];
  const hasCardio = cardioType && cardioType !== 'none';

  const cycleDay = ((dayOfChallenge - 1) % 3 + 3) % 3;
  const startIndex = cycleDay * 2;
  
  let todaysMuscleGroups: string[];
  
  if (hasCardio) {
    // Als er cardio is, toon 1 musclegroup + cardio type
    todaysMuscleGroups = [
      muscleGroups[startIndex].musslegroup,
      cardioType === 'bike' ? 'Cardio: Fietsen' : 'Cardio: Hardlopen'
    ];
  } else {
    // Normale dag met 2 musclegroups
    todaysMuscleGroups = [
      muscleGroups[startIndex].musslegroup,
      muscleGroups[startIndex + 1].musslegroup
    ];
  }

  return {
    day: dayOfChallenge,
    date: date.toISOString().split('T')[0],
    muscleGroups: todaysMuscleGroups,
    hasCardio,
    cardioType: hasCardio ? cardioType : undefined
  };
}

import { NextResponse } from 'next/server';
import { getWeekSchedule } from '@/lib/schedule';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const dateParam = searchParams.get('date');
  const startDateParam = searchParams.get('startDate');
  
  if (type === 'week') {
    const schedule = getWeekSchedule();
    return NextResponse.json(schedule);
  }
  
  // Parse datums
  const date = dateParam ? new Date(dateParam) : new Date();
  const startDate = startDateParam ? new Date(startDateParam) : new Date();
  
  // Bereken schedule met de gegeven startdatum
  const schedule = getDayScheduleWithStart(date, startDate);
  return NextResponse.json(schedule);
}

function getDayScheduleWithStart(date: Date, startDate: Date) {
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

  const cycleDay = ((dayOfChallenge - 1) % 3 + 3) % 3;
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

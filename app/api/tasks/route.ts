import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - haal taken op voor een datum
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date required' }, { status: 400 });
    }

    const tasks = await prisma.dailyTask.findMany({
      where: { date },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST - maak of update een taak
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, taskName, completed } = body;

    if (!date || !taskName || completed === undefined) {
      return NextResponse.json({ error: 'Date, taskName and completed required' }, { status: 400 });
    }

    const task = await prisma.dailyTask.upsert({
      where: {
        date_taskName: {
          date,
          taskName,
        },
      },
      update: {
        completed,
      },
      create: {
        date,
        taskName,
        completed,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error saving task:', error);
    return NextResponse.json({ error: 'Failed to save task' }, { status: 500 });
  }
}

// PATCH - batch update voor meerdere taken (sync)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { tasks } = body;

    if (!Array.isArray(tasks)) {
      return NextResponse.json({ error: 'Tasks array required' }, { status: 400 });
    }

    // Batch upsert
    const results = await Promise.all(
      tasks.map(({ date, taskName, completed }) =>
        prisma.dailyTask.upsert({
          where: {
            date_taskName: {
              date,
              taskName,
            },
          },
          update: {
            completed,
          },
          create: {
            date,
            taskName,
            completed,
          },
        })
      )
    );

    return NextResponse.json({ synced: results.length });
  } catch (error) {
    console.error('Error syncing tasks:', error);
    return NextResponse.json({ error: 'Failed to sync tasks' }, { status: 500 });
  }
}

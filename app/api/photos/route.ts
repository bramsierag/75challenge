import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { prisma } from '@/lib/prisma';

// GET: Haal foto op voor een specifieke datum, of alle foto's als geen datum gegeven
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  try {
    // Als geen datum, return alle foto's
    if (!date) {
      const photos = await prisma.progressPhoto.findMany({
        orderBy: { date: 'desc' }
      });
      return NextResponse.json(photos);
    }

    // Anders return specifieke foto
    const photo = await prisma.progressPhoto.findUnique({
      where: { date }
    });

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    return NextResponse.json(photo);
  } catch (error) {
    console.error('Error fetching photo:', error);
    return NextResponse.json({ error: 'Failed to fetch photo' }, { status: 500 });
  }
}

// POST: Upload een nieuwe foto
export async function POST(request: NextRequest) {
  try {
    console.log('Starting photo upload...');
    const formData = await request.formData();
    console.log('FormData received');
    
    const file = formData.get('file') as File;
    const date = formData.get('date') as string;

    console.log('File:', file?.name, 'Size:', file?.size, 'Date:', date);

    if (!file || !date) {
      return NextResponse.json({ error: 'File and date are required' }, { status: 400 });
    }

    // Valideer bestandstype
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    console.log('Creating upload directory...');
    // Maak upload directory aan als deze niet bestaat
    const uploadDir = join(process.cwd(), 'uploads', 'progress-photos');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Genereer bestandsnaam: datum_timestamp.extensie voor unieke naam
    const extension = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const filename = `${date}_${timestamp}.${extension}`;
    const filepath = join(uploadDir, filename);

    console.log('Writing file to:', filepath);
    // Converteer file naar buffer en sla op
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);
    console.log('File written successfully');

    console.log('Saving to database...');
    // Sla metadata op in database (of update als al bestaat)
    const photo = await prisma.progressPhoto.upsert({
      where: { date },
      update: {
        filename,
        path: `/uploads/progress-photos/${filename}`,
      },
      create: {
        date,
        filename,
        path: `/uploads/progress-photos/${filename}`,
      },
    });
    console.log('Database saved successfully');

    return NextResponse.json(photo);
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }
}

// DELETE: Verwijder foto voor een specifieke datum
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
  }

  try {
    // Verwijder uit database
    await prisma.progressPhoto.delete({
      where: { date }
    });

    // Note: Je zou hier ook het fysieke bestand kunnen verwijderen met fs.unlink
    // maar voor veiligheid laten we bestanden staan

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}

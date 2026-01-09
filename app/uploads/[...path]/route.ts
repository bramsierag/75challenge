import { NextRequest, NextResponse } from 'next/server';

// Serveer bestanden uit uploads folder
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { readFile } = await import('fs/promises');
  const { join } = await import('path');
  
  const resolvedParams = await params;
  
  try {
    const filePath = join(process.cwd(), 'uploads', ...resolvedParams.path);
    const fileBuffer = await readFile(filePath);
    
    // Bepaal content type op basis van extensie
    const extension = resolvedParams.path[resolvedParams.path.length - 1].split('.').pop();
    const contentTypes: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentTypes[extension || 'jpg'] || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { writeFile } from 'fs/promises';
import { getCurrentUser } from '@/lib/auth/auth';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No backup file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.tar.gz')) {
      return NextResponse.json({ error: 'Invalid backup file format' }, { status: 400 });
    }

    // Save uploaded backup file temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempBackupPath = join(process.cwd(), 'temp-restore.tar.gz');
    
    await writeFile(tempBackupPath, buffer);

    // Extract backup (this will overwrite existing data directory)
    await execAsync(`tar -xzf "${tempBackupPath}" -C "${process.cwd()}"`);

    // Clean up temp file
    await execAsync(`rm "${tempBackupPath}"`);

    return NextResponse.json({
      success: true,
      message: 'Database and files restored successfully. Please restart the application.',
    });
  } catch (error) {
    console.error('Restore error:', error);
    return NextResponse.json(
      { error: 'Failed to restore backup' },
      { status: 500 }
    );
  }
}

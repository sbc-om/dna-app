import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { existsSync } from 'fs';
import { mkdir, readdir } from 'fs/promises';
import { getCurrentUser } from '@/lib/auth/auth';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dataDir = join(process.cwd(), 'data');
    const backupDir = join(process.cwd(), 'backups');
    
    // Create backup directory if it doesn't exist
    if (!existsSync(backupDir)) {
      await mkdir(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `backup-${timestamp}.tar.gz`;
    const backupPath = join(backupDir, backupFilename);

    // Create tar.gz archive of data directory
    await execAsync(`tar -czf "${backupPath}" -C "${process.cwd()}" data`);

    return NextResponse.json({
      success: true,
      filename: backupFilename,
      message: 'Backup created successfully',
    });
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backupDir = join(process.cwd(), 'backups');
    
    if (!existsSync(backupDir)) {
      return NextResponse.json({ success: true, backups: [] });
    }

    const files = await readdir(backupDir);
    const backups = files
      .filter(file => file.endsWith('.tar.gz'))
      .map(file => ({
        filename: file,
        timestamp: file.replace('backup-', '').replace('.tar.gz', ''),
      }))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return NextResponse.json({ success: true, backups });
  } catch (error) {
    console.error('List backups error:', error);
    return NextResponse.json(
      { error: 'Failed to list backups' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth';
import { getUnreadCount } from '@/lib/db/repositories/messageRepository';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await getUnreadCount(user.id);
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

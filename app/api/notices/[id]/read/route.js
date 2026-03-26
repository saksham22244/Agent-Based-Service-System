import { NextResponse } from 'next/server';
import { noticeDb } from '@/lib/db';

// POST - Mark a notice as read
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    
    const notice = await noticeDb.getById(id);
    
    if (!notice) {
      return NextResponse.json(
        { error: 'Notice not found' },
        { status: 404 }
      );
    }
    
    const updatedNotice = await noticeDb.markAsRead(id);
    
    return NextResponse.json(updatedNotice);
  } catch (error) {
    console.error('Error marking notice as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notice as read' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { noticeDb } from '@/lib/db';

// GET - Get all notices sent to admin
export async function GET(request) {
  try {
    // Get all notices sent to admin
    const result = await noticeDb.getAll({
      recipientType: 'admin'
    });

    // Sort by creation date (newest first) and priority
    const sortedNotices = result.notices.sort((a, b) => {
      // First sort by priority (urgent/high first)
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      const aPriority = priorityOrder[a.priority] || 2;
      const bPriority = priorityOrder[b.priority] || 2;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Then sort by creation date (newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return NextResponse.json({
      notices: sortedNotices,
      total: sortedNotices.length,
      unread: sortedNotices.filter(n => !n.read).length,
      urgent: sortedNotices.filter(n => n.priority === 'urgent' || n.priority === 'high').length
    });

  } catch (error) {
    console.error('Error fetching admin inbox:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin inbox' },
      { status: 500 }
    );
  }
}

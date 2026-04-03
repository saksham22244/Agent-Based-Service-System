import { NextResponse } from 'next/server';
import { noticeDb } from '@/lib/db';

// GET - Get recent notices sent by a user to admin
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get notices sent by this user to admin
    const result = await noticeDb.getAll({
      recipientType: 'admin',
      senderId: userId
    });

    // Sort by creation date (newest first)
    const sortedNotices = result.notices.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Return only the 10 most recent
    const recentNotices = sortedNotices.slice(0, 10);

    return NextResponse.json({
      notices: recentNotices,
      total: sortedNotices.length
    });

  } catch (error) {
    console.error('Error fetching admin notices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notices' },
      { status: 500 }
    );
  }
}

// POST - Send notice to admin
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      title, 
      message, 
      priority = 'normal',
      senderId,
      senderName,
      senderEmail,
      senderRole
    } = body;
    
    // Validate required fields
    if (!title || !message || !senderId || !senderName || !senderEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: title, message, sender information' },
        { status: 400 }
      );
    }

    // Validate priority
    if (!['low', 'normal', 'high', 'urgent'].includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority level' },
        { status: 400 }
      );
    }

    // Validate title and message length
    if (title.length > 200) {
      return NextResponse.json(
        { error: 'Title must be less than 200 characters' },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: 'Message must be less than 1000 characters' },
        { status: 400 }
      );
    }

    // Create notice for admin
    const noticeData = {
      title,
      message,
      recipientType: 'admin',
      recipientId: 'admin', // Special ID for all admins
      recipientName: 'System Administrator',
      priority,
      status: 'active',
      senderId,
      senderName,
      senderEmail,
      senderRole,
      // Additional metadata for admin notices
      source: 'user_submission',
      requiresAction: priority === 'urgent' || priority === 'high'
    };

    const notice = await noticeDb.create(noticeData);

    return NextResponse.json({
      message: 'Notice sent to admin successfully',
      notice: {
        id: notice.id,
        title: notice.title,
        message: notice.message,
        priority: notice.priority,
        createdAt: notice.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error sending notice to admin:', error);
    return NextResponse.json(
      { error: 'Failed to send notice to admin' },
      { status: 500 }
    );
  }
}

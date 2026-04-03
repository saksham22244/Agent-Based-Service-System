import { NextResponse } from 'next/server';
import { noticeDb } from '@/lib/db';

// POST - Send reply from admin to user/agent
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      originalNoticeId,
      replyTo,
      replyToEmail,
      replyToName,
      replyToRole,
      message,
      originalTitle,
      originalMessage
    } = body;
    
    // Validate required fields
    if (!originalNoticeId || !replyTo || !replyToEmail || !replyToName || !message) {
      return NextResponse.json(
        { error: 'Missing required fields for reply' },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.length > 1000) {
      return NextResponse.json(
        { error: 'Reply message must be less than 1000 characters' },
        { status: 400 }
      );
    }

    // Get admin info from request (you might need to implement admin authentication)
    // For now, using a generic admin identifier
    const adminInfo = {
      senderId: 'admin',
      senderName: 'System Administrator',
      senderEmail: 'admin@example.com',
      senderRole: 'admin'
    };

    // Create reply notice for the user/agent
    const replyNoticeData = {
      title: `Re: ${originalTitle}`,
      message: message,
      recipientType: replyToRole, // 'user' or 'agent'
      recipientId: replyTo,
      recipientName: replyToName,
      priority: 'normal',
      status: 'active',
      ...adminInfo,
      // Additional metadata for replies
      source: 'admin_reply',
      originalNoticeId,
      originalMessage,
      isReply: true
    };

    const replyNotice = await noticeDb.create(replyNoticeData);

    // Optionally, you could also mark the original notice as replied
    await noticeDb.update(originalNoticeId, { 
      replied: true, 
      repliedAt: new Date(),
      replyId: replyNotice.id 
    });



    return NextResponse.json({
      message: 'Reply sent successfully',
      reply: {
        id: replyNotice.id,
        title: replyNotice.title,
        message: replyNotice.message,
        recipientName: replyNotice.recipientName,
        createdAt: replyNotice.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error sending reply:', error);
    return NextResponse.json(
      { error: 'Failed to send reply' },
      { status: 500 }
    );
  }
}

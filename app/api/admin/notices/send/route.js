import { NextResponse } from 'next/server';
import { noticeDb, userDb, agentDb } from '@/lib/db';

// POST - Send notice to specific user/agent or bulk send
export async function POST(request) {
  try {
    const body = await request.json();
    const { title, message, recipientType, recipients, priority = 'normal' } = body;
    
    // Validate required fields
    if (!title || !message || !recipientType || !recipients) {
      return NextResponse.json(
        { error: 'Missing required fields: title, message, recipientType, recipients' },
        { status: 400 }
      );
    }
    
    // Validate recipientType
    if (!['user', 'agent'].includes(recipientType)) {
      return NextResponse.json(
        { error: 'recipientType must be either "user" or "agent"' },
        { status: 400 }
      );
    }
    
    // Get the appropriate database
    const db = recipientType === 'user' ? userDb : agentDb;
    
    let recipientIds = [];
    let results = {
      success: [],
      failed: [],
      total: 0,
      successCount: 0,
      failedCount: 0,
    };
    
    // Handle different recipient formats
    if (recipients === 'all') {
      // Send to all users/agents
      const allRecipients = await db.getAll();
      recipientIds = allRecipients.map(r => r.id);
      results.total = recipientIds.length;
    } else if (Array.isArray(recipients)) {
      // Send to specific recipients (IDs)
      recipientIds = recipients;
      results.total = recipientIds.length;
    } else if (typeof recipients === 'string') {
      // Single recipient ID
      recipientIds = [recipients];
      results.total = 1;
    } else {
      return NextResponse.json(
        { error: 'recipients must be "all", an array of IDs, or a single ID' },
        { status: 400 }
      );
    }
    
    // Create notices for each recipient
    for (const recipientId of recipientIds) {
      try {
        // Get recipient details
        const recipient = await db.getById(recipientId);
        
        if (!recipient) {
          results.failed.push({ 
            recipientId, 
            error: 'Recipient not found' 
          });
          results.failedCount++;
          continue;
        }
        
        // Create notice
        const noticeData = {
          title,
          message,
          recipientType,
          recipientId,
          recipientName: recipient.name,
          priority,
          status: 'active',
        };
        
        const notice = await noticeDb.create(noticeData);
        results.success.push({
          recipientId,
          recipientName: recipient.name,
          noticeId: notice.id
        });
        results.successCount++;
        
      } catch (error) {
        results.failed.push({ 
          recipientId, 
          error: error.message 
        });
        results.failedCount++;
      }
    }
    
    return NextResponse.json({
      message: `Notice sending completed`,
      title,
      recipientType,
      ...results
    });
    
  } catch (error) {
    console.error('Error sending notice:', error);
    return NextResponse.json(
      { error: 'Failed to send notice' },
      { status: 500 }
    );
  }
}

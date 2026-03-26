import { NextResponse } from 'next/server';
import { noticeDb } from '@/lib/db';

// GET - Fetch all notices with filtering and pagination
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      recipientType: searchParams.get('recipientType') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
    };
    
    const pagination = {
      page: parseInt(searchParams.get('page')) || 1,
      limit: parseInt(searchParams.get('limit')) || 50,
    };
    
    const result = await noticeDb.getAll(filters, pagination);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching notices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notices' },
      { status: 500 }
    );
  }
}

// POST - Create a new notice
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { title, message, recipientType, recipientId, recipientName } = body;
    
    if (!title || !message || !recipientType || !recipientId || !recipientName) {
      return NextResponse.json(
        { error: 'Missing required fields: title, message, recipientType, recipientId, recipientName' },
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
    
    const noticeData = {
      title,
      message,
      recipientType,
      recipientId,
      recipientName,
      priority: body.priority || 'normal',
      status: body.status || 'active',
    };
    
    const notice = await noticeDb.create(noticeData);
    
    return NextResponse.json(notice, { status: 201 });
  } catch (error) {
    console.error('Error creating notice:', error);
    return NextResponse.json(
      { error: 'Failed to create notice' },
      { status: 500 }
    );
  }
}

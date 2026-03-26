import { NextResponse } from 'next/server';
import { noticeDb } from '@/lib/db';

// GET - Get all notices for a specific user
export async function GET(request, { params }) {
  try {
    const p = await params;
    const { id } = p;
    console.log('[API] Fetching notices for recipientId:', id);
    const { searchParams } = new URL(request.url);
    
    const pagination = {
      page: parseInt(searchParams.get('page')) || 1,
      limit: parseInt(searchParams.get('limit')) || 20,
    };
    
    const result = await noticeDb.getByRecipientId(id, pagination);
    console.log('[API] Result returned from noticeDb:', result.notices.length, 'notices found.');
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching user notices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user notices' },
      { status: 500 }
    );
  }
}

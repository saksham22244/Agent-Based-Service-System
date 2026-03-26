import { NextResponse } from 'next/server';
import { noticeDb } from '@/lib/db';

// GET - Get all notices for a specific agent
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    const pagination = {
      page: parseInt(searchParams.get('page')) || 1,
      limit: parseInt(searchParams.get('limit')) || 20,
    };
    
    const result = await noticeDb.getByRecipientId(id, pagination);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching agent notices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent notices' },
      { status: 500 }
    );
  }
}

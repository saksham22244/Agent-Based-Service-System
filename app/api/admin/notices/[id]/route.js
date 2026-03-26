import { NextResponse } from 'next/server';
import { noticeDb } from '@/lib/db';

// GET - Get a specific notice by ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    console.log('GET notice with ID:', id);
    
    const notice = await noticeDb.getById(id);
    console.log('Found notice:', notice);
    
    if (!notice) {
      console.log('Notice not found for ID:', id);
      return NextResponse.json(
        { error: 'Notice not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(notice);
  } catch (error) {
    console.error('Error fetching notice:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notice' },
      { status: 500 }
    );
  }
}

// PATCH - Update a notice
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const notice = await noticeDb.getById(id);
    
    if (!notice) {
      return NextResponse.json(
        { error: 'Notice not found' },
        { status: 404 }
      );
    }
    
    const updatedNotice = await noticeDb.update(id, body);
    
    return NextResponse.json(updatedNotice);
  } catch (error) {
    console.error('Error updating notice:', error);
    return NextResponse.json(
      { error: 'Failed to update notice' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a notice
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    const notice = await noticeDb.getById(id);
    
    if (!notice) {
      return NextResponse.json(
        { error: 'Notice not found' },
        { status: 404 }
      );
    }
    
    const deleted = await noticeDb.delete(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete notice' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('Error deleting notice:', error);
    return NextResponse.json(
      { error: 'Failed to delete notice' },
      { status: 500 }
    );
  }
}

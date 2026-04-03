import { NextResponse } from 'next/server';
import { noticeDb } from '@/lib/db';

// GET - Get notice by ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const notice = await noticeDb.getById(id);
    
    if (!notice) {
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

// DELETE - Delete notice by ID
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    // Get the notice first to verify it exists and check ownership
    const notice = await noticeDb.getById(id);
    if (!notice) {
      return NextResponse.json(
        { error: 'Notice not found' },
        { status: 404 }
      );
    }

    // Check if this is a user-side deletion (recipientType is 'user' or 'agent')
    // If so, also delete from admin inbox
    if (notice.recipientType === 'user' || notice.recipientType === 'agent') {
      // This is a notice sent TO user/agent, so also remove from admin's view
      // Find and delete the corresponding admin notice if it exists
      const adminNotices = await noticeDb.getAll({
        recipientType: 'admin',
        originalNoticeId: id
      });
      
      // Delete any admin notices related to this original notice
      for (const adminNotice of adminNotices.notices) {
        await noticeDb.delete(adminNotice.id);
      }
    }

    // Delete the original notice
    await noticeDb.delete(id);

    return NextResponse.json({
      message: 'Notice deleted successfully from all sides',
      deletedFrom: notice.recipientType === 'user' || notice.recipientType === 'agent' 
        ? 'user and admin sides' 
        : 'admin side only'
    });

  } catch (error) {
    console.error('Error deleting notice:', error);
    return NextResponse.json(
      { error: 'Failed to delete notice' },
      { status: 500 }
    );
  }
}

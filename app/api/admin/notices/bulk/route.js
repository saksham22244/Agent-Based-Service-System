import { NextResponse } from 'next/server';
import { noticeDb } from '@/lib/db';

// POST - Bulk operations on notices
export async function POST(request) {
  try {
    const body = await request.json();
    const { operation, ids, data } = body;
    
    // Validate required fields
    if (!operation || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: operation, ids (array)' },
        { status: 400 }
      );
    }
    
    const results = {
      success: [],
      failed: [],
      total: ids.length,
      successCount: 0,
      failedCount: 0,
    };
    
    switch (operation) {
      case 'delete':
        // Bulk delete notices
        for (const id of ids) {
          try {
            const deleted = await noticeDb.delete(id);
            if (deleted) {
              results.success.push(id);
              results.successCount++;
            } else {
              results.failed.push({ id, error: 'Notice not found or already deleted' });
              results.failedCount++;
            }
          } catch (error) {
            results.failed.push({ id, error: error.message });
            results.failedCount++;
          }
        }
        break;
        
      case 'update':
        // Bulk update notices
        if (!data) {
          return NextResponse.json(
            { error: 'Data field is required for update operation' },
            { status: 400 }
          );
        }
        
        try {
          const bulkResult = await noticeDb.bulkUpdate(ids, data);
          results.successCount = bulkResult.modifiedCount;
          results.failedCount = ids.length - bulkResult.modifiedCount;
          results.message = `Successfully updated ${bulkResult.modifiedCount} notices`;
        } catch (error) {
          return NextResponse.json(
            { error: 'Bulk update failed: ' + error.message },
            { status: 500 }
          );
        }
        break;
        
      case 'markRead':
        // Bulk mark as read
        try {
          const bulkResult = await noticeDb.bulkUpdate(ids, { 
            read: true, 
            readAt: new Date() 
          });
          results.successCount = bulkResult.modifiedCount;
          results.failedCount = ids.length - bulkResult.modifiedCount;
          results.message = `Successfully marked ${bulkResult.modifiedCount} notices as read`;
        } catch (error) {
          return NextResponse.json(
            { error: 'Bulk mark as read failed: ' + error.message },
            { status: 500 }
          );
        }
        break;
        
      case 'markUnread':
        // Bulk mark as unread
        try {
          const bulkResult = await noticeDb.bulkUpdate(ids, { 
            read: false, 
            readAt: null 
          });
          results.successCount = bulkResult.modifiedCount;
          results.failedCount = ids.length - bulkResult.modifiedCount;
          results.message = `Successfully marked ${bulkResult.modifiedCount} notices as unread`;
        } catch (error) {
          return NextResponse.json(
            { error: 'Bulk mark as unread failed: ' + error.message },
            { status: 500 }
          );
        }
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid operation. Supported operations: delete, update, markRead, markUnread' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      message: `Bulk ${operation} operation completed`,
      operation,
      ...results
    });
    
  } catch (error) {
    console.error('Error in bulk notice operation:', error);
    return NextResponse.json(
      { error: 'Bulk operation failed' },
      { status: 500 }
    );
  }
}

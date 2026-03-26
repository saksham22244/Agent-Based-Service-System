import { NextResponse } from 'next/server';
import { userDb, agentDb } from '@/lib/db';

/**
 * POST /api/admin/bulk
 * Perform bulk operations on users or agents
 * Supports: approve, verify, delete, update
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { operation, type, ids, data } = body;

    if (!operation || !type || !ids || !Array.isArray(ids)) {
      return NextResponse.json(
        { error: 'Missing required fields: operation, type, ids (array)' },
        { status: 400 }
      );
    }

    if (!['user', 'agent'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "user" or "agent"' },
        { status: 400 }
      );
    }

    const db = type === 'user' ? userDb : agentDb;
    const results = {
      success: [],
      failed: [],
    };

    // Process each ID
    for (const id of ids) {
      try {
        // Prevent modifying super admin
        if (type === 'user') {
          const user = await userDb.getById(id);
          if (user && user.email === 'admin@example.com') {
            results.failed.push({ id, error: 'Cannot modify super admin' });
            continue;
          }
        }

        switch (operation) {
          case 'delete':
            const deleted = await db.delete(id);
            if (deleted) {
              results.success.push(id);
            } else {
              results.failed.push({ id, error: 'Not found' });
            }
            break;

          case 'approve':
            if (type === 'agent') {
              const updated = await agentDb.update(id, { approved: true });
              if (updated) {
                results.success.push(id);
              } else {
                results.failed.push({ id, error: 'Not found' });
              }
            } else {
              results.failed.push({ id, error: 'Approve operation only for agents' });
            }
            break;

          case 'verify':
            if (type === 'user') {
              const updated = await userDb.update(id, { verified: true });
              if (updated) {
                results.success.push(id);
              } else {
                results.failed.push({ id, error: 'Not found' });
              }
            } else {
              results.failed.push({ id, error: 'Verify operation only for users' });
            }
            break;

          case 'unverify':
            if (type === 'user') {
              const updated = await userDb.update(id, { verified: false });
              if (updated) {
                results.success.push(id);
              } else {
                results.failed.push({ id, error: 'Not found' });
              }
            } else {
              results.failed.push({ id, error: 'Unverify operation only for users' });
            }
            break;

          case 'update':
            if (!data) {
              results.failed.push({ id, error: 'Update data required' });
              break;
            }
            const updated = await db.update(id, data);
            if (updated) {
              results.success.push(id);
            } else {
              results.failed.push({ id, error: 'Not found' });
            }
            break;

          default:
            results.failed.push({ id, error: `Unknown operation: ${operation}` });
        }
      } catch (error) {
        console.error(`Error processing ${type} ${id}:`, error);
        results.failed.push({ id, error: error.message || 'Processing failed' });
      }
    }

    return NextResponse.json({
      message: `Bulk operation completed`,
      operation,
      type,
      total: ids.length,
      successCount: results.success.length,
      failedCount: results.failed.length,
      results,
    });
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}

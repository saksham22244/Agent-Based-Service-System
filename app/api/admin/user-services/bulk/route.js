import { NextResponse } from 'next/server';
import { userServiceDb, userDb, serviceDb } from '@/lib/db';

/**
 * POST /api/admin/user-services/bulk
 * Bulk assign/unassign services to/from users
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { operation, userIds, serviceIds } = body;

    if (!operation || !userIds || !serviceIds) {
      return NextResponse.json(
        { error: 'Missing required fields: operation, userIds, serviceIds' },
        { status: 400 }
      );
    }

    if (!Array.isArray(userIds) || !Array.isArray(serviceIds)) {
      return NextResponse.json(
        { error: 'userIds and serviceIds must be arrays' },
        { status: 400 }
      );
    }

    if (!['assign', 'unassign'].includes(operation)) {
      return NextResponse.json(
        { error: 'Operation must be "assign" or "unassign"' },
        { status: 400 }
      );
    }

    const results = {
      success: [],
      failed: [],
    };

    for (const userId of userIds) {
      // Verify user exists
      const user = await userDb.getById(userId);
      if (!user) {
        results.failed.push({ userId, error: 'User not found' });
        continue;
      }

      for (const serviceId of serviceIds) {
        try {
          if (operation === 'assign') {
            // Verify service exists
            const service = await serviceDb.getById(serviceId);
            if (!service) {
              results.failed.push({ userId, serviceId, error: 'Service not found' });
              continue;
            }

            await userServiceDb.assign(userId, serviceId, 'admin');
            results.success.push({ userId, serviceId });
          } else if (operation === 'unassign') {
            const success = await userServiceDb.unassign(userId, serviceId);
            if (success) {
              results.success.push({ userId, serviceId });
            } else {
              results.failed.push({ userId, serviceId, error: 'Assignment not found' });
            }
          }
        } catch (error) {
          console.error(`Error processing ${operation} for user ${userId}, service ${serviceId}:`, error);
          results.failed.push({ 
            userId, 
            serviceId, 
            error: error.message || 'Processing failed' 
          });
        }
      }
    }

    return NextResponse.json({
      message: `Bulk ${operation} operation completed`,
      operation,
      total: userIds.length * serviceIds.length,
      successCount: results.success.length,
      failedCount: results.failed.length,
      results,
    });
  } catch (error) {
    console.error('Error performing bulk user-service operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { userServiceDb, serviceDb } from '@/lib/db';

/**
 * GET /api/admin/services/[id]/users
 * Get all users assigned to a specific service
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    // Verify service exists
    const service = await serviceDb.getById(id);
    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    const serviceUsers = await userServiceDb.getByServiceId(id);

    return NextResponse.json({
      serviceId: id,
      serviceName: service.name,
      users: serviceUsers,
      count: serviceUsers.length,
    });
  } catch (error) {
    console.error('Error fetching service users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service users' },
      { status: 500 }
    );
  }
}

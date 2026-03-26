import { NextResponse } from 'next/server';
import { userServiceDb, userDb, serviceDb } from '@/lib/db';

/**
 * GET /api/admin/users/[id]/services
 * Get all services assigned to a specific user
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    // Verify user exists
    const user = await userDb.getById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userServices = await userServiceDb.getByUserId(id);

    return NextResponse.json({
      userId: id,
      userName: user.name,
      services: userServices,
      count: userServices.length,
    });
  } catch (error) {
    console.error('Error fetching user services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user services' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users/[id]/services
 * Assign services to a user
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const { serviceIds, serviceId } = body;

    // Verify user exists
    const user = await userDb.getById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Support both single serviceId and array of serviceIds
    const idsToAssign = serviceIds || (serviceId ? [serviceId] : []);

    if (idsToAssign.length === 0) {
      return NextResponse.json(
        { error: 'At least one service ID is required' },
        { status: 400 }
      );
    }

    // Verify all services exist
    for (const serviceId of idsToAssign) {
      const service = await serviceDb.getById(serviceId);
      if (!service) {
        return NextResponse.json(
          { error: `Service with ID ${serviceId} not found` },
          { status: 404 }
        );
      }
    }

    // Bulk assign services
    const result = await userServiceDb.bulkAssign(id, idsToAssign, 'admin');

    return NextResponse.json({
      message: 'Services assigned successfully',
      userId: id,
      assigned: result.assigned,
      skipped: result.skipped,
    });
  } catch (error) {
    console.error('Error assigning services to user:', error);
    return NextResponse.json(
      { error: 'Failed to assign services' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]/services
 * Remove services from a user
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');

    if (!serviceId) {
      return NextResponse.json(
        { error: 'serviceId query parameter is required' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await userDb.getById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const success = await userServiceDb.unassign(id, serviceId);

    if (!success) {
      return NextResponse.json(
        { error: 'Service assignment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Service removed from user successfully',
      userId: id,
      serviceId,
    });
  } catch (error) {
    console.error('Error removing service from user:', error);
    return NextResponse.json(
      { error: 'Failed to remove service from user' },
      { status: 500 }
    );
  }
}

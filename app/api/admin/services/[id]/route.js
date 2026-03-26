import { NextResponse } from 'next/server';
import { serviceDb } from '@/lib/db';

/**
 * GET /api/admin/services/[id]
 * Get a specific service by ID
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const service = await serviceDb.getById(id);

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/services/[id]
 * Update a service
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Format name if provided
    let updateData = { ...body };
    if (updateData.name) {
      const words = updateData.name.toUpperCase().split(' ');
      let displayName = updateData.name.toUpperCase();
      if (words.length >= 2) {
        displayName = `${words[0]}\n${words.slice(1).join(' ')}`;
      }
      updateData.name = displayName;
    }

    // Remove id from update data if present
    delete updateData.id;
    delete updateData._id;

    const updatedService = await serviceDb.update(id, updateData);

    if (!updatedService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/services/[id]
 * Delete a service
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const success = await serviceDb.delete(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    );
  }
}

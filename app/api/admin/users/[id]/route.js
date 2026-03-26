import { NextResponse } from 'next/server';
import { userDb } from '@/lib/db';
import bcrypt from 'bcrypt';

/**
 * GET /api/admin/users/[id]
 * Get a specific user by ID
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const user = await userDb.getById(id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent accessing super admin
    if (user.email === 'admin@example.com') {
      return NextResponse.json(
        { error: 'Cannot access super admin user' },
        { status: 403 }
      );
    }

    // Remove password from response
    const { password, ...userResponse } = user;

    return NextResponse.json(userResponse);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Update a user (admin can update any user field)
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if user exists and is not super admin
    const existingUser = await userDb.getById(id);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (existingUser.email === 'admin@example.com') {
      return NextResponse.json(
        { error: 'Cannot modify super admin user' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData = { ...body };

    // Hash password if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // Remove id from update data if present
    delete updateData.id;
    delete updateData._id;

    const updatedUser = await userDb.update(id, updateData);

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Remove password from response
    const { password, ...userResponse } = updatedUser;

    return NextResponse.json(userResponse);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a user
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    // Check if user is super admin before deleting
    const user = await userDb.getById(id);
    if (user && user.email === 'admin@example.com') {
      return NextResponse.json(
        { error: 'Cannot delete super admin user' },
        { status: 403 }
      );
    }
    
    const success = await userDb.delete(id);

    if (!success) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

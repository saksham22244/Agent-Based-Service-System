import { NextResponse } from 'next/server';
import { userDb } from '@/lib/db';

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

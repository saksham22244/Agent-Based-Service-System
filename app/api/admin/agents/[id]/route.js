import { NextResponse } from 'next/server';
import { agentDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';

/**
 * GET /api/admin/agents/[id]
 */
export async function GET(request, { params }) {
  const auth = requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await params;
    const agent = await agentDb.getById(id);

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Remove password from response
    const { password, ...agentResponse } = agent;

    return NextResponse.json(agentResponse);
  } catch (error) {
    console.error('Error fetching agent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/agents/[id]
 */
export async function PATCH(request, { params }) {
  const auth = requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await params;
    const contentType = request.headers.get('content-type');
    
    let updateData = {};

    // Handle form data (for photo uploads)
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      
      const name = formData.get('name');
      const email = formData.get('email');
      const phoneNumber = formData.get('phoneNumber');
      const address = formData.get('address');
      const photo = formData.get('photo');
      const approved = formData.get('approved');

      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (phoneNumber) updateData.phoneNumber = phoneNumber;
      if (address) updateData.address = address;
      if (approved !== null) updateData.approved = approved === 'true';

      // Handle photo upload
      if (photo && photo.size > 0) {
        updateData.photoUrl = await uploadToCloudinary(photo, 'agents');
      }
    } else {
      // Handle JSON data
      updateData = await request.json();
    }

    // Remove id from update data if present
    delete updateData.id;
    delete updateData._id;

    const updatedAgent = await agentDb.update(id, updateData);

    if (!updatedAgent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Remove password from response
    const { password, ...agentResponse } = updatedAgent;

    return NextResponse.json(agentResponse);
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/agents/[id]
 */
export async function DELETE(request, { params }) {
  const auth = requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await params;
    const agent = await agentDb.getById(id);

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Delete photo file if exists (Cloudinary manages deletion separately)
    // Local file deletion removed — images are stored on Cloudinary

    const success = await agentDb.delete(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete agent' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { error: 'Failed to delete agent' },
      { status: 500 }
    );
  }
}

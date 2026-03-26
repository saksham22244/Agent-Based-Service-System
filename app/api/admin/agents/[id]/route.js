import { NextResponse } from 'next/server';
import { agentDb } from '@/lib/db';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

/**
 * GET /api/admin/agents/[id]
 * Get a specific agent by ID
 */
export async function GET(request, { params }) {
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
 * Update an agent (admin can update any agent field including approval)
 */
export async function PATCH(request, { params }) {
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
        // Delete old photo if exists
        const existingAgent = await agentDb.getById(id);
        if (existingAgent?.photoUrl) {
          try {
            const oldPhotoPath = join(process.cwd(), 'public', existingAgent.photoUrl);
            await unlink(oldPhotoPath);
          } catch (error) {
            console.error('Error deleting old photo:', error);
          }
        }

        // Save new photo
        const bytes = await photo.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'agents');
        if (!existsSync(uploadsDir)) {
          await mkdir(uploadsDir, { recursive: true });
        }

        const timestamp = Date.now();
        const filename = `${timestamp}-${photo.name}`;
        const filepath = join(uploadsDir, filename);

        await writeFile(filepath, buffer);
        updateData.photoUrl = `/uploads/agents/${filename}`;
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
 * Delete an agent
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const agent = await agentDb.getById(id);

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Delete photo file if exists
    if (agent.photoUrl) {
      try {
        const photoPath = join(process.cwd(), 'public', agent.photoUrl);
        await unlink(photoPath);
      } catch (error) {
        // Ignore file deletion errors
        console.error('Error deleting photo:', error);
      }
    }

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

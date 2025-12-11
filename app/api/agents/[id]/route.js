import { NextResponse } from 'next/server';
import { agentDb } from '@/lib/db';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Update agent (for approval)
    const updatedAgent = await agentDb.update(id, body);
    
    if (!updatedAgent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedAgent);
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    );
  }
}

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

import { NextResponse } from 'next/server';
import { applicationDb } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const application = await applicationDb.getById(id);

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const updates = await request.json();

    if (updates.status === 'approved') {
      const currentApp = await applicationDb.getById(id);
      if (currentApp && currentApp.status !== 'approved' && currentApp.assignedAgentId) {
        try {
          const { serviceDb, agentDb } = await import('@/lib/db');
          const service = await serviceDb.getById(currentApp.serviceId);
          const price = parseFloat(service?.price) || 0;
          
          if (price > 0) {
            const agentShare = price * 0.8;
            const agent = await agentDb.getById(currentApp.assignedAgentId);
            if (agent) {
               const newTotalEarnings = (agent.totalEarnings || 0) + agentShare;
               await agentDb.update(agent.id, { totalEarnings: newTotalEarnings });
            }
          }
        } catch (e) {
          console.error('Error crediting agent:', e);
        }
      }
    }

    const updatedApplication = await applicationDb.update(id, updates);

    if (!updatedApplication) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const success = await applicationDb.delete(id);

    if (!success) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { applicationDb, serviceDb } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const agentId = searchParams.get('agentId');
    
    let applications = [];
    if (userId) {
      applications = await applicationDb.getByUserId(userId);
    } else if (agentId) {
      applications = await applicationDb.getByAgentId(agentId);
    } else {
      applications = await applicationDb.getAll();
    }
    
    // Sort descending by creation date
    applications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Expect FormData because it will likely contain uploaded documents (files) from the dynamic form fields
    const formData = await request.formData();
    
    const userId = formData.get('userId');
    const serviceId = formData.get('serviceId');
    const formDataString = formData.get('formData'); // JSON string of standard fields
    
    if (!userId || !serviceId) {
      return NextResponse.json({ error: 'User ID and Service ID are required' }, { status: 400 });
    }

    // Grab the service to find its creator/assignee
    const service = await serviceDb.getById(serviceId);
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Determine assignee: if the service was created by an agent, it defaults to them. Otherwise, system admin.
    const assignedAgentId = service.creatorRole === 'agent' ? service.createdBy : 'admin';

    let parsedFormData = {};
    if (formDataString) {
      try {
        parsedFormData = JSON.parse(formDataString);
      } catch (e) {
        console.error('Failed to parse the submitted stringified formData JSON');
      }
    }

    // Handle actual File uploads dynamically
    for (const [key, value] of formData.entries()) {
      if (!['userId', 'serviceId', 'formData'].includes(key)) {
        if (value instanceof File && value.size > 0) {
          const bytes = await value.arrayBuffer();
          const buffer = Buffer.from(bytes);

          const uploadsDir = join(process.cwd(), 'public', 'uploads', 'applications');
          if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
          }

          const timestamp = Date.now();
          // Remove spaces/special characters from filename
          const safeName = value.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
          const filename = `${timestamp}-${safeName}`;
          const filepath = join(uploadsDir, filename);

          await writeFile(filepath, buffer);
          parsedFormData[key] = `/uploads/applications/${filename}`;
        } else if (!(value instanceof File)) {
          // If it's just raw text outside the JSON block, assign it natively
          parsedFormData[key] = value;
        }
      }
    }

    const applicationData = {
      userId,
      serviceId,
      assignedAgentId,
      formData: parsedFormData,
      status: 'pending_payment', // Defaults to pending_payment per the eSewa requirement
      paymentDetails: null
    };

    const newApplication = await applicationDb.create(applicationData);

    return NextResponse.json(newApplication, { status: 201 });
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}

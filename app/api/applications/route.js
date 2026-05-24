import { NextResponse } from 'next/server';
import { applicationDb, serviceDb } from '@/lib/db';
import { uploadToCloudinary } from '@/lib/cloudinary';

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

    // Set assignee to null so it goes to ALL agents and one can claim it.
    const assignedAgentId = null;

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
          parsedFormData[key] = await uploadToCloudinary(value, 'applications');
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

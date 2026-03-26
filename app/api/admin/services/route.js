import { NextResponse } from 'next/server';
import { serviceDb } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * GET /api/admin/services
 * Get all services with optional filtering and pagination
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const active = searchParams.get('active');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    let services = await serviceDb.getAll();

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      services = services.filter(s => 
        s.name?.toLowerCase().includes(searchLower) ||
        s.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply active filter
    if (active !== null && active !== undefined) {
      const isActive = active === 'true';
      services = services.filter(s => (s.active !== false) === isActive);
    }

    // Get total count before pagination
    const total = services.length;

    // Apply pagination
    const paginatedServices = services.slice(skip, skip + limit);

    return NextResponse.json({
      services: paginatedServices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/services
 * Create a new service
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    
    const name = formData.get('name');
    const description = formData.get('description');
    const icon = formData.get('icon');
    const color = formData.get('color');
    const borderColor = formData.get('borderColor');
    const active = formData.get('active');
    
    // New dynamic fields and permissions
    const createdBy = formData.get('createdBy') || 'system';
    const creatorRole = formData.get('creatorRole') || 'admin';
    const formFieldsString = formData.get('formFields');
    const image = formData.get('image');

    // Parse dynamic user form fields array
    let formFields = [];
    if (formFieldsString) {
      try {
        formFields = JSON.parse(formFieldsString);
      } catch (e) {
        console.error('Failed to parse form fields JSON', e);
      }
    }

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Service name is required' },
        { status: 400 }
      );
    }

    // Format name (uppercase, handle line breaks)
    const words = name.toUpperCase().split(' ');
    let displayName = name.toUpperCase();
    if (words.length >= 2) {
      displayName = `${words[0]}\n${words.slice(1).join(' ')}`;
    }

    // Handle Image upload dynamically
    let imageUrl = null;
    if (image && image.size > 0) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'services');
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      const timestamp = Date.now();
      const filename = `${timestamp}-${image.name}`;
      const filepath = join(uploadsDir, filename);

      await writeFile(filepath, buffer);
      imageUrl = `/uploads/services/${filename}`;
    }

    // Admin creations are auto-approved, agent creations are held for review
    const approvalStatus = creatorRole === 'admin' ? 'approved' : 'pending';

    const newService = await serviceDb.create({
      name: displayName,
      icon: icon || '📋',
      color: color || 'bg-blue-50',
      borderColor: borderColor || 'border-blue-200',
      description: description || '',
      imageUrl,
      formFields,
      createdBy,
      creatorRole,
      approvalStatus,
      active: active !== 'false',
    });

    return NextResponse.json(newService, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    );
  }
}

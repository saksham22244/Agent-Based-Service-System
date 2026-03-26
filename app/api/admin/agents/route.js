import { NextResponse } from 'next/server';
import { agentDb } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * GET /api/admin/agents
 * Get all agents with optional filtering and pagination
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const approved = searchParams.get('approved');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    let agents = await agentDb.getAll();

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      agents = agents.filter(a => 
        a.name?.toLowerCase().includes(searchLower) ||
        a.email?.toLowerCase().includes(searchLower) ||
        a.phoneNumber?.includes(search)
      );
    }

    // Apply approved filter
    if (approved !== null && approved !== undefined) {
      const isApproved = approved === 'true';
      agents = agents.filter(a => (a.approved === true) === isApproved);
    }

    // Get total count before pagination
    const total = agents.length;

    // Apply pagination
    const paginatedAgents = agents.slice(skip, skip + limit);

    // Remove sensitive data
    const sanitizedAgents = paginatedAgents.map(a => {
      const { password, ...agentWithoutPassword } = a;
      return agentWithoutPassword;
    });

    return NextResponse.json({
      agents: sanitizedAgents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/agents
 * Create a new agent (admin can create agents directly)
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    
    const name = formData.get('name');
    const email = formData.get('email');
    const phoneNumber = formData.get('phoneNumber');
    const address = formData.get('address');
    const photo = formData.get('photo');
    const approved = formData.get('approved') === 'true';

    // Validate required fields
    if (!name || !email || !phoneNumber || !address) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phoneNumber, address' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingAgent = await agentDb.getByEmail(email);
    if (existingAgent) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    let photoUrl = null;

    // Handle photo upload
    if (photo && photo.size > 0) {
      const bytes = await photo.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'agents');
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}-${photo.name}`;
      const filepath = join(uploadsDir, filename);

      // Save file
      await writeFile(filepath, buffer);

      // Set photo URL
      photoUrl = `/uploads/agents/${filename}`;
    }

    const newAgent = await agentDb.create({
      name,
      email,
      phoneNumber,
      address,
      photoUrl,
      approved: approved || false,
    });

    return NextResponse.json(newAgent, { status: 201 });
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}

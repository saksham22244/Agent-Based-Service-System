import { NextResponse } from 'next/server';
import { agentDb } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import bcrypt from 'bcrypt';

export async function GET() {
  try {
    const agents = await agentDb.getAll();
    return NextResponse.json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    const name = formData.get('name');
    const email = formData.get('email');
    const phoneNumber = formData.get('phoneNumber');
    const address = formData.get('address');
    const password = formData.get('password');
    const photo = formData.get('photo');

    // Validate required fields
    if (!name || !email || !phoneNumber || !address || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Validate photo is required
    if (!photo || photo.size === 0) {
      return NextResponse.json(
        { error: 'Photo is required' },
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

    // Prevent admin from signing up as agent
    if (email === 'admin@example.com') {
      return NextResponse.json(
        { error: 'Admin account cannot be created through agent signup.' },
        { status: 403 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle photo upload (required)
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
    const photoUrl = `/uploads/agents/${filename}`;

    const newAgent = await agentDb.create({
      name,
      email,
      phoneNumber,
      address,
      password: hashedPassword,
      photoUrl,
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

import { NextResponse } from 'next/server';
import { agentDb, userDb } from '@/lib/db';
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
    const photo = formData.get('photo');

    // Validate required fields
    if (!name || !email || !phoneNumber || !address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let photoUrl;

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

    // Check if email already exists (as user or agent)
    const existingUser = await userDb.getByEmail(email);
    const existingAgent = await agentDb.getByEmail(email);
    
    if (existingUser || existingAgent) {
      return NextResponse.json(
        { error: 'Email already exists. Please use a different email or login.' },
        { status: 400 }
      );
    }

    // Check if approved flag is set (for admin-created agents)
    const approved = formData.get('approved') === 'true';
    
    // Hash password if provided
    const password = formData.get('password');
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const newAgent = await agentDb.create({
      name,
      email,
      phoneNumber,
      address,
      photoUrl,
      password: hashedPassword,
      approved: approved || false, // Default to false unless explicitly set to true
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

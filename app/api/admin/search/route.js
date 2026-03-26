import { NextResponse } from 'next/server';
import { userDb, agentDb } from '@/lib/db';

/**
 * GET /api/admin/search
 * Search across users and agents
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // 'all', 'user', 'agent'
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const results = {
      users: [],
      agents: [],
    };

    const queryLower = query.toLowerCase();

    // Search users
    if (type === 'all' || type === 'user') {
      const users = await userDb.getAll();
      const filteredUsers = users
        .filter(u => u.email !== 'admin@example.com') // Exclude super admin
        .filter(u => 
          u.name?.toLowerCase().includes(queryLower) ||
          u.email?.toLowerCase().includes(queryLower) ||
          u.phoneNumber?.includes(query) ||
          u.address?.toLowerCase().includes(queryLower)
        )
        .slice(0, limit)
        .map(u => {
          const { password, ...userWithoutPassword } = u;
          return userWithoutPassword;
        });
      
      results.users = filteredUsers;
    }

    // Search agents
    if (type === 'all' || type === 'agent') {
      const agents = await agentDb.getAll();
      const filteredAgents = agents
        .filter(a => 
          a.name?.toLowerCase().includes(queryLower) ||
          a.email?.toLowerCase().includes(queryLower) ||
          a.phoneNumber?.includes(query) ||
          a.address?.toLowerCase().includes(queryLower)
        )
        .slice(0, limit)
        .map(a => {
          const { password, ...agentWithoutPassword } = a;
          return agentWithoutPassword;
        });
      
      results.agents = filteredAgents;
    }

    return NextResponse.json({
      query,
      type,
      totalResults: results.users.length + results.agents.length,
      results,
    });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}

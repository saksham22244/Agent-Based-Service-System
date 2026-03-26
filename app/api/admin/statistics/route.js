import { NextResponse } from 'next/server';
import { userDb, agentDb, serviceDb, userServiceDb, noticeDb } from '@/lib/db';

/**
 * GET /api/admin/statistics
 * Returns dashboard statistics for admin
 */
export async function GET() {
  try {
    const [users, agents, services, noticeStats] = await Promise.all([
      userDb.getAll(),
      agentDb.getAll(),
      serviceDb.getAll(),
      noticeDb.getStatistics(),
    ]);

    // Filter out super admin from user count
    const regularUsers = users.filter(u => u.email !== 'admin@example.com');
    
    // Get service assignment statistics
    let totalServiceAssignments = 0;
    let usersWithServices = 0;
    
    try {
      const allUserServices = await Promise.all(
        regularUsers.map(u => userServiceDb.getByUserId(u.id))
      );
      totalServiceAssignments = allUserServices.reduce((sum, us) => sum + us.length, 0);
      usersWithServices = allUserServices.filter(us => us.length > 0).length;
    } catch (error) {
      console.error('Error fetching service assignments:', error);
    }
    
    // Calculate statistics
    const stats = {
      totalUsers: regularUsers.length,
      totalAgents: agents.length,
      totalServices: services.length,
      verifiedUsers: regularUsers.filter(u => u.verified !== false).length,
      unverifiedUsers: regularUsers.filter(u => u.verified === false).length,
      approvedAgents: agents.filter(a => a.approved === true).length,
      pendingAgents: agents.filter(a => !a.approved || a.approved === false).length,
      activeServices: services.filter(s => s.active !== false).length,
      inactiveServices: services.filter(s => s.active === false).length,
      totalAccounts: regularUsers.length + agents.length,
      totalServiceAssignments,
      usersWithServices,
      // Notice statistics
      totalNotices: noticeStats.total,
      activeNotices: noticeStats.active,
      inactiveNotices: noticeStats.inactive,
      readNotices: noticeStats.read,
      unreadNotices: noticeStats.unread,
      userNotices: noticeStats.userNotices,
      agentNotices: noticeStats.agentNotices,
      recentUsers: regularUsers
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5)
        .map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          verified: u.verified,
          createdAt: u.createdAt,
        })),
      recentAgents: agents
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5)
        .map(a => ({
          id: a.id,
          name: a.name,
          email: a.email,
          approved: a.approved,
          createdAt: a.createdAt,
        })),
      recentServices: services
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5)
        .map(s => ({
          id: s.id,
          name: s.name,
          active: s.active,
          createdAt: s.createdAt,
        })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

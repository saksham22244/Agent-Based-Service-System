import { userDb } from './db';

/**
 * Middleware to check if the request is from an admin
 * In production, this should use proper session/JWT authentication
 * For now, we'll check via email in the request headers or body
 */
export async function verifyAdmin(request) {
  try {
    // In a real app, you'd get this from session/JWT token
    // For now, we'll check if admin email is provided in headers
    const adminEmail = request.headers.get('x-admin-email') || 
                       request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!adminEmail) {
      return { isAdmin: false, error: 'Admin authentication required' };
    }

    const admin = await userDb.getByEmail(adminEmail);
    
    if (!admin || admin.role !== 'superadmin') {
      return { isAdmin: false, error: 'Unauthorized: Admin access required' };
    }

    return { isAdmin: true, admin };
  } catch (error) {
    console.error('Admin verification error:', error);
    return { isAdmin: false, error: 'Admin verification failed' };
  }
}

/**
 * Simple admin check - allows all requests for now
 * In production, implement proper authentication
 */
export function isAdminRequest(request) {
  // For development, we'll allow all requests
  // In production, implement proper JWT/session validation
  return true;
}

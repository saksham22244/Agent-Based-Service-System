import { userDb, agentDb } from './db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT secret is required. Set NEXTAUTH_SECRET or JWT_SECRET.');
}

// ---------------------------------------------------------------------------
// Stateless JWT helpers — no module-level session state
// ---------------------------------------------------------------------------

/**
 * Extracts and verifies the Bearer token from the Authorization header.
 * Returns the decoded payload on success.
 * Returns a NextResponse (401) on any failure — caller must check and return early.
 *
 * Usage:
 *   const auth = verifyJWT(request);
 *   if (auth instanceof NextResponse) return auth;
 *   // auth.payload is now available
 */
export function verifyJWT(request) {
  const authHeader = request.headers.get('authorization') || '';

  if (!authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return { payload };
  } catch (err) {
    if (
      err.name === 'JsonWebTokenError' ||
      err.name === 'TokenExpiredError' ||
      err.name === 'NotBeforeError'
    ) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    // Unexpected error — re-throw so the route's catch block returns 500
    throw err;
  }
}

/**
 * Verifies the JWT and additionally checks that payload.role === requiredRole.
 * Returns { payload } on success.
 * Returns a NextResponse (401 or 403) on failure.
 */
export function requireRole(request, requiredRole) {
  const result = verifyJWT(request);
  if (result instanceof NextResponse) return result; // 401

  const { payload } = result;
  if (payload.role !== requiredRole) {
    const messages = {
      superadmin: 'Admin access required',
      agent: 'Agent access required',
      user: 'User access required',
    };
    return NextResponse.json(
      { error: messages[requiredRole] || 'Access denied' },
      { status: 403 }
    );
  }

  return { payload };
}

// Convenience wrappers
export const requireAuth = (req) => verifyJWT(req);
export const requireAdmin = (req) => requireRole(req, 'superadmin');
export const requireAgent = (req) => requireRole(req, 'agent');
export const requireUser  = (req) => requireRole(req, 'user');

export function createToken(user) {
  const userId = user.id || (user._id ? user._id.toString() : null);
  if (!userId || !user.email || !user.role) {
    throw new Error('Invalid user payload for JWT generation');
  }

  return jwt.sign(
    { userId, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
}

// ---------------------------------------------------------------------------
// Stateless login helper — used by login route handlers only.
// Does NOT write to any module-level variable.
// Returns { user, isAgent } on success, null on failure.
// ---------------------------------------------------------------------------
export const auth = {
  login: async (email, password) => {
    let user = await userDb.getByEmail(email);
    let isAgent = false;

    if (!user) {
      user = await agentDb.getByEmail(email);
      if (user) {
        isAgent = true;
        user.role = 'agent';
      }
    }

    if (!user || !user.password) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Return session data — caller is responsible for signing the JWT
    return { user, isAgent };
  },
};

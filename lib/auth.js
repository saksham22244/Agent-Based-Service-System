import { userDb } from './db';

// Simple session management (in production, use proper session management)
let currentSession = null;

export const auth = {
  login: async (email, password) => {
    // For demo purposes, any email that exists in the database works
    // In production, implement proper password hashing and verification
    const user = await userDb.getByEmail(email);
    if (user) {
      currentSession = { user };
      return currentSession;
    }
    return null;
  },
  getSession: () => currentSession,
  logout: () => {
    currentSession = null;
  },
  isSuperAdmin: () => {
    return currentSession?.user.role === 'superadmin';
  },
};

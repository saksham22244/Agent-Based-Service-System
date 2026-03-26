import { userDb, agentDb } from './db';
import bcrypt from 'bcrypt';

// Simple session management (in production, use proper session management)
let currentSession = null;

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

    currentSession = { user, isAgent };
    return currentSession;
  },
  getSession: () => currentSession,
  logout: () => {
    currentSession = null;
  },
  isSuperAdmin: () => {
    return currentSession?.user.role === 'superadmin';
  },
};

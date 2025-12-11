import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { userDb } from '@/lib/db';

// Check for required environment variables
const hasGoogleConfig = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
const hasNextAuthSecret = process.env.NEXTAUTH_SECRET;

const authOptions = {
  providers: hasGoogleConfig ? [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ] : [],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Check if user exists
          let existingUser = await userDb.getByEmail(user.email);
          
          if (!existingUser) {
            // Prevent admin from signing up via Google OAuth
            if (user.email === 'admin@example.com') {
              console.error('Admin cannot sign up via Google OAuth');
              return false;
            }
            // Create new user from Google account
            existingUser = await userDb.create({
              name: user.name || profile?.name || 'User',
              email: user.email,
              phoneNumber: '', // Google doesn't provide phone number
              address: '', // Google doesn't provide address
              role: 'user',
              verified: true, // Google accounts are pre-verified
              googleId: account.providerAccountId,
              image: user.image || profile?.picture,
            });
          } else {
            // Update existing user with Google ID and image if not present
            const updateData = {};
            if (!existingUser.googleId) {
              updateData.googleId = account.providerAccountId;
            }
            if (!existingUser.image && (user.image || profile?.picture)) {
              updateData.image = user.image || profile.picture;
            }
            if (Object.keys(updateData).length > 0) {
              await userDb.updateByEmail(user.email, updateData);
            }
          }
          
          return true;
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session?.user?.email) {
        try {
          const user = await userDb.getByEmail(session.user.email);
          if (user) {
            session.user.id = user.id;
            session.user.role = user.role;
            session.user.verified = user.verified;
          }
        } catch (error) {
          console.error('Error in session callback:', error);
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        token.accessToken = account.access_token;
        if (user.id) {
          token.id = user.id;
        }
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // Redirect to callback page which will handle role-based routing
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      // Default to callback page for Google OAuth
      return `${baseUrl}/auth/callback`;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: hasNextAuthSecret ? process.env.NEXTAUTH_SECRET : 'fallback-secret-for-development-only-change-in-production',
  debug: process.env.NODE_ENV === 'development',
};

// Warn if Google OAuth is not configured
if (!hasGoogleConfig && process.env.NODE_ENV === 'development') {
  console.warn('⚠️  Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env.local file.');
}

let GET, POST;

try {
  const result = NextAuth(authOptions);
  
  // NextAuth v5 beta returns an object with handlers property
  if (result && result.handlers) {
    GET = result.handlers.GET;
    POST = result.handlers.POST;
  } else if (typeof result === 'function') {
    // Fallback for older API
    GET = result;
    POST = result;
  } else {
    throw new Error('NextAuth did not return expected handlers');
  }
  
  if (typeof GET !== 'function' || typeof POST !== 'function') {
    throw new Error('NextAuth handlers are not functions');
  }
} catch (error) {
  console.error('NextAuth initialization error:', error);
  // Create fallback handlers that return an error
  const errorHandler = async (req, context) => {
    return new Response(
      JSON.stringify({ 
        error: 'Authentication service unavailable',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  };
  GET = errorHandler;
  POST = errorHandler;
}

export { GET, POST };


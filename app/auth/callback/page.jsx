'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'authenticated' && session?.user) {
      // Store user in localStorage
      const userData = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        verified: session.user.verified,
      };
      localStorage.setItem('user', JSON.stringify(userData));

      // Redirect based on email/role
      if (session.user.email === 'admin@example.com' || session.user.role === 'superadmin') {
        router.push('/dashboard');
      } else {
        router.push('/user');
      }
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}









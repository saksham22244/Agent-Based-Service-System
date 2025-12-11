'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UserPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // If user is admin, redirect to dashboard
      if (parsedUser.email === 'admin@example.com' || parsedUser.role === 'superadmin') {
        router.push('/dashboard');
        return;
      }
    } else {
      // No user found, redirect to login
      router.push('/login');
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Agent Based Service System</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">Welcome, {user.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">User Dashboard</h2>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Welcome!</h3>
                  <p className="text-blue-800">
                    You are logged in as a regular user. This is your user dashboard.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Your Information</h3>
                    <p className="text-sm text-gray-600"><strong>Name:</strong> {user.name}</p>
                    <p className="text-sm text-gray-600"><strong>Email:</strong> {user.email}</p>
                    <p className="text-sm text-gray-600"><strong>Phone:</strong> {user.phoneNumber || 'N/A'}</p>
                    <p className="text-sm text-gray-600"><strong>Address:</strong> {user.address || 'N/A'}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Account Status</h3>
                    <p className="text-sm text-gray-600">
                      <strong>Status:</strong>{' '}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.verified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.verified ? 'Verified' : 'Pending Verification'}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Role:</strong> {user.role || 'user'}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Available Actions</h3>
                  <div className="space-y-2">
                    <button className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      View Services
                    </button>
                    <button className="w-full md:w-auto ml-0 md:ml-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                      My Requests
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}









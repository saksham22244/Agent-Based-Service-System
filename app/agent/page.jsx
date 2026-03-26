'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AgentPage() {
  const router = useRouter();
  const [agent, setAgent] = useState(null);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noticesLoading, setNoticesLoading] = useState(false);

  useEffect(() => {
    // Get agent from localStorage
    const agentData = localStorage.getItem('agent');
    if (agentData) {
      const parsedAgent = JSON.parse(agentData);
      setAgent(parsedAgent);
      
      // Fetch agent notices
      fetchAgentNotices(parsedAgent.id);
    } else {
      // No agent found, redirect to login
      router.push('/login');
    }
    setLoading(false);
  }, [router]);

  const fetchAgentNotices = async (agentId) => {
    setNoticesLoading(true);
    try {
      const response = await fetch(`/api/agents/${agentId}/notices`);
      const data = await response.json();
      setNotices(data.notices || []);
    } catch (error) {
      console.error('Error fetching notices:', error);
      toast.error('Failed to load notices');
    } finally {
      setNoticesLoading(false);
    }
  };

  const handleMarkAsRead = async (noticeId) => {
    try {
      const response = await fetch(`/api/notices/${noticeId}/read`, {
        method: 'POST',
      });
      
      if (response.ok) {
        // Update local state
        setNotices(notices.map(notice => 
          notice.id === noticeId 
            ? { ...notice, read: true, readAt: new Date().toISOString() }
            : notice
        ));
        toast.success('Notice marked as read');
      } else {
        toast.error('Failed to mark notice as read');
      }
    } catch (error) {
      console.error('Error marking notice as read:', error);
      toast.error('An error occurred');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('agent');
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

  if (!agent) {
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
              <span className="text-sm text-gray-700">Welcome, {agent.name}</span>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Agent Dashboard</h2>
              
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Welcome!</h3>
                  <p className="text-green-800">
                    You are logged in as an agent. This is your agent dashboard.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Your Information</h3>
                    <p className="text-sm text-gray-600"><strong>Name:</strong> {agent.name}</p>
                    <p className="text-sm text-gray-600"><strong>Email:</strong> {agent.email}</p>
                    <p className="text-sm text-gray-600"><strong>Phone:</strong> {agent.phoneNumber || 'N/A'}</p>
                    <p className="text-sm text-gray-600"><strong>Address:</strong> {agent.address || 'N/A'}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Account Status</h3>
                    <p className="text-sm text-gray-600">
                      <strong>Status:</strong>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-3 ${
                        agent.approved 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {agent.approved ? 'Approved' : 'Pending Approval'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Notices Section */}
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Your Notices</h3>
                    <span className="text-sm text-gray-500">
                      {notices.filter(n => !n.read).length} unread
                    </span>
                  </div>
                  
                  {noticesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : notices.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                      <p className="text-gray-500">No notices received yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notices.map((notice) => (
                        <div
                          key={notice.id}
                          className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all ${
                            notice.read ? 'border-gray-200 opacity-75' : 'border-blue-200 shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-gray-900">{notice.title}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(notice.priority)}`}>
                                  {notice.priority?.toUpperCase() || 'NORMAL'}
                                </span>
                                {!notice.read && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                    NEW
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-700 mb-2">{notice.message}</p>
                              <p className="text-xs text-gray-500">
                                Received: {new Date(notice.createdAt).toLocaleString()}
                              </p>
                              {notice.readAt && (
                                <p className="text-xs text-green-600">
                                  Read: {new Date(notice.readAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              {!notice.read && (
                                <button
                                  onClick={() => handleMarkAsRead(notice.id)}
                                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                >
                                  Mark as Read
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Available Actions</h3>
                  <div className="space-y-2">
                    <button className="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
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
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

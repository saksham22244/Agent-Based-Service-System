'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function SendNoticeToAdminPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentNotices, setRecentNotices] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    
    // Redirect admins away from this page
    if (parsedUser.role === 'admin' || parsedUser.role === 'superadmin') {
      router.push('/dashboard');
      return;
    }

    setCurrentUser(parsedUser);
    fetchRecentNotices(parsedUser.id);
  }, [router]);

  const fetchRecentNotices = async (userId) => {
    try {
      const response = await fetch(`/api/notices/admin?userId=${userId}`);
      const data = await response.json();
      setRecentNotices(data.notices || []);
    } catch (error) {
      console.error('Error fetching recent notices:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim()) {
      toast.error('Please fill in both title and message fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/notices/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          priority,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderEmail: currentUser.email,
          senderRole: currentUser.role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Notice sent to admin successfully!');
        
        // Clear form
        setTitle('');
        setMessage('');
        setPriority('normal');
        
        // Refresh recent notices
        fetchRecentNotices(currentUser.id);
      } else {
        toast.error(data.error || 'Failed to send notice to admin');
      }
    } catch (error) {
      console.error('Error sending notice to admin:', error);
      toast.error('An error occurred while sending notice');
    } finally {
      setLoading(false);
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

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'urgent': return 'Urgent';
      case 'high': return 'High';
      case 'low': return 'Low';
      default: return 'Normal';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto w-full">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-[#5C5470] flex-shrink-0"></div>
        
        <div className="flex-1 max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Send Notice to Admin</h1>
            <p className="text-gray-600">
              Send messages, reports, or concerns directly to the system administrators.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Send Notice Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Compose Notice</h2>
                    <p className="text-sm text-gray-500">Your message will be sent to all administrators</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter the subject of your message"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400"
                      required
                      maxLength={200}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {title.length}/200 characters
                    </p>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Priority Level
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {['low', 'normal', 'high', 'urgent'].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setPriority(level)}
                          className={`px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all ${
                            priority === level
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {getPriorityLabel(level)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your detailed message here..."
                      rows={8}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400 resize-none"
                      required
                      maxLength={1000}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {message.length}/1000 characters
                    </p>
                  </div>

                  {/* Sender Info */}
                  {currentUser && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Sending as:</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {currentUser.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{currentUser.name}</p>
                          <p className="text-sm text-gray-500">{currentUser.email}</p>
                          <p className="text-xs text-gray-400">Role: {currentUser.role}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || !title.trim() || !message.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-lg"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending to Admin...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Send Notice to Admin
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Recent Notices */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Your Recent Notices</h3>
                
                {recentNotices.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v-2a2 2 0 00-2-2h6a2 2 0 002 2v2a2 2 0 002-2z" />
                    </svg>
                    <p className="text-gray-500 text-sm">No notices sent yet</p>
                    <p className="text-gray-400 text-xs mt-1">Your recent messages will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {recentNotices.map((notice) => (
                      <div
                        key={notice.id}
                        className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 text-sm truncate flex-1">
                            {notice.title}
                          </h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(notice.priority)}`}>
                            {notice.priority?.toUpperCase() || 'NORMAL'}
                          </span>
                        </div>
                        <p className="text-gray-600 text-xs line-clamp-2 mb-2">
                          {notice.message}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {new Date(notice.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

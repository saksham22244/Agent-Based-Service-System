'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function UserNoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    
    if (parsedUser.email === 'admin@example.com' || parsedUser.role === 'superadmin') {
      router.push('/dashboard');
      return;
    }
    
    fetchUserNotices(parsedUser.id);
  }, [router]);

  const fetchUserNotices = async (userId) => {
    try {
      const response = await fetch(`/api/users/${userId}/notices`);
      const data = await response.json();
      setNotices(data.notices || []);
    } catch (error) {
      console.error('Error fetching notices:', error);
      toast.error('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (noticeId) => {
    try {
      const response = await fetch(`/api/notices/${noticeId}/read`, {
        method: 'POST',
      });
      
      if (response.ok) {
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto w-full">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-[#5C5470] flex-shrink-0"></div>
        <div className="flex-1 max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Notices</h2>
          <span className="bg-[#5C5470] text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md">
            {notices.filter(n => !n.read).length} Unread
          </span>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5C5470]"></div>
          </div>
        ) : notices.length === 0 ? (
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-12 text-center">
             <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
               <span className="text-4xl text-gray-400">📭</span>
             </div>
             <h3 className="text-xl font-bold text-gray-800 mb-2">No Target Messages</h3>
             <p className="text-gray-500 max-w-sm mx-auto font-medium">Your agent or system administration team has not securely transmitted any active notices matching your user node.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className={`bg-white border-2 rounded-2xl p-6 transition-all ${
                  notice.read ? 'border-gray-200 opacity-80 bg-gray-50/50' : 'border-[#5C5470]/30 shadow-lg shadow-[#5C5470]/5 hover:border-[#5C5470]/60'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h4 className="text-xl font-black text-gray-900">{notice.title}</h4>
                      <span className={`px-3 py-1 rounded-md text-xs font-black tracking-widest border ${getPriorityColor(notice.priority)}`}>
                        {notice.priority?.toUpperCase() || 'NORMAL'}
                      </span>
                      {!notice.read && (
                        <span className="px-3 py-1 bg-red-500 text-white rounded-md text-xs font-black shadow-sm tracking-widest animate-pulse">
                          ACTION REQUIRED
                        </span>
                      )}
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 font-medium text-gray-700 text-base leading-relaxed mb-4">
                      {notice.message}
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400 tracking-wide uppercase">
                      <span>Log Time: {new Date(notice.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      {notice.readAt && (
                        <span className="text-green-600 flex items-center gap-1">
                          ✓ Verified at {new Date(notice.readAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 pt-1">
                    {!notice.read && (
                      <button
                        onClick={() => handleMarkAsRead(notice.id)}
                        className="w-full sm:w-auto px-6 py-3 bg-[#5C5470] text-white text-sm font-black tracking-wider rounded-xl hover:bg-[#48425C] hover:scale-105 transition-all shadow-md active:scale-95"
                      >
                        Acknowledge receipt
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

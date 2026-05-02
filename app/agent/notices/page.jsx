'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopHeader from '@/components/TopHeader';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AgentNoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState({});
  const [noticeToDelete, setNoticeToDelete] = useState(null);

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
    
    fetchAgentNotices(parsedUser.id);
  }, [router]);

  const fetchAgentNotices = async (agentId) => {
    try {
      const response = await fetch(`/api/agents/${agentId}/notices`);
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

  const confirmDeleteNotice = async () => {
    if (!noticeToDelete) return;

    setDeleteLoading(prev => ({ ...prev, [noticeToDelete]: true }));

    try {
      const response = await fetch(`/api/notices/${noticeToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotices(notices.filter(notice => notice.id !== noticeToDelete));
        toast.success('Notice deleted successfully');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete notice');
      }
    } catch (error) {
      console.error('Error deleting notice:', error);
      toast.error('An error occurred while deleting notice');
    } finally {
      setDeleteLoading(prev => ({ ...prev, [noticeToDelete]: false }));
      setNoticeToDelete(null);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-50 text-red-600 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSourceColor = (source) => {
    switch (source) {
      case 'admin_reply': return 'bg-green-50 text-green-700 border-green-200';
      case 'user_submission': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getSourceLabel = (source) => {
    switch (source) {
      case 'admin_reply': return 'Admin Reply';
      case 'user_submission': return 'System Notice';
      default: return 'System';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto w-full">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-[#5C5470] flex-shrink-0"></div>
        <div className="flex-1 max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Agent Notices</h2>
              <p className="text-gray-500 font-medium">Broadcasts and notifications assigned to your terminal.</p>
            </div>
            <div className="flex items-center gap-6">
              <span className="bg-[#5C5470] text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md">
                {notices.filter(n => !n.read).length} Unread
              </span>
              <TopHeader user={localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null} setUser={() => {}} noticesCount={notices.filter(n => !n.read).length} />
            </div>
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
             <p className="text-gray-500 max-w-sm mx-auto font-medium">Your system administration team has not securely transmitted any active notices matching your agent node.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className={`bg-white border rounded-xl p-6 transition-all ${
                  notice.read ? 'border-gray-200 opacity-75 bg-gray-50/30' : 'border-blue-200 shadow-sm shadow-blue-50 hover:border-blue-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h4 className="text-xl font-bold text-gray-900">{notice.title}</h4>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${getPriorityColor(notice.priority)}`}>
                        {notice.priority?.toUpperCase() || 'NORMAL'}
                      </span>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${getSourceColor(notice.source)}`}>
                        {getSourceLabel(notice.source)}
                      </span>
                      {notice.isReply && (
                        <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-semibold border border-purple-200">
                          Reply
                        </span>
                      )}
                      {!notice.read && (
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold shadow-sm">
                          New
                        </span>
                      )}
                    </div>
                    <div className="text-gray-700 font-medium text-base leading-relaxed mb-4">
                      {notice.message}
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                      <span>{new Date(notice.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      {notice.readAt && (
                        <span className="text-green-600 flex items-center gap-1">
                          ✓ Read at {new Date(notice.readAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2 w-full sm:w-auto mt-4 sm:mt-0 pt-1">
                    {!notice.read && (
                      <button
                        onClick={() => handleMarkAsRead(notice.id)}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        Mark as Read
                      </button>
                    )}
                    <button
                      onClick={() => setNoticeToDelete(notice.id)}
                      disabled={deleteLoading[notice.id]}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-100 transition-colors border border-red-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
                    >
                      {deleteLoading[notice.id] ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {noticeToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-50 rounded-full mb-4 mx-auto">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Delete Notice</h3>
              <p className="text-center text-gray-500 text-sm mb-6">
                Are you sure you want to remove this notice?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setNoticeToDelete(null)}
                  disabled={deleteLoading[noticeToDelete]}
                  className="flex-1 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors border border-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteNotice}
                  disabled={deleteLoading[noticeToDelete]}
                  className="flex-1 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg transition-colors border border-red-100 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleteLoading[noticeToDelete] ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

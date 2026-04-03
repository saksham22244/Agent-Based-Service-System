'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AdminInboxPage() {
  const router = useRouter();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, urgent
  const [deleteLoading, setDeleteLoading] = useState({});
  
  // Reply modal state
  const [replyModal, setReplyModal] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    
    // Only allow admins and superadmins
    if (parsedUser.role !== 'admin' && parsedUser.role !== 'superadmin') {
      router.push('/dashboard');
      return;
    }

    fetchAdminNotices();
  }, [router]);

  const fetchAdminNotices = async () => {
    try {
      const response = await fetch('/api/notices/admin/inbox');
      const data = await response.json();
      setNotices(data.notices || []);
    } catch (error) {
      console.error('Error fetching admin notices:', error);
      toast.error('Failed to load admin notices');
    } finally {
      setLoading(false);
    }
  };

  // Real-time check for deleted notices (polling every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (notices.length > 0) {
        fetchAdminNotices();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [notices.length]);

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

  const handleDelete = async (noticeId) => {
    if (!confirm('Are you sure you want to delete this notice?')) {
      return;
    }

    setDeleteLoading(prev => ({ ...prev, [noticeId]: true }));

    try {
      const response = await fetch(`/api/notices/${noticeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotices(notices.filter(notice => notice.id !== noticeId));
        toast.success('Notice deleted successfully');
      } else {
        toast.error('Failed to delete notice');
      }
    } catch (error) {
      console.error('Error deleting notice:', error);
      toast.error('An error occurred while deleting notice');
    } finally {
      setDeleteLoading(prev => ({ ...prev, [noticeId]: false }));
    }
  };

  const handleReply = (notice) => {
    setSelectedNotice(notice);
    setReplyMessage('');
    setReplyModal(true);
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    setReplyLoading(true);

    try {
      const response = await fetch('/api/notices/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalNoticeId: selectedNotice.id,
          replyTo: selectedNotice.senderId,
          replyToEmail: selectedNotice.senderEmail,
          replyToName: selectedNotice.senderName,
          replyToRole: selectedNotice.senderRole,
          message: replyMessage.trim(),
          originalTitle: selectedNotice.title,
          originalMessage: selectedNotice.message,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Reply sent successfully!');
        setReplyModal(false);
        setSelectedNotice(null);
        setReplyMessage('');
      } else {
        toast.error(data.error || 'Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('An error occurred while sending reply');
    } finally {
      setReplyLoading(false);
    }
  };

  const getFilteredNotices = () => {
    switch (filter) {
      case 'unread':
        return notices.filter(n => !n.read);
      case 'urgent':
        return notices.filter(n => n.priority === 'urgent' || n.priority === 'high');
      default:
        return notices;
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
      case 'user_submission': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const filteredNotices = getFilteredNotices();
  const unreadCount = notices.filter(n => !n.read).length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto w-full">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-[#5C5470] flex-shrink-0"></div>
        
        <div className="flex-1 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Inbox</h1>
              <p className="text-gray-600">
                Notices and messages sent by users and agents to administrators
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm font-bold shadow-md border border-red-200">
                {unreadCount} Unread
              </span>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Messages ({notices.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('urgent')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'urgent'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Urgent & High Priority
              </button>
            </div>
          </div>

          {/* Notices List */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl text-gray-400">📭</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Messages Found</h3>
              <p className="text-gray-500 max-w-sm mx-auto font-medium">
                {filter === 'unread' 
                  ? 'No unread messages in your inbox' 
                  : filter === 'urgent'
                  ? 'No urgent or high priority messages'
                  : 'No messages from users or agents yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotices.map((notice) => (
                <div
                  key={notice.id}
                  className={`relative bg-white rounded-xl p-6 transition-all border ${
                    !notice.read 
                      ? 'border-indigo-200 shadow-sm shadow-indigo-100' 
                      : 'border-slate-200'
                  }`}
                >
                  {/* Unread indicator */}
                  {!notice.read && (
                    <div className="absolute top-6 right-6 w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>
                  )}
                  
                  <div className="flex flex-col gap-3">
                    {/* Header */}
                    <div>
                      <div className="flex items-center gap-3 mb-1.5 pr-8">
                        <h3 className="text-lg font-bold text-slate-800">{notice.title}</h3>
                        {notice.priority && notice.priority !== 'normal' && (
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest ${getPriorityColor(notice.priority)} border-none`}>
                            {notice.priority}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest ${getSourceColor(notice.source)} border-none`}>
                          {notice.source === 'user_submission' ? 'User' : 'System'}
                        </span>
                      </div>
                      
                      {/* Sender Metadata */}
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                        <span className="font-semibold text-slate-700">{notice.senderName}</span>
                        <span className="text-slate-300">•</span>
                        <span>{notice.senderEmail}</span>
                        <span className="text-slate-300">•</span>
                        <span>{new Date(notice.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Message Body */}
                    <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap mt-2">
                      {notice.message}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-5 mt-3 pt-4 border-t border-slate-100">
                      {!notice.read && (
                        <button
                          onClick={() => handleMarkAsRead(notice.id)}
                          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          Mark as Read
                        </button>
                      )}
                      <button
                        onClick={() => handleReply(notice)}
                        className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        Reply
                      </button>
                      <button
                        onClick={() => handleDelete(notice.id)}
                        disabled={deleteLoading[notice.id]}
                        className="text-sm font-semibold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
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
                          'Delete'
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

      {/* Reply Modal */}
      {replyModal && selectedNotice && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex justify-between items-center text-white">
              <div>
                <h3 className="text-xl font-bold">Reply to {selectedNotice.senderName}</h3>
                <p className="text-sm text-blue-100 mt-1">
                  Replying to: "{selectedNotice.title}"
                </p>
              </div>
              <button 
                onClick={() => setReplyModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shadow-sm"
              >
                ✕
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {/* Original Message Context */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Original Message:</h4>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-sm text-gray-700 italic">{selectedNotice.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    From: {selectedNotice.senderName} ({selectedNotice.senderEmail})
                  </p>
                  <p className="text-xs text-gray-400">
                    Sent: {new Date(selectedNotice.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {/* Reply Form */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Reply *
                </label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply message here..."
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400 resize-none"
                  required
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {replyMessage.length}/1000 characters
                </p>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 bg-white border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setReplyModal(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSendReply}
                disabled={replyLoading || !replyMessage.trim()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {replyLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending Reply...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Reply
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

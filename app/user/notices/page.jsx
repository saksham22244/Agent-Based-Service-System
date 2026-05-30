'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { FaTrashAlt, FaBell } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function UserNoticesPage() {
  const router = useRouter();
  
  // State: Stores all user notices
  const [notices, setNotices] = useState([]);
  // State: Shows loading spinner while fetching data
  const [loading, setLoading] = useState(true);
  // State: ID of notice being deleted (null if no deletion pending)
  const [noticeToDelete, setNoticeToDelete] = useState(null);
  // State: Shows "Deleting..." text during API call
  const [isDeletingNotice, setIsDeletingNotice] = useState(false);

  // Runs when page loads - checks auth and fetches notices
  useEffect(() => {
    // Get logged-in user from browser storage
    const userData = localStorage.getItem('user');
    // No user? Send to login page
    if (!userData) {
      router.push('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    
    // Admins go to admin dashboard, not user notices page
    if (parsedUser.email === 'admin@example.com' || parsedUser.role === 'superadmin') {
      router.push('/dashboard');
      return;
    }
    
    // Load notices for this specific user
    fetchUserNotices(parsedUser.id);
  }, [router]);

  // Fetches all notices for a user from the API
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

  // Marks a single notice as read (updates UI immediately)
  const handleMarkAsRead = async (noticeId) => {
    try {
      const response = await fetch(`/api/notices/${noticeId}/read`, {
        method: 'POST',
      });
      
      if (response.ok) {
        // Update local state instantly (optimistic update)
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

  // Actually deletes the notice after confirmation
  const confirmDeleteNotice = async () => {
    if (!noticeToDelete) return;
    
    setIsDeletingNotice(true);
    try {
      const response = await fetch(`/api/notices/${noticeToDelete}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove deleted notice from local state
        setNotices(notices.filter(n => n.id !== noticeToDelete));
        toast.success('Notice securely deleted');
      } else {
        toast.error('Deletion failed');
      }
    } catch (error) {
      console.error('Error deleting notice:', error);
      toast.error('An error occurred during deletion');
    } finally {
      setIsDeletingNotice(false);
      setNoticeToDelete(null);
    }
  };

  // Returns different background/text colors based on priority level
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
        {/* Blue gradient line at top of page */}
        <div className="h-1 bg-gradient-to-r from-blue-500 to-[#5C5470] flex-shrink-0"></div>
        
        <div className="flex-1 max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full">
          
          {/* Header with title and unread count */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Notices</h2>
            {/* Shows how many unread notices */}
            <span className="bg-[#5C5470] text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md">
              {notices.filter(n => !n.read).length} Unread
            </span>
          </div>
          
          {/* Show loading spinner while fetching data */}
          {loading ? (
            <div className="flex justify-center py-20">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5C5470]"></div>
            </div>
          ) : notices.length === 0 ? (
            // Show empty state when no notices exist
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-12 text-center">
               <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                 <span className="text-4xl text-gray-400">📭</span>
               </div>
               <h3 className="text-xl font-bold text-gray-800 mb-2">No Target Messages</h3>
               <p className="text-gray-500 max-w-sm mx-auto font-medium">
                 Your agent or system administration team has not securely transmitted any active notices matching your user node.
               </p>
            </div>
          ) : (
            // Display list of notices
            <div className="space-y-4">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className={`bg-white border rounded-xl p-6 transition-all ${
                    notice.read 
                      ? 'border-gray-200 opacity-75 bg-gray-50/30' // Read notice style
                      : 'border-blue-200 shadow-sm shadow-blue-50 hover:border-blue-300' // Unread notice style
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    
                    {/* Left side - notice content */}
                    <div className="flex-1 w-full">
                      
                      {/* Title row with badges */}
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h4 className="text-xl font-bold text-gray-900">{notice.title}</h4>
                        {/* Priority badge */}
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${getPriorityColor(notice.priority)}`}>
                          {notice.priority?.toUpperCase() || 'NORMAL'}
                        </span>
                        {/* "New" badge for unread notices */}
                        {!notice.read && (
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold shadow-sm">
                            New
                          </span>
                        )}
                      </div>
                      
                      {/* Notice message body */}
                      <div className="text-gray-700 font-medium text-base leading-relaxed mb-4">
                        {notice.message}
                      </div>
                      
                      {/* Timestamps row */}
                      <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                        {/* When notice was sent */}
                        <span>
                          {new Date(notice.createdAt).toLocaleString(undefined, { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        {/* When user read it (if read) */}
                        {notice.readAt && (
                          <span className="text-green-600 flex items-center gap-1">
                            ✓ Read at {new Date(notice.readAt).toLocaleString(undefined, { 
                              month: 'short', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Right side - action buttons */}
                    <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2 w-full sm:w-auto mt-4 sm:mt-0 pt-1">
                      
                      {/* Mark as Read button (only for unread notices) */}
                      {!notice.read && (
                        <button
                          onClick={() => handleMarkAsRead(notice.id)}
                          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          Mark as Read
                        </button>
                      )}
                      
                      {/* Delete button (always visible) */}
                      <button
                        onClick={() => setNoticeToDelete(notice.id)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                      >
                        <FaTrashAlt className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal - appears when user clicks delete */}
      {noticeToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              
              {/* Red warning icon */}
              <div className="flex items-center justify-center w-12 h-12 bg-red-50 rounded-full mb-4 mx-auto">
                <FaTrashAlt className="w-5 h-5 text-red-500" />
              </div>
              
              {/* Modal text */}
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Delete Notice</h3>
              <p className="text-center text-gray-500 text-sm mb-6">
                Are you sure you want to remove this notice?
              </p>
              
              {/* Modal buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setNoticeToDelete(null)}
                  disabled={isDeletingNotice}
                  className="flex-1 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors border border-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteNotice}
                  disabled={isDeletingNotice}
                  className="flex-1 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg transition-colors border border-red-100 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeletingNotice ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast popup notifications */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
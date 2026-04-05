'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function NoticePage() {
  // --- STATE VARIABLES (Where React temporarily stores data) ---
  const [title, setTitle] = useState(''); // The subject of the notice
  const [message, setMessage] = useState(''); // The body paragraph of the notice
  const [recipientType, setRecipientType] = useState('user'); // Toggle: sending to 'user' or 'agent'
  const [recipients, setRecipients] = useState(''); // Stores the specific ID of the person receiving it, or 'all'
  const [priority, setPriority] = useState('normal'); // The urgency color (low, normal, high, urgent)
  
  // States holding arrays of data fetched from the database
  const [notices, setNotices] = useState([]); // List of previously sent notices
  const [users, setUsers] = useState([]); // List of all registered users
  const [agents, setAgents] = useState([]); // List of all registered agents
  
  const [currentUser, setCurrentUser] = useState(null); // The currently logged-in Admin
  const [loading, setLoading] = useState(false); // Used to show the "Sending..." spinning wheel
  const [deleteLoading, setDeleteLoading] = useState({}); // Tracking which specific notice is actively being deleted
  
  // Pagination tracking (cutting long lists into pages of 5)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // --- INITIALIZATION (Runs exactly once when the page opens) ---
  useEffect(() => {
    // 1. Read the browser's persistent storage to see who is logged in
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr)); // Convert the string back into a JSON object and save to state
    }
    // 2. Automatically download data from the API to fill the tables
    fetchData();
  }, []);

  // --- DATA FETCHING LOGIC ---
  const fetchData = async () => {
    try {
      // Promise.all runs all 3 API fetches simultaneously for faster load times.
      const [noticesRes, usersRes, agentsRes] = await Promise.all([
        fetch('/api/admin/notices'), // Download past notices
        fetch('/api/users'),         // Download all users
        fetch('/api/agents'),        // Download all agents
      ]);

      const noticesData = await noticesRes.json();
      const usersData = await usersRes.json();
      const agentsData = await agentsRes.json();

      const rawNotices = noticesData.notices || [];
      const groupedMap = new Map();
      
      // --- GROUPING LOGIC ---
      // If an Admin sends 1 notice to 50 users, the DB makes 50 individual records.
      // This loop merges duplicate messages sent at the exact same minute into ONE visual box.
      rawNotices.forEach(notice => {
        const timeKey = new Date(notice.createdAt).toISOString().substring(0, 16); // Round time to the exact minute
        const key = `${notice.title}|${notice.message}|${notice.recipientType}|${timeKey}`;
        
        if (!groupedMap.has(key)) {
          groupedMap.set(key, { ...notice, groupedIds: [notice.id] });
        } else {
          const group = groupedMap.get(key);
          group.groupedIds.push(notice.id);
          group.recipientName = `Multiple (${group.groupedIds.length})`;
        }
      });
      
      // Sort the final collapsed list from Newest -> Oldest
      const sortedNotices = Array.from(groupedMap.values()).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );

      setNotices(sortedNotices); // Save to React State to visually render
      
      // Filter out the 'admin@example.com' so they don't accidentally message themselves
      const filteredUsers = usersData.filter(u => u.email !== 'admin@example.com');
      setUsers(filteredUsers);
      setAgents(agentsData);

      // Setup default placeholder selection for the Dropdown menu ("All Users")
      const userStr = localStorage.getItem('user');
      let isAdmin = false;
      if (userStr) {
        const u = JSON.parse(userStr);
        isAdmin = u.role === 'admin' || u.role === 'superadmin';
      }
      if (isAdmin) {
         setRecipients('all'); // Admins default to sending to everyone
      } else if (filteredUsers.length > 0) {
         setRecipients(filteredUsers[0].id); // Users default to first ID
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    }
  };

  // --- FORM SUBMISSION ---
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent standard browser reloading on form submit
    
    // Quick validation check
    if (!title || !message) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true); // Spin the "Sending..." button

    try {
      // POST the data to our backend Next.js API string
      const response = await fetch('/api/admin/notices/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,           // Note: Next.js API parses this `req.body` and creates MongoDB items
          message,
          recipientType,
          recipients,
          priority,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Notice sent successfully! ${data.successCount} recipients notified.`);
        
        // Clear form
        setTitle('');
        setMessage('');
        setPriority('normal');
        
        // Refresh notices list
        fetchData();
      } else {
        toast.error(data.error || 'Failed to send notice');
      }
    } catch (error) {
      console.error('Error sending notice:', error);
      toast.error('An error occurred while sending notice');
    } finally {
      setLoading(false);
    }
  };

  // --- DELETING LOGIC ---
  const handleDelete = async (notice) => {
    if (!confirm('Are you sure you want to delete this notice?')) {
      return; // Stop if they click 'Cancel' on the browser prompt
    }

    // Set a loading indicator ONLY for the specific card being clicked
    setDeleteLoading(prev => ({ ...prev, [notice.id]: true }));

    try {
      // If it is a grouped message (1 sent to multiple people), delete all records inside the group
      if (notice.groupedIds && notice.groupedIds.length > 1) {
        const deletePromises = notice.groupedIds.map(id => 
          fetch(`/api/admin/notices/${id}`, { method: 'DELETE' })
        );
        const responses = await Promise.all(deletePromises);
        
        if (responses.every(r => r.ok)) {
          toast.success('Notices deleted');
          await fetchData();
        } else {
          toast.error('Failed to delete some notices');
        }
      } else {
        const response = await fetch(`/api/admin/notices/${notice.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Notice deleted');
          await fetchData();
        } else {
          const data = await response.json();
          toast.error(data.error || 'Failed to delete notice');
        }
      }
    } catch (error) {
      console.error('Error deleting notice:', error);
      toast.error('An error occurred while deleting notice');
    } finally {
      // Clear loading state for this notice
      setDeleteLoading(prev => ({ ...prev, [notice.id]: false }));
    }
  };

  // Simple utility function to return mapped CSS classes based on strict strings
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // --- PAGINATION MATH ---
  // Calculates how many "Pages" exist (e.g. 15 items / 5 items_per_page = 3 totalPages)
  const totalPages = Math.max(1, Math.ceil(notices.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  // Calculates Array Slice range (e.g. Page 2 starts at index 5 and slices to 10)
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedNotices = notices.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Notice Management</h1>

        {/* Notice Form */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Send New Notice</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter notice title"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                >
                  <option value="low">Low Priority</option>
                  <option value="normal">Normal Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent Priority</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 resize-none"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Send To</label>
                <select
                  value={recipientType}
                  onChange={(e) => setRecipientType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                >
                  <option value="user">Users</option>
                  <option value="agent">Agents</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                <select
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
                  required
                >
                  <option value="" disabled>-- Select Recipient --</option>
                  {(currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && (
                    <option value="all">All {recipientType === 'user' ? 'Users' : 'Agents'}</option>
                  )}
                  {recipientType === 'user' && users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                  {recipientType === 'agent' && agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </>
              ) : (
                'Send Notice'
              )}
            </button>
          </form>
        </div>

        {/* Notices List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Recent Notices</h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {notices.length} {notices.length === 1 ? 'Notice' : 'Notices'}
            </span>
          </div>

          {notices.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v-2a2 2 0 00-2-2h6a2 2 0 002 2v2a2 2 0 002-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m13 16-5-5-5 1.414-1.414L8.586 8.586a2 2 0 00-2.828 0l-4.586 4.586a2 2 0 000 2.828 0L16 16m-2-2a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-600 text-lg font-medium">No notices sent yet</p>
              <p className="text-gray-500 text-sm mt-2">Send your first notice to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-indigo-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{notice.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(notice.priority)}`}>
                          {notice.priority?.toUpperCase() || 'NORMAL'}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {notice.recipientType === 'user' ? 'To Users' : 'To Agents'}
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{notice.message}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {new Date(notice.createdAt).toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleDelete(notice)}
                        disabled={deleteLoading[notice.id]}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        title="Delete notice"
                      >
                        {deleteLoading[notice.id] ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6h4m4 6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Recipients: {notice.recipientName || 'All'}</span>
                      {notice.read && (!notice.groupedIds || notice.groupedIds.length === 1) && (
                        <span className="text-green-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Read
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {notices.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-end gap-1.5 mt-8 text-sm text-gray-700 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <span className="mr-0.5 font-medium">Show</span>
              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNumber = index + 1;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                      safeCurrentPage === pageNumber
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

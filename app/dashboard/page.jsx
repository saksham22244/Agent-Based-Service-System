'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Image from 'next/image';
import UserForm from '@/components/UserForm';
import AgentForm from '@/components/AgentForm';
import NoticeForm from '@/components/NoticeForm';

export default function DashboardPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewModal, setViewModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [approveConfirm, setApproveConfirm] = useState(null);
  const [addUserModal, setAddUserModal] = useState(false);
  const [addAgentModal, setAddAgentModal] = useState(false);
  const [noticeModal, setNoticeModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7; // Reduced strictly to exactly fit viewport perfectly without scrolling
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, agentsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/agents'),
      ]);

      const usersData = await usersRes.json();
      const agentsData = await agentsRes.json();

      // Store users and agents for notice form
      setUsers(usersData);
      setAgents(agentsData);

      // Filter out super admin from display
      const filteredUsers = usersData.filter((u) => u.email !== 'admin@example.com');

      const combined = [
        ...filteredUsers.map((u) => ({ ...u, type: 'user' })),
        ...agentsData.map((a) => ({ ...a, type: 'agent', approved: a.approved || false })),
      ];

      // Sort by createdAt descending (newest first)
      combined.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Descending order (newest first)
      });

      setItems(combined);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id, type) => {
    // Get item name for confirmation
    const item = items.find(i => i.id === id);
    
    // Prevent deleting super admin
    if (type === 'user' && item && item.email === 'admin@example.com') {
      alert('Cannot delete super admin user!');
      return;
    }
    
    const itemName = item?.name || 'this item';
    
    // Show custom confirmation modal
    setDeleteConfirm({ id, type, name: itemName });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    const { id, type } = deleteConfirm;
    console.log('Proceeding with deletion of:', id, type);
    
    // Close confirmation modal
    setDeleteConfirm(null);

    try {
      const endpoint = type === 'user' ? `/api/users/${id}` : `/api/agents/${id}`;
      console.log('Making DELETE request to:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        console.log('Delete successful, refreshing data...');
        alert('Successfully deleted!');
        await fetchData();
      } else {
        const errorMessage = data.error || data.message || 'Unknown error';
        alert(`Failed to delete: ${errorMessage}`);
        console.error('Delete failed:', data);
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleLogout = () => {
    // Clear any session data
    if (confirm('Are you sure you want to logout?')) {
      router.push('/login');
    }
  };

  const handleApproveConfirm = async () => {
    if (!approveConfirm) return;

    const { id } = approveConfirm;
    setApproveConfirm(null);

    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approved: true }),
      });

      if (response.ok) {
        await fetchData();
      } else {
        alert('Failed to approve agent');
      }
    } catch (error) {
      console.error('Error approving agent:', error);
      alert('An error occurred while approving agent');
    }
  };

  const handleAddUser = async (userData) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userData,
          verified: true, // Admin-created users are immediately active
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAddUserModal(false);
        alert('User created successfully!');
        await fetchData();
      } else {
        alert(data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('An error occurred while creating user');
    }
  };

  const handleAddAgent = async (formData) => {
    try {
      // Add approved: true for admin-created agents
      formData.append('approved', 'true');
      
      const response = await fetch('/api/agents', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setAddAgentModal(false);
        alert('Agent created and approved successfully!');
        await fetchData();
      } else {
        alert(data.error || 'Failed to create agent');
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      alert('An error occurred while creating agent');
    }
  };

  const handleSendNotice = async (noticeData) => {
    try {
      const response = await fetch('/api/admin/notices/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noticeData),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Notice sent successfully! ${data.successCount} recipients notified.`);
      } else {
        alert(data.error || 'Failed to send notice');
      }
    } catch (error) {
      console.error('Error sending notice:', error);
      alert('An error occurred while sending notice');
    }
  };


  const filteredItems = items.filter((item) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'user' && item.type === 'user') ||
      (filter === 'agent' && item.type === 'agent');

    const matchesSearch =
      searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.phoneNumber.includes(searchQuery);

    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <div className="h-1 bg-blue-500 flex-shrink-0"></div>
        <div className="bg-white px-4 py-2 border-b flex-shrink-0 flex items-center justify-between">
          <p className="text-blue-800 font-semibold text-sm">Admin Dashboard Page</p>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </button>
        </div>

        {/* Main Content - No Scroll */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-4 flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <h1 className="text-xl font-bold text-black">DASHBOARD</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setAddUserModal(true)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add User
                </button>
                <button
                  onClick={() => setAddAgentModal(true)}
                  className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Agent
                </button>
                <button
                  onClick={() => setNoticeModal(true)}
                  className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1.5"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                    />
                  </svg>
                  Send Notice
                </button>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 flex-shrink-0">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('user')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filter === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  USER
                </button>
                <button
                  onClick={() => setFilter('agent')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filter === 'agent'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  AGENT
                </button>
              </div>

              {/* Search */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs w-full sm:w-auto max-w-xs"
                />
                <button className="p-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex-shrink-0">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Table Container - Auto Height */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed divide-y divide-gray-200 border-collapse">
                    <colgroup>
                      <col className="w-[22%]" />
                      <col className="w-[15%]" />
                      <col className="w-[33%]" />
                      <col className="w-[15%]" />
                      <col className="w-[15%]" />
                    </colgroup>
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">
                            Loading...
                          </td>
                        </tr>
                      ) : filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">
                            No items found
                          </td>
                        </tr>
                      ) : (
                        paginatedItems.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 align-middle">
                              <div className="text-sm font-medium text-gray-900 truncate" title={item.name}>
                                {item.name}
                              </div>
                            </td>
                            <td className="px-4 py-3 align-middle">
                              <div className="text-sm text-gray-600 truncate" title={item.phoneNumber}>
                                {item.phoneNumber}
                              </div>
                            </td>
                            <td className="px-4 py-3 align-middle">
                              <div 
                                className="text-sm text-gray-600 truncate cursor-help" 
                                title={item.email}
                              >
                                {item.email}
                              </div>
                            </td>
                            <td className="px-4 py-3 align-middle">
                              <div className="flex flex-col gap-1">
                                <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium w-fit">
                                  {item.type === 'user' ? 'Users' : 'Agent'}
                                </span>
                                {item.type === 'agent' && (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit ${
                                    item.approved 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {item.approved ? 'Approved' : 'Pending'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 align-middle">
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setViewModal(item);
                                  }}
                                  className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded p-1.5 transition-colors"
                                  title="View Details"
                                  type="button"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDeleteClick(item.id, item.type);
                                  }}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  className="inline-flex items-center justify-center text-red-600 hover:text-red-800 hover:bg-red-50 rounded p-1.5 transition-colors"
                                  title="Delete"
                                  type="button"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                                {item.type === 'agent' && !item.approved && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setApproveConfirm({ id: item.id, name: item.name });
                                    }}
                                    className="inline-flex items-center justify-center text-green-600 hover:text-green-800 hover:bg-green-50 rounded p-1.5 transition-colors"
                                    title="Approve Agent"
                                    type="button"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* "Show 1 2" style pager - Inner */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-end gap-1.5 text-xs text-gray-700 bg-gray-50 px-4 py-3 border-t border-gray-200">
                    <span className="mr-0.5">Show</span>
                    {Array.from({ length: totalPages }).map((_, index) => {
                      const pageNumber = index + 1;
                      return (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`px-2 py-0.5 rounded border text-xs transition-colors ${
                            safeCurrentPage === pageNumber
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
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
        </div>
      </div>

      {/* View Modal */}
      {viewModal && (
        <div 
          className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity"
          onClick={() => setViewModal(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">View Details</h2>
              <button
                onClick={() => setViewModal(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{viewModal.name}</h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                viewModal.type === 'user' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {viewModal.type === 'user' ? 'User' : 'Agent'}
              </span>
            </div>
            
            {/* Image Display - Prominent for Agents */}
            {viewModal.type === 'agent' && 'photoUrl' in viewModal && viewModal.photoUrl ? (
              <div className="mb-6 flex justify-center">
                <div className="w-full max-w-md h-96 relative rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
                  <Image
                    src={viewModal.photoUrl}
                    alt={viewModal.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            ) : viewModal.type === 'user' ? (
              <div className="mb-6 flex justify-center">
                <div className="w-48 h-48 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300 shadow-md">
                  <svg
                    className="w-24 h-24 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
            ) : null}
            
            <div className="bg-gray-50 rounded-xl p-5 space-y-4">
              <div className="flex items-start gap-4">
                <span className="font-semibold text-gray-700 w-24 flex-shrink-0">Email:</span>
                <span className="text-gray-900 break-words">{viewModal.email}</span>
              </div>
              <div className="flex items-start gap-4">
                <span className="font-semibold text-gray-700 w-24 flex-shrink-0">Phone:</span>
                <span className="text-gray-900">{viewModal.phoneNumber}</span>
              </div>
              <div className="flex items-start gap-4">
                <span className="font-semibold text-gray-700 w-24 flex-shrink-0">Address:</span>
                <span className="text-gray-900 break-words">{viewModal.address}</span>
              </div>
              {viewModal.type === 'agent' && (
                <div className="flex items-start gap-4">
                  <span className="font-semibold text-gray-700 w-24 flex-shrink-0">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    viewModal.approved 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {viewModal.approved ? 'Approved' : 'Pending'}
                  </span>
                </div>
              )}
              {viewModal.type === 'user' && 'role' in viewModal && (
                <div className="flex items-start gap-4">
                  <span className="font-semibold text-gray-700 w-24 flex-shrink-0">Role:</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    {viewModal.role}
                  </span>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewModal(null)}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div 
          className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity"
          onClick={() => setDeleteConfirm(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Delete Confirmation</h2>
              </div>
              <p className="text-gray-600 mb-3">
                Are you sure you want to delete this {deleteConfirm.type}?
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-lg font-semibold text-gray-900">
                  {deleteConfirm.name}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {deleteConfirm.type.toUpperCase()}
                </p>
              </div>
              <p className="text-red-600 text-sm font-medium">
                ⚠️ This action cannot be undone!
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {approveConfirm && (
        <div 
          className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity"
          onClick={() => setApproveConfirm(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Approve Agent</h2>
              </div>
              <p className="text-gray-600 mb-3">
                Are you sure you want to approve this agent?
              </p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-lg font-semibold text-gray-900">
                  {approveConfirm.name}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Once approved, the agent will be able to login and access the system.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setApproveConfirm(null)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveConfirm}
                className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {addUserModal && (
        <div 
          className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity"
          onClick={() => setAddUserModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Add New User</h2>
              <button
                onClick={() => setAddUserModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <UserForm
              onSubmit={handleAddUser}
              onCancel={() => setAddUserModal(false)}
            />
          </div>
        </div>
      )}

      {/* Add Agent Modal */}
      {addAgentModal && (
        <div 
          className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity"
          onClick={() => setAddAgentModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Add New Agent</h2>
              <button
                onClick={() => setAddAgentModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <AgentForm
              onSubmit={handleAddAgent}
              onCancel={() => setAddAgentModal(false)}
            />
          </div>
        </div>
      )}

      {/* Notice Modal */}
      {noticeModal && (
        <NoticeForm
          onClose={() => setNoticeModal(false)}
          onSubmit={handleSendNotice}
          users={users}
          agents={agents}
        />
      )}
    </div>
  );
}


